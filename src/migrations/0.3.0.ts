/**
 * Migration to v0.3.0 — tag-and-go command markdown files.
 *
 * Adds desgin-duck/commands/ with dd-*.md files that users can tag
 * (e.g. @dd-vision) to instruct the AI agent to run the corresponding
 * CLI command. The command files and updated AGENTS.md are regenerated
 * automatically by the upgrade command, so no manual file changes are
 * needed in this migration.
 */

import type { Migration } from "./types";

export const migration: Migration = {
  version: "0.3.0",
  description:
    "Add tag-and-go command files (desgin-duck/commands/dd-*.md) for AI agent shortcuts",
  migrate: (_duckDir: string) => {
    // No manual file changes required — the upgrade command's regeneration
    // step creates the commands/ directory and writes all dd-*.md files.
  },
};
