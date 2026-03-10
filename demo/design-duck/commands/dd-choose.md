# Design Duck — Choose

Evaluate and choose design options for a specific project.

## How to Use

The user tagged this file to ask you to work on the **choose** phase for a project.
This phase requires a **project name**.

### Determining the Project Name

1. If the user mentioned a project name in their message, use it.
2. Otherwise, list the available projects:
   ```bash
   ls design-duck/docs/projects/
   ```
3. If there is exactly one project, use it.
4. If there are multiple projects, ask the user which one to work on.

## Steps

1. Run the context command with the project name:

   ```bash
   dd context choose <project-name>
   ```

2. Read the output carefully — it contains the design decisions with their
   options and detailed instructions for evaluation.

3. Follow the instructions from the context output. For each unchosen
   decision, evaluate options and set `chosen` + `chosenReason` in
   `design-duck/docs/projects/<project-name>/design.yaml`.

4. Run validation to check your work:

   ```bash
   dd validate
   ```

## Rules

- Do NOT override decisions that already have a choice.
- Provide a clear `chosenReason` for each selection.
- Consider the user's message for any preferences or constraints.
- **Prefer simpler options** when they deliver similar user value. Choose complexity only when a concrete requirement demands it.

## Next Step

When you're done, suggest the user continue to the **propagate** phase to
review which decisions should be promoted to global design: `@dd-propagate`
