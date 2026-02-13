/**
 * Renders a single requirement as a card with edit and delete actions.
 */

import type { Requirement } from "../domain/requirements/requirement";

export interface RequirementCardProps {
  requirement: Requirement;
  onEdit?: (requirement: Requirement) => void;
  onDelete?: (requirementId: string) => void;
}

export function RequirementCard({ requirement, onEdit, onDelete }: RequirementCardProps) {
  const { id, description, userValue } = requirement;

  console.debug(`[design-duck:ui] Rendering RequirementCard: ${id}`);

  return (
    <article
      className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      data-testid={`requirement-card-${id}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-gray-400 uppercase">
          {id}
        </span>
        {(onEdit || onDelete) && (
          <div className="flex items-center gap-1">
            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(requirement)}
                className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-indigo-600 transition-colors cursor-pointer"
                title="Edit requirement"
                data-testid={`edit-requirement-${id}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(id)}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                title="Delete requirement"
                data-testid={`delete-requirement-${id}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>

      <h3 className="mb-2 text-sm font-semibold leading-snug text-gray-900">
        {description}
      </h3>

      <p className="text-sm leading-relaxed text-gray-500">
        {userValue}
      </p>
    </article>
  );
}
