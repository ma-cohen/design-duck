# Design Duck — Agent Instructions

You are working inside a project that uses **Design Duck** for vision-driven
requirements and design management. All project state lives in YAML files under
`desgin-duck/requirements/`. A live UI (`design-duck ui`) shows the current
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

Edit `desgin-duck/requirements/vision.yaml` with a clear **vision**, **mission**,
and **problem** statement. Every downstream decision traces back here.

### 2. Split into Projects

```bash
design-duck context projects
```

Create project directories under `desgin-duck/requirements/projects/<name>/`.
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

### 6. Implementation Plan (per project)

```bash
design-duck context implementation <project>
```

Create `implementation.yaml` for the project with a phased **plan**, **todos**,
**validations**, and **tests**. Every item links back to requirements via
`requirementRefs`.

### Global Validations (any time)

```bash
design-duck context validations
```

Edit `desgin-duck/requirements/implementation.yaml` to add cross-cutting
validation rules (linting, testing, security, etc.) that all projects must respect.

## File Structure

```
desgin-duck/requirements/
├── vision.yaml                  # Vision, mission & problem
├── design.yaml                  # Global design decisions
├── implementation.yaml          # Global validations
└── projects/
    └── <project-name>/
        ├── requirements.yaml    # User-value requirements
        ├── design.yaml          # Design decisions & options
        └── implementation.yaml  # Plan, todos, validations, tests
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
