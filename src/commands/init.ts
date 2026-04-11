import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { AGENT_MD } from "../templates/agents-md";
import { COMMAND_FILES } from "../templates/commands-md";
import { writeProjectVersion } from "../infrastructure/version";

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

  // Write AGENTS.md (AI agent instructions)
  const agentMdPath = join(duckDir, "AGENTS.md");
  writeFileSync(agentMdPath, AGENT_MD, "utf-8");
  console.log("  Created AGENTS.md (AI agent instructions)");

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

export function init(targetDir: string = process.cwd()): void {
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
  scaffoldCommands(duckDir);
  writeProjectVersion(targetDir);
  console.log("  Created .version");

  console.log(`
Design Duck initialized!

  design-duck/
  ├── AGENTS.md                        # AI agent instructions & workflow guide
  ├── commands/                        # Tag-and-go agent shortcuts (@dd-vision, etc.)
  └── docs/
      ├── context.yaml                 # Situational context (org, team, constraints)
      ├── vision.yaml                  # Vision, mission & core problem
      ├── design.yaml                  # Global design decisions
      └── projects/
          └── example-project/
              ├── context.yaml
              ├── requirements.yaml
              └── design.yaml

Next steps:
  Tag @dd-vision and tell your AI agent what to build!

Or run: dd ui    (opens the live dashboard)`);
}
