import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readVision, listProjects, readProjectRequirements } from "./file-store";

describe("readVision", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `design-duck-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("parses valid vision.yaml", () => {
    const yaml = `vision: "A world of great requirements"
mission: "Provide tools for requirements"
problem: "Teams struggle with requirements"
`;
    writeFileSync(join(testDir, "vision.yaml"), yaml, "utf-8");

    const vision = readVision(testDir);

    expect(vision.vision).toBe("A world of great requirements");
    expect(vision.mission).toBe("Provide tools for requirements");
    expect(vision.problem).toBe("Teams struggle with requirements");
  });

  test("throws error when vision.yaml not found", () => {
    expect(() => readVision(testDir)).toThrow(/vision.yaml not found/);
  });

  test("throws error when vision.yaml is not valid YAML", () => {
    writeFileSync(join(testDir, "vision.yaml"), "invalid: [yaml", "utf-8");
    expect(() => readVision(testDir)).toThrow();
  });

  test("throws error when vision.yaml is not an object", () => {
    writeFileSync(join(testDir, "vision.yaml"), "just a string", "utf-8");
    expect(() => readVision(testDir)).toThrow(/must contain a YAML object/);
  });

  test("throws error when vision field is missing", () => {
    const yaml = `mission: "m"\nproblem: "p"`;
    writeFileSync(join(testDir, "vision.yaml"), yaml, "utf-8");
    expect(() => readVision(testDir)).toThrow(/vision/);
  });

  test("throws error when file is empty", () => {
    writeFileSync(join(testDir, "vision.yaml"), "", "utf-8");
    expect(() => readVision(testDir)).toThrow(/must contain a YAML object/);
  });
});

describe("listProjects", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `design-duck-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("returns empty array when projects/ directory does not exist", () => {
    expect(listProjects(testDir)).toEqual([]);
  });

  test("returns project directory names", () => {
    const projectsDir = join(testDir, "projects");
    mkdirSync(join(projectsDir, "alpha"), { recursive: true });
    mkdirSync(join(projectsDir, "beta"), { recursive: true });

    const projects = listProjects(testDir);
    expect(projects).toContain("alpha");
    expect(projects).toContain("beta");
    expect(projects).toHaveLength(2);
  });

  test("ignores files in projects/ directory", () => {
    const projectsDir = join(testDir, "projects");
    mkdirSync(projectsDir, { recursive: true });
    mkdirSync(join(projectsDir, "real-project"), { recursive: true });
    writeFileSync(join(projectsDir, "not-a-project.txt"), "hello", "utf-8");

    const projects = listProjects(testDir);
    expect(projects).toEqual(["real-project"]);
  });
});

describe("readProjectRequirements", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `design-duck-test-${Date.now()}`);
    mkdirSync(join(testDir, "projects", "my-project"), { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("parses valid requirements.yaml with single requirement", () => {
    const yaml = `visionAlignment: "Helps achieve the vision by enabling search"
requirements:
  - id: req-001
    description: Users need to search products
    userValue: Reduces time to find products
`;
    writeFileSync(join(testDir, "projects", "my-project", "requirements.yaml"), yaml, "utf-8");

    const result = readProjectRequirements(testDir, "my-project");

    expect(result.visionAlignment).toBe("Helps achieve the vision by enabling search");
    expect(result.requirements).toHaveLength(1);
    expect(result.requirements[0].id).toBe("req-001");
    expect(result.requirements[0].description).toBe("Users need to search products");
    expect(result.requirements[0].userValue).toBe("Reduces time to find products");
  });

  test("parses valid requirements.yaml with multiple requirements", () => {
    const yaml = `visionAlignment: "Helps with search and wishlists"
requirements:
  - id: req-001
    description: Search products
    userValue: Faster search
  - id: req-002
    description: Save wishlist
    userValue: Return to items
`;
    writeFileSync(join(testDir, "projects", "my-project", "requirements.yaml"), yaml, "utf-8");

    const result = readProjectRequirements(testDir, "my-project");

    expect(result.requirements).toHaveLength(2);
    expect(result.requirements[0].id).toBe("req-001");
    expect(result.requirements[1].id).toBe("req-002");
  });

  test("parses empty requirements array", () => {
    const yaml = `visionAlignment: "Some alignment"
requirements: []`;
    writeFileSync(join(testDir, "projects", "my-project", "requirements.yaml"), yaml, "utf-8");

    const result = readProjectRequirements(testDir, "my-project");
    expect(result.requirements).toHaveLength(0);
    expect(result.visionAlignment).toBe("Some alignment");
  });

  test("throws error when requirements.yaml not found", () => {
    expect(() => readProjectRequirements(testDir, "nonexistent")).toThrow(/requirements.yaml not found/);
  });

  test("throws error when requirements.yaml is not valid YAML", () => {
    const yaml = `visionAlignment: "a"\nrequirements: [invalid yaml`;
    writeFileSync(join(testDir, "projects", "my-project", "requirements.yaml"), yaml, "utf-8");
    expect(() => readProjectRequirements(testDir, "my-project")).toThrow();
  });

  test("throws error when requirements.yaml is not an object", () => {
    writeFileSync(join(testDir, "projects", "my-project", "requirements.yaml"), "just a string", "utf-8");
    expect(() => readProjectRequirements(testDir, "my-project")).toThrow(/must contain a YAML object/);
  });

  test("throws error when visionAlignment is missing", () => {
    const yaml = `requirements: []`;
    writeFileSync(join(testDir, "projects", "my-project", "requirements.yaml"), yaml, "utf-8");
    expect(() => readProjectRequirements(testDir, "my-project")).toThrow(/visionAlignment/);
  });

  test("throws error when visionAlignment is empty", () => {
    const yaml = `visionAlignment: ""\nrequirements: []`;
    writeFileSync(join(testDir, "projects", "my-project", "requirements.yaml"), yaml, "utf-8");
    expect(() => readProjectRequirements(testDir, "my-project")).toThrow(/visionAlignment/);
  });

  test("throws error when requirements field is missing", () => {
    const yaml = `visionAlignment: "some alignment"`;
    writeFileSync(join(testDir, "projects", "my-project", "requirements.yaml"), yaml, "utf-8");
    expect(() => readProjectRequirements(testDir, "my-project")).toThrow(/must have a 'requirements' array/);
  });

  test("throws error when requirement has missing userValue", () => {
    const yaml = `visionAlignment: "align"
requirements:
  - id: req-001
    description: x
`;
    writeFileSync(join(testDir, "projects", "my-project", "requirements.yaml"), yaml, "utf-8");
    expect(() => readProjectRequirements(testDir, "my-project")).toThrow(/requirement at index 0/);
    expect(() => readProjectRequirements(testDir, "my-project")).toThrow(/userValue/);
  });

  test("throws error at correct index for second invalid requirement", () => {
    const yaml = `visionAlignment: "align"
requirements:
  - id: req-001
    description: x
    userValue: y
  - id: ""
    description: x
    userValue: y
`;
    writeFileSync(join(testDir, "projects", "my-project", "requirements.yaml"), yaml, "utf-8");
    expect(() => readProjectRequirements(testDir, "my-project")).toThrow(/requirement at index 1/);
  });

  test("throws error when file is empty", () => {
    writeFileSync(join(testDir, "projects", "my-project", "requirements.yaml"), "", "utf-8");
    expect(() => readProjectRequirements(testDir, "my-project")).toThrow(/must contain a YAML object/);
  });

  test("accepts requirement with extra fields (ignores them)", () => {
    const yaml = `visionAlignment: "align"
requirements:
  - id: req-001
    description: x
    userValue: y
    extraField: should be ignored
`;
    writeFileSync(join(testDir, "projects", "my-project", "requirements.yaml"), yaml, "utf-8");
    const result = readProjectRequirements(testDir, "my-project");
    expect(result.requirements).toHaveLength(1);
    expect(result.requirements[0].id).toBe("req-001");
  });
});
