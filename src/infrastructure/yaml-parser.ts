/**
 * Pure YAML parsing functions for requirement files.
 *
 * These functions are environment-agnostic — they work in both Node/Bun
 * and the browser. They accept raw YAML strings and return validated
 * requirement objects.
 *
 * This module intentionally has NO Node.js imports (no node:fs, node:path)
 * so it can be safely bundled for browser use by Vite.
 */

import { load as parseYaml } from "js-yaml";
import type {
  Vision,
  Requirement,
  ProjectRequirements,
  ContextItem,
  ContextDocument,
  Decision,
  ProjectDesign,
  GeneralValidation,
  GeneralValidations,
  ImplementationTodo,
  ImplementationValidation,
  TestSpec,
  ProjectImplementation,
} from "../domain/requirements/requirement";
import {
  assertRequirement,
  assertContextItem,
  assertDecision,
  assertGeneralValidation,
  assertImplementationTodo,
  assertImplementationValidation,
  assertTestSpec,
} from "../domain/requirements/requirement";

/**
 * Parses a YAML string into a validated Vision object.
 *
 * @param content - Raw YAML string from vision.yaml
 * @returns Validated vision object
 * @throws Error if malformed YAML or validation fails
 */
export function parseVisionYaml(content: string): Vision {
  const parsed = parseYaml(content) as unknown;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("vision.yaml must contain a YAML object");
  }

  const file = parsed as Record<string, unknown>;

  return {
    vision: typeof file.vision === "string" ? file.vision : "",
    mission: typeof file.mission === "string" ? file.mission : "",
    problem: typeof file.problem === "string" ? file.problem : "",
  };
}

/**
 * Parses a YAML string into validated ProjectRequirements (visionAlignment + requirements).
 *
 * @param content - Raw YAML string from a project's requirements.yaml
 * @returns Validated project requirements object
 * @throws Error if malformed YAML or validation fails
 */
export function parseProjectRequirementsYaml(content: string): ProjectRequirements {
  const parsed = parseYaml(content) as unknown;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("requirements.yaml must contain a YAML object");
  }

  const file = parsed as Record<string, unknown>;

  const visionAlignment = typeof file.visionAlignment === "string" ? file.visionAlignment : "";

  const requirements: Requirement[] = [];

  if (Array.isArray(file.requirements)) {
    for (let i = 0; i < file.requirements.length; i++) {
      const raw = file.requirements[i];
      try {
        assertRequirement(raw);
        requirements.push(raw);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`requirements.yaml requirement at index ${i}: ${msg}`);
      }
    }
  }

  return {
    visionAlignment,
    requirements,
  };
}

/**
 * Parses a YAML string into a validated ContextDocument (context items).
 *
 * @param content - Raw YAML string from context.yaml
 * @returns Validated context document
 * @throws Error if malformed YAML or validation fails
 */
export function parseContextYaml(content: string): ContextDocument {
  const parsed = parseYaml(content) as unknown;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("context.yaml must contain a YAML object");
  }

  const file = parsed as Record<string, unknown>;

  const contexts: ContextItem[] = [];

  if (Array.isArray(file.contexts)) {
    for (let i = 0; i < file.contexts.length; i++) {
      const raw = file.contexts[i];
      try {
        assertContextItem(raw);
        contexts.push(raw);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`context.yaml context item at index ${i}: ${msg}`);
      }
    }
  }

  return { contexts };
}

/**
 * Parses a YAML string into a validated ProjectDesign (decisions with options).
 *
 * @param content - Raw YAML string from a project's design.yaml
 * @returns Validated project design object
 * @throws Error if malformed YAML or validation fails
 */
export function parseProjectDesignYaml(content: string): ProjectDesign {
  const parsed = parseYaml(content) as unknown;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("design.yaml must contain a YAML object");
  }

  const file = parsed as Record<string, unknown>;

  if (!Array.isArray(file.decisions)) {
    throw new Error("design.yaml must have a 'decisions' array");
  }

  const decisions: Decision[] = [];

  for (let i = 0; i < file.decisions.length; i++) {
    const raw = file.decisions[i];
    try {
      assertDecision(raw);
      decisions.push(raw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`design.yaml decision at index ${i}: ${msg}`);
    }
  }

  const notes = typeof file.notes === "string" ? file.notes : null;

  return { notes, decisions };
}

/**
 * Parses a YAML string into a validated GeneralValidations object.
 *
 * @param content - Raw YAML string from implementation.yaml (root-level)
 * @returns Validated general validations object
 * @throws Error if malformed YAML or validation fails
 */
export function parseGeneralValidationsYaml(content: string): GeneralValidations {
  const parsed = parseYaml(content) as unknown;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("implementation.yaml must contain a YAML object");
  }

  const file = parsed as Record<string, unknown>;

  if (!Array.isArray(file.validations)) {
    throw new Error("implementation.yaml must have a 'validations' array");
  }

  const validations: GeneralValidation[] = [];

  for (let i = 0; i < file.validations.length; i++) {
    const raw = file.validations[i];
    try {
      assertGeneralValidation(raw);
      validations.push(raw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`implementation.yaml validation at index ${i}: ${msg}`);
    }
  }

  return { validations };
}

/**
 * Parses a YAML string into a validated ProjectImplementation object.
 *
 * @param content - Raw YAML string from a project's implementation.yaml
 * @returns Validated project implementation object
 * @throws Error if malformed YAML or validation fails
 */
export function parseProjectImplementationYaml(content: string): ProjectImplementation {
  const parsed = parseYaml(content) as unknown;

  if (!parsed || typeof parsed !== "object") {
    throw new Error("implementation.yaml must contain a YAML object");
  }

  const file = parsed as Record<string, unknown>;

  const plan = typeof file.plan === "string" ? file.plan : null;

  // Parse todos
  const todos: ImplementationTodo[] = [];
  if (file.todos !== undefined) {
    if (!Array.isArray(file.todos)) {
      throw new Error("implementation.yaml 'todos' must be an array");
    }
    for (let i = 0; i < file.todos.length; i++) {
      const raw = file.todos[i];
      try {
        assertImplementationTodo(raw);
        todos.push(raw);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`implementation.yaml todo at index ${i}: ${msg}`);
      }
    }
  }

  // Parse validations
  const validations: ImplementationValidation[] = [];
  if (file.validations !== undefined) {
    if (!Array.isArray(file.validations)) {
      throw new Error("implementation.yaml 'validations' must be an array");
    }
    for (let i = 0; i < file.validations.length; i++) {
      const raw = file.validations[i];
      try {
        assertImplementationValidation(raw);
        validations.push(raw);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`implementation.yaml validation at index ${i}: ${msg}`);
      }
    }
  }

  // Parse tests
  const tests: TestSpec[] = [];
  if (file.tests !== undefined) {
    if (!Array.isArray(file.tests)) {
      throw new Error("implementation.yaml 'tests' must be an array");
    }
    for (let i = 0; i < file.tests.length; i++) {
      const raw = file.tests[i];
      try {
        assertTestSpec(raw);
        tests.push(raw);
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new Error(`implementation.yaml test at index ${i}: ${msg}`);
      }
    }
  }

  return { plan, todos, validations, tests };
}
