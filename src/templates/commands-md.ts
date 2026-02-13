/**
 * Command markdown templates — generated into desgin-duck/commands/ by init and upgrade.
 *
 * Each file acts as an agent instruction: the user tags it (e.g. @dd-vision)
 * and the agent reads the file to know which CLI command to run and how to
 * handle the output.
 */

// ---------------------------------------------------------------------------
// Context-phase commands
// ---------------------------------------------------------------------------

const DD_VISION = `# Design Duck — Vision

Define or refine the product vision, mission, and problem statement.

## How to Use

The user tagged this file to ask you to work on the **vision** phase.
Use their message as context for what the vision should be about.

## Steps

1. Start the live UI so the user can see progress in real time:

   \`\`\`bash
   dd ui
   \`\`\`

2. Run the context command to get the current state and instructions:

   \`\`\`bash
   dd context vision
   \`\`\`

3. Read the output carefully — it contains the current \`vision.yaml\` state
   and detailed instructions for what to do.

4. Follow the instructions from the context output. Edit
   \`desgin-duck/requirements/vision.yaml\` with a clear **vision**, **mission**,
   and **problem** statement, incorporating the user's request.

5. Run validation to check your work:

   \`\`\`bash
   dd validate
   \`\`\`

## Rules

- YAML is the source of truth — edit the files directly.
- Keep descriptions concise and user-focused.
- Every downstream decision traces back to the vision.

## Next Step

When you're done, suggest the user continue to the **projects** phase to split the
vision into deliverable work streams: \`@dd-projects\`
`;

const DD_PROJECTS = `# Design Duck — Projects

Split the vision into distinct projects.

## How to Use

The user tagged this file to ask you to work on the **projects** phase.
Use their message as context for how to split the vision into projects.

## Prerequisites

The vision must be defined first (\`desgin-duck/requirements/vision.yaml\`).

## Steps

1. Run the context command to get the current state and instructions:

   \`\`\`bash
   dd context projects
   \`\`\`

2. Read the output carefully — it contains the current vision, existing
   projects (if any), and detailed instructions.

3. Follow the instructions from the context output. Create project directories
   under \`desgin-duck/requirements/projects/<name>/\` with a
   \`requirements.yaml\` containing a \`visionAlignment\` field.

4. Run validation to check your work:

   \`\`\`bash
   dd validate
   \`\`\`

## Rules

- Each project must have a \`visionAlignment\` explaining how it supports the vision.
- Project names should be kebab-case (e.g. \`user-auth\`, \`payment-flow\`).

## Next Step

When you're done, suggest the user continue to the **requirements** phase to
gather user-value requirements for each project: \`@dd-requirements\`
`;

const DD_REQUIREMENTS = `# Design Duck — Requirements

Gather user-value requirements for a specific project.

## How to Use

The user tagged this file to ask you to work on **requirements** for a project.
This phase requires a **project name**.

### Determining the Project Name

1. If the user mentioned a project name in their message, use it.
2. Otherwise, list the available projects:
   \`\`\`bash
   ls desgin-duck/requirements/projects/
   \`\`\`
3. If there is exactly one project (besides \`example-project\`), use it.
4. If there are multiple projects, ask the user which one to work on.

## Steps

1. Run the context command with the project name:

   \`\`\`bash
   dd context requirements <project-name>
   \`\`\`

2. Read the output carefully — it contains existing requirements and
   detailed instructions.

3. Follow the instructions from the context output. Edit
   \`desgin-duck/requirements/projects/<project-name>/requirements.yaml\`
   with user-value requirements. Each requirement needs an **id**,
   **description**, and **userValue**.

4. Run validation to check your work:

   \`\`\`bash
   dd validate
   \`\`\`

## Rules

- Focus on what users need, not technical implementation.
- IDs must be unique within the project (e.g. \`REQ-001\`, \`REQ-002\`).
- Each requirement must have a clear \`userValue\`.

## Next Step

When you're done, suggest the user continue to the **design** phase to brainstorm
design decisions and options for the project: \`@dd-design\`
`;

const DD_DESIGN = `# Design Duck — Design

Brainstorm design decisions and options for a specific project.

## How to Use

The user tagged this file to ask you to work on the **design** phase for a project.
This phase requires a **project name**.

### Determining the Project Name

1. If the user mentioned a project name in their message, use it.
2. Otherwise, list the available projects:
   \`\`\`bash
   ls desgin-duck/requirements/projects/
   \`\`\`
3. If there is exactly one project (besides \`example-project\`), use it.
4. If there are multiple projects, ask the user which one to work on.

## Steps

1. Run the context command with the project name:

   \`\`\`bash
   dd context design <project-name>
   \`\`\`

2. Read the output carefully — it contains current requirements, existing
   design decisions, and detailed instructions.

3. Follow the instructions from the context output. Create or edit
   \`desgin-duck/requirements/projects/<project-name>/design.yaml\`
   with design decisions. Each decision should have multiple options with
   pros/cons. Leave \`chosen\` and \`chosenReason\` as \`null\` — the human picks.

4. Run validation to check your work:

   \`\`\`bash
   dd validate
   \`\`\`

## Rules

- Each decision must reference requirements via \`requirementRefs\`.
- Provide at least two options per decision with clear pros/cons.
- Do NOT make choices — leave \`chosen: null\` for the user to decide.
- **Favour simplicity.** Always include a simple, straightforward option. Don't propose over-engineered solutions that go beyond what the requirements need.
- Only create decisions for questions that genuinely matter — skip obvious or trivial choices.

## Next Step

When you're done, suggest the user review the design options in the UI, then
continue to the **choose** phase to evaluate and pick options: \`@dd-choose\`
`;

const DD_CHOOSE = `# Design Duck — Choose

Evaluate and choose design options for a specific project.

## How to Use

The user tagged this file to ask you to work on the **choose** phase for a project.
This phase requires a **project name**.

### Determining the Project Name

1. If the user mentioned a project name in their message, use it.
2. Otherwise, list the available projects:
   \`\`\`bash
   ls desgin-duck/requirements/projects/
   \`\`\`
3. If there is exactly one project (besides \`example-project\`), use it.
4. If there are multiple projects, ask the user which one to work on.

## Steps

1. Run the context command with the project name:

   \`\`\`bash
   dd context choose <project-name>
   \`\`\`

2. Read the output carefully — it contains the design decisions with their
   options and detailed instructions for evaluation.

3. Follow the instructions from the context output. For each unchosen
   decision, evaluate options and set \`chosen\` + \`chosenReason\` in
   \`desgin-duck/requirements/projects/<project-name>/design.yaml\`.

4. Run validation to check your work:

   \`\`\`bash
   dd validate
   \`\`\`

## Rules

- Do NOT override decisions that already have a choice.
- Provide a clear \`chosenReason\` for each selection.
- Consider the user's message for any preferences or constraints.
- **Prefer simpler options** when they deliver similar user value. Choose complexity only when a concrete requirement demands it.

## Next Step

When you're done, suggest the user continue to the **implementation** phase to
create a phased plan, todos, and tests: \`@dd-implementation\`
`;

const DD_IMPLEMENTATION = `# Design Duck — Implementation

Create an implementation plan for a specific project.

## How to Use

The user tagged this file to ask you to work on the **implementation** phase
for a project. This phase requires a **project name**.

### Determining the Project Name

1. If the user mentioned a project name in their message, use it.
2. Otherwise, list the available projects:
   \`\`\`bash
   ls desgin-duck/requirements/projects/
   \`\`\`
3. If there is exactly one project (besides \`example-project\`), use it.
4. If there are multiple projects, ask the user which one to work on.

## Steps

1. Run the context command with the project name:

   \`\`\`bash
   dd context implementation <project-name>
   \`\`\`

2. Read the output carefully — it contains the requirements, chosen designs,
   and detailed instructions for creating the implementation plan.

3. Follow the instructions from the context output. Create or edit
   \`desgin-duck/requirements/projects/<project-name>/implementation.yaml\`
   with a phased **plan**, **todos**, **validations**, and **tests**.
   Every item must link back to requirements via \`requirementRefs\`.

4. Run validation to check your work:

   \`\`\`bash
   dd validate
   \`\`\`

## Rules

- Every todo, validation, and test must reference at least one requirement.
- Keep the plan phased and incremental.
- Todos track status: \`pending\` | \`in-progress\` | \`done\`.
- **Keep it lean.** Only include tasks that directly serve a requirement. Avoid speculative infrastructure or premature optimizations.

## Next Step

When you're done, suggest the user optionally define **global validations** that
apply across all projects: \`@dd-validations\`. Otherwise, the design is complete
and the user can start implementing based on the plan.
`;

const DD_VALIDATIONS = `# Design Duck — Validations

Define global cross-cutting validations that all projects must respect.

## How to Use

The user tagged this file to ask you to work on **global validations**.
These are checks that apply across all projects (linting, testing, security, CI, etc.).

## Steps

1. Run the context command to get the current state and instructions:

   \`\`\`bash
   dd context validations
   \`\`\`

2. Read the output carefully — it contains existing validations and
   detailed instructions.

3. Follow the instructions from the context output. Edit
   \`desgin-duck/requirements/implementation.yaml\` to add or update
   cross-cutting validation rules.

4. Run validation to check your work:

   \`\`\`bash
   dd validate
   \`\`\`

## Rules

- Each validation needs an \`id\`, \`description\`, and \`category\`.
- Categories group validations (e.g. \`linting\`, \`testing\`, \`ci\`, \`security\`).

## Next Step

When you're done, let the user know the design process is complete. They can
now start implementing based on the plans in each project's \`implementation.yaml\`.
If any projects still need an implementation plan, suggest: \`@dd-implementation\`
`;

// ---------------------------------------------------------------------------
// Utility commands
// ---------------------------------------------------------------------------

const DD_VALIDATE = `# Design Duck — Validate

Validate all YAML files and cross-references.

## How to Use

The user tagged this file to ask you to **validate** the Design Duck YAML files.

## Steps

1. Run the validate command:

   \`\`\`bash
   dd validate
   \`\`\`

2. Review the output for any errors or warnings.

3. If there are validation errors, fix them:
   - **Invalid YAML**: Fix syntax in the reported file.
   - **Missing requirementRefs**: Add references to existing requirement IDs.
   - **Duplicate IDs**: Rename to ensure uniqueness within scope.
   - **Missing globalDecisionRefs**: Reference existing global decision IDs.

4. Re-run \`dd validate\` until all checks pass.
`;

const DD_UI = `# Design Duck — UI

Start the live Design Duck UI dashboard.

## How to Use

The user tagged this file to ask you to **start the UI**.

## Steps

1. Run the UI command:

   \`\`\`bash
   dd ui
   \`\`\`

2. The UI starts on an auto-selected port (starting from 3456). Report the
   URL to the user so they can open it in their browser.

3. The UI auto-updates when YAML files change — no need to restart.

## Notes

- The UI is read-only — it displays the current state from the YAML files.
- Keep it running in the background while working on other phases.
- If the port is already in use, the next available port is selected.
`;

const DD_INIT = `# Design Duck — Init

Initialize Design Duck in the current project.

## How to Use

The user tagged this file to ask you to **initialize** Design Duck.

## Steps

1. Run the init command:

   \`\`\`bash
   dd init
   \`\`\`

2. Install dependencies:

   \`\`\`bash
   cd desgin-duck && npm install && cd ..
   \`\`\`

3. Report the created folder structure to the user and suggest next steps:
   - Start the UI: \`dd ui\`
   - Begin with vision: tag \`@dd-vision\` with a description of the product

## Notes

- Init only runs once — it will refuse to overwrite an existing setup.
- After init, all Design Duck state lives in \`desgin-duck/\`.

## Next Step

When you're done, suggest the user start with the **vision** phase to define
the product direction: \`@dd-vision\`
`;

const DD_UPGRADE = `# Design Duck — Upgrade

Upgrade Design Duck to the latest version.

## How to Use

The user tagged this file to ask you to **upgrade** Design Duck.

## Steps

1. Run the upgrade command — it automatically cleans and reinstalls the latest
   version from GitHub before applying migrations:

   \`\`\`bash
   dd upgrade
   \`\`\`

2. Review the output for any migration messages or warnings.

3. Report to the user what was upgraded and if any action is needed.

## Notes

- The upgrade command handles the full clean reinstall automatically (removes
  \`node_modules\` and \`package-lock.json\` to force a fresh fetch from GitHub).
- Backups of overwritten files are saved in \`desgin-duck/.backup/\`.
- AGENTS.md and command files are always regenerated to stay current.
`;

// ---------------------------------------------------------------------------
// Export: map of filename → content
// ---------------------------------------------------------------------------

/** All command markdown files keyed by filename (without path). */
export const COMMAND_FILES: Record<string, string> = {
  "dd-vision.md": DD_VISION,
  "dd-projects.md": DD_PROJECTS,
  "dd-requirements.md": DD_REQUIREMENTS,
  "dd-design.md": DD_DESIGN,
  "dd-choose.md": DD_CHOOSE,
  "dd-implementation.md": DD_IMPLEMENTATION,
  "dd-validations.md": DD_VALIDATIONS,
  "dd-validate.md": DD_VALIDATE,
  "dd-ui.md": DD_UI,
  "dd-init.md": DD_INIT,
  "dd-upgrade.md": DD_UPGRADE,
};
