/**
 * Displays the vision, mission, and core problem statement.
 * Includes an edit button that opens a modal for editing.
 */

import { useState } from "react";
import type { Vision } from "../domain/requirements/requirement";
import { useRequirementsStore } from "../stores/requirements-store";
import { EditModal, type FieldDefinition } from "./EditModal";

export interface VisionHeaderProps {
  vision: Vision | null;
}

const VISION_FIELDS: FieldDefinition[] = [
  { key: "vision", label: "Vision", type: "textarea", placeholder: "Your product vision..." },
  { key: "mission", label: "Mission", type: "textarea", placeholder: "Your product mission..." },
  { key: "problem", label: "Core Problem", type: "textarea", placeholder: "The core problem you are solving..." },
];

export function VisionHeader({ vision }: VisionHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const saveVision = useRequirementsStore((s) => s.saveVision);

  if (!vision) {
    return null;
  }

  const handleSave = async (values: Record<string, string | string[]>) => {
    await saveVision({
      vision: values.vision as string,
      mission: values.mission as string,
      problem: values.problem as string,
    });
    setEditing(false);
  };

  return (
    <>
      <section
        className="mb-10 rounded-xl border border-indigo-600/40 bg-gradient-to-br from-indigo-900/30 to-purple-900/30"
        data-testid="vision-header"
      >
        {/* Collapsible header row */}
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="flex w-full items-center justify-between px-8 py-5 text-left cursor-pointer hover:bg-indigo-900/20 rounded-xl transition-colors"
          data-testid="vision-toggle"
        >
          <h2 className="text-xl font-bold text-indigo-200">Vision &amp; Mission</h2>
          <div className="flex items-center gap-2">
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); setEditing(true); }}
              onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setEditing(true); } }}
              className="inline-flex items-center gap-1.5 rounded-md border border-indigo-600/40 bg-slate-600/70 px-3 py-2 text-sm font-medium text-indigo-200 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
              data-testid="edit-vision-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 text-indigo-300 transition-transform ${expanded ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>

        {/* Expanded content */}
        {expanded && (
          <div className="border-t border-indigo-600/30 px-8 pb-8 pt-5">
            <div className="space-y-5">
              <div data-testid="vision-field">
                <span className="text-sm font-semibold tracking-wide text-indigo-300 uppercase">
                  Vision
                </span>
                <p className="mt-1 text-base leading-relaxed text-slate-100">
                  {vision.vision}
                </p>
              </div>

              <div data-testid="mission-field">
                <span className="text-sm font-semibold tracking-wide text-indigo-300 uppercase">
                  Mission
                </span>
                <p className="mt-1 text-base leading-relaxed text-slate-100">
                  {vision.mission}
                </p>
              </div>

              <div data-testid="problem-field">
                <span className="text-sm font-semibold tracking-wide text-indigo-300 uppercase">
                  Core Problem
                </span>
                <p className="mt-1 text-base leading-relaxed text-slate-100">
                  {vision.problem}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {editing && (
        <EditModal
          title="Edit Vision & Mission"
          fields={VISION_FIELDS}
          initialValues={{
            vision: vision.vision,
            mission: vision.mission,
            problem: vision.problem,
          }}
          onSave={handleSave}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
}
