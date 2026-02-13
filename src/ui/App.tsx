/**
 * Root application component for Design Duck UI.
 * Renders the main layout shell for viewing and managing requirements.
 */

import { useEffect, useState } from "react";
import { useRequirementsStore } from "../stores/requirements-store";
import { RequirementTree } from "../components/RequirementTree";

export function App() {
  const {
    vision,
    projects,
    designs,
    generalValidations,
    implementations,
    loading,
    error,
    loadFromFiles,
    startWatching,
    stopWatching,
  } = useRequirementsStore();

  const [selectedProject, setSelectedProject] = useState<string | null>(null);

  useEffect(() => {
    console.log("[design-duck:ui] App mounted, loading requirements");
    loadFromFiles();
    startWatching();

    return () => {
      stopWatching();
    };
  }, [loadFromFiles, startWatching, stopWatching]);

  return (
    <div className="min-h-screen bg-slate-800 text-slate-100">
      <header className="border-b border-slate-600 bg-slate-700 px-8 py-5 shadow-sm">
        <div className="mx-auto max-w-6xl flex items-center gap-4">
          {selectedProject && (
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-500 bg-slate-600 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 focus:ring-offset-slate-800 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
              {selectedProject ? selectedProject : "Design Duck"}
            </h1>
            <p className="mt-1 text-base text-slate-300">
              {selectedProject
                ? "Project requirements & design"
                : "Vision-driven requirements management"}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-10">
        <RequirementTree
          vision={vision}
          projects={projects}
          designs={designs}
          generalValidations={generalValidations}
          implementations={implementations}
          loading={loading}
          error={error}
          selectedProject={selectedProject}
          onSelectProject={setSelectedProject}
        />
      </main>
    </div>
  );
}
