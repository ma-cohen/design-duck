import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { readVision, listProjects, readProjectRequirements, readProjectDesign } from "./file-store";

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

  test("defaults missing vision fields to empty string", () => {
    const yaml = `mission: "m"\nproblem: "p"`;
    writeFileSync(join(testDir, "vision.yaml"), yaml, "utf-8");
    const vision = readVision(testDir);
    expect(vision.vision).toBe("");
    expect(vision.mission).toBe("m");
    expect(vision.problem).toBe("p");
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

  test("defaults missing visionAlignment to empty string", () => {
    const yaml = `requirements: []`;
    writeFileSync(join(testDir, "projects", "my-project", "requirements.yaml"), yaml, "utf-8");
    const result = readProjectRequirements(testDir, "my-project");
    expect(result.visionAlignment).toBe("");
    expect(result.requirements).toHaveLength(0);
  });

  test("accepts empty visionAlignment", () => {
    const yaml = `visionAlignment: ""\nrequirements: []`;
    writeFileSync(join(testDir, "projects", "my-project", "requirements.yaml"), yaml, "utf-8");
    const result = readProjectRequirements(testDir, "my-project");
    expect(result.visionAlignment).toBe("");
  });

  test("defaults missing requirements field to empty array", () => {
    const yaml = `visionAlignment: "some alignment"`;
    writeFileSync(join(testDir, "projects", "my-project", "requirements.yaml"), yaml, "utf-8");
    const result = readProjectRequirements(testDir, "my-project");
    expect(result.visionAlignment).toBe("some alignment");
    expect(result.requirements).toHaveLength(0);
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

describe("readProjectDesign", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `design-duck-test-${Date.now()}`);
    mkdirSync(join(testDir, "projects", "my-project"), { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("returns null when design.yaml does not exist", () => {
    const result = readProjectDesign(testDir, "my-project");
    expect(result).toBeNull();
  });

  test("parses valid design.yaml with one decision", () => {
    const yaml = `decisions:
  - id: dec-001
    topic: Search Technology
    context: We need fast search
    requirementRefs:
      - req-001
    options:
      - id: opt-a
        title: Elasticsearch
        description: Dedicated search engine
        pros:
          - Fast search
        cons:
          - Complex setup
    chosen: opt-a
    chosenReason: Performance is critical
`;
    writeFileSync(join(testDir, "projects", "my-project", "design.yaml"), yaml, "utf-8");

    const result = readProjectDesign(testDir, "my-project");
    expect(result).not.toBeNull();
    expect(result!.decisions).toHaveLength(1);
    expect(result!.decisions[0].id).toBe("dec-001");
    expect(result!.decisions[0].topic).toBe("Search Technology");
    expect(result!.decisions[0].options).toHaveLength(1);
    expect(result!.decisions[0].chosen).toBe("opt-a");
  });

  test("parses design with null chosen fields", () => {
    const yaml = `decisions:
  - id: dec-001
    topic: Undecided topic
    context: Still exploring
    requirementRefs: []
    options:
      - id: opt-a
        title: Option A
        description: First option
        pros:
          - Pro A
        cons:
          - Con A
    chosen: null
    chosenReason: null
`;
    writeFileSync(join(testDir, "projects", "my-project", "design.yaml"), yaml, "utf-8");

    const result = readProjectDesign(testDir, "my-project");
    expect(result).not.toBeNull();
    expect(result!.decisions[0].chosen).toBeNull();
    expect(result!.decisions[0].chosenReason).toBeNull();
  });

  test("throws error for invalid design.yaml content", () => {
    writeFileSync(join(testDir, "projects", "my-project", "design.yaml"), "just a string", "utf-8");
    expect(() => readProjectDesign(testDir, "my-project")).toThrow(/must contain a YAML object/);
  });

  test("throws error when decisions field is missing", () => {
    writeFileSync(join(testDir, "projects", "my-project", "design.yaml"), "something: else", "utf-8");
    expect(() => readProjectDesign(testDir, "my-project")).toThrow(/must have a 'decisions' array/);
  });

  test("throws error when a decision has invalid option", () => {
    const yaml = `decisions:
  - id: dec-001
    topic: Topic
    context: Context
    requirementRefs: []
    options:
      - id: ""
        title: Bad option
        description: Missing id
        pros: []
        cons: []
    chosen: null
    chosenReason: null
`;
    writeFileSync(join(testDir, "projects", "my-project", "design.yaml"), yaml, "utf-8");
    expect(() => readProjectDesign(testDir, "my-project")).toThrow(/decision at index 0/);
  });

  test("returns null for nonexistent project directory", () => {
    const result = readProjectDesign(testDir, "nonexistent");
    expect(result).toBeNull();
  });
});
