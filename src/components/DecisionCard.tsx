/**
 * Renders a single design decision with its options, linked requirements, and chosen status.
 */

import type { Decision } from "../domain/requirements/requirement";
import { OptionCard } from "./OptionCard";

export interface DecisionCardProps {
  decision: Decision;
}

export function DecisionCard({ decision }: DecisionCardProps) {
  const { id, topic, context, requirementRefs, options, chosen, chosenReason } = decision;

  console.debug(`[design-duck:ui] Rendering DecisionCard: ${id}`);

  return (
    <div
      className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
      data-testid={`decision-card-${id}`}
    >
      <h4 className="mb-1 text-sm font-bold text-gray-900">{topic}</h4>

      <p className="mb-3 text-sm leading-relaxed text-gray-500">{context}</p>

      {requirementRefs.length > 0 && (
        <div className="mb-3" data-testid={`decision-refs-${id}`}>
          <span className="text-xs font-medium text-gray-400 uppercase">
            Addresses:{" "}
          </span>
          {requirementRefs.map((ref) => (
            <span
              key={ref}
              className="mr-1.5 inline-block rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700"
            >
              {ref}
            </span>
          ))}
        </div>
      )}

      <div className="grid gap-3" data-testid={`decision-options-${id}`}>
        {options.map((opt) => (
          <OptionCard key={opt.id} option={opt} isChosen={chosen === opt.id} />
        ))}
      </div>

      {chosen && chosenReason && (
        <div
          className="mt-3 rounded-md bg-green-50 px-4 py-3"
          data-testid={`decision-chosen-reason-${id}`}
        >
          <p className="text-sm text-green-800">
            <span className="font-medium">Reason: </span>
            {chosenReason}
          </p>
        </div>
      )}
    </div>
  );
}
