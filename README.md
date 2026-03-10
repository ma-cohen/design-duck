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
npx github:ma-cohen/design-duck#main init
```

This scaffolds a local `design-duck/` folder with templates, command shortcuts,
and an agent guide.

### 2. Install once

```bash
cd design-duck && npm install && cd ..
```

### 3. Run the UI

```bash
./design-duck/duck ui
```

The dashboard opens in your browser and auto-reloads when YAML files change.

### 4. Work through context phases

Run a context command, feed the output to your AI agent, let it edit YAML, and
review results in the UI.

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

### Core phases

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

### Playground phases (isolated problem-solving)

```bash
./design-duck/duck context playground
./design-duck/duck context playground-requirements <playground>
./design-duck/duck context playground-design <playground>
./design-duck/duck context playground-choose <playground>
```

Use playgrounds for experiments that should not directly alter your main project
design flow.

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
| `./design-duck/duck upgrade` | Reinstall latest package and run migrations |
| `./design-duck/duck reset [--force]` | Reset `docs/` and `commands/` back to empty templates |

## File Structure

```text
design-duck/
├── duck
├── duck.cmd
├── AGENTS.md
├── commands/
│   ├── dd-vision.md
│   ├── dd-projects.md
│   ├── dd-requirements.md
│   ├── dd-design.md
│   ├── dd-choose.md
│   ├── dd-propagate.md
│   ├── dd-playground.md
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
    └── playgrounds/
        └── <playground-name>/
            ├── requirements.yaml
            ├── context.yaml
            └── design.yaml
```

## YAML Reference

### `vision.yaml`

- `productName` (optional string)
- `vision` (string)
- `mission` (string)
- `problem` (string)

### `context.yaml` (root or project/playground)

- `contexts` (array)
- `contexts[].id` (string, unique in file)
- `contexts[].description` (string)

### `requirements.yaml` (project)

- `visionAlignment` (string)
- `requirements` (array)
- `requirements[].id` (string)
- `requirements[].description` (string)
- `requirements[].userValue` (string)

### `requirements.yaml` (playground)

- `problemStatement` (string)
- `requirements` (array)
- `requirements[].id` (string)
- `requirements[].description` (string)
- `requirements[].userValue` (string)

### `design.yaml` (global/project/playground)

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
