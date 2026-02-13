/**
 * Renders the full requirements view: vision header + per-project sections.
 * Supports two modes:
 *   - Home view (no project selected): vision header + grid of project cards
 *   - Detail view (project selected): full project section with requirements & design
 */

import type { Vision, ProjectRequirements, ProjectDesign } from "../domain/requirements/requirement";
import { useRequirementsStore } from "../stores/requirements-store";
import { VisionHeader } from "./VisionHeader";
import { ProjectSection } from "./ProjectSection";
import { ProjectCard } from "./ProjectCard";

export interface RequirementTreeProps {
  vision: Vision | null;
  projects: Record<string, ProjectRequirements>;
  designs?: Record<string, ProjectDesign>;
  loading: boolean;
  error: string | null;
  selectedProject: string | null;
  onSelectProject: (name: string | null) => void;
}

export function RequirementTree({
  vision,
  projects,
  designs = {},
  loading,
  error,
  selectedProject,
  onSelectProject,
}: RequirementTreeProps) {
  const deleteProject = useRequirementsStore((s) => s.deleteProject);
  const projectNames = Object.keys(projects).sort();

  console.debug(
    `[design-duck:ui] Rendering RequirementTree: ${projectNames.length} project(s), selected=${selectedProject}`,
  );

  const handleDeleteProject = async (name: string) => {
    await deleteProject(name);
    onSelectProject(null);
  };

  if (loading) {
    return (
      <div className="py-12 text-center" data-testid="tree-loading">
        <p className="text-sm text-gray-500">Loading requirements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-red-200 bg-red-50 px-5 py-4"
        data-testid="tree-error"
      >
        <p className="text-sm font-medium text-red-800">
          Failed to load requirements
        </p>
        <p className="mt-1 text-sm text-red-600">{error}</p>
      </div>
    );
  }

  if (!vision && projectNames.length === 0) {
    return (
      <div className="py-12 text-center" data-testid="tree-empty">
        <p className="text-sm text-gray-500">
          No requirements found. Run{" "}
          <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">
            design-duck init
          </code>{" "}
          to get started.
        </p>
      </div>
    );
  }

  // ---------- Detail view: single project ----------
  if (selectedProject && projects[selectedProject]) {
    return (
      <div data-testid="project-detail-view">
        <ProjectSection
          projectName={selectedProject}
          project={projects[selectedProject]}
          design={designs[selectedProject] ?? null}
          onDeleteProject={handleDeleteProject}
        />
      </div>
    );
  }

  // ---------- Home view: vision + project card grid ----------
  return (
    <div data-testid="requirement-tree">
      <VisionHeader vision={vision} />

      {projectNames.length === 0 ? (
        <div className="py-8 text-center" data-testid="no-projects">
          <p className="text-sm text-gray-500">
            No projects found. Add a project directory under{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono">
              requirements/projects/
            </code>
          </p>
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
          data-testid="projects-grid"
        >
          {projectNames.map((name) => (
            <ProjectCard
              key={name}
              projectName={name}
              project={projects[name]}
              design={designs[name] ?? null}
              onClick={() => onSelectProject(name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
