# Design Duck

Vision-driven requirements and design management for human-agent collaboration.

Design Duck gives your AI coding agent the context it needs at every step — from
defining a vision, through requirements and design, all the way to implementation
planning. You stay in control of the decisions; the agent does the heavy lifting.

All state lives in plain YAML files. A live UI updates instantly when files change.

## Getting Started

### 1. Install

```bash
# From GitHub
npm install github:ma-cohen/desgin-duck#main

# Or from a local clone
npm install file:../path/to/desgin-duck
```

### 2. Initialize

```bash
npx design-duck init
```

This creates a `desgin-duck/` directory in your project with:

```
desgin-duck/
├── AGENTS.md                        # AI agent instructions & workflow guide
└── requirements/
    ├── vision.yaml                  # Vision, mission & core problem
    ├── design.yaml                  # Global design decisions
    ├── implementation.yaml          # Global validations (linting, tests, CI)
    └── projects/
        └── example-project/
            ├── requirements.yaml    # User-value requirements
            ├── design.yaml          # Design decisions & options
            └── implementation.yaml  # Todos, validations & test specs
```

The `AGENTS.md` file is an instruction guide for your AI agent — it explains the
full workflow and all commands. Point your agent at it to get started.

### 3. Work with Your AI Agent

Design Duck follows a phased workflow. At each step, run a `context` command to
generate a structured prompt, then feed it to your AI agent. The agent edits the
YAML files, and the cycle continues.

```
You                        Design Duck                   Your AI Agent
───                        ───────────                   ─────────────

Run context command ────▶  Reads YAML state
                           Generates prompt ───────────▶  Receives context
                                                          Edits YAML files
                           File watcher detects change ◀──────────┘
                           UI updates instantly
Review in UI ◀─────────────────────┘
```

#### Phase 1: Define the Vision

```bash
npx design-duck context vision
```

Give the output to your agent. It will fill in `vision.yaml` with a clear
vision, mission, and problem statement.

#### Phase 2: Split into Projects

```bash
npx design-duck context projects
```

The agent reads your vision and suggests how to break the work into projects,
creating directories under `requirements/projects/`.

#### Phase 3: Gather Requirements

```bash
npx design-duck context requirements <project>
```

For each project, the agent gets the vision context and produces user-value
requirements — focused on what users need, not technical details.

#### Phase 4: Brainstorm Design

```bash
npx design-duck context design <project>
```

The agent proposes design decisions with multiple options, pros, and cons.
It also sees global design decisions and validations as constraints.
All choices are left as `null` for you to decide.

#### Phase 5: Choose Design

```bash
npx design-duck context choose <project>
```

The agent evaluates the options and recommends choices. Review and adjust
as needed — you have the final say.

#### Phase 6: Plan Implementation

```bash
npx design-duck context implementation <project>
```

The agent creates a phased plan with actionable todos, validation rules,
and test specifications — all linked back to requirements.

#### Global Validations (any time)

```bash
npx design-duck context validations
```

Define cross-cutting rules (linting, testing, security, etc.) that every
project must respect. These are injected into design and implementation
context automatically.

### 4. Validate

```bash
npx design-duck validate
```

Checks all YAML files against the schema and verifies that `requirementRefs`
and `globalDecisionRefs` point to valid IDs.

### 5. View in UI

```bash
npx design-duck ui
```

Opens a browser at `http://localhost:3456` showing your vision, projects,
designs, and implementation plans.

**Live reload**: edit any YAML file and the UI updates automatically — no
refresh needed.

## CLI Commands

| Command               | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `init`                | Scaffold `desgin-duck/` directory with AGENTS.md and YAML templates |
| `context <phase> [p]` | Generate AI context prompt for a workflow phase      |
| `validate`            | Validate all YAML files and cross-references         |
| `ui`                  | Start the live UI on port 3456                       |

### Context Phases

| Phase            | Command                            | Needs Project? |
| ---------------- | ---------------------------------- | -------------- |
| Vision           | `context vision`                   | No             |
| Projects         | `context projects`                 | No             |
| Requirements     | `context requirements <project>`   | Yes            |
| Design           | `context design <project>`         | Yes            |
| Choose           | `context choose <project>`         | Yes            |
| Implementation   | `context implementation <project>` | Yes            |
| Validations      | `context validations`              | No             |

## File Structure

```
desgin-duck/
├── AGENTS.md                            # AI agent instructions
└── requirements/
    ├── vision.yaml                      # Vision, mission, core problem
    ├── design.yaml                      # Global design decisions
    ├── implementation.yaml              # Global validations
    └── projects/
        └── <project-name>/
            ├── requirements.yaml        # Vision alignment + requirements
            ├── design.yaml              # Design decisions & options
            └── implementation.yaml      # Plan, todos, validations, tests
```

## YAML Reference

### Vision (`vision.yaml`)

| Field     | Required | Description                            |
| --------- | -------- | -------------------------------------- |
| `vision`  | Yes      | Future-state you want to create        |
| `mission` | Yes      | What your product does to get there    |
| `problem` | Yes      | The problem users face today           |

### Requirement (`requirements.yaml`)

| Field             | Required | Description                           |
| ----------------- | -------- | ------------------------------------- |
| `visionAlignment` | Yes      | How this project serves the vision    |
| `requirements`    | Yes      | Array of requirements                 |
| `requirements[].id`          | Yes | Unique ID (e.g. `AUTH-001`)    |
| `requirements[].description` | Yes | What the user can do           |
| `requirements[].userValue`   | Yes | Why it matters to the user     |

### Decision (`design.yaml`)

| Field               | Required | Description                                       |
| ------------------- | -------- | ------------------------------------------------- |
| `notes`             | No       | Free-text research notes, links, constraints      |
| `decisions`         | Yes      | Array of decisions                                |
| `id`                | Yes      | Unique ID (e.g. `DEC-AUTH-001`)                   |
| `topic`             | Yes      | What question this answers                        |
| `context`           | Yes      | Background and constraints                        |
| `requirementRefs`   | Yes      | Requirement IDs this addresses                    |
| `globalDecisionRefs`| No       | Global decision IDs this builds on                |
| `options`           | Yes      | Array of alternatives (at least one)              |
| `chosen`            | No       | ID of the selected option (`null` while exploring)|
| `chosenReason`      | No       | Why this option was picked                        |

Each option has: `id`, `title`, `description`, `pros` (array), `cons` (array).

### Implementation (`implementation.yaml` per project)

| Field         | Required | Description                                |
| ------------- | -------- | ------------------------------------------ |
| `plan`        | No       | Free-text phased implementation plan       |
| `todos`       | Yes      | Tasks with `id`, `description`, `status` (pending/in-progress/done), `requirementRefs` |
| `validations` | Yes      | Rules with `id`, `description`, `requirementRefs` |
| `tests`       | Yes      | Specs with `id`, `description`, `type` (unit/integration/e2e), `requirementRefs` |

### General Validations (`implementation.yaml` at root)

| Field         | Required | Description                                |
| ------------- | -------- | ------------------------------------------ |
| `validations` | Yes      | Array of global validation rules           |
| `id`          | Yes      | Unique ID (e.g. `VAL-GENERAL-001`)         |
| `description` | Yes      | What must be validated                     |
| `category`    | Yes      | Grouping (linting, testing, security, etc.)|

## Development

### Prerequisites

- [Bun](https://bun.sh) (for building and running from source)

### Commands

```bash
bun install            # Install dependencies
bun test               # Run tests
bun run build          # Build CLI + UI for distribution
bun run dev:ui         # Dev mode with Vite HMR (for working on the UI)
bun run src/cli.ts ui  # Run CLI from source
```

### Project Structure

```
src/
├── ai/                # AI context generation (prompts, context assembly)
├── commands/          # CLI command handlers (init, ui, validate, context)
├── domain/            # Types and validation
├── infrastructure/    # File I/O, YAML parsing, file watcher, HTTP server
├── stores/            # Zustand state management
├── components/        # React UI components
└── ui/                # React entry point
```

## License

MIT
