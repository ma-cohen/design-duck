/**
 * Vite plugin that watches the desgin-duck/docs/ directory for YAML changes
 * and notifies the browser via HMR custom events.
 *
 * Uses the existing file-watcher infrastructure to detect filesystem changes
 * and sends a "design-duck:docs-changed" HMR event so the Zustand
 * store can auto-reload docs without polling.
 */

import { join } from "node:path";
import { existsSync } from "node:fs";
import { watchDocsDir } from "./file-watcher";
import type { Plugin } from "vite";

/**
 * Creates a Vite plugin that watches the desgin-duck/docs/ directory
 * and sends HMR events when YAML files change.
 *
 * @returns Vite plugin instance
 *
 * @example
 * ```ts
 * // vite.config.ts
 * import { docsWatcherPlugin } from "./src/infrastructure/vite-requirements-plugin";
 *
 * export default defineConfig({
 *   plugins: [docsWatcherPlugin()],
 * });
 * ```
 */
export function docsWatcherPlugin(): Plugin {
  return {
    name: "design-duck-docs-watcher",

    configureServer(server) {
      const docsDir = join(server.config.root, "desgin-duck", "docs");

      if (!existsSync(docsDir)) {
        console.warn(
          "[design-duck:vite] desgin-duck/docs/ directory not found, skipping file watcher",
        );
        return;
      }

      console.log(
        `[design-duck:vite] Watching ${docsDir} for YAML changes`,
      );

      const handle = watchDocsDir(docsDir, () => {
        console.log(
          "[design-duck:vite] Docs changed, notifying browser",
        );
        server.ws.send({
          type: "custom",
          event: "design-duck:docs-changed",
          data: {},
        });
      });

      // Clean up watcher when the server closes
      server.httpServer?.on("close", () => {
        handle.close();
        console.log("[design-duck:vite] File watcher closed");
      });
    },
  };
}
