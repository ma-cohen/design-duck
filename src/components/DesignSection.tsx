/**
 * Renders a project's design decisions section with add/edit/delete support.
 * Decisions are grouped by category with a coverage indicator.
 */

import { useState } from "react";
import type { ProjectDesign, Decision, DecisionCategory, DesignOption } from "../domain/requirements/requirement";
import { DECISION_CATEGORIES } from "../domain/requirements/requirement";
import { useRequirementsStore } from "../stores/requirements-store";
import { DecisionCard } from "./DecisionCard";
import { EditModal, type FieldDefinition } from "./EditModal";

export interface DesignSectionProps {
  design: ProjectDesign;
  projectName: string;
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

/** Ordered list of categories for display (other always last). */
const CATEGORY_ORDER: DecisionCategory[] = [
  "product", "architecture", "technology", "data", "testing", "infrastructure", "other",
];

const CATEGORY_OPTIONS = CATEGORY_ORDER.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }));

const DECISION_FIELDS: FieldDefinition[] = [
  { key: "id", label: "ID", placeholder: "e.g. DEC-001" },
  { key: "topic", label: "Topic", placeholder: "What this decision is about" },
  { key: "category", label: "Category", type: "select", options: CATEGORY_OPTIONS },
  { key: "context", label: "Context", type: "textarea", placeholder: "Background and reasoning..." },
  { key: "requirementRefs", label: "Requirement References", type: "string-list", required: false, placeholder: "e.g. REQ-001" },
  { key: "contextRefs", label: "Context References", type: "string-list", required: false, placeholder: "e.g. CTX-001" },
  { key: "parentDecisionRef", label: "Parent Decision (cascading)", required: false, placeholder: "e.g. DEC-001 (leave empty if not triggered by another decision)" },
];

export function DesignSection({ design, projectName }: DesignSectionProps) {
  const saveProjectDesign = useRequirementsStore((s) => s.saveProjectDesign);
  const propagateToGlobal = useRequirementsStore((s) => s.propagateToGlobal);

  const [addingDecision, setAddingDecision] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmPropagate, setConfirmPropagate] = useState<string | null>(null);
  const [propagating, setPropagating] = useState(false);

  console.debug(
    `[design-duck:ui] Rendering DesignSection with ${design.decisions.length} decisions`,
  );

  const handleSaveDecision = async (values: Record<string, string | string[]>) => {
    const contextRefsArr = values.contextRefs as string[] | undefined;
    const parentRef = (values.parentDecisionRef as string)?.trim() || null;
    const updated: Decision = {
      id: values.id as string,
      topic: values.topic as string,
      context: values.context as string,
      category: (values.category as DecisionCategory) || "other",
      requirementRefs: values.requirementRefs as string[],
      ...(contextRefsArr && contextRefsArr.length > 0 ? { contextRefs: contextRefsArr } : {}),
      ...(parentRef ? { parentDecisionRef: parentRef } : {}),
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

    await saveProjectDesign(projectName, { notes: design.notes, decisions: newDecisions });
    setEditingDecision(null);
    setAddingDecision(false);
  };

  const handleDeleteDecision = async (decId: string) => {
    const newDecisions = design.decisions.filter((d) => d.id !== decId);
    await saveProjectDesign(projectName, { notes: design.notes, decisions: newDecisions });
    setConfirmDelete(null);
  };

  const handleSaveOptions = async (decisionId: string, newOptions: DesignOption[]) => {
    const newDecisions = design.decisions.map((d) =>
      d.id === decisionId ? { ...d, options: newOptions } : d,
    );
    await saveProjectDesign(projectName, { notes: design.notes, decisions: newDecisions });
  };

  const handleChooseOption = async (decisionId: string, optionId: string | null, reason: string | null) => {
    const newDecisions = design.decisions.map((d) =>
      d.id === decisionId ? { ...d, chosen: optionId, chosenReason: reason } : d,
    );
    await saveProjectDesign(projectName, { notes: design.notes, decisions: newDecisions });
  };

  const handleSaveDecisionNotes = async (decisionId: string, notes: string | null) => {
    const newDecisions = design.decisions.map((d) =>
      d.id === decisionId ? { ...d, notes } : d,
    );
    await saveProjectDesign(projectName, { notes: design.notes, decisions: newDecisions });
  };

  const handlePropagateDecision = async (decisionId: string) => {
    setPropagating(true);
    try {
      await propagateToGlobal(projectName, decisionId);
      setConfirmPropagate(null);
    } catch (err) {
      console.error("[design-duck:ui] Failed to propagate decision:", err);
      alert(err instanceof Error ? err.message : "Failed to propagate decision");
    } finally {
      setPropagating(false);
    }
  };

  // Group decisions by category
  const groupedDecisions = CATEGORY_ORDER.reduce<Record<DecisionCategory, Decision[]>>(
    (acc, cat) => {
      acc[cat] = design.decisions.filter((d) => d.category === cat);
      return acc;
    },
    {} as Record<DecisionCategory, Decision[]>,
  );

  // Categories that have at least one decision
  const coveredCategories = new Set(
    CATEGORY_ORDER.filter((cat) => groupedDecisions[cat].length > 0),
  );

  return (
    <>
      <div data-testid="design-section">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="text-base font-semibold text-slate-200">
            Design Decisions
          </h4>
          <button
            type="button"
            onClick={() => setAddingDecision(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-500 bg-slate-600 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
            data-testid={`add-decision-${projectName}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Decision
          </button>
        </div>

        {/* Coverage bar — shows which categories have decisions */}
        {design.decisions.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2" data-testid="category-coverage">
            {CATEGORY_ORDER.filter((c) => c !== "other").map((cat) => (
              <span
                key={cat}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  coveredCategories.has(cat)
                    ? "bg-green-900/40 border border-green-600/30 text-green-300"
                    : "bg-slate-600/50 border border-slate-500/30 text-slate-500"
                }`}
                title={coveredCategories.has(cat) ? `${CATEGORY_LABELS[cat]}: ${groupedDecisions[cat].length} decision(s)` : `${CATEGORY_LABELS[cat]}: no decisions yet`}
              >
                {CATEGORY_LABELS[cat]}
              </span>
            ))}
          </div>
        )}

        {design.decisions.length === 0 ? (
          <p className="text-base text-slate-300" data-testid="design-section-empty">
            No design decisions yet.
          </p>
        ) : (
          <div className="space-y-6">
            {CATEGORY_ORDER.map((cat) => {
              const decisions = groupedDecisions[cat];
              if (decisions.length === 0) return null;
              return (
                <div key={cat} data-testid={`category-group-${cat}`}>
                  <div className="mb-3 flex items-center gap-2">
                    <h5 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                      {CATEGORY_LABELS[cat]}
                    </h5>
                    <span className="rounded-full bg-slate-600 px-2 py-0.5 text-xs font-medium text-slate-300">
                      {decisions.length}
                    </span>
                  </div>
                  <div className="grid gap-4">
                    {decisions.map((dec) => (
                      <DecisionCard
                        key={dec.id}
                        decision={dec}
                        onEdit={(d) => setEditingDecision(d)}
                        onDelete={(id) => setConfirmDelete(id)}
                        onSaveOptions={(opts) => handleSaveOptions(dec.id, opts)}
                        onChooseOption={(optId, reason) => handleChooseOption(dec.id, optId, reason)}
                        onSaveNotes={(notes) => handleSaveDecisionNotes(dec.id, notes)}
                        onPropagate={(id) => setConfirmPropagate(id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add decision modal */}
      {addingDecision && (
        <EditModal
          title="Add Decision"
          fields={DECISION_FIELDS}
          initialValues={{ category: "other" }}
          onSave={handleSaveDecision}
          onClose={() => setAddingDecision(false)}
        />
      )}

      {/* Edit decision modal */}
      {editingDecision && (
        <EditModal
          title="Edit Decision"
          fields={DECISION_FIELDS}
          initialValues={{
            id: editingDecision.id,
            topic: editingDecision.topic,
            category: editingDecision.category,
            context: editingDecision.context,
            requirementRefs: editingDecision.requirementRefs,
            contextRefs: editingDecision.contextRefs ?? [],
            parentDecisionRef: editingDecision.parentDecisionRef ?? "",
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

      {/* Propagate to global confirmation */}
      {confirmPropagate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget && !propagating) setConfirmPropagate(null); }}
          data-testid="propagate-confirm-backdrop"
        >
          <div className="w-full max-w-md rounded-xl border border-indigo-500/40 bg-slate-700 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-50">Propagate to Global</h3>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              This will <strong>move</strong> decision <strong>{confirmPropagate}</strong> to the high-level global design decisions.
            </p>
            <ul className="mt-3 space-y-1.5 text-sm text-slate-400">
              <li>- The decision will be removed from this project</li>
              <li>- All projects will need to follow this decision</li>
              <li>- Related decisions in this project will get <code className="text-indigo-300">globalDecisionRefs</code> updated</li>
            </ul>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmPropagate(null)}
                disabled={propagating}
                className="rounded-md border border-slate-500 bg-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handlePropagateDecision(confirmPropagate)}
                disabled={propagating}
                className="rounded-md bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer disabled:opacity-50"
                data-testid="confirm-propagate-btn"
              >
                {propagating ? "Propagating..." : "Propagate to Global"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
