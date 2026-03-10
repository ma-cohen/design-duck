import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { validate } from "./validate";

describe("validate", () => {
  let testDir: string;
  let docsDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `design-duck-test-${Date.now()}`);
    docsDir = join(testDir, "design-duck", "docs");
    mkdirSync(join(docsDir, "projects", "test-project"), { recursive: true });
    process.exitCode = 0;
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    process.exitCode = 0;
  });

  test("exits with code 1 when design-duck/docs/ directory does not exist", () => {
    rmSync(docsDir, { recursive: true });
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("validates valid vision.yaml and project requirements", () => {
    writeFileSync(join(docsDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    writeFileSync(
      join(docsDir, "projects", "test-project", "requirements.yaml"),
      'visionAlignment: "align"\nrequirements: []',
      "utf-8",
    );
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("validates valid project with requirements", () => {
    writeFileSync(join(docsDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    const projectYaml = `visionAlignment: "Helps with search"
requirements:
  - id: req-001
    description: Users need to search products
    userValue: Reduces time to find products
`;
    writeFileSync(join(docsDir, "projects", "test-project", "requirements.yaml"), projectYaml, "utf-8");
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("exits with code 1 when vision.yaml is missing", () => {
    writeFileSync(
      join(docsDir, "projects", "test-project", "requirements.yaml"),
      'visionAlignment: "a"\nrequirements: []',
      "utf-8",
    );
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("passes when vision.yaml has empty fields (brainstorm-only)", () => {
    writeFileSync(join(docsDir, "vision.yaml"), 'vision: ""\nmission: ""\nproblem: ""', "utf-8");
    writeFileSync(
      join(docsDir, "projects", "test-project", "requirements.yaml"),
      'visionAlignment: "a"\nrequirements: []',
      "utf-8",
    );
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("passes when project has empty visionAlignment", () => {
    writeFileSync(join(docsDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    writeFileSync(
      join(docsDir, "projects", "test-project", "requirements.yaml"),
      'visionAlignment: ""\nrequirements: []',
      "utf-8",
    );
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("exits with code 1 when project has invalid requirement", () => {
    writeFileSync(join(docsDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    const projectYaml = `visionAlignment: "align"
requirements:
  - id: req-001
    description: Missing userValue field
`;
    writeFileSync(join(docsDir, "projects", "test-project", "requirements.yaml"), projectYaml, "utf-8");
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("validates multiple projects", () => {
    writeFileSync(join(docsDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    mkdirSync(join(docsDir, "projects", "second-project"), { recursive: true });

    writeFileSync(
      join(docsDir, "projects", "test-project", "requirements.yaml"),
      'visionAlignment: "First"\nrequirements:\n  - id: req-001\n    description: x\n    userValue: y\n',
      "utf-8",
    );
    writeFileSync(
      join(docsDir, "projects", "second-project", "requirements.yaml"),
      'visionAlignment: "Second"\nrequirements:\n  - id: req-002\n    description: a\n    userValue: b\n',
      "utf-8",
    );
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("handles no projects gracefully", () => {
    rmSync(join(docsDir, "projects"), { recursive: true });
    writeFileSync(join(docsDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  // --- Design validation ---

  test("validates valid design.yaml alongside requirements", () => {
    writeFileSync(join(docsDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    writeFileSync(
      join(docsDir, "projects", "test-project", "requirements.yaml"),
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
    writeFileSync(join(docsDir, "projects", "test-project", "design.yaml"), designYaml, "utf-8");
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("passes when project has no design.yaml", () => {
    writeFileSync(join(docsDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    writeFileSync(
      join(docsDir, "projects", "test-project", "requirements.yaml"),
      'visionAlignment: "align"\nrequirements: []',
      "utf-8",
    );
    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("exits with code 1 when design.yaml has invalid content", () => {
    writeFileSync(join(docsDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    writeFileSync(
      join(docsDir, "projects", "test-project", "requirements.yaml"),
      'visionAlignment: "align"\nrequirements: []',
      "utf-8",
    );
    writeFileSync(join(docsDir, "projects", "test-project", "design.yaml"), "just a string", "utf-8");
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("exits with code 1 when design.yaml references unknown requirement", () => {
    writeFileSync(join(docsDir, "vision.yaml"), 'vision: "v"\nmission: "m"\nproblem: "p"', "utf-8");
    writeFileSync(
      join(docsDir, "projects", "test-project", "requirements.yaml"),
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
    writeFileSync(join(docsDir, "projects", "test-project", "design.yaml"), designYaml, "utf-8");
    validate(testDir);
    expect(process.exitCode).toBe(1);
  });
});
