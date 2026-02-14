/**
 * Migration v1.1.0 — Add `category: other` to all existing design decisions.
 *
 * The Decision type now requires a `category` field. This migration walks
 * all design.yaml files (root, projects, playgrounds) and adds
 * `category: other` to any decision that doesn't already have one.
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import type { Migration } from "./types";

/**
 * Add `category: other` to decisions in a single design.yaml file.
 * Uses line-by-line text processing to preserve YAML formatting.
 */
function addCategoryToDesignFile(filePath: string): void {
  if (!existsSync(filePath)) return;

  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const result: string[] = [];
  let modified = false;

  for (let i = 0; i < lines.length; i++) {
    result.push(lines[i]);

    // Detect a decision entry: a line like "  - id: DEC-..." or "    id: ..."
    // that is inside the decisions array. We look for lines matching the
    // pattern of a decision id field, then check if `category:` follows
    // within the next few fields (before the next `- id:` or end of file).
    if (/^\s+-\s+id:\s+\S/.test(lines[i]) || /^\s+id:\s+DEC-/.test(lines[i])) {
      // Check if category already exists in this decision block
      const indent = lines[i].match(/^(\s*)/)?.[1] ?? "";
      const baseIndent = indent.replace(/-\s+/, "  ");
      let hasCategory = false;

      // Look ahead to see if this decision block already has a category field
      for (let j = i + 1; j < lines.length; j++) {
        const line = lines[j];
        // If we hit another decision entry or end of decisions, stop looking
        if (/^\s+-\s+id:\s/.test(line)) break;
        // If the line is less indented than the decision fields, stop
        if (line.trim() !== "" && !line.startsWith(baseIndent) && !line.startsWith(indent)) break;
        if (/^\s+category:\s/.test(line)) {
          hasCategory = true;
          break;
        }
      }

      if (!hasCategory) {
        // Insert `category: other` right after the id line, using the same indentation
        // as the fields that follow (topic, context, etc.)
        const fieldIndent = lines[i].match(/^(\s*)-\s+/)
          ? lines[i].match(/^(\s*)/)?.[1] + "    "
          : baseIndent;
        result.push(`${fieldIndent}category: other`);
        modified = true;
      }
    }
  }

  if (modified) {
    writeFileSync(filePath, result.join("\n"), "utf-8");
  }
}

/**
 * List subdirectories in a directory (non-recursive).
 */
function listSubdirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory();
  });
}

export const migration: Migration = {
  version: "1.1.0",
  description: "Add category field to design decisions (defaults to 'other')",
  migrate(duckDir: string): void {
    const docsDir = join(duckDir, "docs");

    // 1. Root design.yaml (global design)
    addCategoryToDesignFile(join(docsDir, "design.yaml"));

    // 2. Project design.yaml files
    const projectsDir = join(docsDir, "projects");
    for (const project of listSubdirs(projectsDir)) {
      addCategoryToDesignFile(join(projectsDir, project, "design.yaml"));
    }

    // 3. Playground design.yaml files
    const playgroundsDir = join(docsDir, "playgrounds");
    for (const playground of listSubdirs(playgroundsDir)) {
      addCategoryToDesignFile(join(playgroundsDir, playground, "design.yaml"));
    }
  },
};
