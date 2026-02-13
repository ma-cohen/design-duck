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
  parseProjectDesignYaml,
} from "./yaml-parser";
import type { Vision, ProjectRequirements, ProjectDesign } from "../domain/requirements/requirement";

// Re-export pure parsers for backward compatibility
export { parseVisionYaml, parseProjectRequirementsYaml, parseProjectDesignYaml } from "./yaml-parser";

// ---------------------------------------------------------------------------
// Filesystem readers (Node/Bun only)
// ---------------------------------------------------------------------------

/**
 * Reads and parses vision.yaml into a validated Vision object.
 *
 * @param requirementsDir - Path to the requirements/ directory
 * @returns Validated vision object
 * @throws Error if file not found, malformed YAML, or validation fails
 */
export function readVision(requirementsDir: string): Vision {
  const filePath = join(requirementsDir, "vision.yaml");

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
 * Lists project names by scanning the requirements/projects/ directory.
 *
 * @param requirementsDir - Path to the requirements/ directory
 * @returns Array of project directory names
 */
export function listProjects(requirementsDir: string): string[] {
  const projectsDir = join(requirementsDir, "projects");

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
 * @param requirementsDir - Path to the requirements/ directory
 * @param projectName - Name of the project subdirectory
 * @returns Validated project requirements
 * @throws Error if file not found, malformed YAML, or validation fails
 */
export function readProjectRequirements(
  requirementsDir: string,
  projectName: string,
): ProjectRequirements {
  const filePath = join(requirementsDir, "projects", projectName, "requirements.yaml");

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
 * @param requirementsDir - Path to the requirements/ directory
 * @param projectName - Name of the project subdirectory
 * @returns Validated project design, or null if design.yaml doesn't exist
 * @throws Error if malformed YAML or validation fails (but NOT for missing file)
 */
export function readProjectDesign(
  requirementsDir: string,
  projectName: string,
): ProjectDesign | null {
  const filePath = join(requirementsDir, "projects", projectName, "design.yaml");

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
