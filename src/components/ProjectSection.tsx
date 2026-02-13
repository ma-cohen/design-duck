/**
 * Renders a project's requirements with its vision alignment statement,
 * and optionally its design decisions.
 */

import type { ProjectRequirements, ProjectDesign } from "../domain/requirements/requirement";
import { RequirementCard } from "./RequirementCard";
import { DesignSection } from "./DesignSection";

export interface ProjectSectionProps {
  projectName: string;
  project: ProjectRequirements;
  design?: ProjectDesign | null;
}

export function ProjectSection({ projectName, project, design }: ProjectSectionProps) {
  console.debug(
    `[design-duck:ui] Rendering ProjectSection: ${projectName} with ${project.requirements.length} requirements`,
  );

  return (
    <section
      className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
      data-testid={`project-section-${projectName}`}
    >
      <div className="mb-4">
        <h3 className="text-base font-bold text-gray-900">{projectName}</h3>
        <p
          className="mt-1 text-sm leading-relaxed text-gray-500 italic"
          data-testid={`vision-alignment-${projectName}`}
        >
          {project.visionAlignment}
        </p>
      </div>

      {project.requirements.length === 0 ? (
        <p
          className="text-sm text-gray-400"
          data-testid={`empty-project-${projectName}`}
        >
          No requirements yet.
        </p>
      ) : (
        <div className="grid gap-4" data-testid={`requirements-list-${projectName}`}>
          {project.requirements.map((req) => (
            <RequirementCard key={req.id} requirement={req} />
          ))}
        </div>
      )}

      {design && (
        <div className="mt-5 border-t border-gray-100 pt-5">
          <DesignSection design={design} />
        </div>
      )}
    </section>
  );
}
