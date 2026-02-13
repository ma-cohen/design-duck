/**
 * Starts the Design Duck UI server.
 *
 * Serves pre-built static UI files and the consumer's desgin-duck/requirements/ YAML
 * files from a built-in HTTP server. No Vite or build tooling needed.
 */

import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { startUiServer } from "../infrastructure/ui-server";

/**
 * Finds the dist-ui/ directory containing pre-built UI assets.
 *
 * Works in three modes:
 * - Bundled (dist/cli.js):                ../dist-ui/
 * - Source  (src/commands/ui.ts):          ../../dist-ui/
 * - npm-installed (node_modules/.../dist): ../dist-ui/
 */
function findDistUiDir(): string {
  // Support both Bun (import.meta.dirname) and Node.js (fileURLToPath)
  const thisDir =
    (import.meta as any).dirname ?? dirname(fileURLToPath(import.meta.url));
  const candidates = [
    join(thisDir, "..", "dist-ui"),
    join(thisDir, "..", "..", "dist-ui"),
  ];

  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }

  throw new Error(
    "UI assets not found (dist-ui/). Run 'bun run build:ui' to build the UI first.",
  );
}

export function ui(): void {
  if (process.env.DEBUG) {
    console.error("[design-duck:ui] Starting UI server");
  }

  const requirementsDir = join(process.cwd(), "desgin-duck", "requirements");

  if (!existsSync(requirementsDir)) {
    console.error(
      "desgin-duck/requirements/ directory not found. Run 'design-duck init' first.",
    );
    process.exitCode = 1;
    return;
  }

  let distUiDir: string;
  try {
    distUiDir = findDistUiDir();
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
    return;
  }

  console.log("Starting Design Duck UI...");

  try {
    startUiServer({
      distUiDir,
      requirementsDir,
      open: true,
    });
  } catch (err) {
    console.error(
      `Failed to start UI server: ${err instanceof Error ? err.message : String(err)}`,
    );
    process.exitCode = 1;
  }
}
