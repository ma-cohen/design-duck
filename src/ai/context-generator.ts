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
  listPlaygrounds,
  readProjectRequirements,
  readProjectDesign,
} from "../infrastructure/file-store";
import {
  visionPrompt,
  projectsPrompt,
  requirementsPrompt,
  designPrompt,
  choosePrompt,
  implementationPrompt,
  validationsPrompt,
  playgroundPrompt,
  playgroundRequirementsPrompt,
  playgroundDesignPrompt,
  playgroundChoosePrompt,
  playgroundImplementationPrompt,
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
function readRawVision(reqDir: string): string | null {
  return readRawOrNull(join(reqDir, "vision.yaml"));
}

/**
 * Reads the root context.yaml as raw text. Returns null if missing.
 */
function readRawRootContext(reqDir: string): string | null {
  return readRawOrNull(join(reqDir, "context.yaml"));
}

/**
 * Reads a project's context.yaml as raw text. Returns null if missing.
 */
function readRawProjectContext(
  reqDir: string,
  projectName: string,
): string | null {
  return readRawOrNull(
    join(reqDir, "projects", projectName, "context.yaml"),
  );
}

/**
 * Reads a project's requirements.yaml as raw text. Returns null if missing.
 */
function readRawProjectRequirements(
  reqDir: string,
  projectName: string,
): string | null {
  return readRawOrNull(
    join(reqDir, "projects", projectName, "requirements.yaml"),
  );
}

/**
 * Reads a project's design.yaml as raw text. Returns null if missing.
 */
function readRawProjectDesign(
  reqDir: string,
  projectName: string,
): string | null {
  return readRawOrNull(
    join(reqDir, "projects", projectName, "design.yaml"),
  );
}

/**
 * Reads the root design.yaml (global design) as raw text. Returns null if missing.
 */
function readRawGlobalDesign(reqDir: string): string | null {
  return readRawOrNull(join(reqDir, "design.yaml"));
}

/**
 * Reads the root implementation.yaml (global validations) as raw text. Returns null if missing.
 */
function readRawGlobalValidations(reqDir: string): string | null {
  return readRawOrNull(join(reqDir, "implementation.yaml"));
}

/**
 * Reads a playground's requirements.yaml as raw text. Returns null if missing.
 */
function readRawPlaygroundRequirements(
  reqDir: string,
  playgroundName: string,
): string | null {
  return readRawOrNull(
    join(reqDir, "playgrounds", playgroundName, "requirements.yaml"),
  );
}

/**
 * Reads a playground's context.yaml as raw text. Returns null if missing.
 */
function readRawPlaygroundContext(
  reqDir: string,
  playgroundName: string,
): string | null {
  return readRawOrNull(
    join(reqDir, "playgrounds", playgroundName, "context.yaml"),
  );
}

/**
 * Reads a playground's design.yaml as raw text. Returns null if missing.
 */
function readRawPlaygroundDesign(
  reqDir: string,
  playgroundName: string,
): string | null {
  return readRawOrNull(
    join(reqDir, "playgrounds", playgroundName, "design.yaml"),
  );
}

// ---------------------------------------------------------------------------
// Context generators
// ---------------------------------------------------------------------------

/**
 * Phase 1: Vision — help define or refine the product vision.
 */
export function generateVisionContext(reqDir: string): string {
  const rawVision = readRawVision(reqDir);
  const rawRootContext = readRawRootContext(reqDir);
  return visionPrompt(rawVision, rawRootContext);
}

/**
 * Phase 2: Projects — suggest how to split the vision into projects.
 */
export function generateProjectsContext(reqDir: string): string {
  const rawVision = readRawVision(reqDir);
  if (!rawVision) {
    throw new Error(
      "vision.yaml not found. Run 'design-duck context vision' first to define your vision.",
    );
  }

  const existing = listProjects(reqDir);
  const rawRootContext = readRawRootContext(reqDir);
  return projectsPrompt(rawVision, existing, rawRootContext);
}

/**
 * Phase 3: Requirements — gather user-value requirements for a project.
 */
export function generateRequirementsContext(
  reqDir: string,
  projectName: string,
): string {
  const rawVision = readRawVision(reqDir);
  if (!rawVision) {
    throw new Error(
      "vision.yaml not found. Run 'design-duck context vision' first.",
    );
  }

  const rawReqs = readRawProjectRequirements(reqDir, projectName);
  const rawRootContext = readRawRootContext(reqDir);
  return requirementsPrompt(rawVision, projectName, rawReqs, rawRootContext);
}

/**
 * Phase 4: Design Brainstorm — propose design decisions with options.
 */
export function generateDesignContext(
  reqDir: string,
  projectName: string,
): string {
  const rawVision = readRawVision(reqDir);
  if (!rawVision) {
    throw new Error(
      "vision.yaml not found. Run 'design-duck context vision' first.",
    );
  }

  const rawReqs = readRawProjectRequirements(reqDir, projectName);
  if (!rawReqs) {
    throw new Error(
      `requirements.yaml not found for project "${projectName}". Run 'design-duck context requirements ${projectName}' first.`,
    );
  }

  const rawGlobalDesign = readRawGlobalDesign(reqDir);
  const rawGlobalValidations = readRawGlobalValidations(reqDir);
  const rawRootContext = readRawRootContext(reqDir);
  const rawProjectContext = readRawProjectContext(reqDir, projectName);

  return designPrompt(
    rawVision,
    projectName,
    rawReqs,
    rawGlobalDesign,
    rawGlobalValidations,
    rawRootContext,
    rawProjectContext,
  );
}

/**
 * Phase 5: Choose Design — evaluate options and recommend choices.
 */
export function generateChooseContext(
  reqDir: string,
  projectName: string,
): string {
  const rawVision = readRawVision(reqDir);
  if (!rawVision) {
    throw new Error(
      "vision.yaml not found. Run 'design-duck context vision' first.",
    );
  }

  const rawReqs = readRawProjectRequirements(reqDir, projectName);
  if (!rawReqs) {
    throw new Error(
      `requirements.yaml not found for project "${projectName}".`,
    );
  }

  const rawDesign = readRawProjectDesign(reqDir, projectName);
  if (!rawDesign) {
    throw new Error(
      `design.yaml not found for project "${projectName}". Run 'design-duck context design ${projectName}' first.`,
    );
  }

  const rawRootContext = readRawRootContext(reqDir);
  const rawProjectContext = readRawProjectContext(reqDir, projectName);
  return choosePrompt(rawVision, projectName, rawReqs, rawDesign, rawRootContext, rawProjectContext);
}

/**
 * Phase 6: Implementation Plan — create todos, validations, and tests.
 */
export function generateImplementationContext(
  reqDir: string,
  projectName: string,
): string {
  const rawVision = readRawVision(reqDir);
  if (!rawVision) {
    throw new Error(
      "vision.yaml not found. Run 'design-duck context vision' first.",
    );
  }

  const rawReqs = readRawProjectRequirements(reqDir, projectName);
  if (!rawReqs) {
    throw new Error(
      `requirements.yaml not found for project "${projectName}".`,
    );
  }

  const rawDesign = readRawProjectDesign(reqDir, projectName);
  const rawGlobalDesign = readRawGlobalDesign(reqDir);
  const rawGlobalValidations = readRawGlobalValidations(reqDir);
  const rawRootContext = readRawRootContext(reqDir);
  const rawProjectContext = readRawProjectContext(reqDir, projectName);

  return implementationPrompt(
    rawVision,
    projectName,
    rawReqs,
    rawDesign,
    rawGlobalDesign,
    rawGlobalValidations,
    rawRootContext,
    rawProjectContext,
  );
}

/**
 * Global Validations — define cross-cutting validation rules.
 */
export function generateValidationsContext(reqDir: string): string {
  const rawVision = readRawVision(reqDir);
  if (!rawVision) {
    throw new Error(
      "vision.yaml not found. Run 'design-duck context vision' first.",
    );
  }

  // Build a summary of all projects
  const projects = listProjects(reqDir);
  let projectSummaries: string;

  if (projects.length === 0) {
    projectSummaries = "No projects defined yet.";
  } else {
    const summaryLines = projects.map((name) => {
      const reqs = readRawProjectRequirements(reqDir, name);
      const design = readRawProjectDesign(reqDir, name);
      const parts = [`- **${name}**`];
      if (reqs) {
        // Count requirements by looking for "- id:" lines
        const reqCount = (reqs.match(/- id:/g) || []).length;
        parts.push(`${reqCount} requirement(s)`);
      } else {
        parts.push("no requirements yet");
      }
      if (design) {
        const decCount = (design.match(/- id: DEC/g) || []).length;
        parts.push(`${decCount} design decision(s)`);
      }
      return parts.join(" — ");
    });
    projectSummaries = summaryLines.join("\n");
  }

  const rawValidations = readRawGlobalValidations(reqDir);
  const rawRootContext = readRawRootContext(reqDir);
  return validationsPrompt(rawVision, projectSummaries, rawValidations, rawRootContext);
}

// ---------------------------------------------------------------------------
// Playground context generators
// ---------------------------------------------------------------------------

/**
 * Playground phase: create/list playgrounds.
 */
export function generatePlaygroundContext(reqDir: string): string {
  const existing = listPlaygrounds(reqDir);
  return playgroundPrompt(existing);
}

/**
 * Playground Requirements: gather requirements for a playground.
 */
export function generatePlaygroundRequirementsContext(
  reqDir: string,
  playgroundName: string,
): string {
  const rawReqs = readRawPlaygroundRequirements(reqDir, playgroundName);
  return playgroundRequirementsPrompt(playgroundName, rawReqs);
}

/**
 * Playground Design: brainstorm design decisions for a playground.
 */
export function generatePlaygroundDesignContext(
  reqDir: string,
  playgroundName: string,
): string {
  const rawReqs = readRawPlaygroundRequirements(reqDir, playgroundName);
  if (!rawReqs) {
    throw new Error(
      `requirements.yaml not found for playground "${playgroundName}". Run 'dd context playground-requirements ${playgroundName}' first.`,
    );
  }

  const rawPlaygroundContext = readRawPlaygroundContext(reqDir, playgroundName);
  return playgroundDesignPrompt(playgroundName, rawReqs, rawPlaygroundContext);
}

/**
 * Playground Choose: evaluate and pick design options for a playground.
 */
export function generatePlaygroundChooseContext(
  reqDir: string,
  playgroundName: string,
): string {
  const rawReqs = readRawPlaygroundRequirements(reqDir, playgroundName);
  if (!rawReqs) {
    throw new Error(
      `requirements.yaml not found for playground "${playgroundName}".`,
    );
  }

  const rawDesign = readRawPlaygroundDesign(reqDir, playgroundName);
  if (!rawDesign) {
    throw new Error(
      `design.yaml not found for playground "${playgroundName}". Run 'dd context playground-design ${playgroundName}' first.`,
    );
  }

  const rawPlaygroundContext = readRawPlaygroundContext(reqDir, playgroundName);
  return playgroundChoosePrompt(playgroundName, rawReqs, rawDesign, rawPlaygroundContext);
}

/**
 * Playground Implementation: create implementation plan for a playground.
 */
export function generatePlaygroundImplementationContext(
  reqDir: string,
  playgroundName: string,
): string {
  const rawReqs = readRawPlaygroundRequirements(reqDir, playgroundName);
  if (!rawReqs) {
    throw new Error(
      `requirements.yaml not found for playground "${playgroundName}".`,
    );
  }

  const rawDesign = readRawPlaygroundDesign(reqDir, playgroundName);
  const rawPlaygroundContext = readRawPlaygroundContext(reqDir, playgroundName);
  return playgroundImplementationPrompt(playgroundName, rawReqs, rawDesign, rawPlaygroundContext);
}
