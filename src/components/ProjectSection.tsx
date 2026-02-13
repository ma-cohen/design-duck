/**
 * Renders a project's requirements with its vision alignment statement.
 */

import type { ProjectRequirements } from "../domain/requirements/requirement";
import { RequirementCard } from "./RequirementCard";

export interface ProjectSectionProps {
  projectName: string;
  project: ProjectRequirements;
}

export function ProjectSection({ projectName, project }: ProjectSectionProps) {
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
    </section>
  );
}
