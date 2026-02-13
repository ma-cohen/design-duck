/**
 * Compact clickable card that summarises a project.
 * Shown on the home view; clicking drills into the full project detail.
 */

import type { ProjectRequirements, ProjectDesign } from "../domain/requirements/requirement";

export interface ProjectCardProps {
  projectName: string;
  project: ProjectRequirements;
  design?: ProjectDesign | null;
  onClick: () => void;
}

export function ProjectCard({ projectName, project, design, onClick }: ProjectCardProps) {
  const reqCount = project.requirements.length;
  const decisionCount = design?.decisions.length ?? 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full cursor-pointer rounded-xl border border-gray-200 bg-white p-5 text-left shadow-sm transition-all hover:border-indigo-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2"
      data-testid={`project-card-${projectName}`}
    >
      <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-700 transition-colors">
        {projectName}
      </h3>

      <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-gray-500 italic">
        {project.visionAlignment}
      </p>

      <div className="mt-4 flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          {reqCount} requirement{reqCount !== 1 ? "s" : ""}
        </span>
        {decisionCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
            {decisionCount} decision{decisionCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </button>
  );
}
