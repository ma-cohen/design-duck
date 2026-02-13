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
        className="mb-8 rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50 p-6"
        data-testid="vision-header"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-indigo-900">Vision &amp; Mission</h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="inline-flex items-center gap-1 rounded-md border border-indigo-200 bg-white/70 px-2.5 py-1.5 text-xs font-medium text-indigo-700 shadow-sm hover:bg-white transition-colors cursor-pointer"
            data-testid="edit-vision-btn"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit
          </button>
        </div>

        <div className="space-y-3">
          <div data-testid="vision-field">
            <span className="text-xs font-semibold tracking-wide text-indigo-500 uppercase">
              Vision
            </span>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-800">
              {vision.vision}
            </p>
          </div>

          <div data-testid="mission-field">
            <span className="text-xs font-semibold tracking-wide text-indigo-500 uppercase">
              Mission
            </span>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-800">
              {vision.mission}
            </p>
          </div>

          <div data-testid="problem-field">
            <span className="text-xs font-semibold tracking-wide text-indigo-500 uppercase">
              Core Problem
            </span>
            <p className="mt-0.5 text-sm leading-relaxed text-gray-800">
              {vision.problem}
            </p>
          </div>
        </div>
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
