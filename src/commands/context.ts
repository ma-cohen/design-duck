/**
 * CLI command: design-duck context <phase> [project]
 *
 * Generates AI-ready context prompts for each workflow phase and
 * writes them to stdout. Users pipe the output to their own AI agent.
 */

import { join } from "node:path";
import { existsSync } from "node:fs";
import {
  generateVisionContext,
  generateProjectsContext,
  generateRequirementsContext,
  generateDesignContext,
  generateChooseContext,
  generateImplementationContext,
  generateValidationsContext,
} from "../ai/context-generator";

export const PHASES = [
  "vision",
  "projects",
  "requirements",
  "design",
  "choose",
  "implementation",
  "validations",
] as const;

export type Phase = (typeof PHASES)[number];

/** Phases that require a project name argument. */
const PROJECT_PHASES = new Set<Phase>([
  "requirements",
  "design",
  "choose",
  "implementation",
]);

function isPhase(s: string): s is Phase {
  return PHASES.includes(s as Phase);
}

function printContextUsage(): void {
  console.error("Usage: design-duck context <phase> [project]");
  console.error("");
  console.error("Phases:");
  console.error("  vision           Define/refine the product vision");
  console.error("  projects         Split vision into projects");
  console.error(
    "  requirements <p> Gather requirements for a project",
  );
  console.error(
    "  design <p>       Brainstorm design decisions for a project",
  );
  console.error(
    "  choose <p>       Evaluate and choose design options",
  );
  console.error(
    "  implementation <p> Create implementation plan for a project",
  );
  console.error(
    "  validations      Define global cross-cutting validations",
  );
  process.exitCode = 1;
}

/**
 * Resolves the requirements directory from the current working directory.
 * Looks for desgin-duck/requirements/ in the given base directory.
 */
function resolveRequirementsDir(baseDir: string): string | null {
  const reqDir = join(baseDir, "desgin-duck", "requirements");
  if (existsSync(reqDir)) return reqDir;
  return null;
}

/**
 * Entry point for the `context` CLI command.
 *
 * @param args - Remaining CLI arguments after "context" (e.g., ["requirements", "user-auth"])
 * @param baseDir - Base directory to look for desgin-duck/requirements/ (defaults to cwd)
 */
export function context(
  args: string[],
  baseDir: string = process.cwd(),
): void {
  const phase = args[0];

  if (!phase || !isPhase(phase)) {
    printContextUsage();
    return;
  }

  const projectName = args[1];

  // Validate project argument for phases that require it
  if (PROJECT_PHASES.has(phase) && !projectName) {
    console.error(`Error: Phase "${phase}" requires a project name.`);
    console.error(`Usage: design-duck context ${phase} <project>`);
    process.exitCode = 1;
    return;
  }

  // Resolve the requirements directory
  const reqDir = resolveRequirementsDir(baseDir);

  // Vision phase can work without an existing requirements dir
  if (!reqDir && phase !== "vision") {
    console.error(
      "Error: desgin-duck/requirements/ directory not found.",
    );
    console.error("Run 'design-duck init' first to set up your project.");
    process.exitCode = 1;
    return;
  }

  try {
    let output: string;

    switch (phase) {
      case "vision":
        // Vision works even without init — reqDir may be null
        output = generateVisionContext(reqDir ?? join(baseDir, "desgin-duck", "requirements"));
        break;
      case "projects":
        output = generateProjectsContext(reqDir!);
        break;
      case "requirements":
        output = generateRequirementsContext(reqDir!, projectName!);
        break;
      case "design":
        output = generateDesignContext(reqDir!, projectName!);
        break;
      case "choose":
        output = generateChooseContext(reqDir!, projectName!);
        break;
      case "implementation":
        output = generateImplementationContext(reqDir!, projectName!);
        break;
      case "validations":
        output = generateValidationsContext(reqDir!);
        break;
    }

    process.stdout.write(output);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : String(err);
    console.error(`Error: ${message}`);
    process.exitCode = 1;
  }
}
