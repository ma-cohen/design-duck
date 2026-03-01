/**
 * Root application component for Design Duck UI.
 * Renders the main layout shell for viewing and managing requirements.
 */

import { useEffect, useState, useCallback } from "react";
import { useRequirementsStore } from "../stores/requirements-store";
import { RequirementTree } from "../components/RequirementTree";
import { generateDesignDocMarkdown } from "../export/markdown-export";
import { downloadMarkdown } from "../export/download";

export function App() {
  const {
    vision,
    rootContext,
    globalDesign,
    projects,
    projectContexts,
    designs,
    playgrounds,
    playgroundContexts,
    playgroundDesigns,
    loading,
    error,
    loadFromFiles,
    startWatching,
    stopWatching,
  } = useRequirementsStore();

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedPlayground, setSelectedPlayground] = useState<string | null>(null);

  const handleExport = useCallback(() => {
    const snapshot = {
      vision,
      rootContext,
      globalDesign,
      projects,
      projectContexts,
      designs,
      playgrounds,
      playgroundContexts,
      playgroundDesigns,
    };
    const md = generateDesignDocMarkdown(snapshot);
    const slug = (vision?.productName || "design-doc")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    downloadMarkdown(md, `${slug}-design-doc.md`);
  }, [
    vision, rootContext, globalDesign, projects, projectContexts, designs,
    playgrounds, playgroundContexts,
    playgroundDesigns,
  ]);

  useEffect(() => {
    const productName = vision?.productName;
    document.title = productName
      ? `${productName} - Design Duck`
      : "Design Duck";
  }, [vision?.productName]);

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
          {(selectedProject || selectedPlayground) && (
            <button
              type="button"
              onClick={() => { setSelectedProject(null); setSelectedPlayground(null); }}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-500 bg-slate-600 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 focus:ring-offset-slate-800 transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
          )}
          <div className="flex items-center gap-3">
            <span className="text-3xl" role="img" aria-label="duck">🦆</span>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
                Design Duck
              </h1>
              <p className="mt-0.5 text-sm text-slate-400">
                {selectedProject
                  ? selectedProject
                  : selectedPlayground
                    ? selectedPlayground
                    : vision?.productName
                      ? vision.productName
                      : "Vision-driven requirements management"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="ml-auto inline-flex items-center gap-1.5 rounded-md border border-slate-500 bg-slate-600 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 focus:ring-offset-slate-800 transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
            </svg>
            Export
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-8 py-10">
        <RequirementTree
          vision={vision}
          rootContext={rootContext}
          globalDesign={globalDesign}
          projects={projects}
          projectContexts={projectContexts}
          designs={designs}
          playgrounds={playgrounds}
          playgroundContexts={playgroundContexts}
          playgroundDesigns={playgroundDesigns}
          loading={loading}
          error={error}
          selectedProject={selectedProject}
          onSelectProject={(name) => { setSelectedProject(name); setSelectedPlayground(null); }}
          selectedPlayground={selectedPlayground}
          onSelectPlayground={(name) => { setSelectedPlayground(name); setSelectedProject(null); }}
        />
      </main>
    </div>
  );
}
