# Design Duck — Propagate

Review chosen design decisions and identify candidates for propagation to global.

## How to Use

The user tagged this file to ask you to review a project's decisions and recommend
which ones should be **propagated to global** (system-wide) design decisions.
This phase requires a **project name**.

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
   dd context propagate <project-name>
   ```

2. Read the output carefully — it contains the project's design decisions,
   existing global decisions, other project designs for cross-referencing,
   and detailed criteria for propagation.

3. Follow the instructions from the context output. For each chosen decision,
   recommend whether it should be propagated to global or kept local, with
   clear reasoning.

4. **Do NOT edit any files.** Your job is to recommend. The user will use the
   "Propagate to Global" button in the UI to move decisions they agree with.

## Rules

- Only chosen decisions can be propagated — unchosen decisions stay local.
- A decision should be global only if it is cross-cutting, establishes a system-wide
  standard, or involves shared infrastructure.
- Do not over-propagate — most decisions should stay project-specific.

## Next Step

After the user acts on your recommendations in the UI, let the user know the
design process is complete. They can now start implementing based on the design
decisions and chosen options.
