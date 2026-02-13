import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { validate } from "./validate";

describe("validate", () => {
  let testDir: string;
  let reqDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `design-duck-test-${Date.now()}`);
    reqDir = join(testDir, "desgin-duck", "requirements");
    mkdirSync(join(reqDir, "projects", "test-project"), { recursive: true });
    process.exitCode = 0;
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    process.exitCode = 0;
  });

  test("exits with code 1 when desgin-duck/requirements/ directory does not exist", () => {
    rmSync(reqDir, { recursive: true });
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("validates valid vision.yaml and project requirements", () => {
    writeFileSync(join(reqDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    writeFileSync(
      join(reqDir, "projects", "test-project", "requirements.yaml"),
      'visionAlignment: "align"\nrequirements: []',
      "utf-8",
    );
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("validates valid project with requirements", () => {
    writeFileSync(join(reqDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    const projectYaml = `visionAlignment: "Helps with search"
requirements:
  - id: req-001
    description: Users need to search products
    userValue: Reduces time to find products
`;
    writeFileSync(join(reqDir, "projects", "test-project", "requirements.yaml"), projectYaml, "utf-8");
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("exits with code 1 when vision.yaml is missing", () => {
    writeFileSync(
      join(reqDir, "projects", "test-project", "requirements.yaml"),
      'visionAlignment: "a"\nrequirements: []',
      "utf-8",
    );
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("exits with code 1 when vision.yaml has invalid content", () => {
    writeFileSync(join(reqDir, "vision.yaml"), 'vision: ""\nmission: "m"\nproblem: "p"', "utf-8");
    writeFileSync(
      join(reqDir, "projects", "test-project", "requirements.yaml"),
      'visionAlignment: "a"\nrequirements: []',
      "utf-8",
    );
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("exits with code 1 when project has invalid requirement", () => {
    writeFileSync(join(reqDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    const projectYaml = `visionAlignment: "align"
requirements:
  - id: req-001
    description: Missing userValue field
`;
    writeFileSync(join(reqDir, "projects", "test-project", "requirements.yaml"), projectYaml, "utf-8");
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("validates multiple projects", () => {
    writeFileSync(join(reqDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    mkdirSync(join(reqDir, "projects", "second-project"), { recursive: true });

    writeFileSync(
      join(reqDir, "projects", "test-project", "requirements.yaml"),
      'visionAlignment: "First"\nrequirements:\n  - id: req-001\n    description: x\n    userValue: y\n',
      "utf-8",
    );
    writeFileSync(
      join(reqDir, "projects", "second-project", "requirements.yaml"),
      'visionAlignment: "Second"\nrequirements:\n  - id: req-002\n    description: a\n    userValue: b\n',
      "utf-8",
    );
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("handles no projects gracefully", () => {
    rmSync(join(reqDir, "projects"), { recursive: true });
    writeFileSync(join(reqDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  // --- Design validation ---

  test("validates valid design.yaml alongside requirements", () => {
    writeFileSync(join(reqDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    writeFileSync(
      join(reqDir, "projects", "test-project", "requirements.yaml"),
      'visionAlignment: "align"\nrequirements:\n  - id: req-001\n    description: x\n    userValue: y\n',
      "utf-8",
    );
    const designYaml = `decisions:
  - id: dec-001
    topic: Topic
    context: Context
    requirementRefs:
      - req-001
    options:
      - id: opt-a
        title: Option A
        description: Description
        pros:
          - Pro
        cons:
          - Con
    chosen: opt-a
    chosenReason: Good reason
`;
    writeFileSync(join(reqDir, "projects", "test-project", "design.yaml"), designYaml, "utf-8");
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("passes when project has no design.yaml", () => {
    writeFileSync(join(reqDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    writeFileSync(
      join(reqDir, "projects", "test-project", "requirements.yaml"),
      'visionAlignment: "align"\nrequirements: []',
      "utf-8",
    );
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("exits with code 1 when design.yaml has invalid content", () => {
    writeFileSync(join(reqDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    writeFileSync(
      join(reqDir, "projects", "test-project", "requirements.yaml"),
      'visionAlignment: "align"\nrequirements: []',
      "utf-8",
    );
    writeFileSync(join(reqDir, "projects", "test-project", "design.yaml"), "just a string", "utf-8");
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("exits with code 1 when design.yaml references unknown requirement", () => {
    writeFileSync(join(reqDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    writeFileSync(
      join(reqDir, "projects", "test-project", "requirements.yaml"),
      'visionAlignment: "align"\nrequirements:\n  - id: req-001\n    description: x\n    userValue: y\n',
      "utf-8",
    );
    const designYaml = `decisions:
  - id: dec-001
    topic: Topic
    context: Context
    requirementRefs:
      - req-999
    options:
      - id: opt-a
        title: Option A
        description: Description
        pros:
          - Pro
        cons:
          - Con
    chosen: null
    chosenReason: null
`;
    writeFileSync(join(reqDir, "projects", "test-project", "design.yaml"), designYaml, "utf-8");
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });
});
