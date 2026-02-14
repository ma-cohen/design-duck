/**
 * Migration to v0.6.0 — rename requirements/ to docs/.
 *
 * Renames the desgin-duck/requirements/ directory to desgin-duck/docs/
 * for existing installations. The internal structure is unchanged.
 */

import { existsSync, renameSync } from "node:fs";
import { join } from "node:path";
import type { Migration } from "./types";

export const migration: Migration = {
  version: "0.6.0",
  description:
    "Rename requirements/ directory to docs/",
  migrate: (duckDir: string) => {
    const oldDir = join(duckDir, "requirements");
    const newDir = join(duckDir, "docs");

    if (existsSync(newDir)) {
      console.log("  docs/ already exists, skipping rename");
      return;
    }

    if (!existsSync(oldDir)) {
      console.log("  requirements/ not found, nothing to rename");
      return;
    }

    renameSync(oldDir, newDir);
    console.log("  Renamed requirements/ → docs/");
  },
};
