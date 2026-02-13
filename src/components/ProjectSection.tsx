/**
 * Renders a project's requirements with its vision alignment statement,
 * and optionally its design decisions. Includes add/edit/delete capabilities.
 */

import { useState } from "react";
import type {
  ProjectRequirements,
  ProjectDesign,
  Requirement,
} from "../domain/requirements/requirement";
import { useRequirementsStore } from "../stores/requirements-store";
import { RequirementCard } from "./RequirementCard";
import { DesignSection } from "./DesignSection";
import { EditModal, type FieldDefinition } from "./EditModal";

export interface ProjectSectionProps {
  projectName: string;
  project: ProjectRequirements;
  design?: ProjectDesign | null;
  onDeleteProject?: (projectName: string) => void;
}

const REQUIREMENT_FIELDS: FieldDefinition[] = [
  { key: "id", label: "ID", placeholder: "e.g. REQ-001" },
  { key: "description", label: "Description", type: "textarea", placeholder: "What the requirement is about" },
  { key: "userValue", label: "User Value", type: "textarea", placeholder: "Why this matters to the user" },
];

export function ProjectSection({ projectName, project, design, onDeleteProject }: ProjectSectionProps) {
  const saveProjectRequirements = useRequirementsStore((s) => s.saveProjectRequirements);

  const [editingReq, setEditingReq] = useState<Requirement | null>(null);
  const [addingReq, setAddingReq] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmDeleteProject, setConfirmDeleteProject] = useState(false);

  console.debug(
    `[design-duck:ui] Rendering ProjectSection: ${projectName} with ${project.requirements.length} requirements`,
  );

  // ---- Requirement handlers ----

  const handleSaveRequirement = async (values: Record<string, string | string[]>) => {
    const updated: Requirement = {
      id: values.id as string,
      description: values.description as string,
      userValue: values.userValue as string,
    };

    let newRequirements: Requirement[];
    if (editingReq) {
      // Replace existing requirement (match on original id)
      newRequirements = project.requirements.map((r) =>
        r.id === editingReq.id ? updated : r,
      );
    } else {
      // Append new requirement
      newRequirements = [...project.requirements, updated];
    }

    await saveProjectRequirements(projectName, {
      visionAlignment: project.visionAlignment,
      requirements: newRequirements,
    });
    setEditingReq(null);
    setAddingReq(false);
  };

  const handleDeleteRequirement = async (reqId: string) => {
    const newRequirements = project.requirements.filter((r) => r.id !== reqId);
    await saveProjectRequirements(projectName, {
      visionAlignment: project.visionAlignment,
      requirements: newRequirements,
    });
    setConfirmDelete(null);
  };

  return (
    <>
      <section
        className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm"
        data-testid={`project-section-${projectName}`}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">{projectName}</h3>
            <p
              className="mt-1 text-sm leading-relaxed text-gray-500 italic"
              data-testid={`vision-alignment-${projectName}`}
            >
              {project.visionAlignment}
            </p>
          </div>
          {onDeleteProject && (
            <button
              type="button"
              onClick={() => setConfirmDeleteProject(true)}
              className="inline-flex items-center gap-1 rounded-md border border-red-200 bg-white px-2.5 py-1.5 text-xs font-medium text-red-600 shadow-sm hover:bg-red-50 transition-colors cursor-pointer shrink-0"
              data-testid={`delete-project-${projectName}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Project
            </button>
          )}
        </div>

        {/* Requirements */}
        <div className="mb-3 flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-700">Requirements</h4>
          <button
            type="button"
            onClick={() => setAddingReq(true)}
            className="inline-flex items-center gap-1 rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
            data-testid={`add-requirement-${projectName}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Requirement
          </button>
        </div>

        {project.requirements.length === 0 ? (
          <p
            className="text-sm text-gray-400"
            data-testid={`empty-project-${projectName}`}
          >
            No requirements yet.
          </p>
        ) : (
          <div className="grid gap-4" data-testid={`requirements-list-${projectName}`}>
            {project.requirements.map((req) => (
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
          <div className="mt-5 border-t border-gray-100 pt-5">
            <DesignSection design={design} projectName={projectName} />
          </div>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDelete(null); }}
          data-testid="delete-confirm-backdrop"
        >
          <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-gray-900">Delete Requirement</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete requirement <strong>{confirmDelete}</strong>? This action cannot be undone.
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
                onClick={() => handleDeleteRequirement(confirmDelete)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
                data-testid="confirm-delete-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete project confirmation */}
      {confirmDeleteProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDeleteProject(false); }}
          data-testid="delete-project-confirm-backdrop"
        >
          <div className="w-full max-w-sm rounded-xl border border-red-200 bg-white p-6 shadow-xl">
            <h3 className="text-base font-bold text-red-900">Delete Project</h3>
            <p className="mt-2 text-sm text-gray-600">
              Are you sure you want to delete project <strong>{projectName}</strong>? This will remove all requirements and design decisions. This action cannot be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteProject(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => onDeleteProject?.(projectName)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
                data-testid="confirm-delete-project-btn"
              >
                Delete Project
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
