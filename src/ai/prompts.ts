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

Capture the answers as context items in: desgin-duck/requirements/context.yaml

${contextBlock}

${stateBlock}

## Instructions

1. First, update context items in desgin-duck/requirements/context.yaml based on the user's situation.
2. Then, edit desgin-duck/requirements/vision.yaml informed by that context.

Each context item needs:
- **id**: A unique identifier (e.g., CTX-001)
- **description**: A one-liner factual statement about the situation

Vision fields:
- **vision**: A compelling future-state statement describing the world you want to create.
- **mission**: What your product/team does to achieve that vision.
- **problem**: The specific problem users face today that you are solving.

Keep each field to 1-2 sentences. Be specific, not generic.

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
  desgin-duck/requirements/projects/<project-name>/requirements.yaml

Use kebab-case for project directory names (e.g., \`user-auth\`, \`notification-service\`).

Each requirements.yaml should contain:
- **visionAlignment**: How this project contributes to the overall vision (1 sentence).
- **requirements**: An empty array (requirements will be gathered in the next step).

## Expected YAML Format

For each project file at \`desgin-duck/requirements/projects/<name>/requirements.yaml\`:

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

Edit the file: desgin-duck/requirements/projects/${projectName}/requirements.yaml

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
  globalValidationsYaml: string | null,
  rootContextYaml: string | null,
  projectContextYaml: string | null,
): string {
  const globalDesignBlock = globalDesignYaml
    ? `## Global Design Decisions\n\nThe following system-wide decisions have been made and must be respected:\n\n\`\`\`yaml\n${globalDesignYaml}\`\`\`\n`
    : "";

  const validationsBlock = globalValidationsYaml
    ? `## Global Validations\n\nAll decisions must account for these cross-cutting validations:\n\n\`\`\`yaml\n${globalValidationsYaml}\`\`\`\n`
    : "";

  const rootContextBlock = rootContextYaml
    ? `## Situational Context\n\n\`\`\`yaml\n${rootContextYaml}\`\`\`\n`
    : "";

  const projectContextBlock = projectContextYaml
    ? `## Project Context\n\nTechnical and system facts for this project:\n\n\`\`\`yaml\n${projectContextYaml}\`\`\`\n`
    : `## Project Context\n\nNo project-level context has been captured yet.\n`;

  return `# Design Brainstorm: ${projectName}

## Your Role

You are helping brainstorm design decisions for the "${projectName}" project.
For each key decision, propose multiple options with pros and cons.
Do NOT choose yet — present options for human review.

**Before brainstorming decisions, ask the user about their current system and technical situation.** Understanding the existing landscape is critical for making good design decisions. Ask about:
- Existing technology stack and infrastructure
- Current system architecture
- Deployment environment (cloud provider, on-prem, etc.)
- Performance or scale requirements
- Integration points with other systems

Capture the answers as context items in: desgin-duck/requirements/projects/${projectName}/context.yaml

## Vision Context

\`\`\`yaml
${visionYaml}\`\`\`

${rootContextBlock}${projectContextBlock}
## Project Requirements

\`\`\`yaml
${requirementsYaml}\`\`\`

${globalDesignBlock}${validationsBlock}

## Instructions

1. First, update project context items in desgin-duck/requirements/projects/${projectName}/context.yaml based on the user's answers.
2. Then, edit desgin-duck/requirements/projects/${projectName}/design.yaml

For each significant architectural or design decision:
1. Identify the topic and provide context.
2. Reference which requirements drive this decision.
3. Reference which context items are relevant via \`contextRefs\`.
4. Propose 2-3 options with pros and cons.
5. Leave \`chosen\` and \`chosenReason\` as null — the human decides.

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

Edit the file: desgin-duck/requirements/projects/${projectName}/design.yaml

For each decision where \`chosen\` is null:
1. Analyze all options against the requirements and vision.
2. Set \`chosen\` to the id of the recommended option.
3. Set \`chosenReason\` explaining why this option best serves the requirements.

Do NOT modify decisions that already have a \`chosen\` value unless specifically asked.

## Guidelines

- Justify choices in terms of user value, not just technical merit.
- Consider how choices interact with each other.
- Keep \`chosenReason\` to 1-2 sentences.
- **Prefer the simpler option** when two options deliver similar user value. Complexity should only win when it provides a clear, concrete advantage for a real requirement.
- **Avoid over-engineering.** Don't choose an option just because it's more "scalable" or "future-proof" unless a current requirement demands that scalability.

## Next Step

When you're done, suggest the user continue to the **implementation** phase to
create a phased plan, todos, and tests by running:
\`dd context implementation ${projectName}\`
`;
}

// ---------------------------------------------------------------------------
// Implementation Plan
// ---------------------------------------------------------------------------

export function implementationPrompt(
  visionYaml: string,
  projectName: string,
  requirementsYaml: string,
  designYaml: string | null,
  globalDesignYaml: string | null,
  globalValidationsYaml: string | null,
  rootContextYaml: string | null,
  projectContextYaml: string | null,
): string {
  const designBlock = designYaml
    ? `## Chosen Design Decisions\n\n\`\`\`yaml\n${designYaml}\`\`\`\n`
    : `## Design Decisions\n\nNo design decisions have been made yet for this project.\n`;

  const globalDesignBlock = globalDesignYaml
    ? `## Global Design Decisions\n\n\`\`\`yaml\n${globalDesignYaml}\`\`\`\n`
    : "";

  const validationsBlock = globalValidationsYaml
    ? `## Global Validations\n\nAll implementation must respect these cross-cutting validations:\n\n\`\`\`yaml\n${globalValidationsYaml}\`\`\`\n`
    : "";

  const rootContextBlock = rootContextYaml
    ? `## Situational Context\n\n\`\`\`yaml\n${rootContextYaml}\`\`\`\n`
    : "";

  const projectContextBlock = projectContextYaml
    ? `## Project Context\n\n\`\`\`yaml\n${projectContextYaml}\`\`\`\n`
    : "";

  return `# Implementation Plan: ${projectName}

## Your Role

You are helping create an implementation plan for the "${projectName}" project.
Produce a phased plan, actionable todos, project-specific validations, and test specifications.

## Vision Context

\`\`\`yaml
${visionYaml}\`\`\`

${rootContextBlock}${projectContextBlock}
## Project Requirements

\`\`\`yaml
${requirementsYaml}\`\`\`

${designBlock}${globalDesignBlock}${validationsBlock}

## Instructions

Edit the file: desgin-duck/requirements/projects/${projectName}/implementation.yaml

Create:
1. **plan**: A phased implementation plan (text).
2. **todos**: Actionable implementation tasks, each linked to requirements.
3. **validations**: Project-specific validation rules linked to requirements.
4. **tests**: Test specifications (unit, integration, e2e) linked to requirements.

## Expected YAML Format

\`\`\`yaml
plan: |
  Phase 1: ...
  Phase 2: ...
todos:
  - id: TODO-<PREFIX>-001
    description: "Implement..."
    status: pending
    requirementRefs: [PREFIX-001]
validations:
  - id: VAL-<PREFIX>-001
    description: "Must ensure..."
    requirementRefs: [PREFIX-001]
tests:
  - id: TEST-<PREFIX>-001
    description: "Verify that..."
    requirementRefs: [PREFIX-001]
    type: unit  # unit | integration | e2e
\`\`\`

## Guidelines

- Every requirement should be covered by at least one todo and one test.
- Order todos by dependency / implementation phase.
- Validations are runtime/deployment checks, not test assertions.
- Initial status for all todos should be "pending".
- Use requirement IDs consistently in \`requirementRefs\`.
- **Keep the plan lean.** Only include todos that directly serve a requirement. Avoid adding "nice-to-have" tasks, premature optimizations, or speculative infrastructure.
- **Favour simplicity.** Prefer straightforward implementations over elaborate architectures. Add complexity only when a requirement explicitly demands it.

## Next Step

When you're done, suggest the user optionally define **global validations** that
apply across all projects by running: \`dd context validations\`.
Otherwise, the design is complete and the user can start implementing based on the plan.
`;
}

// ---------------------------------------------------------------------------
// Global Validations
// ---------------------------------------------------------------------------

export function validationsPrompt(
  visionYaml: string,
  projectSummaries: string,
  currentValidationsYaml: string | null,
  rootContextYaml: string | null,
): string {
  const stateBlock = currentValidationsYaml
    ? `## Current Global Validations\n\n\`\`\`yaml\n${currentValidationsYaml}\`\`\`\n\nRefine or extend these validations.`
    : `## Current Global Validations\n\nNo global validations defined yet.`;

  const contextBlock = rootContextYaml
    ? `## Situational Context\n\n\`\`\`yaml\n${rootContextYaml}\`\`\`\n`
    : "";

  return `# Global Validations

## Your Role

You are helping define cross-cutting validation rules that apply to ALL projects.
These are quality gates, coding standards, and constraints that every project must respect.

## Vision Context

\`\`\`yaml
${visionYaml}\`\`\`

${contextBlock}
## Project Overview

${projectSummaries}

${stateBlock}

## Instructions

Edit the file: desgin-duck/requirements/implementation.yaml

Each validation needs:
- **id**: Unique identifier with VAL-GENERAL prefix (e.g., VAL-GENERAL-001).
- **description**: What must be true / what rule must be followed.
- **category**: Classification (e.g., linting, testing, security, performance, accessibility).

## Expected YAML Format

\`\`\`yaml
validations:
  - id: VAL-GENERAL-001
    description: "All code must..."
    category: linting
  - id: VAL-GENERAL-002
    description: "All tests must..."
    category: testing
\`\`\`

## Guidelines

- Focus on rules that apply universally, not project-specific ones.
- Categories help organize validations — use consistent category names.
- Be specific and actionable — avoid vague rules.
- Consider: linting, testing, security, performance, accessibility, documentation.

## Next Step

When you're done, let the user know the design process is complete. They can now
start implementing based on the plans in each project's \`implementation.yaml\`.
If any projects still need an implementation plan, suggest running:
\`dd context implementation <project-name>\`
`;
}
