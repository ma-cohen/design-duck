/**
 * Command markdown templates — generated into design-duck/commands/ by init and upgrade.
 *
 * Each file acts as an agent instruction: the user tags it (e.g. @dd-new)
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

3. Read the output carefully — it contains the current \`vision.yaml\` state,
   any existing context items, and detailed instructions for what to do.

4. **Ask the user about their situation first** — company stage, team size,
   budget, constraints, target users, etc. Capture these as context items in
   \`design-duck/docs/context.yaml\`. Do not define the vision in a vacuum.

5. Follow the instructions from the context output. Edit
   \`design-duck/docs/vision.yaml\` with a clear **vision**, **mission**,
   and **problem** statement, informed by the context and the user's request.

6. Run validation to check your work:

   \`\`\`bash
   dd validate
   \`\`\`

## Rules

- YAML is the source of truth — edit the files directly.
- Keep descriptions concise and user-focused.
- Every downstream decision traces back to the vision.
- Context items should be one-liner factual statements.

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

The vision must be defined first (\`design-duck/docs/vision.yaml\`).

## Steps

1. Run the context command to get the current state and instructions:

   \`\`\`bash
   dd context projects
   \`\`\`

2. Read the output carefully — it contains the current vision, existing
   projects (if any), and detailed instructions.

3. Follow the instructions from the context output. Create project directories
   under \`design-duck/docs/projects/<name>/\` with a
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
   ls design-duck/docs/projects/
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
   \`design-duck/docs/projects/<project-name>/requirements.yaml\`
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
This phase requires a **project name**. Design is **iterative** — you may run
this multiple times as cascading decisions emerge from previous choices.

### Determining the Project Name

1. If the user mentioned a project name in their message, use it.
2. Otherwise, list the available projects:
   \`\`\`bash
   ls design-duck/docs/projects/
   \`\`\`
3. If there is exactly one project (besides \`example-project\`), use it.
4. If there are multiple projects, ask the user which one to work on.

## Steps

1. Run the context command with the project name:

   \`\`\`bash
   dd context design <project-name>
   \`\`\`

2. Read the output carefully — it contains current requirements, existing
   design decisions (including chosen ones), context items, and detailed
   instructions.

3. **On first run**, ask the user about their current system and technical
   situation — existing tech stack, infrastructure, deployment environment,
   etc. Capture these as context items in
   \`design-duck/docs/projects/<project-name>/context.yaml\`.
   **On subsequent runs** (iteration), build on existing context and focus
   on cascading decisions triggered by previous choices.

4. Follow the instructions from the context output. Create or edit
   \`design-duck/docs/projects/<project-name>/design.yaml\`
   with design decisions. Each decision needs:
   - A \`category\`: product, architecture, technology, data, testing,
     infrastructure, or other
   - Multiple options with pros/cons
   - \`parentDecisionRef\` if triggered by a previous choice
   - \`chosen: null\` and \`chosenReason: null\` — the human picks

5. Run validation to check your work:

   \`\`\`bash
   dd validate
   \`\`\`

## Rules

- Each decision must have a \`category\` and reference requirements via \`requirementRefs\`.
- Use \`contextRefs\` to link decisions to relevant context items.
- Provide at least two options per decision with clear pros/cons.
- Do NOT make choices — leave \`chosen: null\` for the user to decide.
- Set \`parentDecisionRef\` on decisions triggered by a previous choice.
- Ensure coverage across categories: product, architecture, technology, data, testing, infrastructure.
- **Favour simplicity.** Always include a simple, straightforward option. Don't propose over-engineered solutions that go beyond what the requirements need.
- Only create decisions for questions that genuinely matter — skip obvious or trivial choices.

## Next Step

When you're done, suggest the user review the design options in the UI, then
continue to the **choose** phase to evaluate and pick options: \`@dd-choose\`

After choosing, if cascading decisions emerge, come back here: \`@dd-design\`
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
   ls design-duck/docs/projects/
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
   \`design-duck/docs/projects/<project-name>/design.yaml\`.

4. **Perform a cascading analysis**: after choosing, review your choices and
   identify any new decisions that are now needed as a consequence. List them
   so the user knows whether to loop back to \`@dd-design\`.

5. Run validation to check your work:

   \`\`\`bash
   dd validate
   \`\`\`

## Rules

- Do NOT override decisions that already have a choice.
- Provide a clear \`chosenReason\` for each selection.
- Consider the user's message for any preferences or constraints.
- **Prefer simpler options** when they deliver similar user value. Choose complexity only when a concrete requirement demands it.
- Consider how choices interact — one choice may constrain or enable options in another decision.

## Next Step

**If cascading decisions were identified**, suggest the user loop back to the
design phase: \`@dd-design\`

**If the design is complete** across all categories, suggest continuing to:
- **Propagation review**: \`@dd-propagate\`
`;

const DD_PROPAGATE = `# Design Duck — Propagate

Review chosen design decisions and identify candidates for propagation to global.

## How to Use

The user tagged this file to ask you to review a project's decisions and recommend
which ones should be **propagated to global** (system-wide) design decisions.
This phase requires a **project name**.

### Determining the Project Name

1. If the user mentioned a project name in their message, use it.
2. Otherwise, list the available projects:
   \`\`\`bash
   ls design-duck/docs/projects/
   \`\`\`
3. If there is exactly one project (besides \`example-project\`), use it.
4. If there are multiple projects, ask the user which one to work on.

## Steps

1. Run the context command with the project name:

   \`\`\`bash
   dd context propagate <project-name>
   \`\`\`

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
`;


// ---------------------------------------------------------------------------
// Full-cycle commands
// ---------------------------------------------------------------------------

const DD_NEW = `# Design Duck — New Project

Run the entire Design Duck workflow in one shot: vision, projects, requirements,
design, choose — all without stopping between phases.

## How to Use

The user tagged this file to start a **new project**. Use their message as the
problem statement. You will take it through every phase automatically.

## Steps

1. Start the live UI so the user can see progress in real time:

   \`\`\`bash
   dd ui
   \`\`\`

2. Run the solve context command to get the current state and full instructions:

   \`\`\`bash
   dd context new
   \`\`\`

3. Read the output carefully — it contains the current state of all phases,
   YAML formats, guidelines, and step-by-step instructions.

4. Follow **all** the instructions from the context output. Work through every
   phase sequentially. **Do NOT stop between phases** to suggest next steps —
   just keep going until everything is complete.

5. Run validation when done:

   \`\`\`bash
   dd validate
   \`\`\`

6. Present a summary of everything created and let the user know they can
   review in the UI.

## Rules

- YAML is the source of truth — edit the files directly.
- **Do NOT stop between phases.** Run the full cycle in one go.
- Ask context questions upfront (situation + tech stack) before starting.
- Keep descriptions concise and user-focused.

## After Completion

Let the user know they can:
- Review everything in the live UI
- Add more problems: \`@dd-extend\`
- Iterate on specific decisions: \`@dd-design\` or \`@dd-choose\`
`;

const DD_EXTEND = `# Design Duck — Extend Project

Add a new problem or need to an existing project, then design and choose
solutions for it — all without stopping between phases.

## How to Use

The user tagged this file to **extend an existing project** with a new problem.
Use their message as the problem statement.
This requires a **project name**.

### Determining the Project Name

1. If the user mentioned a project name in their message, use it.
2. Otherwise, list the available projects:
   \`\`\`bash
   ls design-duck/docs/projects/
   \`\`\`
3. If there is exactly one project (besides \`example-project\`), use it.
4. If there are multiple projects, ask the user which one to add to.

## Steps

1. Run the add context command with the project name:

   \`\`\`bash
   dd context extend <project-name>
   \`\`\`

2. Read the output carefully — it contains the existing state (vision,
   requirements, design) and step-by-step instructions.

3. Follow **all** the instructions from the context output:
   - Add new requirements for the user's problem
   - Add new design decisions with options
   - Choose options for the new decisions
   **Do NOT stop between steps** — complete everything in one go.

4. Run validation when done:

   \`\`\`bash
   dd validate
   \`\`\`

5. Present a summary of what was added.

## Rules

- **Do NOT modify or remove existing requirements or decisions** — only add new ones.
- Use IDs that don't collide with existing ones.
- YAML is the source of truth — edit the files directly.
- Keep descriptions concise and user-focused.

## After Completion

Let the user know they can:
- Review in the UI
- Add more problems: \`@dd-extend\`
- Iterate on specific decisions: \`@dd-design\` or \`@dd-choose\`
`;

const DD_CHAT = `# Design Duck — Chat (Continue Anywhere)

Pick up the conversation at whatever stage the project is currently at.
The agent reads current state and figures out what to do.

## How to Use

Tag this file with your question, intent, or next step.

Examples:
- \`@dd-chat the requirements look good, let's move to design\`
- \`@dd-chat what decisions are still open in the auth project?\`
- \`@dd-chat I've reviewed the options, choose them now\``

## Step 1 — Inspect Current State

Check what exists and what is populated:

\`\`\`bash
ls design-duck/docs/projects/ 2>/dev/null || echo "No projects yet"
\`\`\`

Also read \`design-duck/docs/vision.yaml\` to check if productName is set.
For each relevant project, read its \`requirements.yaml\` and \`design.yaml\`.

## Step 2 — Determine What to Do

Based on state + the user's message:

| State | Next phase |
| ----- | ---------- |
| No vision (productName empty) | \`dd context vision\` |
| Vision exists, no projects | \`dd context projects\` |
| Projects exist, no requirements | \`dd context requirements <project>\` |
| Requirements exist, no design decisions | \`dd context design <project>\` |
| Design exists, some decisions unchosen | \`dd context choose <project>\` |
| All decisions chosen, user wants to add more | \`dd context design <project>\` |
| User explicitly names a phase | Run that phase's context command |

If multiple projects exist and the user hasn't specified one, ask.
Always prefer explicit user intent over your inference.

## Step 3 — Do the Work

Run the context command you chose, read its output carefully, follow its instructions.
Then validate:

\`\`\`bash
dd validate
\`\`\`

## Rules

- YAML is the source of truth — edit files directly.
- Do NOT modify existing chosen decisions unless the user explicitly asks.
- If the user's intent is still ambiguous after reading state, ask one clarifying question.

## After Completion

Tell the user what you did and what the natural next step is.
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
   - **Missing contextRefs**: Add references to existing context item IDs.
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

2. Report the created folder structure to the user and suggest next steps:
   - Start the UI: \`dd ui\`
   - Start a new project: \`@dd-new\` with a description of what to build

## Notes

- Init only runs once — it will refuse to overwrite an existing setup.
- After init, all Design Duck state lives in \`design-duck/\`.

## Next Step

When you're done, suggest the user start a new project: \`@dd-new\`
`;

const DD_RESET = `# Design Duck — Reset

Reset Design Duck to a clean state, deleting all docs and starting fresh.

## How to Use

The user tagged this file to ask you to **reset** Design Duck.

## Steps

1. Run the reset command with \`--force\` to skip the confirmation prompt:

   \`\`\`bash
   dd reset --force
   \`\`\`

2. This will:
   - Delete the entire \`design-duck/docs/\` directory (all projects, vision, design, etc.)
   - Delete and regenerate the \`design-duck/commands/\` directory
   - Re-create everything with fresh empty templates (same as \`dd init\`)

3. Report to the user that the reset is complete.

## Notes

- Without \`--force\`, the command prompts for confirmation before deleting.
- This is destructive — all existing YAML content will be lost.
- The \`design-duck/\` directory itself is preserved (only docs/ and commands/ are reset).

## Next Step

After resetting, suggest the user start a new project: \`@dd-new\`
`;

const DD_UPGRADE = `# Design Duck — Upgrade

Upgrade Design Duck to the latest version.

## How to Use

The user tagged this file to ask you to **upgrade** Design Duck.

## Steps

1. Upgrade the global CLI binary:

   \`\`\`bash
   npm install -g design-duck@latest
   \`\`\`

2. Apply any schema migrations and regenerate templates for this project:

   \`\`\`bash
   dd upgrade
   \`\`\`

3. Review the output for any migration messages or warnings.

4. Report to the user what was upgraded and if any action is needed.

## Notes

- Step 1 upgrades the \`dd\` CLI itself; step 2 upgrades this project's files.
- Backups of overwritten files are saved in \`design-duck/.backup/\`.
- Command files are always regenerated to stay current.
`;

// ---------------------------------------------------------------------------
// Slash command variants
// ---------------------------------------------------------------------------

const DD_NEW_SLASH = `# Design Duck — New Project

Run the entire Design Duck workflow in one shot: vision, projects, requirements,
design, choose — all without stopping between phases.

## How to Use

The user typed \`/dd-new\` to start a **new project**. User's description: \$ARGUMENTS — take it through every phase automatically.

## Steps

1. Start the live UI so the user can see progress in real time:

   \`\`\`bash
   dd ui
   \`\`\`

2. Run the solve context command to get the current state and full instructions:

   \`\`\`bash
   dd context new
   \`\`\`

3. Read the output carefully — it contains the current state of all phases,
   YAML formats, guidelines, and step-by-step instructions.

4. Follow **all** the instructions from the context output. Work through every
   phase sequentially. **Do NOT stop between phases** to suggest next steps —
   just keep going until everything is complete.

5. Run validation when done:

   \`\`\`bash
   dd validate
   \`\`\`

6. Present a summary of everything created and let the user know they can
   review in the UI.

## Rules

- YAML is the source of truth — edit the files directly.
- **Do NOT stop between phases.** Run the full cycle in one go.
- Ask context questions upfront (situation + tech stack) before starting.
- Keep descriptions concise and user-focused.

## After Completion

Let the user know they can:
- Review everything in the live UI
- Add more problems: \`/dd-extend\`
- Iterate on specific decisions: \`/dd-design\` or \`/dd-choose\`
`;

const DD_EXTEND_SLASH = `# Design Duck — Extend Project

Add a new problem or need to an existing project, then design and choose
solutions for it — all without stopping between phases.

## How to Use

The user typed \`/dd-extend\` to **extend an existing project** with a new problem. User's description: \$ARGUMENTS
This requires a **project name**.

### Determining the Project Name

1. If the user mentioned a project name in their message, use it.
2. Otherwise, list the available projects:
   \`\`\`bash
   ls design-duck/docs/projects/
   \`\`\`
3. If there is exactly one project (besides \`example-project\`), use it.
4. If there are multiple projects, ask the user which one to add to.

## Steps

1. Run the add context command with the project name:

   \`\`\`bash
   dd context extend <project-name>
   \`\`\`

2. Read the output carefully — it contains the existing state (vision,
   requirements, design) and step-by-step instructions.

3. Follow **all** the instructions from the context output:
   - Add new requirements for the user's problem
   - Add new design decisions with options
   - Choose options for the new decisions
   **Do NOT stop between steps** — complete everything in one go.

4. Run validation when done:

   \`\`\`bash
   dd validate
   \`\`\`

5. Present a summary of what was added.

## Rules

- **Do NOT modify or remove existing requirements or decisions** — only add new ones.
- Use IDs that don't collide with existing ones.
- YAML is the source of truth — edit the files directly.
- Keep descriptions concise and user-focused.

## After Completion

Let the user know they can:
- Review in the UI
- Add more problems: \`/dd-extend\`
- Iterate on specific decisions: \`/dd-design\` or \`/dd-choose\`
`;

const DD_CHAT_SLASH = `# Design Duck — Chat (Continue Anywhere)

Pick up the conversation at whatever stage the project is currently at.
The agent reads current state and figures out what to do.

## How to Use

The user typed \`/dd-chat\` with their question, intent, or next step. User's input: \$ARGUMENTS

Examples:
- \`/dd-chat the requirements look good, let's move to design\`
- \`/dd-chat what decisions are still open in the auth project?\`
- \`/dd-chat I've reviewed the options, choose them now\`

## Step 1 — Inspect Current State

Check what exists and what is populated:

\`\`\`bash
ls design-duck/docs/projects/ 2>/dev/null || echo "No projects yet"
\`\`\`

Also read \`design-duck/docs/vision.yaml\` to check if productName is set.
For each relevant project, read its \`requirements.yaml\` and \`design.yaml\`.

## Step 2 — Determine What to Do

Based on state + the user's message:

| State | Next phase |
| ----- | ---------- |
| No vision (productName empty) | \`dd context vision\` |
| Vision exists, no projects | \`dd context projects\` |
| Projects exist, no requirements | \`dd context requirements <project>\` |
| Requirements exist, no design decisions | \`dd context design <project>\` |
| Design exists, some decisions unchosen | \`dd context choose <project>\` |
| All decisions chosen, user wants to add more | \`dd context design <project>\` |
| User explicitly names a phase | Run that phase's context command |

If multiple projects exist and the user hasn't specified one, ask.
Always prefer explicit user intent over your inference.

## Step 3 — Do the Work

Run the context command you chose, read its output carefully, follow its instructions.
Then validate:

\`\`\`bash
dd validate
\`\`\`

## Rules

- YAML is the source of truth — edit files directly.
- Do NOT modify existing chosen decisions unless the user explicitly asks.
- If the user's intent is still ambiguous after reading state, ask one clarifying question.

## After Completion

Tell the user what you did and what the natural next step is.
`;

// ---------------------------------------------------------------------------
// Export: map of filename → content
// ---------------------------------------------------------------------------

/** All command markdown files keyed by filename (without path). */
export const COMMAND_FILES: Record<string, string> = {
  "dd-new.md": DD_NEW,
  "dd-extend.md": DD_EXTEND,
  "dd-chat.md": DD_CHAT,
  "dd-vision.md": DD_VISION,
  "dd-projects.md": DD_PROJECTS,
  "dd-requirements.md": DD_REQUIREMENTS,
  "dd-design.md": DD_DESIGN,
  "dd-choose.md": DD_CHOOSE,
  "dd-propagate.md": DD_PROPAGATE,
  "dd-validate.md": DD_VALIDATE,
  "dd-ui.md": DD_UI,
  "dd-init.md": DD_INIT,
  "dd-upgrade.md": DD_UPGRADE,
  "dd-reset.md": DD_RESET,
};

/**
 * Slash command files for Claude Code (.claude/commands/) and Cursor (.cursor/commands/).
 * Same as COMMAND_FILES but adapted for IDE slash commands:
 * - References $ARGUMENTS where tag commands use "the user's message"
 * - Intro text uses "/dd-*" syntax instead of "@dd-*" tags
 */
export const SLASH_COMMAND_FILES: Record<string, string> = {
  "dd-new.md": DD_NEW_SLASH,
  "dd-extend.md": DD_EXTEND_SLASH,
  "dd-chat.md": DD_CHAT_SLASH,
};
