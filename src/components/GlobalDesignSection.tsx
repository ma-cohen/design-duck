/**
 * Renders the root-level global design decisions section.
 * These are system-wide decisions that all projects must follow.
 */

import { useState } from "react";
import type { GlobalDesign, Decision, DecisionCategory, DesignOption } from "../domain/requirements/requirement";
import { DECISION_CATEGORIES } from "../domain/requirements/requirement";
import { useRequirementsStore } from "../stores/requirements-store";
import { DecisionCard } from "./DecisionCard";
import { EditModal, type FieldDefinition } from "./EditModal";

export interface GlobalDesignSectionProps {
  globalDesign: GlobalDesign | null;
}

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

const CATEGORY_ORDER: DecisionCategory[] = [
  "product", "architecture", "technology", "data", "testing", "infrastructure", "other",
];

const CATEGORY_OPTIONS = CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }));

const DECISION_FIELDS: FieldDefinition[] = [
  { key: "id", label: "ID", placeholder: "e.g. GD-001" },
  { key: "topic", label: "Topic", placeholder: "What this decision is about" },
  { key: "category", label: "Category", type: "select", options: CATEGORY_OPTIONS },
  { key: "context", label: "Context", type: "textarea", placeholder: "Background and reasoning..." },
  { key: "requirementRefs", label: "Requirement References", type: "string-list", required: false, placeholder: "e.g. REQ-001" },
];

export function GlobalDesignSection({ globalDesign }: GlobalDesignSectionProps) {
  const saveGlobalDesign = useRequirementsStore((s) => s.saveGlobalDesign);

  const [expanded, setExpanded] = useState(false);
  const [addingDecision, setAddingDecision] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const design = globalDesign ?? { notes: null, decisions: [] };
  const decisionCount = design.decisions.length;
  const decidedCount = design.decisions.filter((d) => d.chosen !== null).length;

  const handleSaveDecision = async (values: Record<string, string | string[]>) => {
    const updated: Decision = {
      id: values.id as string,
      topic: values.topic as string,
      context: values.context as string,
      category: (values.category as DecisionCategory) || "other",
      requirementRefs: values.requirementRefs as string[],
      options: editingDecision?.options ?? [
        { id: "option-1", title: "Option 1", description: "Describe this option", pros: ["Pro 1"], cons: ["Con 1"] },
      ],
      chosen: editingDecision?.chosen ?? null,
      chosenReason: editingDecision?.chosenReason ?? null,
    };

    let newDecisions: Decision[];
    if (editingDecision) {
      newDecisions = design.decisions.map((d) =>
        d.id === editingDecision.id ? updated : d,
      );
    } else {
      newDecisions = [...design.decisions, updated];
    }

    await saveGlobalDesign({ notes: design.notes, decisions: newDecisions });
    setEditingDecision(null);
    setAddingDecision(false);
  };

  const handleDeleteDecision = async (decId: string) => {
    const newDecisions = design.decisions.filter((d) => d.id !== decId);
    await saveGlobalDesign({ notes: design.notes, decisions: newDecisions });
    setConfirmDelete(null);
  };

  const handleSaveOptions = async (decisionId: string, newOptions: DesignOption[]) => {
    const newDecisions = design.decisions.map((d) =>
      d.id === decisionId ? { ...d, options: newOptions } : d,
    );
    await saveGlobalDesign({ notes: design.notes, decisions: newDecisions });
  };

  const handleChooseOption = async (decisionId: string, optionId: string | null, reason: string | null) => {
    const newDecisions = design.decisions.map((d) =>
      d.id === decisionId ? { ...d, chosen: optionId, chosenReason: reason } : d,
    );
    await saveGlobalDesign({ notes: design.notes, decisions: newDecisions });
  };

  const handleSaveDecisionNotes = async (decisionId: string, notes: string | null) => {
    const newDecisions = design.decisions.map((d) =>
      d.id === decisionId ? { ...d, notes } : d,
    );
    await saveGlobalDesign({ notes: design.notes, decisions: newDecisions });
  };

  return (
    <>
      <div
        className="mb-6 rounded-xl border border-indigo-500/40 bg-slate-700/60 shadow-sm"
        data-testid="global-design-section"
      >
        {/* Collapsible header */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between px-6 py-4 text-left cursor-pointer hover:bg-slate-700/80 rounded-xl transition-colors"
        >
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-indigo-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <h3 className="text-lg font-semibold text-slate-50">
              High-Level Design Decisions
            </h3>
            {decisionCount > 0 && (
              <span className="rounded-full bg-indigo-500/20 px-2.5 py-0.5 text-xs font-medium text-indigo-300">
                {decidedCount}/{decisionCount} decided
              </span>
            )}
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 text-slate-400 transition-transform ${expanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-slate-600 px-6 py-5">
            {/* Decisions */}
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-200">
                Decisions
              </h4>
              <button
                type="button"
                onClick={() => setAddingDecision(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-500 bg-slate-600 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
                data-testid="add-global-decision"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Decision
              </button>
            </div>

            {design.decisions.length === 0 ? (
              <p className="text-base text-slate-300" data-testid="global-design-empty">
                No high-level design decisions yet.
              </p>
            ) : (
              <div className="grid gap-4">
                {design.decisions.map((dec) => (
                  <DecisionCard
                    key={dec.id}
                    decision={dec}
                    onEdit={(d) => setEditingDecision(d)}
                    onDelete={(id) => setConfirmDelete(id)}
                    onSaveOptions={(opts) => handleSaveOptions(dec.id, opts)}
                    onChooseOption={(optId, reason) => handleChooseOption(dec.id, optId, reason)}
                    onSaveNotes={(notes) => handleSaveDecisionNotes(dec.id, notes)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add decision modal */}
      {addingDecision && (
        <EditModal
          title="Add Global Decision"
          fields={DECISION_FIELDS}
          initialValues={{ category: "other" }}
          onSave={handleSaveDecision}
          onClose={() => setAddingDecision(false)}
        />
      )}

      {/* Edit decision modal */}
      {editingDecision && (
        <EditModal
          title="Edit Global Decision"
          fields={DECISION_FIELDS}
          initialValues={{
            id: editingDecision.id,
            topic: editingDecision.topic,
            category: editingDecision.category,
            context: editingDecision.context,
            requirementRefs: editingDecision.requirementRefs,
          }}
          onSave={handleSaveDecision}
          onClose={() => setEditingDecision(null)}
        />
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-600 bg-slate-700 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-50">Delete Decision</h3>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              Are you sure you want to delete decision <strong>{confirmDelete}</strong>? This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-md border border-slate-500 bg-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDecision(confirmDelete)}
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
