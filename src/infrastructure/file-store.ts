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
  parseGeneralValidationsYaml,
  parseProjectImplementationYaml,
} from "./yaml-parser";
import type { Vision, ProjectRequirements, ProjectDesign, GlobalDesign, GeneralValidations, ProjectImplementation } from "../domain/requirements/requirement";

// Re-export pure parsers for backward compatibility
export { parseVisionYaml, parseProjectRequirementsYaml, parseProjectDesignYaml, parseGeneralValidationsYaml, parseProjectImplementationYaml } from "./yaml-parser";

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
 * Reads and parses the root-level design.yaml into a validated GlobalDesign object.
 * Returns null if the file does not exist (global design is optional).
 *
 * @param requirementsDir - Path to the requirements/ directory
 * @returns Validated global design, or null if design.yaml doesn't exist
 * @throws Error if malformed YAML or validation fails (but NOT for missing file)
 */
export function readGlobalDesign(
  requirementsDir: string,
): GlobalDesign | null {
  const filePath = join(requirementsDir, "design.yaml");

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

/**
 * Reads and parses the root-level implementation.yaml into validated GeneralValidations.
 * Returns null if the file does not exist (implementation is optional).
 *
 * @param requirementsDir - Path to the requirements/ directory
 * @returns Validated general validations, or null if implementation.yaml doesn't exist
 * @throws Error if malformed YAML or validation fails (but NOT for missing file)
 */
export function readGeneralValidations(
  requirementsDir: string,
): GeneralValidations | null {
  const filePath = join(requirementsDir, "implementation.yaml");

  if (process.env.DEBUG) {
    console.error(`[file-store] Reading general validations from: ${filePath}`);
  }

  if (!existsSync(filePath)) {
    if (process.env.DEBUG) {
      console.error(`[file-store] No implementation.yaml found — skipping`);
    }
    return null;
  }

  const content = readFileSync(filePath, "utf-8");

  if (process.env.DEBUG) {
    console.error(`[file-store] Read ${content.length} bytes from implementation.yaml`);
  }

  const generalValidations = parseGeneralValidationsYaml(content);

  if (process.env.DEBUG) {
    console.error(
      `[file-store] Successfully parsed ${generalValidations.validations.length} general validations`,
    );
  }

  return generalValidations;
}

/**
 * Reads and parses a project's implementation.yaml into validated ProjectImplementation.
 * Returns null if the file does not exist (implementation is optional).
 *
 * @param requirementsDir - Path to the requirements/ directory
 * @param projectName - Name of the project subdirectory
 * @returns Validated project implementation, or null if implementation.yaml doesn't exist
 * @throws Error if malformed YAML or validation fails (but NOT for missing file)
 */
export function readProjectImplementation(
  requirementsDir: string,
  projectName: string,
): ProjectImplementation | null {
  const filePath = join(requirementsDir, "projects", projectName, "implementation.yaml");

  if (process.env.DEBUG) {
    console.error(`[file-store] Reading project implementation from: ${filePath}`);
  }

  if (!existsSync(filePath)) {
    if (process.env.DEBUG) {
      console.error(`[file-store] No implementation.yaml found for project "${projectName}" — skipping`);
    }
    return null;
  }

  const content = readFileSync(filePath, "utf-8");

  if (process.env.DEBUG) {
    console.error(`[file-store] Read ${content.length} bytes from ${projectName}/implementation.yaml`);
  }

  const implementation = parseProjectImplementationYaml(content);

  if (process.env.DEBUG) {
    console.error(
      `[file-store] Successfully parsed implementation for project ${projectName}: ${implementation.todos.length} todos, ${implementation.validations.length} validations, ${implementation.tests.length} tests`,
    );
  }

  return implementation;
}
