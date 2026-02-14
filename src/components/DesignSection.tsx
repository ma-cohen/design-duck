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
  { key: "contextRefs", label: "Context References", type: "string-list", required: false, placeholder: "e.g. CTX-001" },
];

export function DesignSection({ design, projectName }: DesignSectionProps) {
  const saveProjectDesign = useRequirementsStore((s) => s.saveProjectDesign);

  const [addingDecision, setAddingDecision] = useState(false);
  const [editingDecision, setEditingDecision] = useState<Decision | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);

  console.debug(
    `[design-duck:ui] Rendering DesignSection with ${design.decisions.length} decisions`,
  );

  const handleSaveDecision = async (values: Record<string, string | string[]>) => {
    const contextRefsArr = values.contextRefs as string[] | undefined;
    const updated: Decision = {
      id: values.id as string,
      topic: values.topic as string,
      context: values.context as string,
      requirementRefs: values.requirementRefs as string[],
      ...(contextRefsArr && contextRefsArr.length > 0 ? { contextRefs: contextRefsArr } : {}),
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

  const handleSaveNotes = async (values: Record<string, string | string[]>) => {
    const newNotes = (values.notes as string).trim() || null;
    await saveProjectDesign(projectName, { notes: newNotes, decisions: design.decisions });
    setEditingNotes(false);
  };

  return (
    <>
      <div data-testid="design-section">
        {/* Notes block */}
        <div className="mb-6" data-testid="design-notes">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold tracking-wide text-slate-300 uppercase">
              Research &amp; Notes
            </span>
            <button
              type="button"
              onClick={() => setEditingNotes(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-slate-500 bg-slate-600 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
              data-testid={`edit-notes-${projectName}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              {design.notes ? "Edit Notes" : "Add Notes"}
            </button>
          </div>
          {design.notes ? (
            <div className="rounded-lg border border-amber-600/40 bg-amber-900/30 px-5 py-4">
              <p className="whitespace-pre-wrap text-base leading-relaxed text-slate-100">
                {design.notes}
              </p>
            </div>
          ) : (
            <p className="text-base text-slate-300 italic">
              No notes yet. Add research, links, or analysis to help inform design decisions.
            </p>
          )}
        </div>

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

        {design.decisions.length === 0 ? (
          <p className="text-base text-slate-300" data-testid="design-section-empty">
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
            contextRefs: editingDecision.contextRefs ?? [],
          }}
          onSave={handleSaveDecision}
          onClose={() => setEditingDecision(null)}
        />
      )}

      {/* Edit notes modal */}
      {editingNotes && (
        <EditModal
          title="Edit Research & Notes"
          fields={[
            { key: "notes", label: "Notes", type: "textarea", required: false, placeholder: "Research, links, analysis, or any context that helps inform design decisions..." },
          ]}
          initialValues={{ notes: design.notes ?? "" }}
          onSave={handleSaveNotes}
          onClose={() => setEditingNotes(false)}
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
