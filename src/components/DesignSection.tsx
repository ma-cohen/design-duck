/**
 * Renders a project's design decisions section with add/edit/delete support.
 */

import { useState } from "react";
import type { ProjectDesign, Decision, DesignOption } from "../domain/requirements/requirement";
import { useRequirementsStore } from "../stores/requirements-store";
import { DecisionCard } from "./DecisionCard";
import { EditModal, type FieldDefinition } from "./EditModal";

export interface DesignSectionProps {
  design: ProjectDesign;
  projectName: string;
}

const DECISION_FIELDS: FieldDefinition[] = [
  { key: "id", label: "ID", placeholder: "e.g. DEC-001" },
  { key: "topic", label: "Topic", placeholder: "What this decision is about" },
  { key: "context", label: "Context", type: "textarea", placeholder: "Background and reasoning..." },
  { key: "requirementRefs", label: "Requirement References", type: "string-list", required: false, placeholder: "e.g. REQ-001" },
];

export function DesignSection({ design, projectName }: DesignSectionProps) {
  const saveProjectDesign = useRequirementsStore((s) => s.saveProjectDesign);

  const [addingDecision, setAddingDecision] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  console.debug(
    `[design-duck:ui] Rendering DesignSection with ${design.decisions.length} decisions`,
  );

  const handleSaveDecision = async (values: Record<string, string | string[]>) => {
    const updated: Decision = {
      id: values.id as string,
      topic: values.topic as string,
      context: values.context as string,
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

    await saveProjectDesign(projectName, { decisions: newDecisions });
    setEditingDecision(null);
    setAddingDecision(false);
  };

  const handleDeleteDecision = async (decId: string) => {
    const newDecisions = design.decisions.filter((d) => d.id !== decId);
    await saveProjectDesign(projectName, { decisions: newDecisions });
    setConfirmDelete(null);
  };

  const handleSaveOptions = async (decisionId: string, newOptions: DesignOption[]) => {
    const newDecisions = design.decisions.map((d) =>
      d.id === decisionId ? { ...d, options: newOptions } : d,
    );
    await saveProjectDesign(projectName, { decisions: newDecisions });
  };

  const handleChooseOption = async (decisionId: string, optionId: string | null, reason: string | null) => {
    const newDecisions = design.decisions.map((d) =>
      d.id === decisionId ? { ...d, chosen: optionId, chosenReason: reason } : d,
    );
    await saveProjectDesign(projectName, { decisions: newDecisions });
  };

  return (
    <>
      <div data-testid="design-section">
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">
            Design Decisions
          </h4>
          <button
            type="button"
            onClick={() => setAddingDecision(true)}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
            data-testid={`add-decision-${projectName}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Decision
          </button>
        </div>

        {design.decisions.length === 0 ? (
          <p className="text-sm text-gray-400" data-testid="design-section-empty">
            No design decisions yet.
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
              />
            ))}
          </div>
        )}
      </div>

      {/* Add decision modal */}
      {addingDecision && (
        <EditModal
          title="Add Decision"
          fields={DECISION_FIELDS}
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
        >
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">Delete Decision</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete decision <strong>{confirmDelete}</strong>? This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteDecision(confirmDelete)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
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
