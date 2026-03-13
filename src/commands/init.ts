import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync, chmodSync } from "node:fs";
import { join } from "node:path";
import { AGENT_MD } from "../templates/agents-md";
import { COMMAND_FILES } from "../templates/commands-md";
import { writeProjectVersion } from "../infrastructure/version";
import { VERSION } from "../index";

const GITHUB_RELEASE_BASE =
  "https://github.com/ma-cohen/design-duck/releases/latest/download";

function duckPackageJson(useGithub: boolean): string {
  const dep = useGithub
    ? `${GITHUB_RELEASE_BASE}/design-duck-${VERSION}.tgz`
    : "design-duck";
  return JSON.stringify(
    { private: true, description: "Design Duck — local requirements management. Run: ./duck ui", dependencies: { "design-duck": dep } },
    null,
    2,
  ) + "\n";
}

/** .gitignore for the design-duck/ folder — keep node_modules out of version control */
const DUCK_GITIGNORE = `node_modules/
`;

/** Bash wrapper script — runs the CLI from node_modules */
const DUCK_SH = `#!/usr/bin/env bash
# Design Duck CLI wrapper — run from your project root: ./design-duck/duck <command>
DIR="$(cd "$(dirname "$0")" && pwd)"
node "$DIR/node_modules/design-duck/dist/cli.js" "$@"
`;

/** Windows wrapper script */
const DUCK_CMD = `@echo off
REM Design Duck CLI wrapper — run from your project root: .\\design-duck\\duck <command>
node "%~dp0node_modules\\design-duck\\dist\\cli.js" %*
`;

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

export interface InitOptions {
  useGithub?: boolean;
}

export function init(targetDir: string = process.cwd(), opts: InitOptions = {}): void {
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

  // Scaffold docs/ and commands/ using shared helpers
  scaffoldDocs(duckDir);
  scaffoldCommands(duckDir);

  // Write .version file to track the installed version
  writeProjectVersion(targetDir);
  console.log("  Created .version");

  const pkgJsonPath = join(duckDir, "package.json");
  if (!existsSync(pkgJsonPath)) {
    writeFileSync(pkgJsonPath, duckPackageJson(!!opts.useGithub), "utf-8");
    const source = opts.useGithub ? "GitHub Release" : "npm";
    console.log(`  Created package.json (source: ${source})`);
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

  design-duck/
  ├── duck                             # CLI wrapper (run: ./design-duck/duck <command>)
  ├── duck.cmd                         # CLI wrapper (Windows)
  ├── package.json                     # npm dependencies
  ├── AGENTS.md                        # AI agent instructions & workflow guide
  ├── commands/                        # Tag-and-go agent shortcuts (@dd-vision, etc.)
  │   ├── dd-vision.md
  │   ├── dd-projects.md
  │   ├── dd-requirements.md
  │   ├── dd-design.md
  │   ├── dd-choose.md
  │   ├── dd-propagate.md
  │   ├── dd-validate.md
  │   ├── dd-ui.md
  │   ├── dd-init.md
  │   ├── dd-upgrade.md
  │   └── dd-reset.md
  └── docs/
      ├── context.yaml                 # Situational context (org, team, constraints)
      ├── vision.yaml                  # Vision, mission & core problem
      ├── design.yaml                  # Global design decisions
      ├── projects/
      │   └── example-project/
      │       ├── context.yaml         # Project-specific context (system, tech)
      │       ├── requirements.yaml    # User-value requirements
      │       └── design.yaml          # Design decisions & options

Next steps:
  1. cd design-duck && npm install     # one-time setup
  2. cd ..
  3. Tag @dd-vision and tell your AI agent what to build!

If you have the 'dd' shell alias set up, you can also use:
  dd context vision
  dd ui
  dd validate

Or point your AI agent at design-duck/AGENTS.md for the full workflow.`);
}
