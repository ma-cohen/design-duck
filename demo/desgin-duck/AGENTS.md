# Design Duck — Agent Instructions

You are working inside a project that uses **Design Duck** for vision-driven
requirements and design management. All project state lives in YAML files under
`desgin-duck/docs/`. A live UI (`design-duck ui`) shows the current
state and updates automatically when files change.

## Workflow

**Before you begin:** Start the live UI so the user can see progress in real time:

```bash
design-duck ui
```

This opens a browser dashboard that auto-updates as you edit the YAML files.
The port is selected automatically, so it won't conflict with other projects.

Then follow these phases **in order**. Each phase has a CLI command that generates
a context prompt — run it, read the output, then perform the work described.

### 1. Define the Vision

```bash
design-duck context vision
```

Edit `desgin-duck/docs/vision.yaml` with the **productName**, a clear **vision**, **mission**,
and **problem** statement. The `productName` is displayed in the UI header —
always ask the user for it. Every downstream decision traces back here.

### 2. Split into Projects

```bash
design-duck context projects
```

Create project directories under `desgin-duck/docs/projects/<name>/`.
Each project gets its own `requirements.yaml` with a `visionAlignment` field
and an empty `requirements` array.

### 3. Gather Requirements (per project)

```bash
design-duck context requirements <project>
```

Fill in user-value requirements. Each requirement has an **id**, **description**,
and **userValue**. Focus on what users need, not technical implementation.

### 4. Design Brainstorm (per project)

```bash
design-duck context design <project>
```

Create `design.yaml` for the project with design decisions. Each decision has
multiple options with pros/cons. Leave `chosen` and `chosenReason` as `null` —
the human picks.

### 5. Choose Design (per project)

```bash
design-duck context choose <project>
```

For each unchosen decision, evaluate options and set `chosen` + `chosenReason`.
Do not override decisions that already have a choice.

### 6. Propagation Review (per project)

```bash
design-duck context propagate <project>
```

Review chosen design decisions and determine which should be promoted to the
global `design.yaml` so they apply across all projects.

## File Structure

```
desgin-duck/docs/
├── vision.yaml                  # Product name, vision, mission & problem
├── context.yaml                 # Situational context (org, team, constraints)
├── design.yaml                  # Global design decisions
└── projects/
    └── <project-name>/
        ├── context.yaml         # Project-specific context
        ├── requirements.yaml    # User-value requirements
        └── design.yaml          # Design decisions & options
```

## Other Commands

| Command                  | Purpose                              |
| ------------------------ | ------------------------------------ |
| `design-duck init`      | Scaffold the requirements directory  |
| `design-duck ui`        | Start the live UI (auto-selects port starting from 3456) |
| `design-duck validate`  | Validate all YAML files              |
| `design-duck upgrade`   | Upgrade to latest version            |

## Short `dd` Alias

If the `dd` shell function is installed (added to `~/.zshrc` or `~/.bashrc`),
you can use `dd` instead of `./desgin-duck/duck` or `design-duck` for all
commands:

```bash
dd init                          # scaffold + npm install in one step
dd context vision                # generate context prompt
dd ui                            # start the live UI
dd validate                      # validate YAML files
dd context requirements <project>
```

When running commands in the terminal on behalf of the user, prefer `dd` if
available — it is shorter and works from the project root.

## Command Files (Tag & Go)

Instead of remembering CLI commands, tag a command file in `desgin-duck/commands/`
to have the agent run the right command automatically. Just tag the file and add
your instructions — the agent handles the rest.

| Tag                    | What it does                                |
| ---------------------- | ------------------------------------------- |
| `@dd-vision`          | Define or refine the product vision         |
| `@dd-projects`        | Split the vision into projects              |
| `@dd-requirements`    | Gather requirements for a project           |
| `@dd-design`          | Brainstorm design decisions for a project   |
| `@dd-choose`          | Evaluate and choose design options          |
| `@dd-propagate`       | Review decisions for propagation to global  |
| `@dd-validate`        | Validate all YAML files                     |
| `@dd-ui`              | Start the live UI dashboard                 |
| `@dd-init`            | Initialize Design Duck                      |
| `@dd-upgrade`         | Upgrade to the latest version               |

**Example:** `@dd-vision create an app for blogging` — the agent runs the vision
context command and fills in vision.yaml based on your description.

## Design Philosophy

- **Solve the requirements, not more.** Every design decision and option
  should trace back to a real requirement. If it doesn't serve a requirement,
  question whether it's needed.
- **Favour simplicity and elegance.** The best design is the simplest one that
  fully satisfies the requirements. Prefer straightforward approaches over
  clever or complex ones.
- **Avoid over-engineering.** Do not introduce abstractions, frameworks, layers,
  or infrastructure "just in case." Add complexity only when a concrete
  requirement demands it.
- **Iterate, don't anticipate.** Design for what's needed now. Future
  requirements can be handled in future iterations — keep the current design
  lean and focused.

## Rules

- **YAML is the source of truth.** Edit the files directly; the UI updates via
  file watching.
- **IDs must be unique** within their scope (requirements per project, decisions
  per project, etc.).
- **requirementRefs** must reference existing requirement IDs. Run
  `design-duck validate` to check cross-references.
- **Global design decisions** can be referenced by project decisions via
  `globalDecisionRefs`.
- Keep descriptions concise and user-focused.
