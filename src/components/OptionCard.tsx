/**
 * Renders a single design option with pros and cons.
 */

import type { DesignOption } from "../domain/requirements/requirement";

export interface OptionCardProps {
  option: DesignOption;
  isChosen: boolean;
}

export function OptionCard({ option, isChosen }: OptionCardProps) {
  const { id, title, description, pros, cons } = option;

  console.debug(`[design-duck:ui] Rendering OptionCard: ${id}`);

  return (
    <div
      className={`rounded-lg border p-4 ${
        isChosen
          ? "border-green-300 bg-green-50"
          : "border-gray-200 bg-gray-50"
      }`}
      data-testid={`option-card-${id}`}
    >
      <div className="mb-2 flex items-center gap-2">
        <h5 className="text-sm font-semibold text-gray-900">{title}</h5>
        {isChosen && (
          <span
            className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800"
            data-testid={`option-chosen-badge-${id}`}
          >
            chosen
          </span>
        )}
      </div>

      <p className="mb-3 text-sm text-gray-600">{description}</p>

      {pros.length > 0 && (
        <ul className="mb-2 space-y-1" data-testid={`option-pros-${id}`}>
          {pros.map((pro, i) => (
            <li key={i} className="flex items-start gap-1.5 text-sm text-green-700">
              <span className="mt-0.5 shrink-0">+</span>
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      )}

      {cons.length > 0 && (
        <ul className="space-y-1" data-testid={`option-cons-${id}`}>
          {cons.map((con, i) => (
            <li key={i} className="flex items-start gap-1.5 text-sm text-red-700">
              <span className="mt-0.5 shrink-0">-</span>
              <span>{con}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
