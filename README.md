# Design Duck

Vision-driven requirements and design management for human-agent collaboration.

Design Duck gives your AI coding agent structured context at each step:
vision, projects, requirements, and design decisions. You stay in control of
the decisions; the agent does the drafting work.

All state lives in plain YAML files under `design-duck/docs/`. A live UI updates
instantly when those files change.

## Getting Started

Design Duck works in any codebase (Node.js, Python, Go, Rust, Java, and more).
Only [Node.js](https://nodejs.org) v18+ is required.

### 1. Initialize

```bash
npx design-duck init
```

This scaffolds a local `design-duck/` folder with templates, command shortcuts,
and an agent guide.

> **npm mirror lagging?** If your corporate npm registry hasn't synced the
> latest version yet, install directly from GitHub Releases:
>
> ```bash
> npx design-duck init --github
> ```

### 2. Install once

```bash
cd design-duck && npm install && cd ..
```

### 3. Run the UI

```bash
./design-duck/duck ui
```

The dashboard opens in your browser and auto-reloads when YAML files change.

### 4. Solve your problem

The fastest way to get a full design is `@dd-solve` — tag it in your AI chat
with a problem statement and the agent runs every phase (vision, projects,
requirements, design, choose) in one shot.

To add more problems to an existing project later, use `@dd-add`.

You can also run individual phases manually — see **Workflow Phases** below.

```text
You                        Design Duck                    Your AI Agent
---                        -----------                    -------------
Run context command -----> Reads YAML state
                           Generates prompt ----------->  Receives context
                                                          Edits YAML files
                           File watcher detects change <-┘
                           UI updates instantly
Review in UI <------------┘
```

## Workflow Phases

### Quick start

```bash
./design-duck/duck context solve              # full cycle from current state
./design-duck/duck context add <project>      # add a new problem to a project
```

- `solve`: runs the entire workflow (vision through choose) in one shot, adapting to whatever state already exists
- `add`: extends an existing project with new requirements and design decisions

### Individual phases

```bash
./design-duck/duck context vision
./design-duck/duck context projects
./design-duck/duck context requirements <project>
./design-duck/duck context design <project>
./design-duck/duck context choose <project>
./design-duck/duck context propagate <project>
```

- `vision`: define/refine `vision.yaml`
- `projects`: split work into project folders
- `requirements`: write user-value requirements for one project
- `design`: brainstorm decision options
- `choose`: select options and rationale
- `propagate`: review chosen project decisions for promotion to global design

### Validate

```bash
./design-duck/duck validate
```

Validates YAML schema and cross-references (`requirementRefs`, `contextRefs`,
`globalDecisionRefs`).

## CLI Commands

| Command | Description |
| --- | --- |
| `./design-duck/duck init` | Scaffold `design-duck/` with templates and command files |
| `./design-duck/duck context <phase> [name]` | Generate AI context prompt for a phase |
| `./design-duck/duck validate` | Validate YAML files and references |
| `./design-duck/duck ui` | Start live UI (auto-selects an available port from 3456) |
| `./design-duck/duck upgrade` | Reinstall latest package from npm and run migrations |
| `./design-duck/duck upgrade --github` | Same as above, but pulls from GitHub Releases instead |
| `./design-duck/duck reset [--force]` | Reset `docs/` and `commands/` back to empty templates |

## File Structure

```text
design-duck/
├── duck
├── duck.cmd
├── AGENTS.md
├── commands/
│   ├── dd-solve.md
│   ├── dd-add.md
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
    ├── vision.yaml
    ├── context.yaml
    ├── design.yaml
    ├── projects/
    │   └── <project-name>/
    │       ├── requirements.yaml
    │       ├── context.yaml
    │       └── design.yaml
```

## YAML Reference

### `vision.yaml`

- `productName` (optional string)
- `vision` (string)
- `mission` (string)
- `problem` (string)

### `context.yaml` (root or project)

- `contexts` (array)
- `contexts[].id` (string, unique in file)
- `contexts[].description` (string)

### `requirements.yaml` (project)

- `visionAlignment` (string)
- `requirements` (array)
- `requirements[].id` (string)
- `requirements[].description` (string)
- `requirements[].userValue` (string)

### `design.yaml` (global/project)

- `notes` (string or `null`)
- `decisions` (array)
- `decisions[].id` (string)
- `decisions[].topic` (string)
- `decisions[].context` (string)
- `decisions[].category` (`product`, `architecture`, `technology`, `data`, `testing`, `infrastructure`, `other`)
- `decisions[].requirementRefs` (string[])
- `decisions[].contextRefs` (optional string[])
- `decisions[].globalDecisionRefs` (optional string[])
- `decisions[].parentDecisionRef` (optional string or `null`)
- `decisions[].options` (array of options: `id`, `title`, `description`, `pros`, `cons`)
- `decisions[].chosen` (string or `null`)
- `decisions[].chosenReason` (string or `null`)

## Development

### Prerequisites

- [Node.js](https://nodejs.org) v18+
- [Bun](https://bun.sh) (for tests)

### Commands

```bash
npm install
npm run build
npm run dev:ui
node dist/cli.js ui
bun test
```

### Source Layout

```text
src/
├── ai/              # Context generation and prompts
├── commands/        # CLI command handlers
├── domain/          # YAML types and validators
├── infrastructure/  # File store, server, migration/version helpers
├── stores/          # Zustand UI state
├── components/      # React components
└── ui/              # React entry point
```

## License

MIT
