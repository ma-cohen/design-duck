# Design Duck — Implementation

Create an implementation plan for a specific project.

## How to Use

The user tagged this file to ask you to work on the **implementation** phase
for a project. This phase requires a **project name**.

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
   dd context implementation <project-name>
   ```

2. Read the output carefully — it contains the requirements, chosen designs,
   and detailed instructions for creating the implementation plan.

3. Follow the instructions from the context output. Create or edit
   `desgin-duck/docs/projects/<project-name>/implementation.yaml`
   with a phased **plan**, **todos**, **validations**, and **tests**.
   Every item must link back to requirements via `requirementRefs`.

4. Run validation to check your work:

   ```bash
   dd validate
   ```

## Rules

- Every todo, validation, and test must reference at least one requirement.
- Keep the plan phased and incremental.
- Todos track status: `pending` | `in-progress` | `done`.
- **Keep it lean.** Only include tasks that directly serve a requirement. Avoid speculative infrastructure or premature optimizations.

## Next Step

When you're done, suggest the user optionally define **global validations** that
apply across all projects: `@dd-validations`. Otherwise, the design is complete
and the user can start implementing based on the plan.
