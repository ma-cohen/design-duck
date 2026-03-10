/**
 * File system operations for reading requirement YAML files.
 *
 * Read functions use filesystem I/O and are Node/Bun only.
 *
 * Pure parsing functions are re-exported from ./yaml-parser for
 * backward compatibility.
 */

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  parseVisionYaml,
  parseProjectRequirementsYaml,
  parseContextYaml,
  parseProjectDesignYaml,
} from "./yaml-parser";
import type { Vision, ProjectRequirements, ContextDocument, ProjectDesign, GlobalDesign } from "../domain/requirements/requirement";

// Re-export pure parsers for backward compatibility
export { parseVisionYaml, parseProjectRequirementsYaml, parseContextYaml, parseProjectDesignYaml } from "./yaml-parser";

// ---------------------------------------------------------------------------
// Filesystem readers (Node/Bun only)
// ---------------------------------------------------------------------------

/**
 * Reads and parses vision.yaml into a validated Vision object.
 *
 * @param docsDir - Path to the docs/ directory
 * @returns Validated vision object
 * @throws Error if file not found, malformed YAML, or validation fails
 */
export function readVision(docsDir: string): Vision {
  const filePath = join(docsDir, "vision.yaml");

  if (process.env.DEBUG) {
    console.error(`[file-store] Reading vision from: ${filePath}`);
  }

  try {
    const content = readFileSync(filePath, "utf-8");

    if (process.env.DEBUG) {
      console.error(`[file-store] Read ${content.length} bytes from vision.yaml`);
    }

    const vision = parseVisionYaml(content);

    if (process.env.DEBUG) {
      console.error(`[file-store] Successfully parsed vision`);
    }

    return vision;
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      throw new Error(`vision.yaml not found at ${filePath}`);
    }
    throw err;
  }
}

/**
 * Reads and parses the root-level context.yaml into a validated ContextDocument.
 * Returns null if the file does not exist (context is optional).
 *
 * @param docsDir - Path to the docs/ directory
 * @returns Validated context document, or null if context.yaml doesn't exist
 * @throws Error if malformed YAML or validation fails (but NOT for missing file)
 */
export function readRootContext(
  docsDir: string,
): ContextDocument | null {
  const filePath = join(docsDir, "context.yaml");

  if (process.env.DEBUG) {
    console.error(`[file-store] Reading root context from: ${filePath}`);
  }

  if (!existsSync(filePath)) {
    if (process.env.DEBUG) {
      console.error(`[file-store] No root context.yaml found — skipping`);
    }
    return null;
  }

  const content = readFileSync(filePath, "utf-8");

  if (process.env.DEBUG) {
    console.error(`[file-store] Read ${content.length} bytes from root context.yaml`);
  }

  const ctx = parseContextYaml(content);

  if (process.env.DEBUG) {
    console.error(
      `[file-store] Successfully parsed ${ctx.contexts.length} root context items`,
    );
  }

  return ctx;
}

/**
 * Reads and parses a project's context.yaml into a validated ContextDocument.
 * Returns null if the file does not exist (project context is optional).
 *
 * @param docsDir - Path to the docs/ directory
 * @param projectName - Name of the project subdirectory
 * @returns Validated context document, or null if context.yaml doesn't exist
 * @throws Error if malformed YAML or validation fails (but NOT for missing file)
 */
export function readProjectContext(
  docsDir: string,
  projectName: string,
): ContextDocument | null {
  const filePath = join(docsDir, "projects", projectName, "context.yaml");

  if (process.env.DEBUG) {
    console.error(`[file-store] Reading project context from: ${filePath}`);
  }

  if (!existsSync(filePath)) {
    if (process.env.DEBUG) {
      console.error(`[file-store] No context.yaml found for project "${projectName}" — skipping`);
    }
    return null;
  }

  const content = readFileSync(filePath, "utf-8");

  if (process.env.DEBUG) {
    console.error(`[file-store] Read ${content.length} bytes from ${projectName}/context.yaml`);
  }

  const ctx = parseContextYaml(content);

  if (process.env.DEBUG) {
    console.error(
      `[file-store] Successfully parsed ${ctx.contexts.length} context items for project ${projectName}`,
    );
  }

  return ctx;
}

/**
 * Reads and parses the root-level design.yaml into a validated GlobalDesign object.
 * Returns null if the file does not exist (global design is optional).
 *
 * @param docsDir - Path to the docs/ directory
 * @returns Validated global design, or null if design.yaml doesn't exist
 * @throws Error if malformed YAML or validation fails (but NOT for missing file)
 */
export function readGlobalDesign(
  docsDir: string,
): GlobalDesign | null {
  const filePath = join(docsDir, "design.yaml");

  if (process.env.DEBUG) {
    console.error(`[file-store] Reading global design from: ${filePath}`);
  }

  if (!existsSync(filePath)) {
    if (process.env.DEBUG) {
      console.error(`[file-store] No root design.yaml found — skipping`);
    }
    return null;
  }

  const content = readFileSync(filePath, "utf-8");

  if (process.env.DEBUG) {
    console.error(`[file-store] Read ${content.length} bytes from root design.yaml`);
  }

  const design = parseProjectDesignYaml(content);

  if (process.env.DEBUG) {
    console.error(
      `[file-store] Successfully parsed ${design.decisions.length} global design decisions`,
    );
  }

  return design;
}

/**
 * Lists project names by scanning the docs/projects/ directory.
 *
 * @param docsDir - Path to the docs/ directory
 * @returns Array of project directory names
 */
export function listProjects(docsDir: string): string[] {
  const projectsDir = join(docsDir, "projects");

  if (process.env.DEBUG) {
    console.error(`[file-store] Listing projects in: ${projectsDir}`);
  }

  try {
    const entries = readdirSync(projectsDir);
    const projects = entries.filter((entry) => {
      const entryPath = join(projectsDir, entry);
      return statSync(entryPath).isDirectory();
    });

    if (process.env.DEBUG) {
      console.error(`[file-store] Found ${projects.length} projects: ${projects.join(", ")}`);
    }

    return projects;
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

/**
 * Reads and parses a project's requirements.yaml into validated ProjectRequirements.
 *
 * @param docsDir - Path to the docs/ directory
 * @param projectName - Name of the project subdirectory
 * @returns Validated project requirements
 * @throws Error if file not found, malformed YAML, or validation fails
 */
export function readProjectRequirements(
  docsDir: string,
  projectName: string,
): ProjectRequirements {
  const filePath = join(docsDir, "projects", projectName, "requirements.yaml");

  if (process.env.DEBUG) {
    console.error(`[file-store] Reading project requirements from: ${filePath}`);
  }

  try {
    const content = readFileSync(filePath, "utf-8");

    if (process.env.DEBUG) {
      console.error(`[file-store] Read ${content.length} bytes from ${projectName}/requirements.yaml`);
    }

    const projectReqs = parseProjectRequirementsYaml(content);

    if (process.env.DEBUG) {
      console.error(
        `[file-store] Successfully parsed ${projectReqs.requirements.length} requirements for project ${projectName}`,
      );
    }

    return projectReqs;
  } catch (err) {
    if (err instanceof Error && "code" in err && err.code === "ENOENT") {
      throw new Error(`requirements.yaml not found for project "${projectName}" at ${filePath}`);
    }
    throw err;
  }
}

/**
 * Reads and parses a project's design.yaml into validated ProjectDesign.
 * Returns null if the file does not exist (design is optional).
 *
 * @param docsDir - Path to the docs/ directory
 * @param projectName - Name of the project subdirectory
 * @returns Validated project design, or null if design.yaml doesn't exist
 * @throws Error if malformed YAML or validation fails (but NOT for missing file)
 */
export function readProjectDesign(
  docsDir: string,
  projectName: string,
): ProjectDesign | null {
  const filePath = join(docsDir, "projects", projectName, "design.yaml");

  if (process.env.DEBUG) {
    console.error(`[file-store] Reading project design from: ${filePath}`);
  }

  if (!existsSync(filePath)) {
    if (process.env.DEBUG) {
      console.error(`[file-store] No design.yaml found for project "${projectName}" — skipping`);
    }
    return null;
  }

  const content = readFileSync(filePath, "utf-8");

  if (process.env.DEBUG) {
    console.error(`[file-store] Read ${content.length} bytes from ${projectName}/design.yaml`);
  }

  const design = parseProjectDesignYaml(content);

  if (process.env.DEBUG) {
    console.error(
      `[file-store] Successfully parsed ${design.decisions.length} decisions for project ${projectName}`,
    );
  }

  return design;
}
