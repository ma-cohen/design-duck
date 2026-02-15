/**
 * Renders a clean, read-only summary of chosen results for a project.
 * Shows requirements compactly and design decisions as compact,
 * collapsible cards (same style as the HLD section).
 */

import type {
  ProjectRequirements,
  ProjectDesign,
} from "../domain/requirements/requirement";
import { RequirementCard } from "./RequirementCard";
import { DecisionCard } from "./DecisionCard";

export interface ResultsViewProps {
  project: ProjectRequirements;
  design: ProjectDesign | null;
  onViewBrainstorm?: () => void;
}

export function ResultsView({ project, design }: ResultsViewProps) {
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

      {/* Decided design decisions — compact collapsible cards */}
      {decidedDecisions.length > 0 && (
        <div className="mb-8">
          <h4 className="mb-4 text-base font-semibold text-slate-200">Design Decisions</h4>
          <div className="grid gap-3" data-testid="results-decided">
            {decidedDecisions.map((dec) => (
              <DecisionCard key={dec.id} decision={dec} />
            ))}
          </div>
        </div>
      )}

      {/* Pending decisions — compact collapsible cards */}
      {pendingDecisions.length > 0 && (
        <div className="mb-8">
          <h4 className="mb-4 text-base font-semibold text-slate-200">Pending Decisions</h4>
          <div className="grid gap-3" data-testid="results-pending">
            {pendingDecisions.map((dec) => (
              <DecisionCard key={dec.id} decision={dec} />
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
