/**
 * Renders a playground's requirements with its problem statement,
 * and optionally its design decisions. Supports the same views as ProjectSection
 * (Results, Brainstorm) but for isolated playground problems.
 */

import { useState } from "react";
import type {
  PlaygroundRequirements,
  ContextDocument,
  ProjectDesign,
  Requirement,
} from "../domain/requirements/requirement";
import { useRequirementsStore } from "../stores/requirements-store";
import { RequirementCard } from "./RequirementCard";
import { ContextSection } from "./ContextSection";
import { DesignSection } from "./DesignSection";
import { ResultsView } from "./ResultsView";
import { EditModal, type FieldDefinition } from "./EditModal";

type ViewMode = "results" | "brainstorm";

export interface PlaygroundSectionProps {
  playgroundName: string;
  playground: PlaygroundRequirements;
  playgroundContext?: ContextDocument | null;
  design?: ProjectDesign | null;
  onDeletePlayground?: (playgroundName: string) => void;
}

const REQUIREMENT_FIELDS: FieldDefinition[] = [
  { key: "id", label: "ID", placeholder: "e.g. PG-001" },
  { key: "description", label: "Description", type: "textarea", placeholder: "What the requirement is about" },
  { key: "userValue", label: "User Value", type: "textarea", placeholder: "Why this matters to the user" },
];

export function PlaygroundSection({ playgroundName, playground, playgroundContext, design, onDeletePlayground }: PlaygroundSectionProps) {
  const savePlaygroundRequirements = useRequirementsStore((s) => s.savePlaygroundRequirements);
  const savePlaygroundContext = useRequirementsStore((s) => s.savePlaygroundContext);

  const [viewMode, setViewMode] = useState<ViewMode>("results");
  const [editingReq, setEditingReq] = useState<Requirement | null>(null);
  const [addingReq, setAddingReq] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeletePlayground, setConfirmDeletePlayground] = useState(false);

  // Build a ProjectRequirements-compatible object for reuse in ResultsView
  const projectCompat = {
    visionAlignment: playground.problemStatement,
    requirements: playground.requirements,
  };

  // ---- Requirement handlers ----

  const handleSaveRequirement = async (values: Record<string, string | string[]>) => {
    const updated: Requirement = {
      id: values.id as string,
      description: values.description as string,
      userValue: values.userValue as string,
    };

    let newRequirements: Requirement[];
    if (editingReq) {
      newRequirements = playground.requirements.map((r) =>
        r.id === editingReq.id ? updated : r,
      );
    } else {
      newRequirements = [...playground.requirements, updated];
    }

    await savePlaygroundRequirements(playgroundName, {
      problemStatement: playground.problemStatement,
      requirements: newRequirements,
    });
    setEditingReq(null);
    setAddingReq(false);
  };

  const handleDeleteRequirement = async (reqId: string) => {
    const newRequirements = playground.requirements.filter((r) => r.id !== reqId);
    await savePlaygroundRequirements(playgroundName, {
      problemStatement: playground.problemStatement,
      requirements: newRequirements,
    });
    setConfirmDelete(null);
  };

  return (
    <>
      <section
        className="rounded-lg border border-slate-600 bg-slate-700 p-6 shadow-sm"
        data-testid={`playground-section-${playgroundName}`}
      >
        <div className="mb-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center rounded-full bg-amber-900/40 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                Playground
              </span>
            </div>
            <h3 className="text-lg font-bold text-slate-50">{playgroundName}</h3>
            <p
              className="mt-1.5 text-base leading-relaxed text-slate-300 italic"
              data-testid={`problem-statement-${playgroundName}`}
            >
              {playground.problemStatement}
            </p>
          </div>
          {onDeletePlayground && (
            <button
              type="button"
              onClick={() => setConfirmDeletePlayground(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-600/40 bg-slate-700 px-3 py-2 text-sm font-medium text-red-400 shadow-sm hover:bg-red-900/30 transition-colors cursor-pointer shrink-0"
              data-testid={`delete-playground-${playgroundName}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Playground
            </button>
          )}
        </div>

        {/* Tab bar */}
        <div className="mb-6 flex gap-1 rounded-lg bg-slate-600 p-1" data-testid="playground-view-mode-tabs">
          <button
            type="button"
            onClick={() => setViewMode("results")}
            className={`flex-1 rounded-md px-4 py-2.5 text-base font-medium transition-colors cursor-pointer ${
              viewMode === "results"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-300 hover:text-slate-100 hover:bg-slate-500"
            }`}
            data-testid="playground-tab-results"
          >
            Results
          </button>
          <button
            type="button"
            onClick={() => setViewMode("brainstorm")}
            className={`flex-1 rounded-md px-4 py-2.5 text-base font-medium transition-colors cursor-pointer ${
              viewMode === "brainstorm"
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-300 hover:text-slate-100 hover:bg-slate-500"
            }`}
            data-testid="playground-tab-brainstorm"
          >
            Brainstorm
          </button>
        </div>

        {/* Results view */}
        {viewMode === "results" && (
          <ResultsView
            project={projectCompat}
            design={design ?? null}
            onViewBrainstorm={() => setViewMode("brainstorm")}
          />
        )}

        {/* Brainstorm view */}
        {viewMode === "brainstorm" && (
          <>
            {/* Playground Context */}
            <ContextSection
              contextDoc={playgroundContext ?? null}
              onSave={(data) => savePlaygroundContext(playgroundName, data)}
              title="Playground Context"
              description="Technical and system facts specific to this playground that inform design decisions."
              testIdPrefix={`playground-context-${playgroundName}`}
            />

            {/* Requirements */}
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-base font-semibold text-slate-200">Requirements</h4>
              <button
                type="button"
                onClick={() => setAddingReq(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-slate-500 bg-slate-600 px-3 py-2 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
                data-testid={`add-requirement-pg-${playgroundName}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Requirement
              </button>
            </div>

            {playground.requirements.length === 0 ? (
              <p
                className="text-base text-slate-300"
                data-testid={`empty-playground-${playgroundName}`}
              >
                No requirements yet.
              </p>
            ) : (
              <div className="grid gap-4" data-testid={`requirements-list-pg-${playgroundName}`}>
                {playground.requirements.map((req) => (
                  <RequirementCard
                    key={req.id}
                    requirement={req}
                    onEdit={(r) => setEditingReq(r)}
                    onDelete={(id) => setConfirmDelete(id)}
                  />
                ))}
              </div>
            )}

            {/* Design */}
            {design && (
              <div className="mt-5 border-t border-slate-600 pt-5">
                <DesignSection design={design} projectName={playgroundName} />
              </div>
            )}
          </>
        )}

      </section>

      {/* Edit requirement modal */}
      {editingReq && (
        <EditModal
          title="Edit Requirement"
          fields={REQUIREMENT_FIELDS}
          initialValues={{
            id: editingReq.id,
            description: editingReq.description,
            userValue: editingReq.userValue,
          }}
          onSave={handleSaveRequirement}
          onClose={() => setEditingReq(null)}
        />
      )}

      {/* Add requirement modal */}
      {addingReq && (
        <EditModal
          title="Add Requirement"
          fields={REQUIREMENT_FIELDS}
          onSave={handleSaveRequirement}
          onClose={() => setAddingReq(false)}
        />
      )}

      {/* Delete requirement confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
          data-testid="delete-confirm-backdrop"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-600 bg-slate-700 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-slate-50">Delete Requirement</h3>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              Are you sure you want to delete requirement <strong>{confirmDelete}</strong>? This action cannot be undone.
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
                onClick={() => handleDeleteRequirement(confirmDelete)}
                className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
                data-testid="confirm-delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete playground confirmation */}
      {confirmDeletePlayground && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDeletePlayground(false); }}
          data-testid="delete-playground-confirm-backdrop"
        >
          <div className="w-full max-w-sm rounded-xl border border-red-600/40 bg-slate-700 p-6 shadow-xl">
            <h3 className="text-lg font-bold text-red-300">Delete Playground</h3>
            <p className="mt-3 text-base leading-relaxed text-slate-300">
              Are you sure you want to delete playground <strong>{playgroundName}</strong>? This will remove all requirements and design decisions. This action cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeletePlayground(false)}
                className="rounded-md border border-slate-500 bg-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onDeletePlayground?.(playgroundName)}
                className="rounded-md bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
                data-testid="confirm-delete-playground-btn"
              >
                Delete Playground
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
