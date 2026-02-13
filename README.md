# Design Duck

Vision-driven requirements gathering and management tool for human-agent collaboration.

Design Duck uses a file-based architecture: an AI agent edits YAML requirement files while a live UI renders the current state. When the agent (or anyone) modifies a requirement file, the UI updates instantly.

Requirements are organized around a central **vision document** and split **per project**, with each project declaring how it helps achieve the vision.

## Quick Start

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

This creates a `requirements/` directory with:
- `vision.yaml` -- vision, mission, and core problem statement
- `design.yaml` -- high-level design decisions that all projects must follow
- `projects/example-project/requirements.yaml` -- example project requirements

It also runs `git init` if the directory isn't already a git repo.

### 3. Define Your Vision

Edit `requirements/vision.yaml`:

```yaml
vision: "A world where every team manages requirements efficiently"
mission: "Provide simple, AI-powered tools for collaborative requirements gathering"
problem: "Teams struggle to capture, organize, and maintain software requirements"
```

### 4. Add Project Requirements

Create a project directory and add `requirements.yaml`:

```
requirements/projects/my-project/requirements.yaml
```

```yaml
visionAlignment: "This project helps achieve the vision by enabling efficient product search"

requirements:
  - id: req-001
    description: Users can search products by name
    userValue: Quickly find desired products
```

### 5. Add High-Level Design Decisions (Optional)

Edit `requirements/design.yaml` to record system-wide design decisions that all projects must follow. These are top-down decisions that guide project-level choices:

```yaml
# requirements/design.yaml
notes: |
  Key architectural constraints and research links.

decisions:
  - id: GD-001
    topic: Primary database technology
    context: "All services need a consistent database strategy"
    requirementRefs: []
    options:
      - id: postgres
        title: PostgreSQL
        description: Relational database with strong ACID guarantees
        pros:
          - Battle-tested and widely supported
          - Rich SQL feature set
        cons:
          - Horizontal scaling requires more effort
      - id: mongodb
        title: MongoDB
        description: Document-oriented NoSQL database
        pros:
          - Flexible schema
          - Easy horizontal scaling
        cons:
          - Weaker transactional guarantees
    chosen: postgres
    chosenReason: "Our data model is highly relational and ACID compliance is critical"
```

Project-level decisions can reference global decisions they're based on using `globalDecisionRefs`:

```yaml
# requirements/projects/my-project/design.yaml
decisions:
  - id: dec-001
    topic: ORM choice
    context: "Need an ORM that works well with our chosen database"
    requirementRefs:
      - req-001
    globalDecisionRefs:
      - GD-001
    # ... options, chosen, etc.
```

### 6. Add Project Design Decisions (Optional)

Create a `design.yaml` alongside the project's `requirements.yaml` to document design alternatives and tradeoffs:

```yaml
# requirements/projects/my-project/design.yaml
decisions:
  - id: dec-001
    topic: Search Technology
    context: "We need sub-second search across millions of products"
    requirementRefs:
      - req-001
    options:
      - id: opt-a
        title: Elasticsearch
        description: Dedicated search engine
        pros:
          - Sub-200ms full-text search
          - Scales horizontally
        cons:
          - Operational overhead
      - id: opt-b
        title: PostgreSQL full-text search
        description: Use existing database
        pros:
          - No extra infrastructure
        cons:
          - Slower for large datasets
    chosen: opt-a
    chosenReason: "Performance is critical for user experience"
```

Design files are optional -- create them when you're ready to start a design session.

### 7. Validate

```bash
npx design-duck validate
```

Checks the vision file, global design, all project requirement files, and any project design files against the schema. Also verifies that `requirementRefs` and `globalDecisionRefs` point to valid IDs.

### 8. View in UI

```bash
npx design-duck ui
```

Opens a browser at `http://localhost:3456` showing your vision and per-project requirements.

**Live reload**: edit any YAML file and the UI updates automatically -- no refresh needed. This works via a file watcher and Server-Sent Events.

## CLI Commands

| Command    | Description |
|------------|-------------|
| `init`     | Scaffold `requirements/` directory with vision and example project |
| `validate` | Validate vision, requirement, and design files; cross-reference requirement refs |
| `ui`       | Start the UI server with live reload on port 3456 |

## How It Works

```
You / AI Agent                    Design Duck
─────────────                    ───────────
                                 
Edit requirements.yaml ────────▶  File watcher detects change
                                       │
                                       ▼
                                 Server sends SSE event
                                       │
                                       ▼
                                 Browser reloads YAML
                                       │
                                       ▼
                                 UI re-renders
```

The `ui` command starts a self-contained HTTP server that:
- Serves the pre-built React UI (no build tools needed in your project)
- Serves your `requirements/*.yaml` files (vision + per-project)
- Provides a `/api/projects` endpoint listing available projects
- Watches for file changes recursively and pushes live updates via SSE

## File Structure

```
requirements/
├── vision.yaml                          # Vision, mission, core problem
├── design.yaml                          # Optional: high-level design decisions (all projects)
└── projects/
    ├── project-a/
    │   ├── requirements.yaml            # Vision alignment + requirements
    │   └── design.yaml                  # Optional: project design decisions
    └── project-b/
        ├── requirements.yaml
        └── design.yaml
```

## Requirement Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (e.g. `req-001`) |
| `description` | Yes | What the user needs |
| `userValue` | Yes | Why this matters to the user |

## Decision Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (e.g. `dec-001` or `GD-001`) |
| `topic` | Yes | What question this decision answers |
| `context` | Yes | Background / why this matters |
| `requirementRefs` | Yes | Array of requirement IDs this addresses (can be empty for global decisions) |
| `globalDecisionRefs` | No | Array of global decision IDs this is based on (project-level only) |
| `options` | Yes | Design alternatives (at least one) |
| `chosen` | No | ID of the selected option (null while exploring) |
| `chosenReason` | No | Why this option was picked |

Each option has: `id`, `title`, `description`, `pros` (array), `cons` (array).

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
├── commands/           # CLI command handlers (init, ui, validate)
├── domain/             # Types and validation (Requirement, Vision, Decision, DesignOption)
├── infrastructure/     # File I/O, YAML parsing, file watcher, HTTP server
├── stores/             # Zustand state management
├── components/         # React UI components (VisionHeader, ProjectSection, DesignSection, etc.)
└── ui/                 # React entry point
```

## License

MIT
