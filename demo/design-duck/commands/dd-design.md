# Design Duck — Design

Brainstorm design decisions and options for a specific project.

## How to Use

The user tagged this file to ask you to work on the **design** phase for a project.
This phase requires a **project name**. Design is **iterative** — you may run
this multiple times as cascading decisions emerge from previous choices.

### Determining the Project Name

1. If the user mentioned a project name in their message, use it.
2. Otherwise, list the available projects:
   ```bash
   ls design-duck/docs/projects/
   ```
3. If there is exactly one project (besides `example-project`), use it.
4. If there are multiple projects, ask the user which one to work on.

## Steps

1. Run the context command with the project name:

   ```bash
   dd context design <project-name>
   ```

2. Read the output carefully — it contains current requirements, existing
   design decisions (including chosen ones), context items, and detailed
   instructions.

3. **On first run**, ask the user about their current system and technical
   situation — existing tech stack, infrastructure, deployment environment,
   etc. Capture these as context items in
   `design-duck/docs/projects/<project-name>/context.yaml`.
   **On subsequent runs** (iteration), build on existing context and focus
   on cascading decisions triggered by previous choices.

4. Follow the instructions from the context output. Create or edit
   `design-duck/docs/projects/<project-name>/design.yaml`
   with design decisions. Each decision needs:
   - A `category`: product, architecture, technology, data, testing,
     infrastructure, or other
   - Multiple options with pros/cons
   - `parentDecisionRef` if triggered by a previous choice
   - `chosen: null` and `chosenReason: null` — the human picks

5. Run validation to check your work:

   ```bash
   dd validate
   ```

## Rules

- Each decision must have a `category` and reference requirements via `requirementRefs`.
- Use `contextRefs` to link decisions to relevant context items.
- Provide at least two options per decision with clear pros/cons.
- Do NOT make choices — leave `chosen: null` for the user to decide.
- Set `parentDecisionRef` on decisions triggered by a previous choice.
- Ensure coverage across categories: product, architecture, technology, data, testing, infrastructure.
- **Favour simplicity.** Always include a simple, straightforward option. Don't propose over-engineered solutions that go beyond what the requirements need.
- Only create decisions for questions that genuinely matter — skip obvious or trivial choices.

## Next Step

When you're done, suggest the user review the design options in the UI, then
continue to the **choose** phase to evaluate and pick options: `@dd-choose`

After choosing, if cascading decisions emerge, come back here: `@dd-design`
