# Design Duck Demo

This directory contains a pre-populated demo project for Design Duck.
It showcases a fictional **TaskFlow** product with a complete set of
vision, context, requirements, design decisions, and a playground.

## Running the demo

From the repository root:

```bash
# Build the project (if not already built)
npm run build

# Start the UI server against the demo data
cd demo && node ../dist/cli.js ui
```

The UI opens in your browser at `http://localhost:3456`.

## What's included

- **Vision** — TaskFlow product vision, mission, and core problem
- **Context** — 5 organizational and environmental facts
- **Global Design** — 4 cross-cutting decisions (language, monorepo, testing, auth — all chosen)
- **Core App project** with:
  - 3 project context items
  - 6 requirements (CRUD, boards, assignments, search, performance, labels)
  - 6 design decisions (3 chosen, 3 pending)
- **Notifications project** with:
  - 2 project context items
  - 4 requirements (real-time, preferences, bell, digest)
  - 3 design decisions (1 chosen, 2 pending)
- **AI Task Assistant playground** with:
  - Problem statement exploring AI-powered task enhancement
  - 3 context items
  - 3 requirements
  - 2 design decisions (1 chosen, 1 pending)
