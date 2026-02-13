/**
 * Renders a single design decision with its options, linked requirements, and chosen status.
 * Includes edit/delete actions and option management.
 */

import { useState } from "react";
import type { Decision, DesignOption } from "../domain/requirements/requirement";
import { OptionCard } from "./OptionCard";
import { EditModal, type FieldDefinition } from "./EditModal";

export interface DecisionCardProps {
  decision: Decision;
  onEdit?: (decision: Decision) => void;
  onDelete?: (decisionId: string) => void;
  onSaveOptions?: (options: DesignOption[]) => void;
  onChooseOption?: (optionId: string | null, reason: string | null) => void;
}

const OPTION_FIELDS: FieldDefinition[] = [
  { key: "id", label: "ID", placeholder: "e.g. option-1" },
  { key: "title", label: "Title", placeholder: "Option name" },
  { key: "description", label: "Description", type: "textarea", placeholder: "Describe this option..." },
  { key: "pros", label: "Pros", type: "string-list", placeholder: "Add a pro..." },
  { key: "cons", label: "Cons", type: "string-list", placeholder: "Add a con..." },
];

export function DecisionCard({ decision, onEdit, onDelete, onSaveOptions, onChooseOption }: DecisionCardProps) {
  const { id, topic, context, requirementRefs, options, chosen, chosenReason } = decision;

  const [editingOption, setEditingOption] = useState<DesignOption | null>(null);
  const [addingOption, setAddingOption] = useState(false);
  const [confirmDeleteOption, setConfirmDeleteOption] = useState<string | null>(null);
  const [choosingOptionId, setChoosingOptionId] = useState<string | null>(null);
  const [chooseReason, setChooseReason] = useState("");

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

  return (
    <>
      <div
        className="rounded-lg border border-slate-600 bg-slate-700 p-6 shadow-sm"
        data-testid={`decision-card-${id}`}
      >
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-base font-bold text-slate-50">{topic}</h4>
          {(onEdit || onDelete) && (
            <div className="flex items-center gap-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(decision)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
                  title="Edit decision"
                  data-testid={`edit-decision-${id}`}
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
                  className="rounded p-1 text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors cursor-pointer"
                  title="Delete decision"
                  data-testid={`delete-decision-${id}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>

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

        {chosen && chosenReason && (
          <div
            className="mt-4 rounded-md bg-green-900/30 px-5 py-4"
            data-testid={`decision-chosen-reason-${id}`}
          >
            <p className="text-base text-green-200">
              <span className="font-medium">Reason: </span>
              {chosenReason}
            </p>
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
