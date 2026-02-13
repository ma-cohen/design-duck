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
 * Asserts that a value is a valid Requirement; throws with errors if not.
 */
export function assertRequirement(raw: unknown): asserts raw is Requirement {
  const result = validateRequirement(raw);
  if (!result.valid) {
    throw new Error(`Invalid requirement: ${result.errors.join("; ")}`);
  }
}

// ---------------------------------------------------------------------------
// Design session types and validation
// ---------------------------------------------------------------------------

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
  options: DesignOption[];
  chosen: string | null;
  chosenReason: string | null;
}

/** A project's design document containing decisions. */
export interface ProjectDesign {
  decisions: Decision[];
}

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

  // options: must be an array with at least one option
  if (!Array.isArray(o.options)) {
    errors.push("options must be an array");
  } else if (o.options.length === 0) {
    errors.push("options must have at least one option");
  } else {
    for (let i = 0; i < o.options.length; i++) {
      const optResult = validateDesignOption(o.options[i]);
      if (!optResult.valid) {
        errors.push(`option at index ${i}: ${optResult.errors.join("; ")}`);
      }
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
