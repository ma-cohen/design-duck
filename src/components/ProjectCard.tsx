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
      className="group w-full cursor-pointer rounded-xl border border-slate-600 bg-slate-700 p-6 text-left shadow-sm transition-all hover:border-indigo-600 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 focus:ring-offset-slate-800"
      data-testid={`project-card-${projectName}`}
    >
      <h3 className="text-lg font-bold text-slate-50 group-hover:text-indigo-400 transition-colors">
        {projectName}
      </h3>

      <p className="mt-2 line-clamp-2 text-base leading-relaxed text-slate-300 italic">
        {project.visionAlignment}
      </p>

      <div className="mt-5 flex items-center gap-4">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-950 px-3 py-1 text-sm font-medium text-blue-200">
          {reqCount} requirement{reqCount !== 1 ? "s" : ""}
        </span>
        {decisionCount > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-950 px-3 py-1 text-sm font-medium text-purple-200">
            {decisionCount} decision{decisionCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </button>
  );
}
