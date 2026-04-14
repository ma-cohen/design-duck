import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { COMMAND_FILES, SLASH_COMMAND_FILES } from "../templates/commands-md";
import { writeProjectVersion } from "../infrastructure/version";
import { writeIntegration, Integration } from "../infrastructure/integration";

const VISION_YAML = `# Vision, mission, and core problem
productName: ""
vision: ""
mission: ""
problem: ""
`;

const ROOT_CONTEXT_YAML = `# Situational context — business, organizational, and environmental facts
# that inform vision and all project decisions.
#
# Each context item has:
#   id          - Unique identifier (e.g. CTX-001)
#   description - One-liner factual statement about the situation

contexts: []
# Example:
#   - id: CTX-001
#     description: "We are a bootstrapped startup with 3 developers"
#   - id: CTX-002
#     description: "Our target users are small development teams"
`;

const GLOBAL_DESIGN_YAML = `# High-level design decisions that all projects must follow
decisions: []
`;

const EXAMPLE_REQUIREMENTS_YAML = `# Project requirements - user-value focused
visionAlignment: ""

requirements: []
# Example:
#   - id: REQ-001
#     description: "Users can sign up with email and password"
#     userValue: "Provides a familiar way to access the platform"
`;

const EXAMPLE_CONTEXT_YAML = `# Project context — technical and system facts specific to this project
# that inform design decisions.
#
# Each context item has:
#   id          - Unique identifier (e.g. CTX-PROJ-001)
#   description - One-liner factual statement about the current system

contexts: []
# Example:
#   - id: CTX-PROJ-001
#     description: "Current backend uses Express.js on Node 18"
#   - id: CTX-PROJ-002
#     description: "Deployed to AWS ECS with Fargate"
`;

const EXAMPLE_DESIGN_YAML = `# Design decisions for this project.
# Each decision explores multiple options with pros/cons,
# and links back to requirements via requirementRefs.
#
# notes: Free-text area for research links, analysis, constraints.

notes: null
decisions: []
# Example:
#   - id: DEC-001
#     topic: "Database choice"
#     context: "We need to choose a database for user data"
#     requirementRefs: [REQ-001]
#     options:
#       - id: postgres
#         title: "PostgreSQL"
#         description: "Relational database"
#         pros: ["Mature", "Strong SQL support"]
#         cons: ["Schema migrations needed"]
#     chosen: null
#     chosenReason: null
`;

// ---------------------------------------------------------------------------
// Shared scaffolding helpers (used by both init and reset)
// ---------------------------------------------------------------------------

/**
 * Create the docs/ directory structure and write all YAML templates.
 * Expects duckDir to already exist.
 */
export function scaffoldDocs(duckDir: string): void {
  const docsDir = join(duckDir, "docs");
  const exampleProjectDir = join(docsDir, "projects", "example-project");
  mkdirSync(exampleProjectDir, { recursive: true });
  console.log("Created design-duck/docs/");

  // Write vision.yaml
  writeFileSync(join(docsDir, "vision.yaml"), VISION_YAML, "utf-8");
  console.log("  Created vision.yaml");

  // Write root context.yaml
  writeFileSync(join(docsDir, "context.yaml"), ROOT_CONTEXT_YAML, "utf-8");
  console.log("  Created context.yaml (situational context)");

  // Write global design.yaml
  writeFileSync(join(docsDir, "design.yaml"), GLOBAL_DESIGN_YAML, "utf-8");
  console.log("  Created design.yaml");

  // Write example project files
  writeFileSync(join(exampleProjectDir, "requirements.yaml"), EXAMPLE_REQUIREMENTS_YAML, "utf-8");
  console.log("  Created projects/example-project/requirements.yaml");

  writeFileSync(join(exampleProjectDir, "context.yaml"), EXAMPLE_CONTEXT_YAML, "utf-8");
  console.log("  Created projects/example-project/context.yaml");

  writeFileSync(join(exampleProjectDir, "design.yaml"), EXAMPLE_DESIGN_YAML, "utf-8");
  console.log("  Created projects/example-project/design.yaml");
}

/**
 * (Re-)create the commands/ directory with tag-and-go markdown files.
 */
export function scaffoldCommands(duckDir: string): void {
  const commandsDir = join(duckDir, "commands");
  mkdirSync(commandsDir, { recursive: true });
  for (const [filename, content] of Object.entries(COMMAND_FILES)) {
    writeFileSync(join(commandsDir, filename), content, "utf-8");
  }
  console.log("  Created commands/ (tag-and-go agent shortcuts)");
}

export function scaffoldClaudeCommands(projectRootDir: string): void {
  const claudeCommandsDir = join(projectRootDir, ".claude", "commands");
  mkdirSync(claudeCommandsDir, { recursive: true });
  for (const [filename, content] of Object.entries(SLASH_COMMAND_FILES)) {
    writeFileSync(join(claudeCommandsDir, filename), content, "utf-8");
  }
  console.log("  Created .claude/commands/ (Claude Code slash commands: /dd-new, /dd-extend, /dd-chat)");
}

export function scaffoldCursorCommands(projectRootDir: string): void {
  const cursorCommandsDir = join(projectRootDir, ".cursor", "commands");
  mkdirSync(cursorCommandsDir, { recursive: true });
  for (const [filename, content] of Object.entries(SLASH_COMMAND_FILES)) {
    writeFileSync(join(cursorCommandsDir, filename), content, "utf-8");
  }
  console.log("  Created .cursor/commands/ (Cursor slash commands: /dd-new, /dd-extend, /dd-chat)");
}

async function promptIntegration(): Promise<Integration> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    console.log("\nWhich AI assistant are you using?");
    console.log("  1. Claude Code   → .claude/commands/ (slash commands: /dd-new, /dd-extend, /dd-chat)");
    console.log("  2. Cursor        → .cursor/commands/ (slash commands: /dd-new, /dd-extend, /dd-chat)");
    console.log("  3. Both");
    console.log("  4. Tags only     → design-duck/commands/ (tag-and-go: @dd-new, @dd-extend, @dd-chat)");
    rl.question("\nChoose [1-4]: ", (answer) => {
      rl.close();
      const map: Record<string, Integration> = { "1": "claude", "2": "cursor", "3": "both", "4": "tags" };
      resolve(map[answer.trim()] ?? "tags");  // default to tags if invalid
    });
  });
}

export function init(targetDir: string = process.cwd(), integration: Integration): void {
  const duckDir = join(targetDir, "design-duck");
  const docsDir = join(duckDir, "docs");

  if (process.env.DEBUG) {
    console.error("[design-duck:init] targetDir:", targetDir);
  }

  if (existsSync(docsDir)) {
    console.error("design-duck/docs/ already exists. Aborting init.");
    process.exitCode = 1;
    return;
  }

  scaffoldDocs(duckDir);

  if (integration === "claude") {
    scaffoldClaudeCommands(targetDir);
  } else if (integration === "cursor") {
    scaffoldCursorCommands(targetDir);
  } else if (integration === "both") {
    scaffoldClaudeCommands(targetDir);
    scaffoldCursorCommands(targetDir);
  } else {
    // "tags"
    scaffoldCommands(duckDir);
  }

  writeProjectVersion(targetDir);
  console.log("  Created .version");

  writeIntegration(targetDir, integration);

  if (integration === "tags") {
    console.log(`
Design Duck initialized!

  design-duck/
  ├── commands/                        # Tag-and-go agent shortcuts (@dd-new, @dd-extend, @dd-chat, ...)
  └── docs/
      ├── context.yaml                 # Situational context (org, team, constraints)
      ├── vision.yaml                  # Vision, mission & core problem
      ├── design.yaml                  # Global design decisions
      └── projects/
          └── example-project/
              ├── context.yaml
              ├── requirements.yaml
              └── design.yaml

3 ways to work with your AI agent:

  1. Start a new project (full design cycle in one shot)
       @dd-new "describe your idea"

  2. Add a new problem to an existing project
       @dd-extend "describe the new problem"

  3. Continue or explore at any stage
       @dd-chat "ask anything, or pick up where you left off"

Or run: dd ui    (opens the live dashboard)
         dd help  (see all commands and workflows)`);
  } else {
    const ideDir = integration === "claude"
      ? ".claude/commands/"
      : integration === "cursor"
        ? ".cursor/commands/"
        : ".claude/commands/ and .cursor/commands/";
    const ideLabel = integration === "claude"
      ? "Claude Code slash commands (/dd-new, /dd-extend, /dd-chat)"
      : integration === "cursor"
        ? "Cursor slash commands (/dd-new, /dd-extend, /dd-chat)"
        : "Claude Code and Cursor slash commands (/dd-new, /dd-extend, /dd-chat)";

    console.log(`
Design Duck initialized!

  design-duck/
  ├── ${ideDir}                # ${ideLabel}
  └── docs/
      ├── context.yaml
      ├── vision.yaml
      ├── design.yaml
      └── projects/
          └── example-project/
              ├── context.yaml
              ├── requirements.yaml
              └── design.yaml

3 ways to work with your AI agent:

  1. Start a new project (full design cycle in one shot)
       /dd-new "describe your idea"

  2. Add a new problem to an existing project
       /dd-extend "describe the new problem"

  3. Continue or explore at any stage
       /dd-chat "ask anything, or pick up where you left off"

Or run: dd ui    (opens the live dashboard)
         dd help  (see all commands and workflows)`);
  }
}

export async function initInteractive(targetDir: string = process.cwd()): Promise<void> {
  const integration = await promptIntegration();
  init(targetDir, integration);
}
