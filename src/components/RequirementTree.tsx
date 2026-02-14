/**
 * Renders the full requirements view: vision header + per-project sections.
 * Supports two modes:
 *   - Home view (no project selected): vision header + grid of project cards
 *   - Detail view (project selected): full project section with requirements & design
 */

import type { Vision, ProjectRequirements, ProjectDesign, GlobalDesign, ContextDocument, GeneralValidations, ProjectImplementation } from "../domain/requirements/requirement";
import { useRequirementsStore } from "../stores/requirements-store";
import { VisionHeader } from "./VisionHeader";
import { ContextSection } from "./ContextSection";
import { GlobalDesignSection } from "./GlobalDesignSection";
import { ProjectSection } from "./ProjectSection";
import { ProjectCard } from "./ProjectCard";
import { GeneralValidationsSection } from "./GeneralValidationsSection";

export interface RequirementTreeProps {
  vision: Vision | null;
  rootContext?: ContextDocument | null;
  globalDesign?: GlobalDesign | null;
  projects: Record<string, ProjectRequirements>;
  projectContexts?: Record<string, ContextDocument>;
  designs?: Record<string, ProjectDesign>;
  generalValidations?: GeneralValidations | null;
  implementations?: Record<string, ProjectImplementation>;
  loading: boolean;
  error: string | null;
  selectedProject: string | null;
  onSelectProject: (name: string | null) => void;
}

export function RequirementTree({
  vision,
  rootContext = null,
  globalDesign = null,
  projects,
  projectContexts = {},
  designs = {},
  generalValidations,
  implementations = {},
  loading,
  error,
  selectedProject,
  onSelectProject,
}: RequirementTreeProps) {
  const deleteProject = useRequirementsStore((s) => s.deleteProject);
  const saveRootContext = useRequirementsStore((s) => s.saveRootContext);
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
      <div className="py-16 text-center" data-testid="tree-loading">
        <p className="text-base text-slate-300">Loading requirements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-red-800 bg-red-900/30 px-6 py-5"
        data-testid="tree-error"
      >
        <p className="text-base font-medium text-red-300">
          Failed to load requirements
        </p>
        <p className="mt-1.5 text-base text-red-400">{error}</p>
      </div>
    );
  }

  if (!vision && projectNames.length === 0) {
    return (
      <div className="py-16 text-center" data-testid="tree-empty">
        <p className="text-base text-slate-300">
          No requirements found. Run{" "}
          <code className="rounded bg-slate-600 px-2 py-1 text-sm font-mono text-slate-200">
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
          projectContext={projectContexts[selectedProject] ?? null}
          design={designs[selectedProject] ?? null}
          implementation={implementations[selectedProject] ?? null}
          generalValidations={generalValidations ?? null}
          onDeleteProject={handleDeleteProject}
        />
      </div>
    );
  }

  // ---------- Home view: vision + project card grid ----------
  return (
    <div data-testid="requirement-tree">
      <VisionHeader vision={vision} />

      <ContextSection
        contextDoc={rootContext}
        onSave={saveRootContext}
        title="Context"
        description="Situational facts about your organization, team, and constraints that inform all decisions."
        testIdPrefix="root-context"
      />

      <GeneralValidationsSection generalValidations={generalValidations ?? null} />

      <GlobalDesignSection globalDesign={globalDesign} />

      {projectNames.length === 0 ? (
        <div className="py-10 text-center" data-testid="no-projects">
          <p className="text-base text-slate-300">
            No projects found. Add a project directory under{" "}
            <code className="rounded bg-slate-600 px-2 py-1 text-sm font-mono text-slate-200">
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
