/**
 * Renders a single design option with pros and cons.
 * Includes edit and delete buttons when callbacks are provided.
 */

import type { DesignOption } from "../domain/requirements/requirement";

export interface OptionCardProps {
  option: DesignOption;
  isChosen: boolean;
  onEdit?: (option: DesignOption) => void;
  onDelete?: (optionId: string) => void;
  onChoose?: (optionId: string) => void;
}

export function OptionCard({ option, isChosen, onEdit, onDelete, onChoose }: OptionCardProps) {
  const { id, title, description, pros, cons } = option;

  console.debug(`[design-duck:ui] Rendering OptionCard: ${id}`);

  return (
    <div
      className={`rounded-lg border p-5 ${
        isChosen
          ? "border-green-600/40 bg-green-900/30"
          : "border-slate-600 bg-slate-600"
      }`}
      data-testid={`option-card-${id}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <h5 className="text-base font-semibold text-slate-50">{title}</h5>
        {isChosen && (
          <span
            className="rounded-full bg-green-800/30 px-2.5 py-0.5 text-sm font-medium text-green-200"
            data-testid={`option-chosen-badge-${id}`}
          >
            chosen
          </span>
        )}
        <div className="ml-auto flex items-center gap-1.5">
          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(option)}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
              title="Edit option"
              data-testid={`edit-option-${id}`}
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
              className="rounded p-1.5 text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors cursor-pointer"
              title="Delete option"
              data-testid={`delete-option-${id}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <p className="mb-4 text-base leading-relaxed text-slate-300">{description}</p>

      {pros.length > 0 && (
        <ul className="mb-3 space-y-1.5" data-testid={`option-pros-${id}`}>
          {pros.map((pro, i) => (
            <li key={i} className="flex items-start gap-2 text-base text-green-300">
              <span className="mt-0.5 shrink-0 font-bold">+</span>
              <span>{pro}</span>
            </li>
          ))}
        </ul>
      )}

      {cons.length > 0 && (
        <ul className="space-y-1.5" data-testid={`option-cons-${id}`}>
          {cons.map((con, i) => (
            <li key={i} className="flex items-start gap-2 text-base text-red-300">
              <span className="mt-0.5 shrink-0 font-bold">-</span>
              <span>{con}</span>
            </li>
          ))}
        </ul>
      )}

      {onChoose && (
        <div className="mt-4 pt-3 border-t border-slate-600">
          {isChosen ? (
            <button
              type="button"
              onClick={() => onChoose("")}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-500 bg-slate-600 px-3 py-2 text-sm font-medium text-slate-300 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
              data-testid={`unchoose-option-${id}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Undo choice
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onChoose(id)}
              className="inline-flex items-center gap-1.5 rounded-md bg-green-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 transition-colors cursor-pointer"
              data-testid={`choose-option-${id}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Choose this option
            </button>
          )}
        </div>
      )}
    </div>
  );
}
