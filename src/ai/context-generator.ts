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

/**
 * Reads the root implementation.yaml (global validations) as raw text. Returns null if missing.
 */
function readRawGlobalValidations(docsDir: string): string | null {
  return readRawOrNull(join(docsDir, "implementation.yaml"));
}

/**
 * Reads a playground's requirements.yaml as raw text. Returns null if missing.
 */
function readRawPlaygroundRequirements(
  docsDir: string,
  playgroundName: string,
): string | null {
  return readRawOrNull(
    join(docsDir, "playgrounds", playgroundName, "requirements.yaml"),
  );
}

/**
 * Reads a playground's context.yaml as raw text. Returns null if missing.
 */
function readRawPlaygroundContext(
  docsDir: string,
  playgroundName: string,
): string | null {
  return readRawOrNull(
    join(docsDir, "playgrounds", playgroundName, "context.yaml"),
  );
}

/**
 * Reads a playground's design.yaml as raw text. Returns null if missing.
 */
function readRawPlaygroundDesign(
  docsDir: string,
  playgroundName: string,
): string | null {
  return readRawOrNull(
    join(docsDir, "playgrounds", playgroundName, "design.yaml"),
  );
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
  const rawVision = readRawVision(docsDir);
  if (!rawVision) {
    throw new Error(
      "vision.yaml not found. Run 'design-duck context vision' first to define your vision.",
    );
  }

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
  const rawVision = readRawVision(docsDir);
  if (!rawVision) {
    throw new Error(
      "vision.yaml not found. Run 'design-duck context vision' first.",
    );
  }

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
  const rawVision = readRawVision(docsDir);
  if (!rawVision) {
    throw new Error(
      "vision.yaml not found. Run 'design-duck context vision' first.",
    );
  }

  const rawReqs = readRawProjectRequirements(docsDir, projectName);
  if (!rawReqs) {
    throw new Error(
      `requirements.yaml not found for project "${projectName}". Run 'design-duck context requirements ${projectName}' first.`,
    );
  }

  const rawGlobalDesign = readRawGlobalDesign(docsDir);
  const rawGlobalValidations = readRawGlobalValidations(docsDir);
  const rawRootContext = readRawRootContext(docsDir);
  const rawProjectContext = readRawProjectContext(docsDir, projectName);

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
  docsDir: string,
  projectName: string,
): string {
  const rawVision = readRawVision(docsDir);
  if (!rawVision) {
    throw new Error(
      "vision.yaml not found. Run 'design-duck context vision' first.",
    );
  }

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
 * Phase 6: Implementation Plan — create todos, validations, and tests.
 */
export function generateImplementationContext(
  docsDir: string,
  projectName: string,
): string {
  const rawVision = readRawVision(docsDir);
  if (!rawVision) {
    throw new Error(
      "vision.yaml not found. Run 'design-duck context vision' first.",
    );
  }

  const rawReqs = readRawProjectRequirements(docsDir, projectName);
  if (!rawReqs) {
    throw new Error(
      `requirements.yaml not found for project "${projectName}".`,
    );
  }

  const rawDesign = readRawProjectDesign(docsDir, projectName);
  const rawGlobalDesign = readRawGlobalDesign(docsDir);
  const rawGlobalValidations = readRawGlobalValidations(docsDir);
  const rawRootContext = readRawRootContext(docsDir);
  const rawProjectContext = readRawProjectContext(docsDir, projectName);

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
export function generateValidationsContext(docsDir: string): string {
  const rawVision = readRawVision(docsDir);
  if (!rawVision) {
    throw new Error(
      "vision.yaml not found. Run 'design-duck context vision' first.",
    );
  }

  // Build a summary of all projects
  const projects = listProjects(docsDir);
  let projectSummaries: string;

  if (projects.length === 0) {
    projectSummaries = "No projects defined yet.";
  } else {
    const summaryLines = projects.map((name) => {
      const reqs = readRawProjectRequirements(docsDir, name);
      const design = readRawProjectDesign(docsDir, name);
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

  const rawValidations = readRawGlobalValidations(docsDir);
  const rawRootContext = readRawRootContext(docsDir);
  return validationsPrompt(rawVision, projectSummaries, rawValidations, rawRootContext);
}

// ---------------------------------------------------------------------------
// Playground context generators
// ---------------------------------------------------------------------------

/**
 * Playground phase: create/list playgrounds.
 */
export function generatePlaygroundContext(docsDir: string): string {
  const existing = listPlaygrounds(docsDir);
  return playgroundPrompt(existing);
}

/**
 * Playground Requirements: gather requirements for a playground.
 */
export function generatePlaygroundRequirementsContext(
  docsDir: string,
  playgroundName: string,
): string {
  const rawReqs = readRawPlaygroundRequirements(docsDir, playgroundName);
  return playgroundRequirementsPrompt(playgroundName, rawReqs);
}

/**
 * Playground Design: brainstorm design decisions for a playground.
 */
export function generatePlaygroundDesignContext(
  docsDir: string,
  playgroundName: string,
): string {
  const rawReqs = readRawPlaygroundRequirements(docsDir, playgroundName);
  if (!rawReqs) {
    throw new Error(
      `requirements.yaml not found for playground "${playgroundName}". Run 'dd context playground-requirements ${playgroundName}' first.`,
    );
  }

  const rawPlaygroundContext = readRawPlaygroundContext(docsDir, playgroundName);
  return playgroundDesignPrompt(playgroundName, rawReqs, rawPlaygroundContext);
}

/**
 * Playground Choose: evaluate and pick design options for a playground.
 */
export function generatePlaygroundChooseContext(
  docsDir: string,
  playgroundName: string,
): string {
  const rawReqs = readRawPlaygroundRequirements(docsDir, playgroundName);
  if (!rawReqs) {
    throw new Error(
      `requirements.yaml not found for playground "${playgroundName}".`,
    );
  }

  const rawDesign = readRawPlaygroundDesign(docsDir, playgroundName);
  if (!rawDesign) {
    throw new Error(
      `design.yaml not found for playground "${playgroundName}". Run 'dd context playground-design ${playgroundName}' first.`,
    );
  }

  const rawPlaygroundContext = readRawPlaygroundContext(docsDir, playgroundName);
  return playgroundChoosePrompt(playgroundName, rawReqs, rawDesign, rawPlaygroundContext);
}

/**
 * Playground Implementation: create implementation plan for a playground.
 */
export function generatePlaygroundImplementationContext(
  docsDir: string,
  playgroundName: string,
): string {
  const rawReqs = readRawPlaygroundRequirements(docsDir, playgroundName);
  if (!rawReqs) {
    throw new Error(
      `requirements.yaml not found for playground "${playgroundName}".`,
    );
  }

  const rawDesign = readRawPlaygroundDesign(docsDir, playgroundName);
  const rawPlaygroundContext = readRawPlaygroundContext(docsDir, playgroundName);
  return playgroundImplementationPrompt(playgroundName, rawReqs, rawDesign, rawPlaygroundContext);
}
