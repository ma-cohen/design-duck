# Design Duck — Design

Brainstorm design decisions and options for a specific project.

## How to Use

The user tagged this file to ask you to work on the **design** phase for a project.
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
   dd context design <project-name>
   ```

2. Read the output carefully — it contains current requirements, existing
   design decisions, context items, and detailed instructions.

3. **Ask the user about their current system and technical situation** —
   existing tech stack, infrastructure, deployment environment, etc. Capture
   these as context items in
   `design-duck/docs/projects/<project-name>/context.yaml`.
   Do not make design decisions without understanding the current landscape.

4. Follow the instructions from the context output. Create or edit
   `design-duck/docs/projects/<project-name>/design.yaml`
   with design decisions. Each decision should have multiple options with
   pros/cons. Use `contextRefs` to link decisions to relevant context items.
   Leave `chosen` and `chosenReason` as `null` — the human picks.

5. Run validation to check your work:

   ```bash
   dd validate
   ```

## Rules

- Each decision must reference requirements via `requirementRefs`.
- Use `contextRefs` to link decisions to relevant context items.
- Provide at least two options per decision with clear pros/cons.
- Do NOT make choices — leave `chosen: null` for the user to decide.
- **Favour simplicity.** Always include a simple, straightforward option. Don't propose over-engineered solutions that go beyond what the requirements need.
- Only create decisions for questions that genuinely matter — skip obvious or trivial choices.

## Next Step

When you're done, suggest the user review the design options in the UI, then
continue to the **choose** phase to evaluate and pick options: `@dd-choose`
