# Design Duck

Vision-driven requirements and design management for human-agent collaboration.

Design Duck gives your AI coding agent the context it needs at every step — from
defining a vision, through requirements and design, all the way to implementation
planning. You stay in control of the decisions; the agent does the heavy lifting.

All state lives in plain YAML files. A live UI updates instantly when files change.

## Getting Started

Design Duck works in **any project**, regardless of technology (Python, Java,
Go, Rust, Node.js, etc.). The only prerequisite is [Node.js](https://nodejs.org) (v18+).

### 1. Initialize

```bash
npx github:ma-cohen/desgin-duck#main init
```

This creates a `desgin-duck/` directory in your project with YAML templates,
an AI agent guide, and everything needed to run locally.

### 2. Install (one-time)

```bash
cd desgin-duck && npm install && cd ..
```

This installs Design Duck locally inside the `desgin-duck/` folder. After this,
all commands are fast and local — no network access needed.

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
./desgin-duck/duck context vision
```

Give the output to your agent. It will fill in `vision.yaml` with a clear
vision, mission, and problem statement.

#### Phase 2: Split into Projects

```bash
./desgin-duck/duck context projects
```

The agent reads your vision and suggests how to break the work into projects,
creating directories under `requirements/projects/`.

#### Phase 3: Gather Requirements

```bash
./desgin-duck/duck context requirements <project>
```

For each project, the agent gets the vision context and produces user-value
requirements — focused on what users need, not technical details.

#### Phase 4: Brainstorm Design

```bash
./desgin-duck/duck context design <project>
```

The agent proposes design decisions with multiple options, pros, and cons.
It also sees global design decisions and validations as constraints.
All choices are left as `null` for you to decide.

#### Phase 5: Choose Design

```bash
./desgin-duck/duck context choose <project>
```

The agent evaluates the options and recommends choices. Review and adjust
as needed — you have the final say.

#### Phase 6: Plan Implementation

```bash
./desgin-duck/duck context implementation <project>
```

The agent creates a phased plan with actionable todos, validation rules,
and test specifications — all linked back to requirements.

#### Global Validations (any time)

```bash
./desgin-duck/duck context validations
```

Define cross-cutting rules (linting, testing, security, etc.) that every
project must respect. These are injected into design and implementation
context automatically.

### 4. Validate

```bash
./desgin-duck/duck validate
```

Checks all YAML files against the schema and verifies that `requirementRefs`
and `globalDecisionRefs` point to valid IDs.

### 5. View in UI

```bash
./desgin-duck/duck ui
```

Opens a browser showing your vision, projects, designs, and implementation
plans. The server auto-selects an available port starting from 3456, so you
can run multiple projects simultaneously.

**Live reload**: edit any YAML file and the UI updates automatically — no
refresh needed.

### Upgrading

```bash
cd desgin-duck && npm update && cd ..  # get latest CLI
./desgin-duck/duck upgrade             # run migrations & regenerate AGENTS.md
```

## CLI Commands

All commands are run from your **project root** via the `duck` wrapper:

| Command                       | Description                                          |
| ----------------------------- | ---------------------------------------------------- |
| `./desgin-duck/duck init`     | Scaffold `desgin-duck/` directory with AGENTS.md and YAML templates |
| `./desgin-duck/duck context <phase> [p]` | Generate AI context prompt for a workflow phase |
| `./desgin-duck/duck validate` | Validate all YAML files and cross-references         |
| `./desgin-duck/duck ui`       | Start the live UI (auto-selects port from 3456)      |
| `./desgin-duck/duck upgrade`  | Run migrations and regenerate AGENTS.md              |

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
├── duck                                 # CLI wrapper (bash)
├── duck.cmd                             # CLI wrapper (Windows)
├── package.json                         # npm dependencies
├── .gitignore                           # ignores node_modules/
├── node_modules/                        # installed locally (gitignored)
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

- [Node.js](https://nodejs.org) (v18+) — required for building
- [Bun](https://bun.sh) — optional, used for running tests

### Commands

```bash
npm install            # Install dependencies
npm run build          # Build CLI + UI for distribution
npm run dev:ui         # Dev mode with Vite HMR (for working on the UI)
node dist/cli.js ui    # Run built CLI
bun test               # Run tests (requires Bun)
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
