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
  generatePlaygroundContext,
  generatePlaygroundRequirementsContext,
  generatePlaygroundDesignContext,
  generatePlaygroundChooseContext,
  generatePlaygroundImplementationContext,
} from "../ai/context-generator";

export const PHASES = [
  "vision",
  "projects",
  "requirements",
  "design",
  "choose",
  "implementation",
  "validations",
  "playground",
  "playground-requirements",
  "playground-design",
  "playground-choose",
  "playground-implementation",
] as const;

export type Phase = (typeof PHASES)[number];

/** Phases that require a project name argument. */
const PROJECT_PHASES = new Set<Phase>([
  "requirements",
  "design",
  "choose",
  "implementation",
]);

/** Phases that require a playground name argument. */
const PLAYGROUND_PHASES = new Set<Phase>([
  "playground-requirements",
  "playground-design",
  "playground-choose",
  "playground-implementation",
]);

function isPhase(s: string): s is Phase {
  return PHASES.includes(s as Phase);
}

function printContextUsage(): void {
  console.error("Usage: design-duck context <phase> [project|playground]");
  console.error("");
  console.error("Phases:");
  console.error("  vision                        Define/refine the product vision");
  console.error("  projects                      Split vision into projects");
  console.error("  requirements <p>              Gather requirements for a project");
  console.error("  design <p>                    Brainstorm design decisions for a project");
  console.error("  choose <p>                    Evaluate and choose design options");
  console.error("  implementation <p>            Create implementation plan for a project");
  console.error("  validations                   Define global cross-cutting validations");
  console.error("");
  console.error("Playground phases (isolated problem-solving):");
  console.error("  playground                    Create/list playgrounds");
  console.error("  playground-requirements <pg>  Gather requirements for a playground");
  console.error("  playground-design <pg>        Brainstorm design decisions for a playground");
  console.error("  playground-choose <pg>        Evaluate and choose design options");
  console.error("  playground-implementation <pg> Create implementation plan for a playground");
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

  // Validate playground argument for phases that require it
  if (PLAYGROUND_PHASES.has(phase) && !projectName) {
    console.error(`Error: Phase "${phase}" requires a playground name.`);
    console.error(`Usage: design-duck context ${phase} <playground>`);
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
      case "playground":
        output = generatePlaygroundContext(reqDir!);
        break;
      case "playground-requirements":
        output = generatePlaygroundRequirementsContext(reqDir!, projectName!);
        break;
      case "playground-design":
        output = generatePlaygroundDesignContext(reqDir!, projectName!);
        break;
      case "playground-choose":
        output = generatePlaygroundChooseContext(reqDir!, projectName!);
        break;
      case "playground-implementation":
        output = generatePlaygroundImplementationContext(reqDir!, projectName!);
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
