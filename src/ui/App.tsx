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
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <header className="border-b border-gray-200 bg-white px-6 py-4 shadow-sm">
        <div className="mx-auto max-w-5xl flex items-center gap-3">
          {selectedProject && (
            <button
              type="button"
              onClick={() => setSelectedProject(null)}
              className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              {selectedProject ? selectedProject : "Design Duck"}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              {selectedProject
                ? "Project requirements & design"
                : "Vision-driven requirements management"}
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <RequirementTree
          vision={vision}
          projects={projects}
          designs={designs}
          loading={loading}
          error={error}
          selectedProject={selectedProject}
          onSelectProject={setSelectedProject}
        />
      </main>
    </div>
  );
}
