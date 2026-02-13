import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const VISION_YAML = `# Vision, mission, and core problem
vision: ""
mission: ""
problem: ""
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

const AGENT_MD = `# Design Duck — Agent Instructions

You are working inside a project that uses **Design Duck** for vision-driven
requirements and design management. All project state lives in YAML files under
\`desgin-duck/requirements/\`. A live UI (\`design-duck ui\`) shows the current
state and updates automatically when files change.

## Workflow

Follow these phases **in order**. Each phase has a CLI command that generates a
context prompt — run it, read the output, then perform the work described.

### 1. Define the Vision

\`\`\`bash
design-duck context vision
\`\`\`

Edit \`desgin-duck/requirements/vision.yaml\` with a clear **vision**, **mission**,
and **problem** statement. Every downstream decision traces back here.

### 2. Split into Projects

\`\`\`bash
design-duck context projects
\`\`\`

Create project directories under \`desgin-duck/requirements/projects/<name>/\`.
Each project gets its own \`requirements.yaml\` with a \`visionAlignment\` field
and an empty \`requirements\` array.

### 3. Gather Requirements (per project)

\`\`\`bash
design-duck context requirements <project>
\`\`\`

Fill in user-value requirements. Each requirement has an **id**, **description**,
and **userValue**. Focus on what users need, not technical implementation.

### 4. Design Brainstorm (per project)

\`\`\`bash
design-duck context design <project>
\`\`\`

Create \`design.yaml\` for the project with design decisions. Each decision has
multiple options with pros/cons. Leave \`chosen\` and \`chosenReason\` as \`null\` —
the human picks.

### 5. Choose Design (per project)

\`\`\`bash
design-duck context choose <project>
\`\`\`

For each unchosen decision, evaluate options and set \`chosen\` + \`chosenReason\`.
Do not override decisions that already have a choice.

### 6. Implementation Plan (per project)

\`\`\`bash
design-duck context implementation <project>
\`\`\`

Create \`implementation.yaml\` for the project with a phased **plan**, **todos**,
**validations**, and **tests**. Every item links back to requirements via
\`requirementRefs\`.

### Global Validations (any time)

\`\`\`bash
design-duck context validations
\`\`\`

Edit \`desgin-duck/requirements/implementation.yaml\` to add cross-cutting
validation rules (linting, testing, security, etc.) that all projects must respect.

## File Structure

\`\`\`
desgin-duck/requirements/
├── vision.yaml                  # Vision, mission & problem
├── design.yaml                  # Global design decisions
├── implementation.yaml          # Global validations
└── projects/
    └── <project-name>/
        ├── requirements.yaml    # User-value requirements
        ├── design.yaml          # Design decisions & options
        └── implementation.yaml  # Plan, todos, validations, tests
\`\`\`

## Other Commands

| Command                  | Purpose                              |
| ------------------------ | ------------------------------------ |
| \`design-duck init\`      | Scaffold the requirements directory  |
| \`design-duck ui\`        | Start the live UI (port 3456)        |
| \`design-duck validate\`  | Validate all YAML files              |

## Rules

- **YAML is the source of truth.** Edit the files directly; the UI updates via
  file watching.
- **IDs must be unique** within their scope (requirements per project, decisions
  per project, etc.).
- **requirementRefs** must reference existing requirement IDs. Run
  \`design-duck validate\` to check cross-references.
- **Global design decisions** can be referenced by project decisions via
  \`globalDecisionRefs\`.
- Keep descriptions concise and user-focused.
`;

const EXAMPLE_REQUIREMENTS_YAML = `# Project requirements - user-value focused
visionAlignment: ""

requirements: []
# Example:
#   - id: REQ-001
#     description: "Users can sign up with email and password"
#     userValue: "Provides a familiar way to access the platform"
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
  const reqDir = join(duckDir, "requirements");

  if (process.env.DEBUG) {
    console.error("[design-duck:init] targetDir:", targetDir);
  }

  if (existsSync(reqDir)) {
    console.error("desgin-duck/requirements/ already exists. Aborting init.");
    process.exitCode = 1;
    return;
  }

  const exampleProjectDir = join(reqDir, "projects", "example-project");
  mkdirSync(exampleProjectDir, { recursive: true });
  console.log("Created desgin-duck/requirements/");

  // Write AGENTS.md (AI agent instructions)
  const agentMdPath = join(duckDir, "AGENTS.md");
  writeFileSync(agentMdPath, AGENT_MD, "utf-8");
  console.log("  Created AGENTS.md (AI agent instructions)");

  // Write vision.yaml
  const visionPath = join(reqDir, "vision.yaml");
  writeFileSync(visionPath, VISION_YAML, "utf-8");
  console.log("  Created vision.yaml");

  // Write global design.yaml
  const designPath = join(reqDir, "design.yaml");
  writeFileSync(designPath, GLOBAL_DESIGN_YAML, "utf-8");
  console.log("  Created design.yaml");

  // Write root-level implementation.yaml (general validations)
  const implPath = join(reqDir, "implementation.yaml");
  writeFileSync(implPath, GENERAL_IMPLEMENTATION_YAML, "utf-8");
  console.log("  Created implementation.yaml (general validations)");

  // Write example project files
  const reqPath = join(exampleProjectDir, "requirements.yaml");
  writeFileSync(reqPath, EXAMPLE_REQUIREMENTS_YAML, "utf-8");
  console.log("  Created projects/example-project/requirements.yaml");

  const projDesignPath = join(exampleProjectDir, "design.yaml");
  writeFileSync(projDesignPath, EXAMPLE_DESIGN_YAML, "utf-8");
  console.log("  Created projects/example-project/design.yaml");

  const projImplPath = join(exampleProjectDir, "implementation.yaml");
  writeFileSync(projImplPath, EXAMPLE_IMPLEMENTATION_YAML, "utf-8");
  console.log("  Created projects/example-project/implementation.yaml");

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
  ├── AGENTS.md                        # AI agent instructions & workflow guide
  └── requirements/
      ├── vision.yaml                  # Vision, mission & core problem
      ├── design.yaml                  # Global design decisions
      ├── implementation.yaml          # General validations (linting, tests, CI)
      └── projects/
          └── example-project/
              ├── requirements.yaml    # User-value requirements
              ├── design.yaml          # Design decisions & options
              └── implementation.yaml  # Todos, validations & test specs

Start by running: design-duck context vision
Or point your AI agent at desgin-duck/AGENTS.md for the full workflow.`);
}
