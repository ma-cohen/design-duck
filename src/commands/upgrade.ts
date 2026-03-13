/**
 * design-duck upgrade – migrate an existing project to the latest version.
 *
 * 1. Reinstall the package from the remote (npm or GitHub Release)
 * 2. Re-exec the CLI using the freshly installed binary
 * 3. Read design-duck/.version (default to "0.1.0" if missing)
 * 4. Check if already up-to-date
 * 5. Collect and run applicable migrations
 * 6. Regenerate AGENTS.md & command files
 * 7. Write the new .version
 */

import { existsSync, mkdirSync, cpSync, writeFileSync, rmSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
import { VERSION } from "../index";
import { AGENT_MD } from "../templates/agents-md";
import { COMMAND_FILES } from "../templates/commands-md";
import { migrations } from "../migrations";
import {
  readProjectVersion,
  writeProjectVersion,
  compareSemver,
} from "../infrastructure/version";

const GITHUB_RELEASE_BASE =
  "https://github.com/ma-cohen/design-duck/releases/latest/download";

export interface UpgradeOptions {
  useGithub?: boolean;
}

/**
 * Back up a file to design-duck/.backup/<version>/ before migrating.
 * Creates the backup directory if it doesn't exist.
 */
function backupFile(
  filePath: string,
  duckDir: string,
  fromVersion: string
): void {
  if (!existsSync(filePath)) return;
  const backupDir = join(duckDir, ".backup", fromVersion);
  mkdirSync(backupDir, { recursive: true });

  const relative = filePath.slice(duckDir.length + 1);
  const backupPath = join(backupDir, relative);
  const backupParent = join(backupPath, "..");
  mkdirSync(backupParent, { recursive: true });

  cpSync(filePath, backupPath);
  if (process.env.DEBUG) {
    console.error(`[design-duck:upgrade] backed up ${relative} -> .backup/${fromVersion}/${relative}`);
  }
}

/**
 * Detect whether the current consumer package.json uses a GitHub Release URL
 * (as opposed to a plain npm registry dependency).
 */
function isGithubSource(duckDir: string): boolean {
  try {
    const pkgPath = join(duckDir, "package.json");
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const dep: string = pkg?.dependencies?.["design-duck"] ?? "";
    return dep.startsWith("https://github.com/");
  } catch {
    return false;
  }
}

/**
 * Reinstall via npm update (standard registry path).
 */
function reinstallFromNpm(duckDir: string): void {
  const lockFile = join(duckDir, "package-lock.json");
  if (existsSync(lockFile)) rmSync(lockFile);

  execSync("npm update design-duck", {
    cwd: duckDir,
    stdio: process.env.DEBUG ? "inherit" : "pipe",
  });
}

/**
 * Reinstall by pointing at the latest GitHub Release tarball.
 * Rewrites the dependency URL in package.json, then runs npm install.
 */
function reinstallFromGithub(duckDir: string): void {
  const latestUrl = `${GITHUB_RELEASE_BASE}/design-duck-latest.tgz`;

  const pkgPath = join(duckDir, "package.json");
  const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
  pkg.dependencies = pkg.dependencies ?? {};
  pkg.dependencies["design-duck"] = latestUrl;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n", "utf-8");

  const lockFile = join(duckDir, "package-lock.json");
  const nodeModules = join(duckDir, "node_modules");
  if (existsSync(lockFile)) rmSync(lockFile);
  if (existsSync(nodeModules)) rmSync(nodeModules, { recursive: true });

  execSync("npm install", {
    cwd: duckDir,
    stdio: process.env.DEBUG ? "inherit" : "pipe",
  });
}

export function upgrade(targetDir: string = process.cwd(), opts: UpgradeOptions = {}): void {
  const duckDir = join(targetDir, "design-duck");

  if (!existsSync(duckDir)) {
    console.error(
      "No design-duck/ directory found. Run 'design-duck init' first."
    );
    process.exitCode = 1;
    return;
  }

  // Determine source: explicit flag > auto-detect from existing package.json
  const useGithub = opts.useGithub ?? isGithubSource(duckDir);

  // 1. Unless we already reinstalled (re-exec pass), pull the latest package
  if (!process.env._DD_SKIP_REINSTALL) {
    const source = useGithub ? "GitHub Release" : "npm";
    console.log(`Checking for updates (source: ${source})...`);
    try {
      if (useGithub) {
        reinstallFromGithub(duckDir);
      } else {
        reinstallFromNpm(duckDir);
      }
    } catch (err) {
      console.error(
        `Failed to install latest package: ${err instanceof Error ? err.message : err}`
      );
      process.exitCode = 1;
      return;
    }

    // Re-exec using the freshly installed CLI so the new code is loaded
    const cliBin = join(duckDir, "node_modules", "design-duck", "dist", "cli.js");
    if (existsSync(cliBin)) {
      try {
        execSync(`node "${cliBin}" upgrade`, {
          cwd: targetDir,
          stdio: "inherit",
          env: { ...process.env, _DD_SKIP_REINSTALL: "1" },
        });
        return;
      } catch (err: any) {
        process.exitCode = err.status ?? 1;
        return;
      }
    }
  }

  // 2. Determine current version
  const currentVersion = readProjectVersion(targetDir) ?? "0.1.0";

  if (process.env.DEBUG) {
    console.error(
      `[design-duck:upgrade] current: v${currentVersion}, installed: v${VERSION}`
    );
  }

  // 3. Check if already up-to-date
  if (compareSemver(currentVersion, VERSION) === 0) {
    console.log(`Already up to date (v${VERSION}).`);
    return;
  }

  // 4. Detect stale CLI — project version ahead of installed
  if (compareSemver(currentVersion, VERSION) > 0) {
    console.error(
      `Version mismatch: your project is at v${currentVersion} but the latest available CLI is v${VERSION}.\n` +
      `This likely means the remote hasn't been updated yet.`
    );
    process.exitCode = 1;
    return;
  }

  // 5. Collect applicable migrations
  const applicable = migrations.filter(
    (m) =>
      compareSemver(m.version, currentVersion) > 0 &&
      compareSemver(m.version, VERSION) <= 0
  );

  console.log(`Upgrading from v${currentVersion} to v${VERSION}...`);

  if (applicable.length > 0) {
    console.log(`\nMigrations to apply:`);
    for (const m of applicable) {
      console.log(`  -> v${m.version}: ${m.description}`);
    }
    console.log("");

    backupFile(join(duckDir, "AGENTS.md"), duckDir, currentVersion);

    for (const m of applicable) {
      if (process.env.DEBUG) {
        console.error(`[design-duck:upgrade] running migration -> v${m.version}`);
      }
      try {
        m.migrate(duckDir);
        console.log(`  Applied migration -> v${m.version}`);
      } catch (err) {
        console.error(
          `Migration to v${m.version} failed: ${err instanceof Error ? err.message : err}`
        );
        console.error(
          `Backups are available in design-duck/.backup/${currentVersion}/`
        );
        process.exitCode = 1;
        return;
      }
    }
  } else {
    console.log("  No schema migrations needed.");
  }

  // 6. Regenerate AGENTS.md (always — it's tool-generated)
  if (applicable.length === 0) {
    backupFile(join(duckDir, "AGENTS.md"), duckDir, currentVersion);
  }
  const agentMdPath = join(duckDir, "AGENTS.md");
  writeFileSync(agentMdPath, AGENT_MD, "utf-8");
  console.log("  Regenerated AGENTS.md");

  // 7. Regenerate command markdown files (always — they're tool-generated)
  const commandsDir = join(duckDir, "commands");
  if (existsSync(commandsDir)) {
    for (const filename of Object.keys(COMMAND_FILES)) {
      backupFile(join(commandsDir, filename), duckDir, currentVersion);
    }
  }
  mkdirSync(commandsDir, { recursive: true });
  for (const [filename, content] of Object.entries(COMMAND_FILES)) {
    writeFileSync(join(commandsDir, filename), content, "utf-8");
  }
  console.log("  Regenerated commands/ (tag-and-go agent shortcuts)");

  // 8. Write the new version
  writeProjectVersion(targetDir, VERSION);
  console.log(`\nUpgrade complete! Now at v${VERSION}.`);
}
