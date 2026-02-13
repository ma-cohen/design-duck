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
    priority: high       # high | medium | low
    status: draft        # draft | review | approved
```

### 5. Validate

```bash
npx design-duck validate
```

Checks the vision file and all project requirement files against the schema.

### 6. View in UI

```bash
npx design-duck ui
```

Opens a browser at `http://localhost:3456` showing your vision and per-project requirements.

**Live reload**: edit any YAML file and the UI updates automatically -- no refresh needed. This works via a file watcher and Server-Sent Events.

## CLI Commands

| Command    | Description |
|------------|-------------|
| `init`     | Scaffold `requirements/` directory with vision and example project |
| `validate` | Validate vision and all project requirement files against the schema |
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
└── projects/
    ├── project-a/
    │   └── requirements.yaml            # Vision alignment + requirements
    └── project-b/
        └── requirements.yaml
```

## Requirement Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (e.g. `req-001`) |
| `description` | Yes | What the user needs |
| `userValue` | Yes | Why this matters to the user |
| `priority` | Yes | `high`, `medium`, or `low` |
| `status` | Yes | `draft`, `review`, or `approved` |

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
├── domain/             # Requirement types and validation (Requirement, Vision)
├── infrastructure/     # File I/O, YAML parsing, file watcher, HTTP server
├── stores/             # Zustand state management
├── components/         # React UI components (VisionHeader, ProjectSection, etc.)
└── ui/                 # React entry point
```

## License

MIT
