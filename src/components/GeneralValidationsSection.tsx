/**
 * Renders the root-level general validations section on the home page.
 * These are global checks (linting, tests, CI) that apply to all projects.
 * Supports add, edit, and delete via EditModal.
 */

import { useState } from "react";
import type { GeneralValidation, GeneralValidations } from "../domain/requirements/requirement";
import { useRequirementsStore } from "../stores/requirements-store";
import { EditModal, type FieldDefinition } from "./EditModal";

export interface GeneralValidationsSectionProps {
  generalValidations: GeneralValidations | null;
}

const GENERAL_VALIDATION_FIELDS: FieldDefinition[] = [
  { key: "id", label: "ID", placeholder: "e.g. VAL-GENERAL-001" },
  { key: "description", label: "Description", type: "textarea", placeholder: "What must always be validated" },
  { key: "category", label: "Category", placeholder: "e.g. linting, testing, ci" },
];

export function GeneralValidationsSection({ generalValidations }: GeneralValidationsSectionProps) {
  const saveGeneralValidations = useRequirementsStore((s) => s.saveGeneralValidations);

  const validations = generalValidations?.validations ?? [];

  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<GeneralValidation | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const handleSave = async (values: Record<string, string | string[]>) => {
    const entry: GeneralValidation = {
      id: values.id as string,
      description: values.description as string,
      category: values.category as string,
    };

    let newValidations: GeneralValidation[];
    if (editing) {
      newValidations = validations.map((v) => (v.id === editing.id ? entry : v));
    } else {
      newValidations = [...validations, entry];
    }

    await saveGeneralValidations({ validations: newValidations });
    setEditing(null);
    setAdding(false);
  };

  const handleDelete = async (valId: string) => {
    const newValidations = validations.filter((v) => v.id !== valId);
    await saveGeneralValidations({ validations: newValidations });
    setConfirmDelete(null);
  };

  // Category color mapping
  const categoryColors: Record<string, string> = {
    linting: "bg-blue-900/60 text-blue-300",
    testing: "bg-green-900/60 text-green-300",
    ci: "bg-purple-900/60 text-purple-300",
  };

  return (
    <>
      <section
        className="mb-6 rounded-lg border border-slate-600 bg-slate-700 p-5 shadow-sm"
        data-testid="general-validations-section"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-100">General Validations</h3>
            <p className="mt-1 text-sm text-slate-400">
              Global checks that apply to all projects (linting, tests, CI, etc.)
            </p>
          </div>
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-500 bg-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-300 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
            data-testid="add-general-validation-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Validation
          </button>
        </div>

        {validations.length === 0 ? (
          <p className="text-sm text-slate-500 italic" data-testid="no-general-validations">
            No general validations yet. Add checks like linting, test suites, or CI requirements.
          </p>
        ) : (
          <div className="grid gap-2" data-testid="general-validations-list">
            {validations.map((val) => (
              <div
                key={val.id}
                className="rounded-md border border-slate-600 bg-slate-600/50 px-4 py-3"
                data-testid={`general-validation-${val.id}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-sm font-medium text-slate-200">{val.id}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${categoryColors[val.category.toLowerCase()] ?? "bg-slate-500 text-slate-300"}`}>
                      {val.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditing(val)}
                      className="rounded p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      title="Edit"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(val.id)}
                      className="rounded p-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                      title="Delete"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
                <p className="mt-1 text-sm text-slate-400">{val.description}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add/Edit Modal */}
      {(adding || editing) && (
        <EditModal
          title={editing ? "Edit General Validation" : "Add General Validation"}
          fields={GENERAL_VALIDATION_FIELDS}
          initialValues={
            editing
              ? { id: editing.id, description: editing.description, category: editing.category }
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
          data-testid="delete-general-validation-confirm-backdrop"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-600 bg-slate-700 p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-100">Delete General Validation</h3>
            <p className="mt-2 text-sm text-slate-400">
              Are you sure you want to delete validation <strong>{confirmDelete}</strong>? This will remove it from all projects.
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
                data-testid="confirm-delete-general-validation-btn"
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
