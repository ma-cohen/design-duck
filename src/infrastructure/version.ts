/**
 * Version tracking utilities.
 *
 * Reads/writes the .version file in the user's desgin-duck/ directory
 * and provides a version-mismatch check for the CLI.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { VERSION } from "../index";

const VERSION_FILENAME = ".version";

/** Resolve the path to the .version file inside the desgin-duck/ directory. */
export function versionFilePath(targetDir: string = process.cwd()): string {
  return join(targetDir, "desgin-duck", VERSION_FILENAME);
}

/** Read the current project version from desgin-duck/.version. Returns null if not found. */
export function readProjectVersion(targetDir: string = process.cwd()): string | null {
  const filePath = versionFilePath(targetDir);
  if (!existsSync(filePath)) {
    return null;
  }
  return readFileSync(filePath, "utf-8").trim();
}

/** Write the installed version to desgin-duck/.version. */
export function writeProjectVersion(targetDir: string = process.cwd(), version?: string): void {
  const filePath = versionFilePath(targetDir);
  writeFileSync(filePath, (version ?? VERSION) + "\n", "utf-8");
}

/**
 * Compare two semver strings. Returns:
 *  -1 if a < b
 *   0 if a === b
 *   1 if a > b
 */
export function compareSemver(a: string, b: string): -1 | 0 | 1 {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va < vb) return -1;
    if (va > vb) return 1;
  }
  return 0;
}

/**
 * Check if the project's version matches the installed version.
 * Prints a warning to stderr if there is a mismatch.
 * Returns true if versions match (or no .version file exists yet).
 */
export function checkVersionMismatch(targetDir: string = process.cwd()): boolean {
  const projectVersion = readProjectVersion(targetDir);

  // No .version file — could be a pre-versioning project or not initialized
  if (projectVersion === null) {
    return true;
  }

  if (compareSemver(projectVersion, VERSION) < 0) {
    console.error(
      `[design-duck] Your project was set up with v${projectVersion} but v${VERSION} is installed.\n` +
      `              Run 'design-duck upgrade' to migrate.`
    );
    return false;
  }

  return true;
}
