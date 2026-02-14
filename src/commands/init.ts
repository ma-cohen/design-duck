import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { AGENT_MD } from "../templates/agents-md";
import { COMMAND_FILES } from "../templates/commands-md";
import { writeProjectVersion } from "../infrastructure/version";

/** package.json for the desgin-duck/ folder — depends on the tool from GitHub */
const DUCK_PACKAGE_JSON = `{
  "private": true,
  "description": "Design Duck — local requirements management. Run: ./duck ui",
  "dependencies": {
    "design-duck": "github:ma-cohen/desgin-duck#main"
  }
}
`;

/** .gitignore for the desgin-duck/ folder — keep node_modules out of version control */
const DUCK_GITIGNORE = `node_modules/
`;

/** Bash wrapper script — runs the CLI from node_modules */
const DUCK_SH = `#!/usr/bin/env bash
# Design Duck CLI wrapper — run from your project root: ./desgin-duck/duck <command>
DIR="$(cd "$(dirname "$0")" && pwd)"
node "$DIR/node_modules/design-duck/dist/cli.js" "$@"
`;

/** Windows wrapper script */
const DUCK_CMD = `@echo off
REM Design Duck CLI wrapper — run from your project root: .\\desgin-duck\\duck <command>
node "%~dp0node_modules\\design-duck\\dist\\cli.js" %*
`;

const VISION_YAML = `# Vision, mission, and core problem
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

const GENERAL_IMPLEMENTATION_YAML = `# General validations that apply to ALL projects.
# These are global checks every project must pass (linting, tests, CI, etc.)
#
# Each validation has:
#   id          - Unique identifier (e.g. VAL-GENERAL-001)
#   description - What must be validated
#   category    - Category for grouping (e.g. linting, testing, ci)

validations: []
# Example:
#   - id: VAL-GENERAL-001
#     description: "All code must pass ESLint with zero errors"
#     category: linting
#   - id: VAL-GENERAL-002
#     description: "All tests must pass before merge"
#     category: testing
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

const EXAMPLE_IMPLEMENTATION_YAML = `# Implementation plan, todos, validations, and tests for this project.
# Everything here should reference requirements to ensure full coverage.
#
# plan:        Free-text implementation plan (describe phases, approach)
# todos:       Implementation tasks with status tracking
# validations: Project-specific checks that must pass
# tests:       Test specifications that must be written

plan: null

todos: []
# Example:
#   - id: TODO-001
#     description: "Set up database schema"
#     status: pending          # pending | in-progress | done
#     requirementRefs: [REQ-001]

validations: []
# Example:
#   - id: VAL-001
#     description: "API response times must be under 200ms"
#     requirementRefs: [REQ-001]

tests: []
# Example:
#   - id: TEST-001
#     description: "User can sign up and receive confirmation"
#     type: integration        # unit | integration | e2e
#     requirementRefs: [REQ-001]
`;

export function init(targetDir: string = process.cwd()): void {
  const duckDir = join(targetDir, "desgin-duck");
  const docsDir = join(duckDir, "docs");

  if (process.env.DEBUG) {
    console.error("[design-duck:init] targetDir:", targetDir);
  }

  if (existsSync(docsDir)) {
    console.error("desgin-duck/docs/ already exists. Aborting init.");
    process.exitCode = 1;
    return;
  }

  const exampleProjectDir = join(docsDir, "projects", "example-project");
  mkdirSync(exampleProjectDir, { recursive: true });
  const playgroundsDir = join(docsDir, "playgrounds");
  mkdirSync(playgroundsDir, { recursive: true });
  console.log("Created desgin-duck/docs/");

  // Write AGENTS.md (AI agent instructions)
  const agentMdPath = join(duckDir, "AGENTS.md");
  writeFileSync(agentMdPath, AGENT_MD, "utf-8");
  console.log("  Created AGENTS.md (AI agent instructions)");

  // Write vision.yaml
  const visionPath = join(docsDir, "vision.yaml");
  writeFileSync(visionPath, VISION_YAML, "utf-8");
  console.log("  Created vision.yaml");

  // Write root context.yaml
  const contextPath = join(docsDir, "context.yaml");
  writeFileSync(contextPath, ROOT_CONTEXT_YAML, "utf-8");
  console.log("  Created context.yaml (situational context)");

  // Write global design.yaml
  const designPath = join(docsDir, "design.yaml");
  writeFileSync(designPath, GLOBAL_DESIGN_YAML, "utf-8");
  console.log("  Created design.yaml");

  // Write root-level implementation.yaml (general validations)
  const implPath = join(docsDir, "implementation.yaml");
  writeFileSync(implPath, GENERAL_IMPLEMENTATION_YAML, "utf-8");
  console.log("  Created implementation.yaml (general validations)");

  // Write example project files
  const reqPath = join(exampleProjectDir, "requirements.yaml");
  writeFileSync(reqPath, EXAMPLE_REQUIREMENTS_YAML, "utf-8");
  console.log("  Created projects/example-project/requirements.yaml");

  const projContextPath = join(exampleProjectDir, "context.yaml");
  writeFileSync(projContextPath, EXAMPLE_CONTEXT_YAML, "utf-8");
  console.log("  Created projects/example-project/context.yaml");

  const projDesignPath = join(exampleProjectDir, "design.yaml");
  writeFileSync(projDesignPath, EXAMPLE_DESIGN_YAML, "utf-8");
  console.log("  Created projects/example-project/design.yaml");

  const projImplPath = join(exampleProjectDir, "implementation.yaml");
  writeFileSync(projImplPath, EXAMPLE_IMPLEMENTATION_YAML, "utf-8");
  console.log("  Created projects/example-project/implementation.yaml");

  // Write command markdown files (tag-and-go agent shortcuts)
  const commandsDir = join(duckDir, "commands");
  mkdirSync(commandsDir, { recursive: true });
  for (const [filename, content] of Object.entries(COMMAND_FILES)) {
    writeFileSync(join(commandsDir, filename), content, "utf-8");
  }
  console.log("  Created commands/ (tag-and-go agent shortcuts)");

  // Write .version file to track the installed version
  writeProjectVersion(targetDir);
  console.log("  Created .version");

  // Write package.json for local npm install
  const pkgJsonPath = join(duckDir, "package.json");
  if (!existsSync(pkgJsonPath)) {
    writeFileSync(pkgJsonPath, DUCK_PACKAGE_JSON, "utf-8");
    console.log("  Created package.json");
  }

  // Write .gitignore to exclude node_modules
  const gitignorePath = join(duckDir, ".gitignore");
  if (!existsSync(gitignorePath)) {
    writeFileSync(gitignorePath, DUCK_GITIGNORE, "utf-8");
    console.log("  Created .gitignore");
  }

  // Write duck wrapper scripts (bash + Windows)
  const duckShPath = join(duckDir, "duck");
  writeFileSync(duckShPath, DUCK_SH, "utf-8");
  try {
    chmodSync(duckShPath, 0o755);
  } catch {
    // chmod may fail on Windows — that's fine, they use duck.cmd
  }
  console.log("  Created duck (CLI wrapper)");

  const duckCmdPath = join(duckDir, "duck.cmd");
  writeFileSync(duckCmdPath, DUCK_CMD, "utf-8");
  console.log("  Created duck.cmd (Windows CLI wrapper)");

  if (!existsSync(join(targetDir, ".git"))) {
    try {
      execSync("git init", { cwd: targetDir, stdio: "pipe" });
      console.log("Initialized git repository.");
    } catch {
      console.warn("Warning: git init failed. Is git installed?");
    }
  } else if (process.env.DEBUG) {
    console.error("[design-duck:init] git repo already exists, skipping git init");
  }

  console.log(`
Design Duck initialized! Your folder structure:

  desgin-duck/
  ├── duck                             # CLI wrapper (run: ./desgin-duck/duck <command>)
  ├── duck.cmd                         # CLI wrapper (Windows)
  ├── package.json                     # npm dependencies
  ├── AGENTS.md                        # AI agent instructions & workflow guide
  ├── commands/                        # Tag-and-go agent shortcuts (@dd-vision, etc.)
  │   ├── dd-vision.md
  │   ├── dd-projects.md
  │   ├── dd-requirements.md
  │   ├── dd-design.md
  │   ├── dd-choose.md
  │   ├── dd-implementation.md
  │   ├── dd-validations.md
  │   ├── dd-playground.md
  │   ├── dd-validate.md
  │   ├── dd-ui.md
  │   ├── dd-init.md
  │   └── dd-upgrade.md
  └── docs/
      ├── context.yaml                 # Situational context (org, team, constraints)
      ├── vision.yaml                  # Vision, mission & core problem
      ├── design.yaml                  # Global design decisions
      ├── implementation.yaml          # General validations (linting, tests, CI)
      ├── projects/
      │   └── example-project/
      │       ├── context.yaml         # Project-specific context (system, tech)
      │       ├── requirements.yaml    # User-value requirements
      │       ├── design.yaml          # Design decisions & options
      │       └── implementation.yaml  # Todos, validations & test specs
      └── playgrounds/                 # Isolated problem explorations (empty)

Next steps:
  1. cd desgin-duck && npm install     # one-time setup
  2. cd ..
  3. Tag @dd-vision and tell your AI agent what to build!

If you have the 'dd' shell alias set up, you can also use:
  dd context vision
  dd ui
  dd validate

Or point your AI agent at desgin-duck/AGENTS.md for the full workflow.`);
}
