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
  generatePropagateContext,
  generateSolveContext,
  generateAddContext,
} from "../ai/context-generator";

export const PHASES = [
  "vision",
  "projects",
  "requirements",
  "design",
  "choose",
  "propagate",
  "solve",
  "add",
] as const;

export type Phase = (typeof PHASES)[number];

/** Phases that require a project name argument. */
const PROJECT_PHASES = new Set<Phase>([
  "requirements",
  "design",
  "choose",
  "propagate",
  "add",
]);

function isPhase(s: string): s is Phase {
  return PHASES.includes(s as Phase);
}

function printContextUsage(): void {
  console.error("Usage: design-duck context <phase> [project]");
  console.error("");
  console.error("Phases:");
  console.error("  vision                        Define/refine the product vision");
  console.error("  projects                      Split vision into projects");
  console.error("  requirements <p>              Gather requirements for a project");
  console.error("  design <p>                    Brainstorm design decisions for a project");
  console.error("  choose <p>                    Evaluate and choose design options");
  console.error("  propagate <p>                 Review decisions for propagation to global");
  console.error("  solve                         Run the full cycle from current state");
  console.error("  add <p>                       Add a new problem to an existing project");
  process.exitCode = 1;
}

/**
 * Resolves the requirements directory from the current working directory.
 * Looks for design-duck/docs/ in the given base directory.
 */
function resolveRequirementsDir(baseDir: string): string | null {
  const docsDir = join(baseDir, "design-duck", "docs");
  if (existsSync(docsDir)) return docsDir;
  return null;
}

/**
 * Entry point for the `context` CLI command.
 *
 * @param args - Remaining CLI arguments after "context" (e.g., ["requirements", "user-auth"])
 * @param baseDir - Base directory to look for design-duck/docs/ (defaults to cwd)
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
  const docsDir = resolveRequirementsDir(baseDir);

  // Vision phase can work without an existing requirements dir
  if (!docsDir && phase !== "vision" && phase !== "solve") {
    console.error(
      "Error: design-duck/docs/ directory not found.",
    );
    console.error("Run 'design-duck init' first to set up your project.");
    process.exitCode = 1;
    return;
  }

  try {
    let output: string;

    switch (phase) {
      case "vision":
        // Vision works even without init — docsDir may be null
        output = generateVisionContext(docsDir ?? join(baseDir, "design-duck", "docs"));
        break;
      case "projects":
        output = generateProjectsContext(docsDir!);
        break;
      case "requirements":
        output = generateRequirementsContext(docsDir!, projectName!);
        break;
      case "design":
        output = generateDesignContext(docsDir!, projectName!);
        break;
      case "choose":
        output = generateChooseContext(docsDir!, projectName!);
        break;
      case "propagate":
        output = generatePropagateContext(docsDir!, projectName!);
        break;
      case "solve":
        output = generateSolveContext(docsDir ?? join(baseDir, "design-duck", "docs"));
        break;
      case "add":
        output = generateAddContext(docsDir!, projectName!);
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
