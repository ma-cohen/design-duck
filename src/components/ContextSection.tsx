/**
 * Renders a context section for displaying and editing context items.
 * Reusable at both root level (business/org context) and project level (system/technical context).
 * Each context item is a one-liner situational fact that informs decisions.
 */

import { useState } from "react";
import type { ContextItem, ContextDocument } from "../domain/requirements/requirement";
import { EditModal, type FieldDefinition } from "./EditModal";

export interface ContextSectionProps {
  /** The context document to display (null if not yet created). */
  contextDoc: ContextDocument | null;
  /** Called to persist context changes. */
  onSave: (data: ContextDocument) => Promise<void>;
  /** Section title. */
  title: string;
  /** Description text shown below the title. */
  description: string;
  /** Test ID prefix for data-testid attributes. */
  testIdPrefix: string;
}

const CONTEXT_FIELDS: FieldDefinition[] = [
  { key: "id", label: "ID", placeholder: "e.g. CTX-001" },
  { key: "description", label: "Description", placeholder: "One-liner situational fact..." },
];

export function ContextSection({ contextDoc, onSave, title, description, testIdPrefix }: ContextSectionProps) {
  const contexts = contextDoc?.contexts ?? [];

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<ContextItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSave = async (values: Record<string, string | string[]>) => {
    const entry: ContextItem = {
      id: values.id as string,
      description: values.description as string,
    };

    let newContexts: ContextItem[];
    if (editing) {
      newContexts = contexts.map((c) => (c.id === editing.id ? entry : c));
    } else {
      newContexts = [...contexts, entry];
    }

    await onSave({ contexts: newContexts });
    setEditing(null);
    setAdding(false);
  };

  const handleDelete = async (ctxId: string) => {
    const newContexts = contexts.filter((c) => c.id !== ctxId);
    await onSave({ contexts: newContexts });
    setConfirmDelete(null);
  };

  return (
    <>
      <section
        className="mb-6 rounded-lg border border-amber-600/30 bg-amber-900/10 p-5 shadow-sm"
        data-testid={`${testIdPrefix}-section`}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-amber-200">{title}</h3>
            <p className="mt-1 text-sm text-slate-400">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-md border border-amber-600/40 bg-slate-600 px-2.5 py-1.5 text-xs font-medium text-amber-200 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
            data-testid={`${testIdPrefix}-add-btn`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Context
          </button>
        </div>

        {contexts.length === 0 ? (
          <p className="text-sm text-slate-500 italic" data-testid={`${testIdPrefix}-empty`}>
            No context items yet. Add situational facts that inform decisions.
          </p>
        ) : (
          <div className="grid gap-2" data-testid={`${testIdPrefix}-list`}>
            {contexts.map((ctx) => (
              <div
                key={ctx.id}
                className="rounded-md border border-amber-600/20 bg-slate-700/60 px-4 py-3"
                data-testid={`${testIdPrefix}-item-${ctx.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="shrink-0 rounded bg-amber-900/40 px-2 py-0.5 text-xs font-semibold text-amber-300">
                      {ctx.id}
                    </span>
                    <span className="text-sm text-slate-200">{ctx.description}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditing(ctx)}
                      className="rounded p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(ctx.id)}
                      className="rounded p-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add/Edit Modal */}
      {(adding || editing) && (
        <EditModal
          title={editing ? "Edit Context Item" : "Add Context Item"}
          fields={CONTEXT_FIELDS}
          initialValues={
            editing
              ? { id: editing.id, description: editing.description }
              : undefined
          }
          onSave={handleSave}
          onClose={() => { setEditing(null); setAdding(false); }}
        />
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
          data-testid={`${testIdPrefix}-delete-confirm-backdrop`}
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-600 bg-slate-700 p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-100">Delete Context Item</h3>
            <p className="mt-2 text-sm text-slate-400">
              Are you sure you want to delete context item <strong>{confirmDelete}</strong>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="rounded-md border border-slate-500 bg-slate-600 px-4 py-2 text-sm font-medium text-slate-300 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDelete(confirmDelete)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
                data-testid={`${testIdPrefix}-confirm-delete-btn`}
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
