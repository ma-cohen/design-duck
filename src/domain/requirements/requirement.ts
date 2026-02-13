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
