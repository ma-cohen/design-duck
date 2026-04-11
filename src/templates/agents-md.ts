/**
 * AGENTS.md template – shared between init and upgrade commands.
 * This file is the single source of truth for the generated AGENTS.md content.
 */

export const AGENT_MD = `# Design Duck — Agent Instructions

You are working inside a project that uses **Design Duck** for vision-driven
requirements and design management. All project state lives in YAML files under
\`design-duck/docs/\`. A live UI (\`dd ui\`) shows the current
state and updates automatically when files change.

## Quick Start

The fastest way to get started is \`@dd-solve\` — tag it with your problem
statement and the agent runs the entire workflow (vision, projects, requirements,
design, choose) in one shot. To add more problems to an existing project later,
use \`@dd-add\`.

## Workflow

**Before you begin:** Start the live UI so the user can see progress in real time:

\`\`\`bash
dd ui
\`\`\`

This opens a browser dashboard that auto-updates as you edit the YAML files.
The port is selected automatically, so it won't conflict with other projects.

Then follow these phases **in order**. Each phase has a CLI command that generates
a context prompt — run it, read the output, then perform the work described.

### 1. Define the Vision

\`\`\`bash
dd context vision
\`\`\`

Edit \`design-duck/docs/vision.yaml\` with the **productName**, a clear **vision**, **mission**,
and **problem** statement. The \`productName\` is displayed in the UI header —
always ask the user for it. Every downstream decision traces back here.

### 2. Split into Projects

\`\`\`bash
dd context projects
\`\`\`

Create project directories under \`design-duck/docs/projects/<name>/\`.
Each project gets its own \`requirements.yaml\` with a \`visionAlignment\` field
and an empty \`requirements\` array.

### 3. Gather Requirements (per project)

\`\`\`bash
dd context requirements <project>
\`\`\`

Fill in user-value requirements. Each requirement has an **id**, **description**,
and **userValue**. Focus on what users need, not technical implementation.

### 4-5. Design and Choose (iterative, per project)

Design is **iterative**. After choosing options, new cascading decisions may
emerge. Loop between design and choose until the design is complete:

1. Brainstorm decisions:
   \`\`\`bash
   dd context design <project>
   \`\`\`

2. Evaluate and choose options:
   \`\`\`bash
   dd context choose <project>
   \`\`\`

3. If cascading decisions are needed (the choose phase will identify them),
   go back to step 1.

4. When the design feels complete across all categories, proceed.

Each decision has a **category** (product, architecture, technology, data,
testing, infrastructure) and optionally a **parentDecisionRef** linking it
to the decision whose choice triggered it.

### 5b. Propagation Review (per project, optional)

\`\`\`bash
dd context propagate <project>
\`\`\`

After the design is complete, review whether any decisions should be **propagated
to global** — making them system-wide decisions that all projects must follow.
The AI recommends candidates; the user uses the "Propagate to Global" button in
the UI to move decisions. Only chosen decisions can be propagated.

## File Structure

\`\`\`
design-duck/docs/
├── vision.yaml                  # Product name, vision, mission & problem
├── design.yaml                  # Global design decisions
└── projects/
    └── <project-name>/
        ├── requirements.yaml    # User-value requirements
        └── design.yaml          # Design decisions & options
\`\`\`

## Other Commands

| Command              | Purpose                              |
| -------------------- | ------------------------------------ |
| \`dd init\`           | Scaffold the requirements directory  |
| \`dd ui\`             | Start the live UI (auto-selects port starting from 3456) |
| \`dd validate\`       | Validate all YAML files              |
| \`dd upgrade\`        | Apply migrations and regenerate templates |

When running commands in the terminal on behalf of the user, always use \`dd\` —
it is available globally after \`npm install -g design-duck\`.

## Command Files (Tag & Go)

Instead of remembering CLI commands, tag a command file in \`design-duck/commands/\`
to have the agent run the right command automatically. Just tag the file and add
your instructions — the agent handles the rest.

| Tag                    | What it does                                |
| ---------------------- | ------------------------------------------- |
| \`@dd-solve\`           | **Full cycle** — run all phases in one shot  |
| \`@dd-add\`             | **Add problem** — extend a project with new requirements and design |
| \`@dd-vision\`          | Define or refine the product vision         |
| \`@dd-projects\`        | Split the vision into projects              |
| \`@dd-requirements\`    | Gather requirements for a project           |
| \`@dd-design\`          | Brainstorm design decisions for a project   |
| \`@dd-choose\`          | Evaluate and choose design options          |
| \`@dd-propagate\`       | Review decisions for propagation to global  |
| \`@dd-validate\`        | Validate all YAML files                     |
| \`@dd-ui\`              | Start the live UI dashboard                 |
| \`@dd-init\`            | Initialize Design Duck                      |
| \`@dd-upgrade\`         | Upgrade to the latest version               |

**Example:** \`@dd-vision create an app for blogging\` — the agent runs the vision
context command and fills in vision.yaml based on your description.

## Design Philosophy

- **Solve the requirements, not more.** Every design decision, option, and
  implementation task should trace back to a real requirement. If it doesn't
  serve a requirement, question whether it's needed.
- **Favour simplicity and elegance.** The best design is the simplest one that
  fully satisfies the requirements. Prefer straightforward approaches over
  clever or complex ones.
- **Avoid over-engineering.** Do not introduce abstractions, frameworks, layers,
  or infrastructure "just in case." Add complexity only when a concrete
  requirement demands it.
- **Iterate, don't anticipate.** Design for what's needed now. Future
  requirements can be handled in future iterations — keep the current design
  lean and focused.
- **Design cascades.** Choosing one option often opens up new questions. After
  choosing, identify cascading decisions and loop back to design. Use
  \`parentDecisionRef\` to link child decisions to the choice that triggered them.
- **Cover all categories.** Ensure decisions span product, architecture,
  technology, data, testing, and infrastructure. The UI shows a coverage bar
  so you can spot gaps.

## Rules

- **YAML is the source of truth.** Edit the files directly; the UI updates via
  file watching.
- **IDs must be unique** within their scope (requirements per project, decisions
  per project, etc.).
- **requirementRefs** must reference existing requirement IDs. Run
  \`dd validate\` to check cross-references.
- **Global design decisions** can be referenced by project decisions via
  \`globalDecisionRefs\`.
- **Every decision must have a \`category\`**: product, architecture, technology,
  data, testing, infrastructure, or other.
- **Cascading decisions** should set \`parentDecisionRef\` to the ID of the
  decision whose choice triggered them.
- Keep descriptions concise and user-focused.
`;
