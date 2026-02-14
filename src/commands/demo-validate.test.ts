import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { join } from "node:path";

import { validate } from "./validate";

/**
 * Validates the demo project's YAML files using the validate command.
 * This ensures the demo data shipped with the repo is always valid.
 */
describe("demo project validation", () => {
  beforeEach(() => {
    process.exitCode = 0;
  });

  afterEach(() => {
    process.exitCode = 0;
  });

  test("demo project passes validation with exit code 0", () => {
    const demoDir = join(import.meta.dirname ?? ".", "..", "..", "demo");
    validate(demoDir);
    expect(process.exitCode).toBe(0);
  });
});
