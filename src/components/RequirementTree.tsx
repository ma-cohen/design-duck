/**
 * Renders the full requirements view: vision header + per-project sections.
 * Supports two modes:
 *   - Home view (no project selected): vision header + grid of project cards
 *   - Detail view (project selected): full project section with requirements & design
 */

import type { Vision, ProjectRequirements, PlaygroundRequirements, ProjectDesign, GlobalDesign, ContextDocument, GeneralValidations, ProjectImplementation } from "../domain/requirements/requirement";
import { useRequirementsStore } from "../stores/requirements-store";
import { VisionHeader } from "./VisionHeader";
import { ContextSection } from "./ContextSection";
import { GlobalDesignSection } from "./GlobalDesignSection";
import { ProjectSection } from "./ProjectSection";
import { ProjectCard } from "./ProjectCard";
import { PlaygroundCard } from "./PlaygroundCard";
import { PlaygroundSection } from "./PlaygroundSection";
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
  playgrounds?: Record<string, PlaygroundRequirements>;
  playgroundContexts?: Record<string, ContextDocument>;
  playgroundDesigns?: Record<string, ProjectDesign>;
  playgroundImplementations?: Record<string, ProjectImplementation>;
  loading: boolean;
  error: string | null;
  selectedProject: string | null;
  onSelectProject: (name: string | null) => void;
  selectedPlayground?: string | null;
  onSelectPlayground?: (name: string | null) => void;
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
  playgrounds = {},
  playgroundContexts = {},
  playgroundDesigns = {},
  playgroundImplementations = {},
  loading,
  error,
  selectedProject,
  onSelectProject,
  selectedPlayground = null,
  onSelectPlayground,
}: RequirementTreeProps) {
  const deleteProject = useRequirementsStore((s) => s.deleteProject);
  const deletePlayground = useRequirementsStore((s) => s.deletePlayground);
  const saveRootContext = useRequirementsStore((s) => s.saveRootContext);
  const projectNames = Object.keys(projects).sort();
  const playgroundNames = Object.keys(playgrounds).sort();

  console.debug(
    `[design-duck:ui] Rendering RequirementTree: ${projectNames.length} project(s), selected=${selectedProject}`,
  );

  const handleDeleteProject = async (name: string) => {
    await deleteProject(name);
    onSelectProject(null);
  };

  const handleDeletePlayground = async (name: string) => {
    await deletePlayground(name);
    onSelectPlayground?.(null);
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

  // ---------- Detail view: single playground ----------
  if (selectedPlayground && playgrounds[selectedPlayground]) {
    return (
      <div data-testid="playground-detail-view">
        <PlaygroundSection
          playgroundName={selectedPlayground}
          playground={playgrounds[selectedPlayground]}
          playgroundContext={playgroundContexts[selectedPlayground] ?? null}
          design={playgroundDesigns[selectedPlayground] ?? null}
          implementation={playgroundImplementations[selectedPlayground] ?? null}
          onDeletePlayground={handleDeletePlayground}
        />
      </div>
    );
  }

  // ---------- Home view: vision + project card grid + playgrounds ----------
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

      {/* Playgrounds section */}
      {playgroundNames.length > 0 && (
        <div className="mt-10" data-testid="playgrounds-section">
          <div className="mb-4 flex items-center gap-3">
            <h2 className="text-xl font-bold text-slate-50">Playgrounds</h2>
            <span className="inline-flex items-center rounded-full bg-amber-900/40 px-2.5 py-0.5 text-xs font-medium text-amber-300">
              Isolated
            </span>
          </div>
          <p className="mb-5 text-base text-slate-400">
            Standalone problem explorations — not tied to the product vision.
          </p>
          <div
            className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
            data-testid="playgrounds-grid"
          >
            {playgroundNames.map((name) => (
              <PlaygroundCard
                key={name}
                playgroundName={name}
                playground={playgrounds[name]}
                design={playgroundDesigns[name] ?? null}
                onClick={() => onSelectPlayground?.(name)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
