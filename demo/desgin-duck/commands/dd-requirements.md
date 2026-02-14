# Design Duck — Requirements

Gather user-value requirements for a specific project.

## How to Use

The user tagged this file to ask you to work on **requirements** for a project.
This phase requires a **project name**.

### Determining the Project Name

1. If the user mentioned a project name in their message, use it.
2. Otherwise, list the available projects:
   ```bash
   ls desgin-duck/docs/projects/
   ```
3. If there is exactly one project, use it.
4. If there are multiple projects, ask the user which one to work on.

## Steps

1. Run the context command with the project name:

   ```bash
   dd context requirements <project-name>
   ```

2. Read the output carefully — it contains existing requirements and
   detailed instructions.

3. Follow the instructions from the context output. Edit
   `desgin-duck/docs/projects/<project-name>/requirements.yaml`
   with user-value requirements. Each requirement needs an **id**,
   **description**, and **userValue**.

4. Run validation to check your work:

   ```bash
   dd validate
   ```

## Rules

- Focus on what users need, not technical implementation.
- IDs must be unique within the project (e.g. `REQ-001`, `REQ-002`).
- Each requirement must have a clear `userValue`.

## Next Step

When you're done, suggest the user continue to the **design** phase to brainstorm
design decisions and options for the project: `@dd-design`
