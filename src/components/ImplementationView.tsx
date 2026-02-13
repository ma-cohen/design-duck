/**
 * Renders the implementation tab for a project.
 * Shows general validations (inherited, read-only), implementation plan,
 * todo list, project-specific validations, and test specifications.
 * All items are linked back to requirements via requirementRefs.
 */

import { useState } from "react";
import type {
  ProjectImplementation,
  GeneralValidations,
  ImplementationTodo,
  ImplementationValidation,
  TestSpec,
  Requirement,
} from "../domain/requirements/requirement";
import { useRequirementsStore } from "../stores/requirements-store";
import { EditModal, type FieldDefinition } from "./EditModal";

export interface ImplementationViewProps {
  projectName: string;
  implementation: ProjectImplementation | null;
  generalValidations: GeneralValidations | null;
  requirements: Requirement[];
}

// ---------------------------------------------------------------------------
// Field definitions for EditModal
// ---------------------------------------------------------------------------

const TODO_FIELDS: FieldDefinition[] = [
  { key: "id", label: "ID", placeholder: "e.g. TODO-001" },
  { key: "description", label: "Description", type: "textarea", placeholder: "What needs to be done" },
  { key: "requirementRefs", label: "Requirement Refs", type: "string-list", required: false, placeholder: "e.g. AUTH-001" },
];

const VALIDATION_FIELDS: FieldDefinition[] = [
  { key: "id", label: "ID", placeholder: "e.g. VAL-001" },
  { key: "description", label: "Description", type: "textarea", placeholder: "What must be validated" },
  { key: "requirementRefs", label: "Requirement Refs", type: "string-list", required: false, placeholder: "e.g. AUTH-001" },
];

const TEST_FIELDS: FieldDefinition[] = [
  { key: "id", label: "ID", placeholder: "e.g. TEST-001" },
  { key: "description", label: "Description", type: "textarea", placeholder: "What should this test verify" },
  { key: "type", label: "Type (unit / integration / e2e)", placeholder: "unit" },
  { key: "requirementRefs", label: "Requirement Refs", type: "string-list", required: false, placeholder: "e.g. AUTH-001" },
];

const PLAN_FIELDS: FieldDefinition[] = [
  { key: "plan", label: "Implementation Plan", type: "textarea", placeholder: "Describe the implementation phases and how they address requirements..." },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function RequirementRefBadges({ refs, requirements }: { refs: string[]; requirements: Requirement[] }) {
  if (refs.length === 0) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {refs.map((ref) => {
        const req = requirements.find((r) => r.id === ref);
        return (
          <span
            key={ref}
            className="inline-flex items-center rounded-full bg-indigo-900/50 px-2 py-0.5 text-xs font-medium text-indigo-300"
            title={req ? req.description : `Unknown requirement: ${ref}`}
          >
            {ref}
          </span>
        );
      })}
    </div>
  );
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: "bg-slate-600", text: "text-slate-300", label: "Pending" },
  "in-progress": { bg: "bg-amber-900/60", text: "text-amber-300", label: "In Progress" },
  done: { bg: "bg-green-900/60", text: "text-green-300", label: "Done" },
};

const NEXT_STATUS: Record<string, "pending" | "in-progress" | "done"> = {
  pending: "in-progress",
  "in-progress": "done",
  done: "pending",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ImplementationView({
  projectName,
  implementation,
  generalValidations,
  requirements,
}: ImplementationViewProps) {
  const saveProjectImplementation = useRequirementsStore((s) => s.saveProjectImplementation);

  const impl = implementation ?? { plan: null, todos: [], validations: [], tests: [] };

  // Modal state
  const [editingPlan, setEditingPlan] = useState(false);
  const [addingTodo, setAddingTodo] = useState(false);
  const [editingTodo, setEditingTodo] = useState<ImplementationTodo | null>(null);
  const [addingValidation, setAddingValidation] = useState(false);
  const [editingValidation, setEditingValidation] = useState<ImplementationValidation | null>(null);
  const [addingTest, setAddingTest] = useState(false);
  const [editingTest, setEditingTest] = useState<TestSpec | null>(null);

  // Delete confirmation state
  const [confirmDeleteTodo, setConfirmDeleteTodo] = useState<string | null>(null);
  const [confirmDeleteValidation, setConfirmDeleteValidation] = useState<string | null>(null);
  const [confirmDeleteTest, setConfirmDeleteTest] = useState<string | null>(null);

  // ---- Save helpers ----

  const saveImpl = async (data: ProjectImplementation) => {
    await saveProjectImplementation(projectName, data);
  };

  // ---- Plan handlers ----

  const handleSavePlan = async (values: Record<string, string | string[]>) => {
    const plan = (values.plan as string).trim() || null;
    await saveImpl({ ...impl, plan });
    setEditingPlan(false);
  };

  // ---- Todo handlers ----

  const handleSaveTodo = async (values: Record<string, string | string[]>) => {
    const todo: ImplementationTodo = {
      id: values.id as string,
      description: values.description as string,
      status: editingTodo ? editingTodo.status : "pending",
      requirementRefs: values.requirementRefs as string[],
    };

    let newTodos: ImplementationTodo[];
    if (editingTodo) {
      newTodos = impl.todos.map((t) => (t.id === editingTodo.id ? todo : t));
    } else {
      newTodos = [...impl.todos, todo];
    }

    await saveImpl({ ...impl, todos: newTodos });
    setEditingTodo(null);
    setAddingTodo(false);
  };

  const handleToggleTodoStatus = async (todoId: string) => {
    const newTodos = impl.todos.map((t) =>
      t.id === todoId ? { ...t, status: NEXT_STATUS[t.status] } : t,
    );
    await saveImpl({ ...impl, todos: newTodos });
  };

  const handleDeleteTodo = async (todoId: string) => {
    const newTodos = impl.todos.filter((t) => t.id !== todoId);
    await saveImpl({ ...impl, todos: newTodos });
    setConfirmDeleteTodo(null);
  };

  // ---- Validation handlers ----

  const handleSaveValidation = async (values: Record<string, string | string[]>) => {
    const validation: ImplementationValidation = {
      id: values.id as string,
      description: values.description as string,
      requirementRefs: values.requirementRefs as string[],
    };

    let newValidations: ImplementationValidation[];
    if (editingValidation) {
      newValidations = impl.validations.map((v) =>
        v.id === editingValidation.id ? validation : v,
      );
    } else {
      newValidations = [...impl.validations, validation];
    }

    await saveImpl({ ...impl, validations: newValidations });
    setEditingValidation(null);
    setAddingValidation(false);
  };

  const handleDeleteValidation = async (valId: string) => {
    const newValidations = impl.validations.filter((v) => v.id !== valId);
    await saveImpl({ ...impl, validations: newValidations });
    setConfirmDeleteValidation(null);
  };

  // ---- Test handlers ----

  const handleSaveTest = async (values: Record<string, string | string[]>) => {
    const testType = (values.type as string).trim().toLowerCase();
    const validTypes = ["unit", "integration", "e2e"];
    const type = validTypes.includes(testType) ? (testType as "unit" | "integration" | "e2e") : "unit";

    const test: TestSpec = {
      id: values.id as string,
      description: values.description as string,
      type,
      requirementRefs: values.requirementRefs as string[],
    };

    let newTests: TestSpec[];
    if (editingTest) {
      newTests = impl.tests.map((t) => (t.id === editingTest.id ? test : t));
    } else {
      newTests = [...impl.tests, test];
    }

    await saveImpl({ ...impl, tests: newTests });
    setEditingTest(null);
    setAddingTest(false);
  };

  const handleDeleteTest = async (testId: string) => {
    const newTests = impl.tests.filter((t) => t.id !== testId);
    await saveImpl({ ...impl, tests: newTests });
    setConfirmDeleteTest(null);
  };

  // ---- Render ----

  return (
    <>
      <div data-testid="implementation-view">
        {/* General Validations (inherited, read-only) */}
        {generalValidations && generalValidations.validations.length > 0 && (
          <div className="mb-6">
            <h4 className="mb-3 text-sm font-semibold text-slate-300">General Validations</h4>
            <p className="mb-2 text-xs text-slate-500 italic">These apply to all projects and are managed at the root level.</p>
            <div className="grid gap-2" data-testid="general-validations-readonly">
              {generalValidations.validations.map((v) => (
                <div
                  key={v.id}
                  className="rounded-md border border-slate-600 bg-slate-600/50 px-4 py-3"
                  data-testid={`general-val-${v.id}`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-200">{v.id}</span>
                    <span className="rounded-full bg-slate-500 px-2 py-0.5 text-xs font-medium text-slate-300">
                      {v.category}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-400">{v.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Implementation Plan */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-300">Implementation Plan</h4>
            <button
              type="button"
              onClick={() => setEditingPlan(true)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-500 bg-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-300 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
              data-testid="edit-plan-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {impl.plan ? "Edit Plan" : "Add Plan"}
            </button>
          </div>
          {impl.plan ? (
            <div className="rounded-md border border-slate-600 bg-slate-600/50 px-4 py-3" data-testid="implementation-plan">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-300 font-sans">{impl.plan}</pre>
            </div>
          ) : (
            <p className="text-sm text-slate-500 italic">No implementation plan yet.</p>
          )}
        </div>

        {/* Todo List */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-300">
              Todo List
              {impl.todos.length > 0 && (
                <span className="ml-2 text-xs font-normal text-slate-500">
                  ({impl.todos.filter((t) => t.status === "done").length}/{impl.todos.length} done)
                </span>
              )}
            </h4>
            <button
              type="button"
              onClick={() => setAddingTodo(true)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-500 bg-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-300 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
              data-testid="add-todo-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Todo
            </button>
          </div>

          {impl.todos.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No implementation todos yet.</p>
          ) : (
            <div className="grid gap-2" data-testid="todos-list">
              {impl.todos.map((todo) => {
                const style = STATUS_STYLES[todo.status];
                return (
                  <div
                    key={todo.id}
                    className="rounded-md border border-slate-600 bg-slate-600/50 px-4 py-3"
                    data-testid={`todo-${todo.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleToggleTodoStatus(todo.id)}
                          className={`shrink-0 rounded-full ${style.bg} px-2 py-0.5 text-xs font-medium ${style.text} cursor-pointer hover:opacity-80 transition-opacity`}
                          title={`Click to change status (currently: ${style.label})`}
                          data-testid={`todo-status-${todo.id}`}
                        >
                          {style.label}
                        </button>
                        <span className="text-sm font-medium text-slate-200">{todo.id}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingTodo(todo)}
                          className="rounded p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteTodo(todo.id)}
                          className="rounded p-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className={`mt-1 text-sm ${todo.status === "done" ? "text-slate-500 line-through" : "text-slate-400"}`}>
                      {todo.description}
                    </p>
                    <RequirementRefBadges refs={todo.requirementRefs} requirements={requirements} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Project Validations */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-300">Project Validations</h4>
            <button
              type="button"
              onClick={() => setAddingValidation(true)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-500 bg-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-300 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
              data-testid="add-validation-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Validation
            </button>
          </div>

          {impl.validations.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No project-specific validations yet.</p>
          ) : (
            <div className="grid gap-2" data-testid="validations-list">
              {impl.validations.map((val) => (
                <div
                  key={val.id}
                  className="rounded-md border border-slate-600 bg-slate-600/50 px-4 py-3"
                  data-testid={`validation-${val.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium text-slate-200">{val.id}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingValidation(val)}
                        className="rounded p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                        title="Edit"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteValidation(val.id)}
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
                  <RequirementRefBadges refs={val.requirementRefs} requirements={requirements} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Specifications */}
        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-300">Test Specifications</h4>
            <button
              type="button"
              onClick={() => setAddingTest(true)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-500 bg-slate-600 px-2.5 py-1.5 text-xs font-medium text-slate-300 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
              data-testid="add-test-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Test
            </button>
          </div>

          {impl.tests.length === 0 ? (
            <p className="text-sm text-slate-500 italic">No test specifications yet.</p>
          ) : (
            <div className="grid gap-2" data-testid="tests-list">
              {impl.tests.map((test) => {
                const typeColors: Record<string, string> = {
                  unit: "bg-blue-900/60 text-blue-300",
                  integration: "bg-purple-900/60 text-purple-300",
                  e2e: "bg-teal-900/60 text-teal-300",
                };
                return (
                  <div
                    key={test.id}
                    className="rounded-md border border-slate-600 bg-slate-600/50 px-4 py-3"
                    data-testid={`test-${test.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-medium text-slate-200">{test.id}</span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[test.type] ?? "bg-slate-600 text-slate-300"}`}>
                          {test.type}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingTest(test)}
                          className="rounded p-1 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteTest(test.id)}
                          className="rounded p-1 text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                          title="Delete"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="mt-1 text-sm text-slate-400">{test.description}</p>
                    <RequirementRefBadges refs={test.requirementRefs} requirements={requirements} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Requirements coverage summary */}
        {requirements.length > 0 && (
          <div className="rounded-md border border-slate-600 bg-slate-700/50 px-4 py-3" data-testid="coverage-summary">
            <h4 className="mb-2 text-sm font-semibold text-slate-300">Requirements Coverage</h4>
            <div className="grid gap-1.5">
              {requirements.map((req) => {
                const todoRefs = impl.todos.filter((t) => t.requirementRefs.includes(req.id));
                const valRefs = impl.validations.filter((v) => v.requirementRefs.includes(req.id));
                const testRefs = impl.tests.filter((t) => t.requirementRefs.includes(req.id));
                const totalCoverage = todoRefs.length + valRefs.length + testRefs.length;
                return (
                  <div key={req.id} className="flex items-center gap-2 text-xs">
                    <span className={`font-medium ${totalCoverage > 0 ? "text-green-400" : "text-amber-400"}`}>
                      {req.id}
                    </span>
                    <span className="text-slate-500">—</span>
                    <span className="text-slate-400 truncate">{req.description}</span>
                    <span className="ml-auto shrink-0 text-slate-500">
                      {todoRefs.length}T {valRefs.length}V {testRefs.length}S
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ---- Modals ---- */}

      {/* Edit Plan Modal */}
      {editingPlan && (
        <EditModal
          title="Edit Implementation Plan"
          fields={PLAN_FIELDS}
          initialValues={{ plan: impl.plan ?? "" }}
          onSave={handleSavePlan}
          onClose={() => setEditingPlan(false)}
        />
      )}

      {/* Add/Edit Todo Modal */}
      {(addingTodo || editingTodo) && (
        <EditModal
          title={editingTodo ? "Edit Todo" : "Add Todo"}
          fields={TODO_FIELDS}
          initialValues={
            editingTodo
              ? { id: editingTodo.id, description: editingTodo.description, requirementRefs: editingTodo.requirementRefs }
              : undefined
          }
          onSave={handleSaveTodo}
          onClose={() => { setEditingTodo(null); setAddingTodo(false); }}
        />
      )}

      {/* Add/Edit Validation Modal */}
      {(addingValidation || editingValidation) && (
        <EditModal
          title={editingValidation ? "Edit Validation" : "Add Validation"}
          fields={VALIDATION_FIELDS}
          initialValues={
            editingValidation
              ? { id: editingValidation.id, description: editingValidation.description, requirementRefs: editingValidation.requirementRefs }
              : undefined
          }
          onSave={handleSaveValidation}
          onClose={() => { setEditingValidation(null); setAddingValidation(false); }}
        />
      )}

      {/* Add/Edit Test Modal */}
      {(addingTest || editingTest) && (
        <EditModal
          title={editingTest ? "Edit Test" : "Add Test"}
          fields={TEST_FIELDS}
          initialValues={
            editingTest
              ? { id: editingTest.id, description: editingTest.description, type: editingTest.type, requirementRefs: editingTest.requirementRefs }
              : undefined
          }
          onSave={handleSaveTest}
          onClose={() => { setEditingTest(null); setAddingTest(false); }}
        />
      )}

      {/* Delete Todo Confirmation */}
      {confirmDeleteTodo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDeleteTodo(null); }}
          data-testid="delete-todo-confirm-backdrop"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-600 bg-slate-700 p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-100">Delete Todo</h3>
            <p className="mt-2 text-sm text-slate-400">
              Are you sure you want to delete todo <strong>{confirmDeleteTodo}</strong>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteTodo(null)}
                className="rounded-md border border-slate-500 bg-slate-600 px-4 py-2 text-sm font-medium text-slate-300 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTodo(confirmDeleteTodo)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
                data-testid="confirm-delete-todo-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Validation Confirmation */}
      {confirmDeleteValidation && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDeleteValidation(null); }}
          data-testid="delete-validation-confirm-backdrop"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-600 bg-slate-700 p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-100">Delete Validation</h3>
            <p className="mt-2 text-sm text-slate-400">
              Are you sure you want to delete validation <strong>{confirmDeleteValidation}</strong>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteValidation(null)}
                className="rounded-md border border-slate-500 bg-slate-600 px-4 py-2 text-sm font-medium text-slate-300 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteValidation(confirmDeleteValidation)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
                data-testid="confirm-delete-validation-btn"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Test Confirmation */}
      {confirmDeleteTest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setConfirmDeleteTest(null); }}
          data-testid="delete-test-confirm-backdrop"
        >
          <div className="w-full max-w-sm rounded-xl border border-slate-600 bg-slate-700 p-6 shadow-xl">
            <h3 className="text-base font-bold text-slate-100">Delete Test</h3>
            <p className="mt-2 text-sm text-slate-400">
              Are you sure you want to delete test <strong>{confirmDeleteTest}</strong>?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteTest(null)}
                className="rounded-md border border-slate-500 bg-slate-600 px-4 py-2 text-sm font-medium text-slate-300 shadow-sm hover:bg-slate-500 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteTest(confirmDeleteTest)}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 transition-colors cursor-pointer"
                data-testid="confirm-delete-test-btn"
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
