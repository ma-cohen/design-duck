# High-Level Design: Design Duck

## Overview

Design Duck is a vision-driven requirements gathering and management tool that helps teams capture, organize, and visualize software requirements. It uses a file-based architecture allowing an AI agent to edit requirements in real-time while a UI renders the current state, enabling collaborative human-agent requirement refinement.

Requirements are organized around a central **vision document** that defines the mission and core problem. Individual **projects** each contain their own user-focused requirements, along with a statement of how the project helps achieve the overall vision.

## Design Guidelines

### Core Principles

- **Vision-Driven** - All requirements trace back to a central vision, mission, and problem statement
- **User Value Focus** - Requirements always center on how the product delivers value to users — no technical/derived requirements
- **Per-Project Organization** - Requirements are split by project, each declaring how it serves the vision
- **File-First Architecture** - All requirements stored as structured YAML files, enabling agent editing + live UI rendering
- **Zero-Config for Consumers** - Install the package, run the CLI, everything works. No build tooling required in consuming projects.

### Key Design Decisions

| Decision | Choice | Why | Tradeoff |
|----------|--------|-----|----------|
| Storage Format | YAML files | Human-readable, supports comments, clean syntax for requirements | Needs js-yaml parser, whitespace-sensitive |
| Distribution | Bun package + pre-built UI | Self-contained CLI with built-in HTTP server and pre-built React UI | Requires Bun for building, but consumers need nothing |
| Package consumption | No npm publish required | Consumable via git or local path; `npm install github:user/repo` or `npm install file:../path` | No central registry; users need repo access or local clone |
| Runtime | Bun | Zero dependencies, built-in TypeScript, fast bundler | Newer runtime, less ecosystem |
| Requirement Model | Vision + per-project user requirements | Clear separation: one vision drives multiple projects, each with user-value requirements only | No technical/derived requirements — those belong in architecture docs |
| State Management | Zustand | Simple, SSE-friendly, works outside React for agent updates | Less structured than Redux |
| Real-time Updates | File watcher + SSE | Server-side recursive file watcher pushes events via SSE to browser; instant updates, no polling waste | Requires SSE-capable browser (all modern browsers) |
| UI Serving | Built-in HTTP server | Self-contained, no Vite/webpack needed at runtime; pre-built UI shipped with package | UI must be rebuilt when changing components |
| UI Framework | React + Tailwind | Fast iteration, modern tooling | Build-time only dependency |

## Architecture Diagram

```
┌───────────────────────────────────────────────────────────────────────┐
│                          DESIGN DUCK                                  │
├───────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐         ┌──────────────────────────────────────┐   │
│  │   AI Agent   │         │           File System                 │   │
│  │  (Cursor)    │────────▶│                                      │   │
│  │              │  writes │  requirements/                        │   │
│  └──────────────┘         │  ├── vision.yaml     (vision/mission)│   │
│                           │  └── projects/                        │   │
│                           │      ├── <project-a>/                 │   │
│                           │      │   └── requirements.yaml        │   │
│                           │      └── <project-b>/                 │   │
│                           │          └── requirements.yaml        │   │
│                           └──────────┬───────────────────────────┘   │
│                                      │                               │
│                              watches │ (fs.watch recursive)          │
│                                      ▼                               │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │              Built-in HTTP Server (ui-server.ts)               │   │
│  │                                                               │   │
│  │  GET /                → Pre-built UI (dist-ui/index.html)     │   │
│  │  GET /assets/*        → Pre-built JS/CSS (dist-ui/assets/)    │   │
│  │  GET /api/projects    → JSON list of project names            │   │
│  │  GET /requirements/*  → YAML files from consumer's project    │   │
│  │  GET /events          → SSE stream (file change events)       │   │
│  └───────────────────────────────┬───────────────────────────────┘   │
│                                  │                                   │
│                         serves   │  SSE events                       │
│                                  ▼                                   │
│  ┌──────────────┐    ┌──────────────────────────────────────────┐   │
│  │   React UI   │    │              Zustand Store                │   │
│  │  (browser)   │◀──▶│  - vision: Vision                        │   │
│  │              │    │  - projects: Record<string, Project>      │   │
│  │  - Vision    │    │  - loadFromFiles()  → fetch YAML via HTTP│   │
│  │  - Projects  │    │  - startWatching()  → SSE + poll fallback│   │
│  │  - Cards     │    │  - stopWatching()                        │   │
│  └──────────────┘    └──────────────────────────────────────────┘   │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

## Data Model

### Requirement File Structure

```
requirements/
├── vision.yaml                      # Vision, mission, core problem
└── projects/
    ├── <project-a>/
    │   └── requirements.yaml        # Vision alignment + user requirements
    └── <project-b>/
        └── requirements.yaml
```

### Vision File (vision.yaml)

```yaml
# vision.yaml - Vision, mission, and core problem
vision: "A world where every team can efficiently gather and manage requirements"
mission: "Provide a simple, AI-powered tool for collaborative requirements gathering"
problem: "Teams struggle to capture, organize, and maintain software requirements effectively"
```

### Project Requirements File (requirements.yaml)

```yaml
# requirements.yaml - Per-project user-value requirements
visionAlignment: "This project helps achieve the vision by enabling users to quickly search and find products"

requirements:
  - id: req-001
    description: Users need to quickly find products by searching with partial names
    userValue: Reduces time to find desired product from minutes to seconds
    priority: high
    status: draft

  - id: req-002
    description: Users can save items to a wishlist for later purchase
    userValue: Increases conversion by letting users return to considered items
    priority: medium
    status: draft
```

### Requirement Fields

| Field | Required | Description |
|-------|----------|-------------|
| `id` | Yes | Unique identifier (e.g. `req-001`) |
| `description` | Yes | What the user needs |
| `userValue` | Yes | Why this matters to the user |
| `priority` | Yes | `high`, `medium`, or `low` |
| `status` | Yes | `draft`, `review`, or `approved` |

## Domain Structure

```
src/
├── domain/                      # Pure business logic (no React)
│   └── requirements/
│       ├── requirement.ts       # Types & validation (Requirement, Vision)
│       └── requirement.test.ts
│
├── infrastructure/              # File system & server operations
│   ├── yaml-parser.ts          # Pure YAML parsing (browser-safe, no Node imports)
│   ├── file-store.ts           # Filesystem readers (Node/Bun only, re-exports parsers)
│   ├── file-watcher.ts         # Watch for external YAML changes (recursive fs.watch)
│   ├── ui-server.ts            # Built-in HTTP server (static files + YAML + SSE + projects API)
│   └── vite-requirements-plugin.ts  # Vite plugin (dev mode only)
│
├── stores/                      # Zustand stores (browser)
│   └── requirements-store.ts   # State + loadFromFiles() + SSE watching
│
├── commands/                    # CLI command handlers
│   ├── init.ts                 # Scaffold requirements/ with vision + example project
│   ├── ui.ts                   # Start built-in UI server
│   └── validate.ts             # Validate YAML files
│
├── ui/                          # React entry points
│   ├── main.tsx                # React root
│   ├── App.tsx                 # App shell + watcher lifecycle
│   └── index.css               # Tailwind styles
│
└── components/                  # React UI components
    ├── VisionHeader.tsx         # Displays vision, mission, problem
    ├── ProjectSection.tsx       # Project with vision alignment + requirements
    ├── RequirementCard.tsx      # Single requirement card
    └── RequirementList.tsx      # List of requirement cards
```

## Key Flows

### Agent Creates/Updates Requirement
```
1. Agent edits vision.yaml or projects/<name>/requirements.yaml
2. Recursive file watcher (fs.watch) detects YAML change
3. Server sends SSE event "requirements-changed" to all connected browsers
4. Zustand store receives SSE event, calls loadFromFiles()
5. Store fetches project list via /api/projects, then fetches each project's YAML + vision.yaml
6. UI re-renders with updated vision and project requirements
```

### User Views Requirements
```
1. User runs `npx design-duck ui` from their project
2. Built-in HTTP server starts on localhost:3456
3. Server serves pre-built React UI from dist-ui/
4. Server serves requirements/ YAML files from the project's working directory
5. Server provides /api/projects endpoint listing project directories
6. Server starts recursive file watcher on requirements/ directory
7. Browser connects to SSE endpoint for live updates
```

## Build Pipeline

Design Duck has a two-stage build:

| Stage | Command | Input | Output | Purpose |
|-------|---------|-------|--------|---------|
| CLI | `bun build src/cli.ts --outdir=dist --target=bun` | `src/cli.ts` + all server code | `dist/cli.js` | Bundled CLI with built-in HTTP server |
| UI | `vite build` | `src/ui/`, `src/components/`, `src/stores/` | `dist-ui/` | Pre-built React app (static HTML/JS/CSS) |

Both are run via `bun run build`. The `dist/` and `dist-ui/` directories are shipped with the package (`files` field in package.json).

## Installation & Usage

The CLI is designed to be **runnable without publishing to npm**. Consumers can install from git or a local path.

```bash
# From Git (public or private repo)
npm install github:ma-cohen/desgin-duck#main

# From local path (e.g. while developing)
npm install file:../path/to/desgin-duck

# Then run the CLI
npx design-duck init       # Scaffold requirements/
npx design-duck validate   # Validate YAML files
npx design-duck ui         # Start UI server with live reload
```

### Development (inside the design-duck repo)

```bash
# Run from source
bun run src/cli.ts init
bun run src/cli.ts validate

# Dev mode UI (with Vite HMR)
bun run dev:ui

# Build for distribution
bun run build

# Run tests
bun test
```

### CLI Commands

| Command | Description |
|---------|-------------|
| `init` | Creates `requirements/` folder with vision.yaml and an example project. Runs `git init` if not already a repo. |
| `ui` | Starts built-in HTTP server on port 3456, opens browser, watches for YAML file changes with live reload via SSE |
| `validate` | Validates all requirement files (vision + all projects) against schema, reports errors to stdout |

## Out of Scope (Phase 1)

- Requirement versioning/history
- Multi-user collaboration
- Export to other formats (Word, PDF)
- Integration with project management tools

## Changelog

### Change 1: Vision-Driven Per-Project Requirements
**Date:** 2026-02-11

**What Changed:**
- Replaced flat main.yaml + derived.yaml structure with vision.yaml + per-project requirements
- Removed derived requirements entirely — requirements are user-focused only
- Added vision document (vision, mission, problem statement)
- Each project has a visionAlignment statement explaining how it serves the vision
- File watcher updated to recursive watching for nested project directories
- Server added /api/projects endpoint for dynamic project discovery
- UI restructured to show vision header + per-project requirement sections

**Why:**
- Requirements should only describe user value, not technical decisions (those belong in architecture docs)
- A central vision document ensures all projects align to the same goal
- Per-project splitting enables better organization for multi-project efforts

**Impact:**
- All domain types changed (DerivedRequirement removed, Vision added, MainRequirement → Requirement)
- All infrastructure files updated (parser, file-store, watcher, server)
- Store completely restructured for multi-project support
- UI components replaced (RequirementTree → VisionHeader + ProjectSection)
- CLI commands updated (init, validate)
- All tests rewritten

**Previous:**
- `requirements/project.yaml` + `requirements/main.yaml` + `requirements/derived.yaml`
- MainRequirement + DerivedRequirement types
- Single-project, flat structure

**New:**
- `requirements/vision.yaml` + `requirements/projects/<name>/requirements.yaml`
- Vision + Requirement types
- Multi-project, vision-driven structure
