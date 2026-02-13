/**
 * Renders a single requirement as a card.
 */

import type { Requirement } from "../domain/requirements/requirement";

export interface RequirementCardProps {
  requirement: Requirement;
}

export function RequirementCard({ requirement }: RequirementCardProps) {
  const { id, description, userValue } = requirement;

  console.debug(`[design-duck:ui] Rendering RequirementCard: ${id}`);

  return (
    <article
      className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      data-testid={`requirement-card-${id}`}
    >
      <span className="mb-2 block text-xs font-medium tracking-wide text-gray-400 uppercase">
        {id}
      </span>

      <h3 className="mb-2 text-sm font-semibold leading-snug text-gray-900">
        {description}
      </h3>

      <p className="text-sm leading-relaxed text-gray-500">
        {userValue}
      </p>
    </article>
  );
}
