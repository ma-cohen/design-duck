# Design Duck — Add Problem

Add a new problem or need to an existing project, then design and choose
solutions for it — all without stopping between phases.

## How to Use

The user tagged this file to **add a new problem** to an existing project.
Use their message as the problem statement.
This requires a **project name**.

### Determining the Project Name

1. If the user mentioned a project name in their message, use it.
2. Otherwise, list the available projects:
   ```bash
   ls design-duck/docs/projects/
   ```
3. If there is exactly one project (besides `example-project`), use it.
4. If there are multiple projects, ask the user which one to add to.

## Steps

1. Run the add context command with the project name:

   ```bash
   dd context add <project-name>
   ```

2. Read the output carefully — it contains the existing state (vision,
   requirements, design) and step-by-step instructions.

3. Follow **all** the instructions from the context output:
   - Add new requirements for the user's problem
   - Add new design decisions with options
   - Choose options for the new decisions
   **Do NOT stop between steps** — complete everything in one go.

4. Run validation when done:

   ```bash
   dd validate
   ```

5. Present a summary of what was added.

## Rules

- **Do NOT modify or remove existing requirements or decisions** — only add new ones.
- Use IDs that don't collide with existing ones.
- YAML is the source of truth — edit the files directly.
- Keep descriptions concise and user-focused.

## After Completion

Let the user know they can:
- Review in the UI
- Add more problems: `@dd-add`
- Iterate on specific decisions: `@dd-design` or `@dd-choose`
