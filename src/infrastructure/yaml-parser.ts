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
import type { Vision, Requirement, ProjectRequirements, Decision, ProjectDesign } from "../domain/requirements/requirement";
import {
  assertVision,
  assertRequirement,
  assertDecision,
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

  try {
    assertVision(parsed);
    return parsed;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`vision.yaml: ${msg}`);
  }
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

  if (typeof file.visionAlignment !== "string" || file.visionAlignment.trim() === "") {
    throw new Error("requirements.yaml must have a non-empty 'visionAlignment' string");
  }

  if (!Array.isArray(file.requirements)) {
    throw new Error("requirements.yaml must have a 'requirements' array");
  }

  const requirements: Requirement[] = [];

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

  return {
    visionAlignment: file.visionAlignment as string,
    requirements,
  };
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
