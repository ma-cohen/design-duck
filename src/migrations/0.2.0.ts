/**
 * Migration to v0.2.0 — auto-port selection for multi-instance support.
 *
 * No user-file changes needed: the port logic is a runtime behavior change
 * in the installed npm package. AGENTS.md is regenerated automatically by
 * the upgrade command.
 */

import type { Migration } from "./types";

export const migration: Migration = {
  version: "0.2.0",
  description: "Auto-select available port so multiple projects can run simultaneously",
  migrate: (_duckDir: string) => {
    // No file changes required — this is a runtime-only improvement.
  },
};
