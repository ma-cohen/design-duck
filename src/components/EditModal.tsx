/**
 * Reusable modal dialog for adding or editing items.
 * Accepts a list of field definitions and renders appropriate inputs.
 */

import { useState, useEffect, useCallback, type FormEvent } from "react";

export interface FieldDefinition {
  /** Unique key used in the values record. */
  key: string;
  /** Human-readable label. */
  label: string;
  /** Input type: defaults to "text". Use "textarea" for multiline. Use "string-list" for arrays of strings. Use "select" for dropdowns. */
  type?: "text" | "textarea" | "string-list" | "select";
  /** Options for "select" type. Each option has a value and label. */
  options?: { value: string; label: string }[];
  /** Whether this field is required. @default true */
  required?: boolean;
  /** Placeholder text. */
  placeholder?: string;
}

export interface EditModalProps {
  /** Modal title (e.g. "Edit Requirement", "Add Decision"). */
  title: string;
  /** Field definitions describing the form. */
  fields: FieldDefinition[];
  /** Initial values keyed by field key. For string-list fields use string[] . */
  initialValues?: Record<string, string | string[]>;
  /** Called with the new values when the user clicks Save. */
  onSave: (values: Record<string, string | string[]>) => void;
  /** Called when the modal is dismissed. */
  onClose: () => void;
}

export function EditModal({ title, fields, initialValues = {}, onSave, onClose }: EditModalProps) {
  const [values, setValues] = useState<Record<string, string | string[]>>(() => {
    const init: Record<string, string | string[]> = {};
    for (const f of fields) {
      if (f.type === "string-list") {
        init[f.key] = (initialValues[f.key] as string[] | undefined) ?? [];
      } else {
        init[f.key] = (initialValues[f.key] as string | undefined) ?? "";
      }
    }
    return init;
  });

  const [error, setError] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const setField = useCallback((key: string, value: string | string[]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic validation
    for (const f of fields) {
      const required = f.required !== false;
      const val = values[f.key];
      if (required) {
        if (f.type === "string-list") {
          if (!Array.isArray(val) || val.length === 0) {
            setError(`${f.label} must have at least one entry`);
            return;
          }
        } else if (typeof val === "string" && val.trim() === "") {
          setError(`${f.label} is required`);
          return;
        }
      }
    }

    onSave(values);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      data-testid="edit-modal-backdrop"
    >
      <div className="w-full max-w-lg rounded-xl border border-slate-600 bg-slate-700 p-8 shadow-xl" data-testid="edit-modal">
        <h2 className="mb-5 text-xl font-bold text-slate-50">{title}</h2>

        {error && (
          <div className="mb-4 rounded-md border border-red-600/40 bg-red-900/30 px-4 py-3 text-base text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {fields.map((f) => (
            <div key={f.key}>
              <label className="mb-1.5 block text-base font-medium text-slate-200">
                {f.label}
              </label>

              {f.type === "textarea" ? (
                <textarea
                  className="w-full rounded-md border border-slate-500 bg-slate-600 px-3.5 py-2.5 text-base text-slate-100 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder:text-slate-400"
                  rows={3}
                  placeholder={f.placeholder}
                  value={values[f.key] as string}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              ) : f.type === "string-list" ? (
                <StringListInput
                  value={values[f.key] as string[]}
                  onChange={(v) => setField(f.key, v)}
                  placeholder={f.placeholder}
                />
              ) : f.type === "select" && f.options ? (
                <select
                  className="w-full rounded-md border border-slate-500 bg-slate-600 px-3.5 py-2.5 text-base text-slate-100 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                  value={values[f.key] as string}
                  onChange={(e) => setField(f.key, e.target.value)}
                >
                  {f.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className="w-full rounded-md border border-slate-500 bg-slate-600 px-3.5 py-2.5 text-base text-slate-100 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder:text-slate-400"
                  placeholder={f.placeholder}
                  value={values[f.key] as string}
                  onChange={(e) => setField(f.key, e.target.value)}
                />
              )}
            </div>
          ))}

          <div className="flex justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-500 bg-slate-600 px-5 py-2.5 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 transition-colors cursor-pointer"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// String list sub-component for array fields (e.g. pros, cons)
// ---------------------------------------------------------------------------

function StringListInput({
  value,
  onChange,
  placeholder,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const trimmed = draft.trim();
    if (trimmed) {
      onChange([...value, trimmed]);
      setDraft("");
    }
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div>
      {value.length > 0 && (
        <ul className="mb-2 space-y-1">
          {value.map((item, i) => (
            <li key={i} className="flex items-center gap-2 rounded-md border border-slate-600 bg-slate-600 px-3 py-2 text-base text-slate-100">
              <span className="flex-1">{item}</span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-red-500 hover:text-red-400 transition-colors cursor-pointer"
                title="Remove"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          className="flex-1 rounded-md border border-slate-500 bg-slate-600 px-3.5 py-2.5 text-base text-slate-100 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400 placeholder:text-slate-400"
          placeholder={placeholder ?? "Add item..."}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
        />
        <button
          type="button"
          onClick={add}
          className="rounded-md border border-slate-500 bg-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
        >
          Add
        </button>
      </div>
    </div>
  );
}
