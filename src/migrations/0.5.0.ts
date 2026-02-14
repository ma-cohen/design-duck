/**
 * Migration to v0.5.0 — playgrounds directory.
 *
 * Adds the playgrounds/ directory under requirements/ for isolated
 * problem-solving explorations independent of the main product vision.
 */

import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import type { Migration } from "./types";

export const migration: Migration = {
  version: "0.5.0",
  description:
    "Add playgrounds/ directory for isolated problem explorations",
  migrate: (duckDir: string) => {
    const docsDir = join(duckDir, "docs");
    const playgroundsDir = join(docsDir, "playgrounds");

    if (!existsSync(playgroundsDir)) {
      mkdirSync(playgroundsDir, { recursive: true });
      console.log("  Created docs/playgrounds/");
    }
  },
};
