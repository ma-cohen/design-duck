/**
 * Integration tracking utilities.
 *
 * Reads/writes the .integration file in the user's design-duck/ directory
 * and tracks which IDE integration the user has chosen.
 */

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const INTEGRATION_FILENAME = ".integration";
const VALID_INTEGRATIONS = ["claude", "cursor", "both", "tags"] as const;

export type Integration = (typeof VALID_INTEGRATIONS)[number];

/** Path to the .integration file inside design-duck/. */
export function integrationFilePath(targetDir: string = process.cwd()): string {
  return join(targetDir, "design-duck", INTEGRATION_FILENAME);
}

/** Read the integration setting. Returns null if file doesn't exist or content is invalid. */
export function readIntegration(targetDir: string = process.cwd()): Integration | null {
  const filePath = integrationFilePath(targetDir);
  if (!existsSync(filePath)) {
    return null;
  }
  const content = readFileSync(filePath, "utf-8").trim();
  if (!isValidIntegration(content)) {
    return null;
  }
  return content as Integration;
}

/** Write the integration setting to design-duck/.integration. */
export function writeIntegration(targetDir: string = process.cwd(), integration: Integration): void {
  const filePath = integrationFilePath(targetDir);
  writeFileSync(filePath, integration + "\n", "utf-8");
}

/** Check if a string is a valid Integration value. */
function isValidIntegration(value: unknown): value is Integration {
  return typeof value === "string" && VALID_INTEGRATIONS.includes(value as Integration);
}
