/**
 * Root application component for Design Duck UI.
 * Renders the main layout shell for viewing and managing requirements.
 */

import { useEffect } from "react";
import { useRequirementsStore } from "../stores/requirements-store";
import { RequirementTree } from "../components/RequirementTree";

export function App() {
  const {
    vision,
    projects,
    loading,
    error,
    loadFromFiles,
    startWatching,
    stopWatching,
  } = useRequirementsStore();

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
        <h1 className="text-xl font-semibold tracking-tight">Design Duck</h1>
        <p className="mt-1 text-sm text-gray-500">
          Vision-driven requirements management
        </p>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <RequirementTree
          vision={vision}
          projects={projects}
          loading={loading}
          error={error}
        />
      </main>
    </div>
  );
}
