/**
 * Renders a project's design decisions section.
 */

import type { ProjectDesign } from "../domain/requirements/requirement";
import { DecisionCard } from "./DecisionCard";

export interface DesignSectionProps {
  design: ProjectDesign;
}

export function DesignSection({ design }: DesignSectionProps) {
  console.debug(
    `[design-duck:ui] Rendering DesignSection with ${design.decisions.length} decisions`,
  );

  if (design.decisions.length === 0) {
    return (
      <div data-testid="design-section-empty">
        <h4 className="mb-2 text-sm font-semibold text-gray-700">
          Design Decisions
        </h4>
        <p className="text-sm text-gray-400">No design decisions yet.</p>
      </div>
    );
  }

  return (
    <div data-testid="design-section">
      <h4 className="mb-3 text-sm font-semibold text-gray-700">
        Design Decisions
      </h4>
      <div className="grid gap-4">
        {design.decisions.map((dec) => (
          <DecisionCard key={dec.id} decision={dec} />
        ))}
      </div>
    </div>
  );
}
