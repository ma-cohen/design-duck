/**
 * design-duck upgrade – migrate an existing project to the latest version.
 *
 * 1. Read desgin-duck/.version (default to "0.1.0" if missing)
 * 2. Compare to the installed VERSION
 * 3. Collect and run applicable migrations
 * 4. Regenerate AGENTS.md
 * 5. Write the new .version
 */

import { existsSync, mkdirSync, cpSync, writeFileSync } from "node:fs";
import { join } from "node:path";
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
 * Back up a file to desgin-duck/.backup/<version>/ before migrating.
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
  const duckDir = join(targetDir, "desgin-duck");

  if (!existsSync(duckDir)) {
    console.error(
      "No desgin-duck/ directory found. Run 'design-duck init' first."
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
  if (compareSemver(currentVersion, VERSION) >= 0) {
    console.log(`Already up to date (v${VERSION}).`);
    return;
  }

  // 3. Collect applicable migrations
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

    // 4. Back up AGENTS.md before any migrations
    backupFile(join(duckDir, "AGENTS.md"), duckDir, currentVersion);

    // 5. Run each migration in order
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
          `Backups are available in desgin-duck/.backup/${currentVersion}/`
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
    // Back up even when there are no schema migrations, since AGENTS.md may have changed
    backupFile(join(duckDir, "AGENTS.md"), duckDir, currentVersion);
  }
  const agentMdPath = join(duckDir, "AGENTS.md");
  writeFileSync(agentMdPath, AGENT_MD, "utf-8");
  console.log("  Regenerated AGENTS.md");

  // 7. Regenerate command markdown files (always — they're tool-generated)
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

  // 8. Write the new version
  writeProjectVersion(targetDir, VERSION);
  console.log(`\nUpgrade complete! Now at v${VERSION}.`);
  console.log(
    "\nTo also update the CLI tool, run:\n  cd desgin-duck && npm update && cd .."
  );
}
