/**
 * AI context generator — reads YAML state from disk and assembles
 * structured prompts for each workflow phase.
 *
 * Each function reads the relevant files, extracts raw YAML content,
 * and delegates to the prompt templates in ./prompts.ts.
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  listProjects,
  readProjectDesign,
} from "../infrastructure/file-store";
import {
  visionPrompt,
  projectsPrompt,
  requirementsPrompt,
  designPrompt,
  choosePrompt,
  propagatePrompt,
  solvePrompt,
  addPrompt,
  type SolveState,
} from "./prompts";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Reads a file as raw text, returning null if it doesn't exist.
 */
function readRawOrNull(filePath: string): string | null {
  if (!existsSync(filePath)) return null;
  return readFileSync(filePath, "utf-8");
}

/**
 * Reads vision.yaml as raw text. Returns null if missing.
 */
function readRawVision(docsDir: string): string | null {
  return readRawOrNull(join(docsDir, "vision.yaml"));
}

/**
 * Reads the root context.yaml as raw text. Returns null if missing.
 */
function readRawRootContext(docsDir: string): string | null {
  return readRawOrNull(join(docsDir, "context.yaml"));
}

/**
 * Reads a project's context.yaml as raw text. Returns null if missing.
 */
function readRawProjectContext(
  docsDir: string,
  projectName: string,
): string | null {
  return readRawOrNull(
    join(docsDir, "projects", projectName, "context.yaml"),
  );
}

/**
 * Reads a project's requirements.yaml as raw text. Returns null if missing.
 */
function readRawProjectRequirements(
  docsDir: string,
  projectName: string,
): string | null {
  return readRawOrNull(
    join(docsDir, "projects", projectName, "requirements.yaml"),
  );
}

/**
 * Reads a project's design.yaml as raw text. Returns null if missing.
 */
function readRawProjectDesign(
  docsDir: string,
  projectName: string,
): string | null {
  return readRawOrNull(
    join(docsDir, "projects", projectName, "design.yaml"),
  );
}

/**
 * Reads the root design.yaml (global design) as raw text. Returns null if missing.
 */
function readRawGlobalDesign(docsDir: string): string | null {
  return readRawOrNull(join(docsDir, "design.yaml"));
}

// ---------------------------------------------------------------------------
// Context generators
// ---------------------------------------------------------------------------

/**
 * Phase 1: Vision — help define or refine the product vision.
 */
export function generateVisionContext(docsDir: string): string {
  const rawVision = readRawVision(docsDir);
  const rawRootContext = readRawRootContext(docsDir);
  return visionPrompt(rawVision, rawRootContext);
}

/**
 * Phase 2: Projects — suggest how to split the vision into projects.
 */
export function generateProjectsContext(docsDir: string): string {
  const rawVision = readRawVision(docsDir) ?? "";

  const existing = listProjects(docsDir);
  const rawRootContext = readRawRootContext(docsDir);
  return projectsPrompt(rawVision, existing, rawRootContext);
}

/**
 * Phase 3: Requirements — gather user-value requirements for a project.
 */
export function generateRequirementsContext(
  docsDir: string,
  projectName: string,
): string {
  const rawVision = readRawVision(docsDir) ?? "";

  const rawReqs = readRawProjectRequirements(docsDir, projectName);
  const rawRootContext = readRawRootContext(docsDir);
  return requirementsPrompt(rawVision, projectName, rawReqs, rawRootContext);
}

/**
 * Phase 4: Design Brainstorm — propose design decisions with options.
 */
export function generateDesignContext(
  docsDir: string,
  projectName: string,
): string {
  const rawVision = readRawVision(docsDir) ?? "";

  const rawReqs = readRawProjectRequirements(docsDir, projectName);
  if (!rawReqs) {
    throw new Error(
      `requirements.yaml not found for project "${projectName}". Run 'design-duck context requirements ${projectName}' first.`,
    );
  }

  const rawGlobalDesign = readRawGlobalDesign(docsDir);
  const rawRootContext = readRawRootContext(docsDir);
  const rawProjectContext = readRawProjectContext(docsDir, projectName);
  const rawProjectDesign = readRawProjectDesign(docsDir, projectName);

  return designPrompt(
    rawVision,
    projectName,
    rawReqs,
    rawGlobalDesign,
    rawRootContext,
    rawProjectContext,
    rawProjectDesign,
  );
}

/**
 * Phase 5: Choose Design — evaluate options and recommend choices.
 */
export function generateChooseContext(
  docsDir: string,
  projectName: string,
): string {
  const rawVision = readRawVision(docsDir) ?? "";

  const rawReqs = readRawProjectRequirements(docsDir, projectName);
  if (!rawReqs) {
    throw new Error(
      `requirements.yaml not found for project "${projectName}".`,
    );
  }

  const rawDesign = readRawProjectDesign(docsDir, projectName);
  if (!rawDesign) {
    throw new Error(
      `design.yaml not found for project "${projectName}". Run 'design-duck context design ${projectName}' first.`,
    );
  }

  const rawRootContext = readRawRootContext(docsDir);
  const rawProjectContext = readRawProjectContext(docsDir, projectName);
  return choosePrompt(rawVision, projectName, rawReqs, rawDesign, rawRootContext, rawProjectContext);
}

/**
 * Propagation Review — review chosen decisions and suggest which to propagate to global.
 */
export function generatePropagateContext(
  docsDir: string,
  projectName: string,
): string {
  const rawVision = readRawVision(docsDir) ?? "";

  const rawDesign = readRawProjectDesign(docsDir, projectName);
  if (!rawDesign) {
    throw new Error(
      `design.yaml not found for project "${projectName}". Run 'design-duck context design ${projectName}' first.`,
    );
  }

  const rawGlobalDesign = readRawGlobalDesign(docsDir);

  // Gather other project designs for cross-referencing
  const allProjects = listProjects(docsDir);
  const otherProjectDesigns: { name: string; yaml: string }[] = [];
  for (const name of allProjects) {
    if (name === projectName) continue;
    const otherDesign = readRawProjectDesign(docsDir, name);
    if (otherDesign) {
      otherProjectDesigns.push({ name, yaml: otherDesign });
    }
  }

  return propagatePrompt(
    rawVision,
    projectName,
    rawDesign,
    rawGlobalDesign,
    otherProjectDesigns,
  );
}

/**
 * Solve — run the full cycle from current state.
 */
export function generateNewContext(docsDir: string): string {
  const rawVision = readRawVision(docsDir);
  const rawRootContext = readRawRootContext(docsDir);
  const rawGlobalDesign = readRawGlobalDesign(docsDir);
  const existing = listProjects(docsDir);

  const projects: SolveState["projects"] = {};
  for (const name of existing) {
    projects[name] = {
      requirementsYaml: readRawProjectRequirements(docsDir, name),
      contextYaml: readRawProjectContext(docsDir, name),
      designYaml: readRawProjectDesign(docsDir, name),
    };
  }

  return solvePrompt({
    visionYaml: rawVision,
    rootContextYaml: rawRootContext,
    existingProjects: existing,
    projects,
    globalDesignYaml: rawGlobalDesign,
  });
}

/**
 * Add Problem — extend an existing project with new requirements and design.
 */
export function generateExtendContext(
  docsDir: string,
  projectName: string,
): string {
  const rawVision = readRawVision(docsDir) ?? "";

  const rawReqs = readRawProjectRequirements(docsDir, projectName);
  if (!rawReqs) {
    throw new Error(
      `requirements.yaml not found for project "${projectName}". The project must exist before adding problems to it.`,
    );
  }

  const rawRootContext = readRawRootContext(docsDir);
  const rawProjectContext = readRawProjectContext(docsDir, projectName);
  const rawProjectDesign = readRawProjectDesign(docsDir, projectName);
  const rawGlobalDesign = readRawGlobalDesign(docsDir);

  return addPrompt(
    rawVision,
    projectName,
    rawReqs,
    rawRootContext,
    rawProjectContext,
    rawProjectDesign,
    rawGlobalDesign,
  );
}
