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
    writeFileSync(
      join(reqDir, "vision.yaml"),
      'vision: "v"\nmission: "m"\nproblem: "p"',
      "utf-8",
    );
    writeFileSync(
      join(reqDir, "projects", "test-project", "requirements.yaml"),
      'visionAlignment: "align"\nrequirements: []',
      "utf-8",
    );

    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("validates valid project with requirements", () => {
    writeFileSync(
      join(reqDir, "vision.yaml"),
      'vision: "v"\nmission: "m"\nproblem: "p"',
      "utf-8",
    );
    const projectYaml = `visionAlignment: "Helps with search"
requirements:
  - id: req-001
    description: Users need to search products
    userValue: Reduces time to find products
    priority: high
    status: draft
`;
    writeFileSync(
      join(reqDir, "projects", "test-project", "requirements.yaml"),
      projectYaml,
      "utf-8",
    );

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
    writeFileSync(
      join(reqDir, "vision.yaml"),
      'vision: "v"\nmission: "m"\nproblem: "p"',
      "utf-8",
    );
    const projectYaml = `visionAlignment: "align"
requirements:
  - id: req-001
    description: Missing userValue field
    priority: high
    status: draft
`;
    writeFileSync(
      join(reqDir, "projects", "test-project", "requirements.yaml"),
      projectYaml,
      "utf-8",
    );

    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("exits with code 1 when project has invalid priority", () => {
    writeFileSync(
      join(reqDir, "vision.yaml"),
      'vision: "v"\nmission: "m"\nproblem: "p"',
      "utf-8",
    );
    const projectYaml = `visionAlignment: "align"
requirements:
  - id: req-001
    description: Users need to search products
    userValue: Reduces time to find products
    priority: invalid
    status: draft
`;
    writeFileSync(
      join(reqDir, "projects", "test-project", "requirements.yaml"),
      projectYaml,
      "utf-8",
    );

    validate(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("validates multiple projects", () => {
    writeFileSync(
      join(reqDir, "vision.yaml"),
      'vision: "v"\nmission: "m"\nproblem: "p"',
      "utf-8",
    );

    mkdirSync(join(reqDir, "projects", "second-project"), { recursive: true });

    const project1Yaml = `visionAlignment: "First alignment"
requirements:
  - id: req-001
    description: Users need to search products
    userValue: Reduces time to find products
    priority: high
    status: draft
`;
    const project2Yaml = `visionAlignment: "Second alignment"
requirements:
  - id: req-002
    description: Users can save wishlists
    userValue: Increases conversion
    priority: medium
    status: review
`;
    writeFileSync(
      join(reqDir, "projects", "test-project", "requirements.yaml"),
      project1Yaml,
      "utf-8",
    );
    writeFileSync(
      join(reqDir, "projects", "second-project", "requirements.yaml"),
      project2Yaml,
      "utf-8",
    );

    validate(testDir);
    expect(process.exitCode).toBe(0);
  });

  test("handles no projects gracefully", () => {
    rmSync(join(reqDir, "projects"), { recursive: true });
    writeFileSync(
      join(reqDir, "vision.yaml"),
      'vision: "v"\nmission: "m"\nproblem: "p"',
      "utf-8",
    );

    validate(testDir);
    expect(process.exitCode).toBe(0);
  });
});
