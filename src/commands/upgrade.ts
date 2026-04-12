/**
 * design-duck upgrade – apply schema migrations and regenerate templates
 * for an existing project.
 *
 * To upgrade the CLI itself, run: npm install -g design-duck@latest
 *
 * 1. Read design-duck/.version (default to "0.1.0" if missing)
 * 2. Check if already up-to-date
 * 3. Collect and run applicable migrations
 * 4. Regenerate AGENTS.md & command files
 * 5. Write the new .version
 */

import { existsSync, mkdirSync, cpSync, writeFileSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { VERSION } from "../index";
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
      "No design-duck/ directory found. Run 'dd init' first."
    );
    process.exitCode = 1;
    return;
  }

  // 1. Determine current version
  const currentVersion = readProjectVersion(targetDir) ?? "0.1.0";

  if (process.env.DEBUG) {
    console.error(
      `[design-duck:upgrade] current: v${currentVersion}, installed: v${VERSION}`
    );
  }

  // 2. Check if already up-to-date
  if (compareSemver(currentVersion, VERSION) === 0) {
    console.log(`Already up to date (v${VERSION}).`);
    return;
  }

  // 3. Detect stale CLI — project version ahead of installed
  if (compareSemver(currentVersion, VERSION) > 0) {
    console.error(
      `Version mismatch: your project is at v${currentVersion} but the installed CLI is v${VERSION}.\n` +
      `Upgrade the CLI first: npm install -g design-duck@latest`
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

  // 5. Regenerate command markdown files (always — they're tool-generated)
  const commandsDir = join(duckDir, "commands");
  if (existsSync(commandsDir)) {
    for (const filename of Object.keys(COMMAND_FILES)) {
      backupFile(join(commandsDir, filename), duckDir, currentVersion);
    }
    // Clean up command files renamed in this version
    const obsoleteCommandFiles = ["dd-solve.md", "dd-add.md"];
    for (const filename of obsoleteCommandFiles) {
      const oldPath = join(commandsDir, filename);
      if (existsSync(oldPath)) {
        unlinkSync(oldPath);
        console.log(`  Removed renamed command file: ${filename}`);
      }
    }
  }
  mkdirSync(commandsDir, { recursive: true });
  for (const [filename, content] of Object.entries(COMMAND_FILES)) {
    writeFileSync(join(commandsDir, filename), content, "utf-8");
  }
  console.log("  Regenerated commands/ (tag-and-go agent shortcuts)");

  // 7. Write the new version
  writeProjectVersion(targetDir, VERSION);
  console.log(`\nUpgrade complete! Now at v${VERSION}.`);
}
