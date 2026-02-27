/**
 * Renders a single design decision with its options, linked requirements, and chosen status.
 * Collapsed by default showing only the topic and chosen option name.
 * Expandable to show chosen option, alternatives, and notes in a single flat view.
 */

import { useState } from "react";
import type { Decision, DecisionCategory, DesignOption } from "../domain/requirements/requirement";
import { OptionCard } from "./OptionCard";
import { EditModal, type FieldDefinition } from "./EditModal";

/** Human-readable labels for each decision category. */
const CATEGORY_LABELS: Record<DecisionCategory, string> = {
  product: "Product",
  architecture: "Architecture",
  technology: "Technology",
  data: "Data",
  testing: "Testing",
  infrastructure: "Infrastructure",
  other: "Other",
};

export interface DecisionCardProps {
  decision: Decision;
  /** Start with the detail section expanded (default: collapsed). */
  defaultExpanded?: boolean;
  onEdit?: (decision: Decision) => void;
  onDelete?: (decisionId: string) => void;
  onSaveOptions?: (options: DesignOption[]) => void;
  onChooseOption?: (optionId: string | null, reason: string | null) => void;
  onSaveNotes?: (notes: string | null) => void;
  /** Propagate this decision to the global design level. Only shown when decision has a chosen option. */
  onPropagate?: (decisionId: string) => void;
}

const OPTION_FIELDS: FieldDefinition[] = [
  { key: "id", label: "ID", placeholder: "e.g. option-1" },
  { key: "title", label: "Title", placeholder: "Option name" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Describe this option..." },
  { key: "pros", label: "Pros", type: "string-list", placeholder: "Add a pro..." },
  { key: "cons", label: "Cons", type: "string-list", placeholder: "Add a con..." },
];

export function DecisionCard({ decision, defaultExpanded = false, onEdit, onDelete, onSaveOptions, onChooseOption, onSaveNotes, onPropagate }: DecisionCardProps) {
  const { id, topic, context, category, requirementRefs, contextRefs = [], parentDecisionRef, options, chosen, chosenReason, notes } = decision;

  const [expanded, setExpanded] = useState(defaultExpanded);
  const [editingOption, setEditingOption] = useState<DesignOption | null>(null);
  const [addingOption, setAddingOption] = useState(false);
  const [confirmDeleteOption, setConfirmDeleteOption] = useState<string | null>(null);
  const [choosingOptionId, setChoosingOptionId] = useState<string | null>(null);
  const [chooseReason, setChooseReason] = useState("");
  const [editingNotes, setEditingNotes] = useState(false);

  // Split options into chosen and alternatives
  const chosenOption = chosen ? options.find((o) => o.id === chosen) ?? null : null;
  const alternativeOptions = chosen ? options.filter((o) => o.id !== chosen) : options;
  const hasChosen = chosenOption !== null;

  console.debug(`[design-duck:ui] Rendering DecisionCard: ${id}`);

  const handleSaveOption = (values: Record<string, string | string[]>) => {
    const updated: DesignOption = {
      id: values.id as string,
      title: values.title as string,
      description: values.description as string,
      pros: values.pros as string[],
      cons: values.cons as string[],
    };

    let newOptions: DesignOption[];
    if (editingOption) {
      newOptions = options.map((o) => (o.id === editingOption.id ? updated : o));
    } else {
      newOptions = [...options, updated];
    }

    onSaveOptions?.(newOptions);
    setEditingOption(null);
    setAddingOption(false);
  };

  const handleDeleteOption = (optId: string) => {
    onSaveOptions?.(options.filter((o) => o.id !== optId));
    setConfirmDeleteOption(null);
  };

  const handleChooseRequest = (optionId: string) => {
    if (optionId === "") {
      // Undo choice
      onChooseOption?.(null, null);
    } else {
      // Show reason modal
      setChoosingOptionId(optionId);
      setChooseReason("");
    }
  };

  const handleConfirmChoice = () => {
    if (choosingOptionId) {
      onChooseOption?.(choosingOptionId, chooseReason.trim() || null);
      setChoosingOptionId(null);
      setChooseReason("");
    }
  };

  const handleSaveDecisionNotes = (values: Record<string, string | string[]>) => {
    const newNotes = (values.notes as string).trim() || null;
    onSaveNotes?.(newNotes);
    setEditingNotes(false);
  };

  return (
    <>
      <div
        className="rounded-lg border border-slate-600 bg-slate-700 shadow-sm"
        data-testid={`decision-card-${id}`}
      >
        {/* Collapsed summary row — always visible */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between px-5 py-3.5 text-left cursor-pointer hover:bg-slate-600/60 rounded-lg transition-colors"
          data-testid={`decision-toggle-${id}`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <h4 className="text-base font-bold text-slate-50 truncate">{topic}</h4>
            {hasChosen ? (
              <span className="shrink-0 rounded-full bg-green-900/40 border border-green-600/30 px-2.5 py-0.5 text-xs font-medium text-green-300">
                {chosenOption.title}
              </span>
            ) : (
              <span className="shrink-0 rounded-full bg-amber-900/40 border border-amber-600/30 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                Pending
              </span>
            )}
            {parentDecisionRef && (
              <span
                className="shrink-0 rounded-full bg-indigo-900/40 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-medium text-indigo-300"
                title={`Triggered by ${parentDecisionRef}`}
              >
                &#8618; {parentDecisionRef}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-3">
            {(onEdit || onDelete || onPropagate) && (
              <div className="flex items-center gap-1">
                {onPropagate && hasChosen && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onPropagate(id); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onPropagate(id); } }}
                    className="rounded p-1 text-slate-400 hover:bg-indigo-900/30 hover:text-indigo-400 transition-colors cursor-pointer"
                    title="Propagate to global"
                    data-testid={`propagate-decision-${id}`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </span>
                )}
                {onEdit && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => { e.stopPropagation(); onEdit(decision); }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onEdit(decision); } }}
                    className="rounded p-1 text-slate-400 hover:bg-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
                    title="Edit decision"
                    data-testid={`edit-decision-${id}`}
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
                    className="rounded p-1 text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors cursor-pointer"
                    title="Delete decision"
                    data-testid={`delete-decision-${id}`}
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
            <p className="mb-4 text-base leading-relaxed text-slate-300">{context}</p>

            {requirementRefs.length > 0 && (
              <div className="mb-4" data-testid={`decision-refs-${id}`}>
                <span className="text-sm font-medium text-slate-300 uppercase">
                  Addresses:{" "}
                </span>
                {requirementRefs.map((ref) => (
                  <span
                    key={ref}
                    className="mr-2 inline-block rounded bg-blue-900/30 px-2.5 py-1 text-sm font-medium text-blue-200"
                  >
                    {ref}
                  </span>
                ))}
              </div>
            )}

            {contextRefs.length > 0 && (
              <div className="mb-4" data-testid={`decision-context-refs-${id}`}>
                <span className="text-sm font-medium text-slate-300 uppercase">
                  Context:{" "}
                </span>
                {contextRefs.map((ref) => (
                  <span
                    key={ref}
                    className="mr-2 inline-block rounded bg-amber-900/30 px-2.5 py-1 text-sm font-medium text-amber-200"
                  >
                    {ref}
                  </span>
                ))}
              </div>
            )}

            {/* Options header with add button */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-300 uppercase">Options</span>
              {onSaveOptions && (
                <button
                  type="button"
                  onClick={() => setAddingOption(true)}
                  className="inline-flex items-center gap-1.5 rounded border border-slate-500 bg-slate-600 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-500 transition-colors cursor-pointer"
                  data-testid={`add-option-${id}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Option
                </button>
              )}
            </div>

            {/* Content — flat layout for both chosen and pending decisions */}
            {hasChosen ? (
              <>
                {/* Chosen option */}
                <div className="grid gap-3" data-testid={`decision-options-${id}`}>
                  <OptionCard
                    key={chosenOption!.id}
                    option={chosenOption!}
                    isChosen
                    onEdit={onSaveOptions ? (o) => setEditingOption(o) : undefined}
                    onDelete={onSaveOptions ? (optId) => setConfirmDeleteOption(optId) : undefined}
                    onChoose={onChooseOption ? handleChooseRequest : undefined}
                  />
                  {chosenReason && (
                    <div
                      className="rounded-md bg-green-900/30 px-5 py-4"
                      data-testid={`decision-chosen-reason-${id}`}
                    >
                      <p className="text-base text-green-200">
                        <span className="font-medium">Reason: </span>
                        {chosenReason}
                      </p>
                    </div>
                  )}
                </div>

                {/* Alternatives */}
                <div className="mt-4 border-t border-slate-600 pt-4" data-testid={`decision-alternatives-${id}`}>
                  <span className="mb-3 block text-sm font-medium text-slate-300 uppercase">
                    Alternatives{alternativeOptions.length > 0 ? ` (${alternativeOptions.length})` : ""}
                  </span>
                  {alternativeOptions.length > 0 ? (
                    <div className="grid gap-3">
                      {alternativeOptions.map((opt) => (
                        <OptionCard
                          key={opt.id}
                          option={opt}
                          isChosen={false}
                          onEdit={onSaveOptions ? (o) => setEditingOption(o) : undefined}
                          onDelete={onSaveOptions ? (optId) => setConfirmDeleteOption(optId) : undefined}
                          onChoose={onChooseOption ? handleChooseRequest : undefined}
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">No alternative options.</p>
                  )}
                </div>

                {/* Notes */}
                <div className="mt-4 border-t border-slate-600 pt-4" data-testid={`decision-notes-${id}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300 uppercase">Research &amp; Notes</span>
                    {onSaveNotes && (
                      <button
                        type="button"
                        onClick={() => setEditingNotes(true)}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-500 bg-slate-600 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-500 transition-colors cursor-pointer"
                        data-testid={`edit-notes-${id}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        {notes ? "Edit Notes" : "Add Notes"}
                      </button>
                    )}
                  </div>
                  {notes ? (
                    <div className="rounded-lg border border-amber-600/40 bg-amber-900/30 px-5 py-4">
                      <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-100">
                        {notes}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      No notes yet. Add research, links, or analysis for this decision.
                    </p>
                  )}
                </div>
              </>
            ) : (
              /* Pending decisions: show flat options list + notes section below */
              <>
                <div className="grid gap-3" data-testid={`decision-options-${id}`}>
                  {options.map((opt) => (
                    <OptionCard
                      key={opt.id}
                      option={opt}
                      isChosen={chosen === opt.id}
                      onEdit={onSaveOptions ? (o) => setEditingOption(o) : undefined}
                      onDelete={onSaveOptions ? (optId) => setConfirmDeleteOption(optId) : undefined}
                      onChoose={onChooseOption ? handleChooseRequest : undefined}
                    />
                  ))}
                </div>

                {/* Notes section for pending decisions (no tabs) */}
                <div className="mt-4 border-t border-slate-600 pt-4" data-testid={`decision-notes-${id}`}>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium text-slate-300 uppercase">Research &amp; Notes</span>
                    {onSaveNotes && (
                      <button
                        type="button"
                        onClick={() => setEditingNotes(true)}
                        className="inline-flex items-center gap-1.5 rounded border border-slate-500 bg-slate-600 px-3 py-1.5 text-sm font-medium text-slate-300 hover:bg-slate-500 transition-colors cursor-pointer"
                        data-testid={`edit-notes-${id}`}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                        {notes ? "Edit Notes" : "Add Notes"}
                      </button>
                    )}
                  </div>
                  {notes ? (
                    <div className="rounded-lg border border-amber-600/40 bg-amber-900/30 px-5 py-4">
                      <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-100">
                        {notes}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-400 italic">
                      No notes yet. Add research, links, or analysis for this decision.
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Edit option modal */}
      {editingOption && (
        <EditModal
          title="Edit Option"
          fields={OPTION_FIELDS}
          initialValues={{
            id: editingOption.id,
            title: editingOption.title,
            description: editingOption.description,
            pros: editingOption.pros,
            cons: editingOption.cons,
          }}
          onSave={handleSaveOption}
          onClose={() => setEditingOption(null)}
        />
      )}

      {/* Add option modal */}
      {addingOption && (
        <EditModal
          title="Add Option"
          fields={OPTION_FIELDS}
          initialValues={{ pros: [], cons: [] }}
          onSave={handleSaveOption}
          onClose={() => setAddingOption(false)}
        />
      )}

      {/* Edit notes modal */}
      {editingNotes && (
        <EditModal
          title="Edit Research & Notes"
          fields={[
            { key: "notes", label: "Notes", type: "textarea", required: false, placeholder: "Research, links, analysis, or any context for this decision..." },
          ]}
          initialValues={{ notes: notes ?? "" }}
          onSave={handleSaveDecisionNotes}
          onClose={() => setEditingNotes(false)}
        />
      )}

      {/* Choose option reason modal */}
      {choosingOptionId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setChoosingOptionId(null); }}
          data-testid="choose-reason-backdrop"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-600 bg-slate-700 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-50">Choose Option</h3>
            <p className="mt-2 text-base text-slate-300">
              You are choosing <strong>{options.find((o) => o.id === choosingOptionId)?.title ?? choosingOptionId}</strong>.
            </p>
            <div className="mt-4">
              <label className="mb-1.5 block text-base font-medium text-slate-200">
                Reason <span className="text-slate-400">(optional)</span>
              </label>
              <textarea
                className="w-full rounded-md border border-slate-500 bg-slate-600 px-3 py-2.5 text-base text-slate-100 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder:text-slate-400"
                rows={3}
                placeholder="Why did you choose this option?"
                value={chooseReason}
                onChange={(e) => setChooseReason(e.target.value)}
                data-testid="choose-reason-input"
              />
            </div>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setChoosingOptionId(null)}
                className="rounded-md border border-slate-500 bg-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmChoice}
                className="rounded-md bg-green-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-green-700 transition-colors cursor-pointer"
                data-testid="confirm-choose-btn"
              >
                Confirm Choice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete option confirmation */}
      {confirmDeleteOption && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDeleteOption(null); }}
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-600 bg-slate-700 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-50">Delete Option</h3>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              Are you sure you want to delete option <strong>{confirmDeleteOption}</strong>?
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteOption(null)}
                className="rounded-md border border-slate-500 bg-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteOption(confirmDeleteOption)}
                className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
