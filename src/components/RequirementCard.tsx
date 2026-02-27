/**
 * Renders a single requirement as a collapsible card.
 * Collapsed by default showing only the ID and description.
 * Expandable to show user value and action buttons.
 */

import { useState } from "react";
import type { Requirement } from "../domain/requirements/requirement";

export interface RequirementCardProps {
  requirement: Requirement;
  onEdit?: (requirement: Requirement) => void;
  onDelete?: (requirementId: string) => void;
}

export function RequirementCard({ requirement, onEdit, onDelete }: RequirementCardProps) {
  const { id, description, userValue } = requirement;
  const [expanded, setExpanded] = useState(false);

  console.debug(`[design-duck:ui] Rendering RequirementCard: ${id}`);

  return (
    <article
      className="rounded-lg border border-slate-600 bg-slate-700 shadow-sm"
      data-testid={`requirement-card-${id}`}
    >
      {/* Collapsed summary row — always visible */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-5 py-3.5 text-left cursor-pointer hover:bg-slate-600/60 rounded-lg transition-colors"
        data-testid={`requirement-toggle-${id}`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="shrink-0 text-sm font-medium tracking-wide text-slate-400 uppercase">
            {id}
          </span>
          <h3 className="text-base font-semibold text-slate-50 truncate">{description}</h3>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-3">
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onEdit(requirement); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onEdit(requirement); } }}
                  className="rounded p-1.5 text-slate-400 hover:bg-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
                  title="Edit requirement"
                  data-testid={`edit-requirement-${id}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </span>
              )}
              {onDelete && (
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); onDelete(id); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onDelete(id); } }}
                  className="rounded p-1.5 text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors cursor-pointer"
                  title="Delete requirement"
                  data-testid={`delete-requirement-${id}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </span>
              )}
            </div>
          )}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Expanded detail content */}
      {expanded && (
        <div className="border-t border-slate-600 px-5 py-4">
          <p className="text-base leading-relaxed text-slate-300">
            {userValue}
          </p>
        </div>
      )}
    </article>
  );
}
