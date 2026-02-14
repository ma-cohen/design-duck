/**
 * Migration to v0.4.0 — context.yaml files.
 *
 * Adds context.yaml at root level and for each existing project.
 * Context items capture situational facts (business/org at root,
 * technical/system at project level) that inform decisions.
 */

import { existsSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Migration } from "./types";

const ROOT_CONTEXT_YAML = `# Situational context — business, organizational, and environmental facts
# that inform vision and all project decisions.
#
# Each context item has:
#   id          - Unique identifier (e.g. CTX-001)
#   description - One-liner factual statement about the situation

contexts: []
`;

const PROJECT_CONTEXT_YAML = `# Project context — technical and system facts specific to this project
# that inform design decisions.
#
# Each context item has:
#   id          - Unique identifier (e.g. CTX-PROJ-001)
#   description - One-liner factual statement about the current system

contexts: []
`;

export const migration: Migration = {
  version: "0.4.0",
  description:
    "Add context.yaml files for situational context (root-level and per-project)",
  migrate: (duckDir: string) => {
    const reqDir = join(duckDir, "requirements");

    // Create root context.yaml if missing
    const rootContextPath = join(reqDir, "context.yaml");
    if (!existsSync(rootContextPath)) {
      writeFileSync(rootContextPath, ROOT_CONTEXT_YAML, "utf-8");
      console.log("  Created requirements/context.yaml");
    }

    // Create context.yaml for each existing project
    const projectsDir = join(reqDir, "projects");
    if (existsSync(projectsDir)) {
      try {
        const entries = readdirSync(projectsDir);
        for (const entry of entries) {
          const entryPath = join(projectsDir, entry);
          if (statSync(entryPath).isDirectory()) {
            const projectContextPath = join(entryPath, "context.yaml");
            if (!existsSync(projectContextPath)) {
              writeFileSync(projectContextPath, PROJECT_CONTEXT_YAML, "utf-8");
              console.log(`  Created requirements/projects/${entry}/context.yaml`);
            }
          }
        }
      } catch {
        // projects/ directory issues — skip silently
      }
    }
  },
};
