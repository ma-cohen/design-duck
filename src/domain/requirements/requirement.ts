/**
 * Requirement domain types and validation.
 *
 * Vision:       requirements/vision.yaml
 * Requirements: requirements/projects/<name>/requirements.yaml
 *
 * Requirements are user-value focused only — no technical/derived requirements.
 */

/** Vision, mission, and core problem statement (vision.yaml). */
export interface Vision {
  /** Optional product/app name displayed in the UI header. */
  productName?: string;
  vision: string;
  mission: string;
  problem: string;
}

/** User-value requirement (per-project requirements.yaml). */
export interface Requirement {
  id: string;
  description: string;
  userValue: string;
}

/** A project's requirements file with vision alignment. */
export interface ProjectRequirements {
  visionAlignment: string;
  requirements: Requirement[];
}

/** A playground's requirements file with a problem statement (no vision alignment). */
export interface PlaygroundRequirements {
  problemStatement: string;
  requirements: Requirement[];
}

// ---------------------------------------------------------------------------
// Context types
// ---------------------------------------------------------------------------

/** A single context item — a one-liner situational fact that informs decisions. */
export interface ContextItem {
  id: string;
  description: string;
}

/** Context document (root-level or per-project context.yaml). */
export interface ContextDocument {
  contexts: ContextItem[];
}

export type ValidationResult =
  | { valid: true }
  | { valid: false; errors: string[] };

function nonEmptyString(value: unknown, field: string): string | null {
  if (typeof value !== "string" || value.trim() === "") {
    return `${field} must be a non-empty string`;
  }
  return null;
}

/**
 * Validates a vision document.
 */
export function validateVision(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== "object") {
    return { valid: false, errors: ["Vision must be an object"] };
  }
  const o = raw as Record<string, unknown>;
  const errors: string[] = [];

  const vErr = nonEmptyString(o.vision, "vision");
  if (vErr) errors.push(vErr);
  const mErr = nonEmptyString(o.mission, "mission");
  if (mErr) errors.push(mErr);
  const pErr = nonEmptyString(o.problem, "problem");
  if (pErr) errors.push(pErr);

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

/**
 * Validates a user-value requirement.
 */
export function validateRequirement(
  raw: unknown,
): ValidationResult {
  if (raw === null || typeof raw !== "object") {
    return { valid: false, errors: ["Requirement must be an object"] };
  }
  const o = raw as Record<string, unknown>;
  const errors: string[] = [];

  const idErr = nonEmptyString(o.id, "id");
  if (idErr) errors.push(idErr);
  const descErr = nonEmptyString(o.description, "description");
  if (descErr) errors.push(descErr);
  const uvErr = nonEmptyString(o.userValue, "userValue");
  if (uvErr) errors.push(uvErr);

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

/**
 * Asserts that a value is a valid Vision; throws with errors if not.
 */
export function assertVision(raw: unknown): asserts raw is Vision {
  const result = validateVision(raw);
  if (!result.valid) {
    throw new Error(`Invalid vision: ${result.errors.join("; ")}`);
  }
}

/**
 * Validates a playground requirements document (problemStatement + requirements[]).
 */
export function validatePlaygroundRequirements(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== "object") {
    return { valid: false, errors: ["PlaygroundRequirements must be an object"] };
  }
  const o = raw as Record<string, unknown>;
  const errors: string[] = [];

  const psErr = nonEmptyString(o.problemStatement, "problemStatement");
  if (psErr) errors.push(psErr);

  if (o.requirements !== undefined && !Array.isArray(o.requirements)) {
    errors.push("requirements must be an array");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

/**
 * Asserts that a value is valid PlaygroundRequirements; throws with errors if not.
 */
export function assertPlaygroundRequirements(raw: unknown): asserts raw is PlaygroundRequirements {
  const result = validatePlaygroundRequirements(raw);
  if (!result.valid) {
    throw new Error(`Invalid playground requirements: ${result.errors.join("; ")}`);
  }
}

/**
 * Asserts that a value is a valid Requirement; throws with errors if not.
 */
export function assertRequirement(raw: unknown): asserts raw is Requirement {
  const result = validateRequirement(raw);
  if (!result.valid) {
    throw new Error(`Invalid requirement: ${result.errors.join("; ")}`);
  }
}

// ---------------------------------------------------------------------------
// Context validation
// ---------------------------------------------------------------------------

/**
 * Validates a context item.
 */
export function validateContextItem(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== "object") {
    return { valid: false, errors: ["ContextItem must be an object"] };
  }
  const o = raw as Record<string, unknown>;
  const errors: string[] = [];

  const idErr = nonEmptyString(o.id, "id");
  if (idErr) errors.push(idErr);
  const descErr = nonEmptyString(o.description, "description");
  if (descErr) errors.push(descErr);

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

/**
 * Asserts that a value is a valid ContextItem; throws with errors if not.
 */
export function assertContextItem(raw: unknown): asserts raw is ContextItem {
  const result = validateContextItem(raw);
  if (!result.valid) {
    throw new Error(`Invalid context item: ${result.errors.join("; ")}`);
  }
}

// ---------------------------------------------------------------------------
// Design session types and validation
// ---------------------------------------------------------------------------

/** Valid decision categories for grouping and coverage tracking. */
export const DECISION_CATEGORIES = [
  "product",        // Form factor, UX patterns, feature scope
  "architecture",   // System structure, code organization, module boundaries
  "technology",     // Language, framework, libraries, runtime
  "data",           // Storage, schema, data flow, caching
  "testing",        // Test strategy, frameworks, coverage
  "infrastructure", // Deployment, CI/CD, hosting, monitoring
  "other",          // Anything that doesn't fit the above
] as const;

/** Decision domain category for grouping and coverage tracking. */
export type DecisionCategory = (typeof DECISION_CATEGORIES)[number];

/** A single design option with pros and cons. */
export interface DesignOption {
  id: string;
  title: string;
  description: string;
  pros: string[];
  cons: string[];
}

/** A design decision with multiple options and an optional chosen option. */
export interface Decision {
  id: string;
  topic: string;
  context: string;
  requirementRefs: string[];
  /** Optional references to context item IDs (root or project-level) that inform this decision. */
  contextRefs?: string[];
  /** Optional references to global design decision IDs that this decision is based on. */
  globalDecisionRefs?: string[];
  /** Optional per-decision research notes, links, and analysis. */
  notes?: string | null;
  options: DesignOption[];
  chosen: string | null;
  chosenReason: string | null;
  /** Decision domain category for grouping and coverage tracking. */
  category: DecisionCategory;
  /** ID of the parent decision whose choice triggered this one (cascading). */
  parentDecisionRef?: string | null;
}

/** A project's design document containing decisions. */
export interface ProjectDesign {
  /** Free-text notes for research, links, analysis, or any context that helps inform decisions. */
  notes: string | null;
  decisions: Decision[];
}

/** Root-level design document for system-wide decisions that all projects must follow. Same shape as ProjectDesign. */
export type GlobalDesign = ProjectDesign;

function stringArray(value: unknown, field: string): string | null {
  if (!Array.isArray(value)) {
    return `${field} must be an array`;
  }
  const bad = value.some(
    (v) => typeof v !== "string" || (v as string).trim() === "",
  );
  if (bad) {
    return `${field} must be an array of non-empty strings`;
  }
  return null;
}

/**
 * Validates a design option.
 */
export function validateDesignOption(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== "object") {
    return { valid: false, errors: ["DesignOption must be an object"] };
  }
  const o = raw as Record<string, unknown>;
  const errors: string[] = [];

  const idErr = nonEmptyString(o.id, "id");
  if (idErr) errors.push(idErr);
  const titleErr = nonEmptyString(o.title, "title");
  if (titleErr) errors.push(titleErr);
  const descErr = nonEmptyString(o.description, "description");
  if (descErr) errors.push(descErr);

  if (!Array.isArray(o.pros)) {
    errors.push("pros must be an array");
  } else {
    const prosErr = stringArray(o.pros, "pros");
    if (prosErr) errors.push(prosErr);
  }

  if (!Array.isArray(o.cons)) {
    errors.push("cons must be an array");
  } else {
    const consErr = stringArray(o.cons, "cons");
    if (consErr) errors.push(consErr);
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

/**
 * Validates a design decision.
 */
export function validateDecision(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== "object") {
    return { valid: false, errors: ["Decision must be an object"] };
  }
  const o = raw as Record<string, unknown>;
  const errors: string[] = [];

  const idErr = nonEmptyString(o.id, "id");
  if (idErr) errors.push(idErr);
  const topicErr = nonEmptyString(o.topic, "topic");
  if (topicErr) errors.push(topicErr);
  const ctxErr = nonEmptyString(o.context, "context");
  if (ctxErr) errors.push(ctxErr);

  // requirementRefs: array of strings (can be empty)
  if (!Array.isArray(o.requirementRefs)) {
    errors.push("requirementRefs must be an array");
  }

  // options: must be an array (can be empty for settled/global decisions)
  if (!Array.isArray(o.options)) {
    errors.push("options must be an array");
  } else if (o.options.length > 0) {
    for (let i = 0; i < o.options.length; i++) {
      const optResult = validateDesignOption(o.options[i]);
      if (!optResult.valid) {
        errors.push(`option at index ${i}: ${optResult.errors.join("; ")}`);
      }
    }
  }

  // contextRefs: optional array of strings
  if (o.contextRefs !== undefined && o.contextRefs !== null) {
    if (!Array.isArray(o.contextRefs)) {
      errors.push("contextRefs must be an array");
    } else {
      const crErr = stringArray(o.contextRefs, "contextRefs");
      if (crErr) errors.push(crErr);
    }
  }

  // globalDecisionRefs: optional array of strings
  if (o.globalDecisionRefs !== undefined && o.globalDecisionRefs !== null) {
    if (!Array.isArray(o.globalDecisionRefs)) {
      errors.push("globalDecisionRefs must be an array");
    } else {
      const gdrErr = stringArray(o.globalDecisionRefs, "globalDecisionRefs");
      if (gdrErr) errors.push(gdrErr);
    }
  }

  // chosen: null or string matching an option id
  if (o.chosen !== null && o.chosen !== undefined && typeof o.chosen !== "string") {
    errors.push("chosen must be a string or null");
  }

  // chosenReason: null or string
  if (o.chosenReason !== null && o.chosenReason !== undefined && typeof o.chosenReason !== "string") {
    errors.push("chosenReason must be a string or null");
  }

  // notes: optional string or null
  if (o.notes !== null && o.notes !== undefined && typeof o.notes !== "string") {
    errors.push("notes must be a string or null");
  }

  // category: required, must be a valid DecisionCategory
  if (typeof o.category !== "string" || !(DECISION_CATEGORIES as readonly string[]).includes(o.category)) {
    errors.push(`category must be one of: ${DECISION_CATEGORIES.join(", ")}`);
  }

  // parentDecisionRef: optional string or null
  if (o.parentDecisionRef !== null && o.parentDecisionRef !== undefined && typeof o.parentDecisionRef !== "string") {
    errors.push("parentDecisionRef must be a string or null");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

/**
 * Asserts that a value is a valid DesignOption; throws with errors if not.
 */
export function assertDesignOption(raw: unknown): asserts raw is DesignOption {
  const result = validateDesignOption(raw);
  if (!result.valid) {
    throw new Error(`Invalid design option: ${result.errors.join("; ")}`);
  }
}

/**
 * Asserts that a value is a valid Decision; throws with errors if not.
 */
export function assertDecision(raw: unknown): asserts raw is Decision {
  const result = validateDecision(raw);
  if (!result.valid) {
    throw new Error(`Invalid decision: ${result.errors.join("; ")}`);
  }
}

// ---------------------------------------------------------------------------
// Implementation types and validation
// ---------------------------------------------------------------------------

/** A root-level general validation that applies to all projects. */
export interface GeneralValidation {
  id: string;
  description: string;
  category: string;
}

/** Root-level general validations document (implementation.yaml). */
export interface GeneralValidations {
  validations: GeneralValidation[];
}

/** A single implementation todo item linked to requirements. */
export interface ImplementationTodo {
  id: string;
  description: string;
  status: "pending" | "in-progress" | "done";
  requirementRefs: string[];
}

/** A project-specific validation linked to requirements. */
export interface ImplementationValidation {
  id: string;
  description: string;
  requirementRefs: string[];
}

/** A test specification linked to requirements. */
export interface TestSpec {
  id: string;
  description: string;
  requirementRefs: string[];
  type: "unit" | "integration" | "e2e";
}

/** A project's implementation document with plan, todos, validations, and tests. */
export interface ProjectImplementation {
  plan: string | null;
  todos: ImplementationTodo[];
  validations: ImplementationValidation[];
  tests: TestSpec[];
}

const VALID_TODO_STATUSES = new Set(["pending", "in-progress", "done"]);
const VALID_TEST_TYPES = new Set(["unit", "integration", "e2e"]);

/**
 * Validates a general validation entry.
 */
export function validateGeneralValidation(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== "object") {
    return { valid: false, errors: ["GeneralValidation must be an object"] };
  }
  const o = raw as Record<string, unknown>;
  const errors: string[] = [];

  const idErr = nonEmptyString(o.id, "id");
  if (idErr) errors.push(idErr);
  const descErr = nonEmptyString(o.description, "description");
  if (descErr) errors.push(descErr);
  const catErr = nonEmptyString(o.category, "category");
  if (catErr) errors.push(catErr);

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

/**
 * Validates an implementation todo item.
 */
export function validateImplementationTodo(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== "object") {
    return { valid: false, errors: ["ImplementationTodo must be an object"] };
  }
  const o = raw as Record<string, unknown>;
  const errors: string[] = [];

  const idErr = nonEmptyString(o.id, "id");
  if (idErr) errors.push(idErr);
  const descErr = nonEmptyString(o.description, "description");
  if (descErr) errors.push(descErr);

  if (typeof o.status !== "string" || !VALID_TODO_STATUSES.has(o.status)) {
    errors.push("status must be one of: pending, in-progress, done");
  }

  if (!Array.isArray(o.requirementRefs)) {
    errors.push("requirementRefs must be an array");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

/**
 * Validates an implementation validation entry.
 */
export function validateImplementationValidation(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== "object") {
    return { valid: false, errors: ["ImplementationValidation must be an object"] };
  }
  const o = raw as Record<string, unknown>;
  const errors: string[] = [];

  const idErr = nonEmptyString(o.id, "id");
  if (idErr) errors.push(idErr);
  const descErr = nonEmptyString(o.description, "description");
  if (descErr) errors.push(descErr);

  if (!Array.isArray(o.requirementRefs)) {
    errors.push("requirementRefs must be an array");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

/**
 * Validates a test specification.
 */
export function validateTestSpec(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== "object") {
    return { valid: false, errors: ["TestSpec must be an object"] };
  }
  const o = raw as Record<string, unknown>;
  const errors: string[] = [];

  const idErr = nonEmptyString(o.id, "id");
  if (idErr) errors.push(idErr);
  const descErr = nonEmptyString(o.description, "description");
  if (descErr) errors.push(descErr);

  if (typeof o.type !== "string" || !VALID_TEST_TYPES.has(o.type)) {
    errors.push("type must be one of: unit, integration, e2e");
  }

  if (!Array.isArray(o.requirementRefs)) {
    errors.push("requirementRefs must be an array");
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }
  return { valid: true };
}

/**
 * Asserts that a value is a valid GeneralValidation; throws with errors if not.
 */
export function assertGeneralValidation(raw: unknown): asserts raw is GeneralValidation {
  const result = validateGeneralValidation(raw);
  if (!result.valid) {
    throw new Error(`Invalid general validation: ${result.errors.join("; ")}`);
  }
}

/**
 * Asserts that a value is a valid ImplementationTodo; throws with errors if not.
 */
export function assertImplementationTodo(raw: unknown): asserts raw is ImplementationTodo {
  const result = validateImplementationTodo(raw);
  if (!result.valid) {
    throw new Error(`Invalid implementation todo: ${result.errors.join("; ")}`);
  }
}

/**
 * Asserts that a value is a valid ImplementationValidation; throws with errors if not.
 */
export function assertImplementationValidation(raw: unknown): asserts raw is ImplementationValidation {
  const result = validateImplementationValidation(raw);
  if (!result.valid) {
    throw new Error(`Invalid implementation validation: ${result.errors.join("; ")}`);
  }
}

/**
 * Asserts that a value is a valid TestSpec; throws with errors if not.
 */
export function assertTestSpec(raw: unknown): asserts raw is TestSpec {
  const result = validateTestSpec(raw);
  if (!result.valid) {
    throw new Error(`Invalid test spec: ${result.errors.join("; ")}`);
  }
}
