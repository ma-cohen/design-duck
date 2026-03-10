# Design Duck Demo

Pre-populated demo data for Design Duck.

This demo uses a fictional product called **TaskFlow** and includes realistic
examples across `vision.yaml`, `context.yaml`, and project requirements/design.

## Run the demo

From the repository root:

```bash
npm run build
cd demo && node ../dist/cli.js ui
```

The UI opens automatically in your browser. The server starts from port `3456`
and picks the next available port if needed.

## Demo contents

- **Vision**: product name, vision, mission, and core problem
- **Root context**: organizational and environmental constraints
- **Global design**: cross-project decisions that projects can reference via `globalDecisionRefs`
- **Project: core-app**:
  - project context
  - user-value requirements
  - categorized design decisions with chosen and pending options
- **Project: notifications**:
  - project context
  - user-value requirements
  - design decisions linked to requirements
## Files to inspect

- `demo/design-duck/docs/vision.yaml`
- `demo/design-duck/docs/context.yaml`
- `demo/design-duck/docs/design.yaml`
- `demo/design-duck/docs/projects/core-app/`
- `demo/design-duck/docs/projects/notifications/`
