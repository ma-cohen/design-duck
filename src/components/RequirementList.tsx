/**
 * Renders a list of requirements using RequirementCard.
 * Handles empty, loading, and error states.
 */

import type { Requirement } from "../domain/requirements/requirement";
import { RequirementCard } from "./RequirementCard";

export interface RequirementListProps {
  requirements: Requirement[];
  loading: boolean;
  error: string | null;
}

export function RequirementList({ requirements, loading, error }: RequirementListProps) {
  console.debug(
    `[design-duck:ui] Rendering RequirementList: ${requirements.length} items, loading=${loading}`,
  );

  if (loading) {
    return (
      <div className="py-16 text-center" data-testid="requirements-loading">
        <p className="text-base text-slate-300">Loading requirements...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-red-600/40 bg-red-900/30 px-6 py-5"
        data-testid="requirements-error"
      >
        <p className="text-base font-medium text-red-300">
          Failed to load requirements
        </p>
        <p className="mt-1.5 text-base text-red-400">{error}</p>
      </div>
    );
  }

  if (requirements.length === 0) {
    return (
      <div className="py-16 text-center" data-testid="requirements-empty">
        <p className="text-base text-slate-300">
          No requirements found. Add requirements to your project's{" "}
          <code className="rounded bg-slate-600 px-2 py-1 text-sm font-mono text-slate-200">
            requirements.yaml
          </code>{" "}
          to get started.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4" data-testid="requirements-list">
      {requirements.map((req) => (
        <RequirementCard key={req.id} requirement={req} />
      ))}
    </div>
  );
}
