/**
 * design-duck upgrade – migrate an existing project to the latest version.
 *
 * 1. Reinstall the package from the remote to get the latest code
 * 2. Re-exec the CLI using the freshly installed binary
 * 3. Read design-duck/.version (default to "0.1.0" if missing)
 * 4. Check if already up-to-date
 * 5. Collect and run applicable migrations
 * 6. Regenerate AGENTS.md & command files
 * 7. Write the new .version
 */

import { existsSync, mkdirSync, cpSync, writeFileSync, rmSync } from "node:fs";
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

  // Preserve relative path inside the backup
  const relative = filePath.slice(duckDir.length + 1);
  const backupPath = join(backupDir, relative);
  const backupParent = join(backupPath, "..");
  mkdirSync(backupParent, { recursive: true });

  cpSync(filePath, backupPath);
  if (process.env.DEBUG) {
    console.error(`[design-duck:upgrade] backed up ${relative} -> .backup/${fromVersion}/${relative}`);
  }
}

export function upgrade(targetDir: string = process.cwd()): void {
  const duckDir = join(targetDir, "design-duck");

  if (!existsSync(duckDir)) {
    console.error(
      "No design-duck/ directory found. Run 'design-duck init' first."
    );
    process.exitCode = 1;
    return;
  }

  // 1. Unless we already reinstalled (re-exec pass), pull the latest package first
  if (!process.env._DD_SKIP_REINSTALL) {
    console.log("Checking for updates...");
    try {
      // GitHub dependencies are pinned by commit hash in package-lock.json,
      // so a plain `npm install` just re-installs the cached version.
      // Remove the lock file and node_modules to force a fresh resolve.
      const lockFile = join(duckDir, "package-lock.json");
      const nodeModules = join(duckDir, "node_modules");
      if (existsSync(lockFile)) rmSync(lockFile);
      if (existsSync(nodeModules)) rmSync(nodeModules, { recursive: true });

      execSync("npm install", {
        cwd: duckDir,
        stdio: process.env.DEBUG ? "inherit" : "pipe",
      });
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
        // Propagate the child's exit code
        return;
      } catch (err: any) {
        // execSync throws on non-zero exit — propagate it
        process.exitCode = err.status ?? 1;
        return;
      }
    }
    // If the bin doesn't exist (shouldn't happen), fall through to run in-process
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

  // 4. Detect stale CLI — project version ahead of installed (shouldn't happen after reinstall)
  if (compareSemver(currentVersion, VERSION) > 0) {
    console.error(
      `Version mismatch: your project is at v${currentVersion} but the latest available CLI is v${VERSION}.\n` +
      `This likely means the remote hasn't been updated yet.`
    );
    process.exitCode = 1;
    return;
  }

  // 4. Collect applicable migrations
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

    // 5. Back up AGENTS.md before any migrations
    backupFile(join(duckDir, "AGENTS.md"), duckDir, currentVersion);

    // 6. Run each migration in order
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

  // 7. Regenerate AGENTS.md (always — it's tool-generated)
  if (applicable.length === 0) {
    // Back up even when there are no schema migrations, since AGENTS.md may have changed
    backupFile(join(duckDir, "AGENTS.md"), duckDir, currentVersion);
  }
  const agentMdPath = join(duckDir, "AGENTS.md");
  writeFileSync(agentMdPath, AGENT_MD, "utf-8");
  console.log("  Regenerated AGENTS.md");

  // 8. Regenerate command markdown files (always — they're tool-generated)
  const commandsDir = join(duckDir, "commands");
  // Back up existing command files before overwriting
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

  // 9. Write the new version
  writeProjectVersion(targetDir, VERSION);
  console.log(`\nUpgrade complete! Now at v${VERSION}.`);
}
