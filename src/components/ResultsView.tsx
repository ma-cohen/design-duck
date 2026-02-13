/**
 * Renders a clean, read-only summary of chosen results for a project.
 * Shows requirements compactly and highlights decided design decisions
 * with their chosen options and reasoning.
 */

import type {
  ProjectRequirements,
  ProjectDesign,
} from "../domain/requirements/requirement";
import { RequirementCard } from "./RequirementCard";

export interface ResultsViewProps {
  project: ProjectRequirements;
  design: ProjectDesign | null;
  onViewBrainstorm?: () => void;
}

export function ResultsView({ project, design, onViewBrainstorm }: ResultsViewProps) {
  const decidedDecisions = design?.decisions.filter((d) => d.chosen !== null) ?? [];
  const pendingDecisions = design?.decisions.filter((d) => d.chosen === null) ?? [];

  return (
    <div data-testid="results-view">
      {/* Requirements (read-only) */}
      <div className="mb-8">
        <h4 className="mb-4 text-base font-semibold text-slate-200">Requirements</h4>
        {project.requirements.length === 0 ? (
          <p className="text-base text-slate-400">No requirements yet.</p>
        ) : (
          <div className="grid gap-4" data-testid="results-requirements">
            {project.requirements.map((req) => (
              <RequirementCard key={req.id} requirement={req} />
            ))}
          </div>
        )}
      </div>

      {/* Decided design decisions */}
      {decidedDecisions.length > 0 && (
        <div className="mb-8">
          <h4 className="mb-4 text-base font-semibold text-slate-200">Design Decisions</h4>
          <div className="grid gap-5" data-testid="results-decided">
            {decidedDecisions.map((dec) => {
              const chosenOption = dec.options.find((o) => o.id === dec.chosen);
              return (
                <div
                  key={dec.id}
                  className="rounded-lg border border-green-800 bg-green-950/40 p-6 shadow-sm"
                  data-testid={`result-decision-${dec.id}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <h5 className="text-base font-bold text-slate-50">{dec.topic}</h5>
                    <span className="rounded-full bg-green-900 px-2.5 py-0.5 text-sm font-medium text-green-200">
                      Decided
                    </span>
                  </div>

                  {chosenOption && (
                    <div className="mt-4 rounded-md border border-green-800/50 bg-green-950/60 px-5 py-4">
                      <p className="text-base font-medium text-green-200">
                        {chosenOption.title}
                      </p>
                      <p className="mt-1.5 text-base leading-relaxed text-slate-300">
                        {chosenOption.description}
                      </p>
                    </div>
                  )}

                  {dec.chosenReason && (
                    <div className="mt-4">
                      <p className="text-base text-slate-300">
                        <span className="font-medium text-green-200">Reason: </span>
                        {dec.chosenReason}
                      </p>
                    </div>
                  )}

                  {onViewBrainstorm && (
                    <button
                      type="button"
                      onClick={onViewBrainstorm}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                      data-testid={`view-brainstorm-${dec.id}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                      See brainstorm details
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Pending decisions */}
      {pendingDecisions.length > 0 && (
        <div className="mb-8">
          <h4 className="mb-4 text-base font-semibold text-slate-200">Pending Decisions</h4>
          <div className="grid gap-4" data-testid="results-pending">
            {pendingDecisions.map((dec) => (
              <div
                key={dec.id}
                className="rounded-lg border border-slate-600 bg-slate-800/50 p-5 shadow-sm"
                data-testid={`result-pending-${dec.id}`}
              >
                <div className="flex items-center gap-2">
                  <h5 className="text-base font-medium text-slate-200">{dec.topic}</h5>
                  <span className="rounded-full bg-amber-900/60 px-2.5 py-0.5 text-sm font-medium text-amber-200">
                    Pending
                  </span>
                </div>
                {onViewBrainstorm && (
                  <button
                    type="button"
                    onClick={onViewBrainstorm}
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
                    data-testid={`view-brainstorm-pending-${dec.id}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                    See brainstorm details
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No design data */}
      {!design && (
        <p className="text-base text-slate-400 italic">No design decisions yet.</p>
      )}
      {design && design.decisions.length === 0 && (
        <p className="text-base text-slate-400 italic">No design decisions yet.</p>
      )}
    </div>
  );
}
