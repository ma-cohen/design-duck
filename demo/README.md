# Design Duck Demo

This directory contains a pre-populated demo project for Design Duck.
It showcases a fictional **Task Board** product with a complete set of
vision, context, requirements, design decisions, and implementation plans.

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

- **Vision** — product vision, mission, and core problem
- **Context** — organizational and environmental facts (3 items)
- **Global Design** — deployment strategy decision (chosen: containers)
- **General Validations** — linting, testing, and security checks
- **Task Board project** with:
  - 4 requirements (drag-and-drop board, columns, assignments, real-time)
  - 2 project context items (React + Hono stack)
  - 2 design decisions (database choice, DnD library)
  - Implementation plan with todos, validations, and test specs
