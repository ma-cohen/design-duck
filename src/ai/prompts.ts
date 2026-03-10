/**
 * Prompt templates for AI context generation.
 *
 * Each template is a function that accepts context data and returns
 * a structured markdown string ready for an AI coding agent.
 */

// ---------------------------------------------------------------------------
// Vision
// ---------------------------------------------------------------------------

export function visionPrompt(currentVision: string | null, rootContextYaml: string | null): string {
  const stateBlock = currentVision
    ? `## Current State\n\nThe vision.yaml file currently contains:\n\n\`\`\`yaml\n${currentVision}\`\`\`\n\nRefine or rewrite these fields as needed.`
    : `## Current State\n\nThe vision.yaml file is empty or does not yet have content. Start fresh.`;

  const contextBlock = rootContextYaml
    ? `## Current Context\n\nThe following situational context has been captured:\n\n\`\`\`yaml\n${rootContextYaml}\`\`\`\n\nUse these facts to inform the vision. You may suggest updates to context items as well.`
    : `## Current Context\n\nNo context has been captured yet.`;

  return `# Vision Definition

## Your Role

You are helping define the product vision, mission, and core problem statement.
Write clear, concise statements that will guide all downstream project decisions.

**Before defining or refining the vision, ask the user about their situation.** Understanding the context is critical — you should not define a vision in a vacuum. Ask about:
- Company stage (startup, scale-up, enterprise?)
- Team size and composition
- Budget and resource constraints
- Target market and users
- Time horizons and urgency
- Any existing products or systems

Capture the answers as context items in: design-duck/docs/context.yaml

${contextBlock}

${stateBlock}

## Instructions

1. First, update context items in design-duck/docs/context.yaml based on the user's situation.
2. Then, edit design-duck/docs/vision.yaml informed by that context.

Each context item needs:
- **id**: A unique identifier (e.g., CTX-001)
- **description**: A one-liner factual statement about the situation

Vision fields:
- **productName**: The name of the product or app (shown in the UI header). Ask the user for it.
- **vision**: A compelling future-state statement describing the world you want to create.
- **mission**: What your product/team does to achieve that vision.
- **problem**: The specific problem users face today that you are solving.

Keep each field to 1-2 sentences. Be specific, not generic. Always set productName.

## Expected YAML Format

context.yaml:
\`\`\`yaml
contexts:
  - id: CTX-001
    description: "We are a bootstrapped startup with 3 developers"
  - id: CTX-002
    description: "Our target users are small development teams"
\`\`\`

vision.yaml:
\`\`\`yaml
productName: "Your Product Name"
vision: "A world where..."
mission: "We provide..."
problem: "Teams currently struggle with..."
\`\`\`

## Next Step

When you're done, suggest the user continue to the **projects** phase to split
the vision into deliverable work streams by running: \`dd context projects\`
`;
}

// ---------------------------------------------------------------------------
// Projects Split
// ---------------------------------------------------------------------------

export function projectsPrompt(
  visionYaml: string,
  existingProjects: string[],
  rootContextYaml: string | null,
): string {
  const existingBlock =
    existingProjects.length > 0
      ? `## Existing Projects\n\nThese projects already exist:\n${existingProjects.map((p) => `- ${p}`).join("\n")}\n\nYou may suggest additional projects or refine the scope of existing ones.`
      : `## Existing Projects\n\nNo projects exist yet.`;

  const contextBlock = rootContextYaml
    ? `## Situational Context\n\n\`\`\`yaml\n${rootContextYaml}\`\`\`\n`
    : "";

  return `# Project Breakdown

## Your Role

You are helping split the product vision into high-level projects (work streams).
Each project should be a cohesive unit of work that delivers user value independently.

## Vision Context

\`\`\`yaml
${visionYaml}\`\`\`

${contextBlock}${existingBlock}

## Instructions

For each new project, create a directory and requirements.yaml file:
  design-duck/docs/projects/<project-name>/requirements.yaml

Use kebab-case for project directory names (e.g., \`user-auth\`, \`notification-service\`).

Each requirements.yaml should contain:
- **visionAlignment**: How this project contributes to the overall vision (1 sentence).
- **requirements**: An empty array (requirements will be gathered in the next step).

## Expected YAML Format

For each project file at \`design-duck/docs/projects/<name>/requirements.yaml\`:

\`\`\`yaml
visionAlignment: "This project contributes to the vision by..."
requirements: []
\`\`\`

## Guidelines

- Aim for 3-7 projects that together cover the full vision.
- Each project should be independently deliverable.
- Name projects after the capability they provide, not the technology.
- **Keep it lean.** Only create projects for work that is essential to the vision. Fewer focused projects are better than many speculative ones.

## Next Step

When you're done, suggest the user continue to the **requirements** phase to
gather user-value requirements for each project by running:
\`dd context requirements <project-name>\`
`;
}

// ---------------------------------------------------------------------------
// Requirements Gathering
// ---------------------------------------------------------------------------

export function requirementsPrompt(
  visionYaml: string,
  projectName: string,
  currentRequirementsYaml: string | null,
  rootContextYaml: string | null,
): string {
  const stateBlock = currentRequirementsYaml
    ? `## Current Requirements\n\n\`\`\`yaml\n${currentRequirementsYaml}\`\`\`\n\nBuild on these or refine them.`
    : `## Current Requirements\n\nNo requirements defined yet for this project.`;

  const contextBlock = rootContextYaml
    ? `## Situational Context\n\n\`\`\`yaml\n${rootContextYaml}\`\`\`\n`
    : "";

  return `# Requirements Gathering: ${projectName}

## Your Role

You are helping define user-value requirements for the "${projectName}" project.
Focus exclusively on what users need and the value it provides — not technical implementation details.

## Vision Context

\`\`\`yaml
${visionYaml}\`\`\`

${contextBlock}${stateBlock}

## Instructions

Edit the file: design-duck/docs/projects/${projectName}/requirements.yaml

Each requirement needs:
- **id**: A unique identifier with a project-specific prefix (e.g., AUTH-001, NOTIF-001).
- **description**: What the user can do (user story style).
- **userValue**: Why this matters to the user (the benefit).

## Expected YAML Format

\`\`\`yaml
visionAlignment: "How this project aligns with the vision..."
requirements:
  - id: PREFIX-001
    description: "Users can..."
    userValue: "This allows users to..."
  - id: PREFIX-002
    description: "Users can..."
    userValue: "This helps users..."
\`\`\`

## Guidelines

- Write requirements from the user's perspective, not the developer's.
- Each requirement should deliver independent value.
- Use clear, testable descriptions.
- Aim for 3-10 requirements per project.
- **Focus on what's essential.** Include requirements that directly support the vision. Avoid gold-plating — don't add requirements "just in case" or for hypothetical future needs.

## Next Step

When you're done, suggest the user continue to the **design** phase to brainstorm
design decisions for the project by running:
\`dd context design ${projectName}\`
`;
}

// ---------------------------------------------------------------------------
// Design Brainstorm
// ---------------------------------------------------------------------------

export function designPrompt(
  visionYaml: string,
  projectName: string,
  requirementsYaml: string,
  globalDesignYaml: string | null,
  rootContextYaml: string | null,
  projectContextYaml: string | null,
  projectDesignYaml: string | null,
): string {
  const globalDesignBlock = globalDesignYaml
    ? `## Global Design Decisions\n\nThe following system-wide decisions have been made and must be respected:\n\n\`\`\`yaml\n${globalDesignYaml}\`\`\`\n`
    : "";

  const rootContextBlock = rootContextYaml
    ? `## Situational Context\n\n\`\`\`yaml\n${rootContextYaml}\`\`\`\n`
    : "";

  const projectContextBlock = projectContextYaml
    ? `## Project Context\n\nTechnical and system facts for this project:\n\n\`\`\`yaml\n${projectContextYaml}\`\`\`\n`
    : `## Project Context\n\nNo project-level context has been captured yet.\n`;

  const isIteration = projectDesignYaml !== null;

  const existingDesignBlock = projectDesignYaml
    ? `## Existing Design Decisions

The following decisions already exist for this project:

\`\`\`yaml
${projectDesignYaml}\`\`\`

**Do NOT recreate or duplicate these decisions.** Instead:
- If a decision has been chosen, analyze whether the choice opens up NEW
  questions that need their own decisions. These are **cascading decisions**.
- Set \`parentDecisionRef\` on cascading decisions to the ID of the parent
  decision that triggered them.
- Focus on gaps: which categories are missing? Which choices need follow-up?
- You may refine existing unchosen decisions (add options, improve descriptions).
`
    : "";

  const cascadingBlock = isIteration
    ? `## Cascading Decisions

Review each **chosen** decision above. Ask: "Does this choice open up new
questions?" For example:
- Choosing "TypeScript" -> may need decisions about build tool, type strictness
- Choosing "Browser Extension" -> may need decisions about manifest version,
  content script architecture
- Choosing "PostgreSQL" -> may need decisions about ORM, migration strategy

For each cascading decision, set \`parentDecisionRef\` to the ID of the
decision whose choice triggered it.
`
    : "";

  const firstRunQuestions = !isIteration
    ? `**Before brainstorming decisions, ask the user about their current system and technical situation.** Understanding the existing landscape is critical for making good design decisions. Ask about:
- Existing technology stack and infrastructure
- Current system architecture
- Deployment environment (cloud provider, on-prem, etc.)
- Performance or scale requirements
- Integration points with other systems

Capture the answers as context items in: design-duck/docs/projects/${projectName}/context.yaml
`
    : `Since this is a design iteration, you already have context from previous rounds.
If the user's answers from before are captured in context.yaml, build on them.
Only ask follow-up questions if a chosen decision opens up a new area that
needs more context.
`;

  return `# Design Brainstorm: ${projectName}

## Your Role

You are helping brainstorm design decisions for the "${projectName}" project.
For each key decision, propose multiple options with pros and cons.
Do NOT choose yet — present options for human review.

${firstRunQuestions}
## Vision Context

\`\`\`yaml
${visionYaml}\`\`\`

${rootContextBlock}${projectContextBlock}
## Project Requirements

\`\`\`yaml
${requirementsYaml}\`\`\`

${globalDesignBlock}${existingDesignBlock}
## Decision Categories

Every decision must have a \`category\`. Assign one of the following:
- **product**: Form factor, UX patterns, feature scope
- **architecture**: System structure, code organization, module boundaries
- **technology**: Language, framework, libraries, runtime
- **data**: Storage, schema, data flow, caching
- **testing**: Test strategy, test frameworks, coverage targets, test environments
- **infrastructure**: Deployment, CI/CD, hosting, monitoring
- **other**: Anything that doesn't fit the above

Ensure you consider all relevant categories. At minimum, think about whether
the project needs decisions for: **technology choice**, **testing approach**,
and **code organization**. Only skip a category if it genuinely doesn't apply.

${cascadingBlock}
## Instructions

1. First, update project context items in design-duck/docs/projects/${projectName}/context.yaml based on the user's answers.
2. Then, edit design-duck/docs/projects/${projectName}/design.yaml

For each significant architectural or design decision:
1. Identify the topic and provide context.
2. Assign a \`category\` from the list above.
3. Reference which requirements drive this decision.
4. Reference which context items are relevant via \`contextRefs\`.
5. Propose 2-3 options with pros and cons.
6. Leave \`chosen\` and \`chosenReason\` as null — the human decides.
7. If this decision was triggered by a previous choice, set \`parentDecisionRef\`.

If relevant global decisions exist, reference them via \`globalDecisionRefs\`.

## Expected YAML Format

context.yaml:
\`\`\`yaml
contexts:
  - id: CTX-<PREFIX>-001
    description: "Our backend currently uses Express.js on Node 18"
  - id: CTX-<PREFIX>-002
    description: "We deploy to AWS ECS with Fargate"
\`\`\`

design.yaml:
\`\`\`yaml
notes: |
  Research links and analysis notes here...
decisions:
  - id: DEC-<PREFIX>-001
    topic: "What to decide"
    context: "Why this decision matters and what constraints exist"
    category: technology
    requirementRefs:
      - PREFIX-001
    contextRefs:
      - CTX-<PREFIX>-001
    globalDecisionRefs: []
    options:
      - id: option-a
        title: "Option A"
        description: "Description of this approach"
        pros:
          - "Advantage 1"
          - "Advantage 2"
        cons:
          - "Disadvantage 1"
      - id: option-b
        title: "Option B"
        description: "Description of this approach"
        pros:
          - "Advantage 1"
        cons:
          - "Disadvantage 1"
          - "Disadvantage 2"
    chosen: null
    chosenReason: null
  - id: DEC-<PREFIX>-002
    topic: "Cascading decision triggered by choosing Option A above"
    context: "Now that we chose Option A, we need to decide..."
    category: architecture
    parentDecisionRef: DEC-<PREFIX>-001
    requirementRefs:
      - PREFIX-001
    contextRefs: []
    globalDecisionRefs: []
    options:
      - id: option-a
        title: "Sub-option A"
        description: "..."
        pros: ["..."]
        cons: ["..."]
      - id: option-b
        title: "Sub-option B"
        description: "..."
        pros: ["..."]
        cons: ["..."]
    chosen: null
    chosenReason: null
\`\`\`

## Guidelines

- Each decision should map to one or more requirements.
- Use \`contextRefs\` to link decisions to the situational facts that inform them.
- Provide at least 2 options per decision.
- Be specific in pros/cons — avoid generic statements.
- Include a \`notes\` field with research links, constraints, or team context.
- **Favour simplicity and elegance.** Always include a simple, straightforward option. The best design is often the least complex one that fully satisfies the requirements.
- **Avoid over-engineering.** Do not propose options that add unnecessary layers, abstractions, or infrastructure unless a requirement specifically calls for it. If a simpler approach solves the problem, prefer it.
- Only create decisions for questions that genuinely affect how requirements are met — skip decisions where the answer is obvious or where there is only one sensible approach.

## Next Step

When you're done, suggest the user review the design options in the UI, then
continue to the **choose** phase to evaluate and pick options by running:
\`dd context choose ${projectName}\`

**Design is iterative.** After choosing, if new cascading decisions emerge,
re-run: \`dd context design ${projectName}\` to add them. Repeat until the
design feels complete across all categories.
`;
}

// ---------------------------------------------------------------------------
// Choose Design
// ---------------------------------------------------------------------------

export function choosePrompt(
  visionYaml: string,
  projectName: string,
  requirementsYaml: string,
  designYaml: string,
  rootContextYaml: string | null,
  projectContextYaml: string | null,
): string {
  const rootContextBlock = rootContextYaml
    ? `## Situational Context\n\n\`\`\`yaml\n${rootContextYaml}\`\`\`\n`
    : "";

  const projectContextBlock = projectContextYaml
    ? `## Project Context\n\n\`\`\`yaml\n${projectContextYaml}\`\`\`\n`
    : "";

  return `# Design Decision Review: ${projectName}

## Your Role

You are helping evaluate design options and recommend choices for the "${projectName}" project.
For each unchosen decision, analyze the options and suggest which to pick and why.
Consider both the requirements and the situational context when making recommendations.

## Vision Context

\`\`\`yaml
${visionYaml}\`\`\`

${rootContextBlock}${projectContextBlock}
## Project Requirements

\`\`\`yaml
${requirementsYaml}\`\`\`

## Current Design Decisions

\`\`\`yaml
${designYaml}\`\`\`

## Instructions

Edit the file: design-duck/docs/projects/${projectName}/design.yaml

For each decision where \`chosen\` is null:
1. Analyze all options against the requirements and vision.
2. Set \`chosen\` to the id of the recommended option.
3. Set \`chosenReason\` explaining why this option best serves the requirements.

Do NOT modify decisions that already have a \`chosen\` value unless specifically asked.

## Cascading Analysis

After choosing all unchosen decisions, review your choices and identify any
**new decisions** that are now needed as a direct consequence. For each:
- What is the new decision topic?
- Which choice triggered it? (this becomes the \`parentDecisionRef\`)
- What \`category\` does it fall into?

List these cascading decisions at the end of your response so the user knows
whether another design iteration is needed.

## Guidelines

- Justify choices in terms of user value, not just technical merit.
- Consider how choices interact with each other — one choice may constrain or
  enable options in another decision.
- Keep \`chosenReason\` to 1-2 sentences.
- **Prefer the simpler option** when two options deliver similar user value. Complexity should only win when it provides a clear, concrete advantage for a real requirement.
- **Avoid over-engineering.** Don't choose an option just because it's more "scalable" or "future-proof" unless a current requirement demands that scalability.

## Next Step

**If cascading decisions were identified above**, the user should run the design
phase again to add them:
\`dd context design ${projectName}\`

**If the design feels complete** across all categories, continue to:
- **Propagation review**: \`dd context propagate ${projectName}\`
`;
}


// ---------------------------------------------------------------------------
// Propagate Review
// ---------------------------------------------------------------------------

export function propagatePrompt(
  visionYaml: string,
  projectName: string,
  projectDesignYaml: string,
  globalDesignYaml: string | null,
  otherProjectDesigns: { name: string; yaml: string }[],
): string {
  const globalDesignBlock = globalDesignYaml
    ? `## Current Global Design Decisions\n\nThese decisions already apply system-wide:\n\n\`\`\`yaml\n${globalDesignYaml}\`\`\`\n`
    : `## Current Global Design Decisions\n\nNo global design decisions have been defined yet.\n`;

  const otherProjectsBlock =
    otherProjectDesigns.length > 0
      ? `## Other Project Designs\n\n${otherProjectDesigns.map((p) => `### ${p.name}\n\n\`\`\`yaml\n${p.yaml}\`\`\`\n`).join("\n")}`
      : `## Other Project Designs\n\nNo other projects have design decisions yet.\n`;

  return `# Propagation Review: ${projectName}

## Your Role

You are helping review chosen design decisions in the "${projectName}" project to identify
which ones should be **propagated to global** (system-wide) design decisions.

Global decisions apply to ALL projects and represent cross-cutting architectural constraints.
Not every decision should be global — only those that genuinely affect multiple projects or
represent system-wide standards.

**Important:** You should NOT make any file changes. Your job is to analyze and recommend.
The user will use the "Propagate to Global" button in the UI to act on your recommendations.

## Vision Context

\`\`\`yaml
${visionYaml}\`\`\`

## ${projectName} Design Decisions

\`\`\`yaml
${projectDesignYaml}\`\`\`

${globalDesignBlock}
${otherProjectsBlock}

## Instructions

Review each **chosen** decision in the "${projectName}" project and determine whether it
should be propagated to the global design level. For each decision, provide one of:

- **PROPAGATE** — This decision should become a global design decision.
- **KEEP LOCAL** — This decision should remain project-specific.

## Criteria for Propagation

A decision should be propagated to global if it meets one or more of these criteria:

1. **Cross-cutting concern**: The decision affects multiple projects (e.g., "use PostgreSQL for all data storage", "all APIs must use REST").
2. **System-wide standard**: The decision establishes a pattern or standard that other projects should follow for consistency (e.g., "authentication uses JWT tokens").
3. **Shared infrastructure**: The decision involves shared infrastructure or tooling (e.g., "deploy via Docker containers on AWS ECS").
4. **Duplicate pattern**: The same or very similar decision appears (or would logically appear) in other projects.

A decision should remain local if:

1. It only affects the implementation of this specific project.
2. It is tightly coupled to project-specific requirements.
3. Making it global would over-constrain other projects unnecessarily.

## Expected Output Format

For each chosen decision, output:

**[DECISION-ID] — [TOPIC]**
- Recommendation: PROPAGATE / KEEP LOCAL
- Reasoning: 1-2 sentences explaining why.

## Summary

After reviewing all decisions, provide a final summary listing only the decisions
recommended for propagation, so the user can quickly act on them in the UI using
the "Propagate to Global" button on each decision card.
`;
}
