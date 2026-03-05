import type {
  Vision,
  ContextDocument,
  GlobalDesign,
  ProjectRequirements,
  PlaygroundRequirements,
  ProjectDesign,
  Decision,
  DesignOption,
} from "../domain/requirements/requirement";

/** Data-only snapshot of the store state needed for export. */
export interface DesignDocSnapshot {
  vision: Vision | null;
  rootContext: ContextDocument | null;
  globalDesign: GlobalDesign | null;
  projects: Record<string, ProjectRequirements>;
  projectContexts: Record<string, ContextDocument>;
  designs: Record<string, ProjectDesign>;
  playgrounds: Record<string, PlaygroundRequirements>;
  playgroundContexts: Record<string, ContextDocument>;
  playgroundDesigns: Record<string, ProjectDesign>;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function renderVision(vision: Vision): string {
  const lines: string[] = [];
  if (vision.vision) {
    lines.push(`**Vision:** ${vision.vision}`);
    lines.push("");
  }
  if (vision.mission) {
    lines.push(`**Mission:** ${vision.mission}`);
    lines.push("");
  }
  if (vision.problem) {
    lines.push(`**Core Problem:** ${vision.problem}`);
  }
  if (lines.length === 0) {
    lines.push("*No vision defined yet.*");
  }
  return lines.join("\n");
}

function renderContextTable(ctx: ContextDocument): string {
  if (ctx.contexts.length === 0) return "";
  const lines: string[] = [];
  lines.push("| ID | Description |");
  lines.push("| --- | --- |");
  for (const item of ctx.contexts) {
    lines.push(`| ${item.id} | ${item.description} |`);
  }
  return lines.join("\n");
}

function renderOption(opt: DesignOption, indent: string = ""): string {
  const lines: string[] = [];
  lines.push(`${indent}- **${opt.title}** — ${opt.description}`);
  if (opt.pros.length > 0) {
    lines.push(`${indent}  - Pros: ${opt.pros.join("; ")}`);
  }
  if (opt.cons.length > 0) {
    lines.push(`${indent}  - Cons: ${opt.cons.join("; ")}`);
  }
  return lines.join("\n");
}

function renderDecision(d: Decision): string {
  const lines: string[] = [];
  const status = d.chosen ? "Decided" : "Pending";
  lines.push(`#### ${d.topic}`);
  lines.push("");
  lines.push(`**Category:** ${d.category} | **Status:** ${status}`);
  lines.push("");
  lines.push(`**Context:** ${d.context}`);

  if (d.requirementRefs.length > 0) {
    lines.push("");
    lines.push(`**Requirement refs:** ${d.requirementRefs.join(", ")}`);
  }
  if (d.contextRefs && d.contextRefs.length > 0) {
    lines.push("");
    lines.push(`**Context refs:** ${d.contextRefs.join(", ")}`);
  }
  if (d.globalDecisionRefs && d.globalDecisionRefs.length > 0) {
    lines.push("");
    lines.push(`**Global decision refs:** ${d.globalDecisionRefs.join(", ")}`);
  }
  if (d.parentDecisionRef) {
    lines.push("");
    lines.push(`**Parent decision:** ${d.parentDecisionRef}`);
  }
  if (d.notes) {
    lines.push("");
    lines.push(`**Notes:** ${d.notes}`);
  }

  if (d.options.length > 0) {
    lines.push("");
    if (d.chosen) {
      const chosenOpt = d.options.find((o) => o.id === d.chosen);
      const others = d.options.filter((o) => o.id !== d.chosen);

      if (chosenOpt) {
        lines.push(`**Chosen: ${chosenOpt.title}** — ${chosenOpt.description}`);
        if (chosenOpt.pros.length > 0) {
          lines.push(`- Pros: ${chosenOpt.pros.join("; ")}`);
        }
        if (chosenOpt.cons.length > 0) {
          lines.push(`- Cons: ${chosenOpt.cons.join("; ")}`);
        }
        if (d.chosenReason) {
          lines.push("");
          lines.push(`**Reason:** ${d.chosenReason}`);
        }
      }

      if (others.length > 0) {
        lines.push("");
        lines.push("<details>");
        lines.push("<summary>Other options considered</summary>");
        lines.push("");
        for (const opt of others) {
          lines.push(renderOption(opt));
        }
        lines.push("");
        lines.push("</details>");
      }
    } else {
      lines.push("**Options:**");
      lines.push("");
      for (const opt of d.options) {
        lines.push(renderOption(opt));
      }
    }
  }

  return lines.join("\n");
}

function renderDesignSection(design: ProjectDesign): string {
  const lines: string[] = [];
  if (design.notes) {
    lines.push(`> ${design.notes}`);
    lines.push("");
  }
  for (const d of design.decisions) {
    lines.push(renderDecision(d));
    lines.push("");
  }
  return lines.join("\n");
}

function renderRequirementsTable(reqs: { id: string; description: string; userValue: string }[]): string {
  if (reqs.length === 0) return "";
  const lines: string[] = [];
  lines.push("| ID | Description | User Value |");
  lines.push("| --- | --- | --- |");
  for (const r of reqs) {
    lines.push(`| ${r.id} | ${r.description} | ${r.userValue} |`);
  }
  return lines.join("\n");
}

function renderProject(
  name: string,
  heading: string,
  reqs: ProjectRequirements,
  ctx: ContextDocument | undefined,
  design: ProjectDesign | undefined,
): string {
  const lines: string[] = [];
  lines.push(heading);
  lines.push("");
  lines.push(`**Vision Alignment:** ${reqs.visionAlignment}`);

  if (ctx && ctx.contexts.length > 0) {
    lines.push("");
    lines.push("**Context:**");
    lines.push("");
    lines.push(renderContextTable(ctx));
  }

  if (reqs.requirements.length > 0) {
    lines.push("");
    lines.push("**Requirements:**");
    lines.push("");
    lines.push(renderRequirementsTable(reqs.requirements));
  }

  if (design && design.decisions.length > 0) {
    lines.push("");
    lines.push("**Design Decisions:**");
    lines.push("");
    lines.push(renderDesignSection(design));
  }

  return lines.join("\n");
}

function renderPlayground(
  name: string,
  heading: string,
  reqs: PlaygroundRequirements,
  ctx: ContextDocument | undefined,
  design: ProjectDesign | undefined,
): string {
  const lines: string[] = [];
  lines.push(heading);
  lines.push("");
  lines.push(`**Problem Statement:** ${reqs.problemStatement}`);

  if (ctx && ctx.contexts.length > 0) {
    lines.push("");
    lines.push("**Context:**");
    lines.push("");
    lines.push(renderContextTable(ctx));
  }

  if (reqs.requirements.length > 0) {
    lines.push("");
    lines.push("**Requirements:**");
    lines.push("");
    lines.push(renderRequirementsTable(reqs.requirements));
  }

  if (design && design.decisions.length > 0) {
    lines.push("");
    lines.push("**Design Decisions:**");
    lines.push("");
    lines.push(renderDesignSection(design));
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Main export function
// ---------------------------------------------------------------------------

export function generateDesignDocMarkdown(snapshot: DesignDocSnapshot): string {
  const sections: string[] = [];
  let sectionNum = 1;

  // Title
  const title = snapshot.vision?.productName || "Untitled Project";
  sections.push(`# ${title} - Design Document`);
  sections.push(`> Generated from Design Duck on ${new Date().toLocaleDateString()}`);
  sections.push("");

  // 1. Vision & Mission
  if (snapshot.vision) {
    sections.push(`## ${sectionNum}. Vision & Mission`);
    sections.push("");
    sections.push(renderVision(snapshot.vision));
    sections.push("");
    sectionNum++;
  }

  // 2. Context
  if (snapshot.rootContext && snapshot.rootContext.contexts.length > 0) {
    sections.push(`## ${sectionNum}. Context`);
    sections.push("");
    sections.push(renderContextTable(snapshot.rootContext));
    sections.push("");
    sectionNum++;
  }

  // 3. High-Level Design Decisions
  if (snapshot.globalDesign && snapshot.globalDesign.decisions.length > 0) {
    sections.push(`## ${sectionNum}. High-Level Design Decisions`);
    sections.push("");
    sections.push(renderDesignSection(snapshot.globalDesign));
    sectionNum++;
  }

  // 4. Projects
  const projectNames = Object.keys(snapshot.projects);
  if (projectNames.length > 0) {
    const projectSectionNum = sectionNum;
    sections.push(`## ${sectionNum}. Projects`);
    sections.push("");
    sectionNum++;

    projectNames.forEach((name, idx) => {
      const heading = `### ${projectSectionNum}.${idx + 1} ${name}`;
      sections.push(renderProject(
        name,
        heading,
        snapshot.projects[name],
        snapshot.projectContexts[name],
        snapshot.designs[name],
      ));
      sections.push("");
    });
  }

  // 5. Playgrounds
  const playgroundNames = Object.keys(snapshot.playgrounds);
  if (playgroundNames.length > 0) {
    const playgroundSectionNum = sectionNum;
    sections.push(`## ${sectionNum}. Playgrounds`);
    sections.push("");
    sectionNum++;

    playgroundNames.forEach((name, idx) => {
      const heading = `### ${playgroundSectionNum}.${idx + 1} ${name}`;
      sections.push(renderPlayground(
        name,
        heading,
        snapshot.playgrounds[name],
        snapshot.playgroundContexts[name],
        snapshot.playgroundDesigns[name],
      ));
      sections.push("");
    });
  }

  // Footer
  sections.push("---");
  sections.push("*Generated by Design Duck*");

  return sections.join("\n");
}
