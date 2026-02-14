import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  generateVisionContext,
  generateProjectsContext,
  generateRequirementsContext,
  generateDesignContext,
  generateChooseContext,
  generateImplementationContext,
  generateValidationsContext,
} from "./context-generator";

describe("context-generator", () => {
  let docsDir: string;

  beforeEach(() => {
    const testDir = join(tmpdir(), `design-duck-ctx-test-${Date.now()}`);
    docsDir = join(testDir, "docs");
    mkdirSync(join(docsDir, "projects"), { recursive: true });
  });

  afterEach(() => {
    // Clean up from docsDir parent (testDir)
    rmSync(join(docsDir, ".."), { recursive: true, force: true });
  });

  // -----------------------------------------------------------------------
  // Helper to set up common fixtures
  // -----------------------------------------------------------------------

  function writeVision(): void {
    writeFileSync(
      join(docsDir, "vision.yaml"),
      'vision: "Test vision"\nmission: "Test mission"\nproblem: "Test problem"\n',
      "utf-8",
    );
  }

  function writeProject(name: string): void {
    const projDir = join(docsDir, "projects", name);
    mkdirSync(projDir, { recursive: true });
    writeFileSync(
      join(projDir, "requirements.yaml"),
      `visionAlignment: "Aligns with vision"\nrequirements:\n  - id: REQ-001\n    description: "Do something"\n    userValue: "User benefits"\n`,
      "utf-8",
    );
  }

  function writeProjectDesign(name: string): void {
    const projDir = join(docsDir, "projects", name);
    writeFileSync(
      join(projDir, "design.yaml"),
      `notes: null\ndecisions:\n  - id: DEC-TEST-001\n    topic: "Some topic"\n    context: "Some context"\n    requirementRefs: [REQ-001]\n    options:\n      - id: opt-a\n        title: "Option A"\n        description: "First option"\n        pros: ["Fast"]\n        cons: ["Complex"]\n      - id: opt-b\n        title: "Option B"\n        description: "Second option"\n        pros: ["Simple"]\n        cons: ["Slow"]\n    chosen: null\n    chosenReason: null\n`,
      "utf-8",
    );
  }

  function writeGlobalDesign(): void {
    writeFileSync(
      join(docsDir, "design.yaml"),
      `notes: null\ndecisions:\n  - id: DEC-GLOBAL-001\n    topic: "Global topic"\n    context: "Global context"\n    requirementRefs: []\n    options:\n      - id: g-opt-a\n        title: "Global Option A"\n        description: "A global option"\n        pros: ["Consistent"]\n        cons: ["Rigid"]\n    chosen: g-opt-a\n    chosenReason: "Best for consistency"\n`,
      "utf-8",
    );
  }

  function writeGlobalValidations(): void {
    writeFileSync(
      join(docsDir, "implementation.yaml"),
      `validations:\n  - id: VAL-GENERAL-001\n    description: "All code must pass linting"\n    category: linting\n`,
      "utf-8",
    );
  }

  // -----------------------------------------------------------------------
  // Vision
  // -----------------------------------------------------------------------

  describe("generateVisionContext", () => {
    test("generates prompt even without vision.yaml", () => {
      const output = generateVisionContext(docsDir);
      expect(output).toContain("# Vision Definition");
      expect(output).toContain("empty or does not yet have content");
    });

    test("includes current vision content when file exists", () => {
      writeVision();
      const output = generateVisionContext(docsDir);
      expect(output).toContain("# Vision Definition");
      expect(output).toContain("Test vision");
      expect(output).toContain("Test mission");
      expect(output).toContain("Refine or rewrite");
    });
  });

  // -----------------------------------------------------------------------
  // Projects
  // -----------------------------------------------------------------------

  describe("generateProjectsContext", () => {
    test("throws when vision.yaml is missing", () => {
      expect(() => generateProjectsContext(docsDir)).toThrow("vision.yaml not found");
    });

    test("generates prompt with no existing projects", () => {
      writeVision();
      const output = generateProjectsContext(docsDir);
      expect(output).toContain("# Project Breakdown");
      expect(output).toContain("No projects exist yet");
      expect(output).toContain("Test vision");
    });

    test("lists existing projects", () => {
      writeVision();
      writeProject("my-app");
      const output = generateProjectsContext(docsDir);
      expect(output).toContain("my-app");
      expect(output).toContain("already exist");
    });
  });

  // -----------------------------------------------------------------------
  // Requirements
  // -----------------------------------------------------------------------

  describe("generateRequirementsContext", () => {
    test("throws when vision.yaml is missing", () => {
      expect(() => generateRequirementsContext(docsDir, "test")).toThrow(
        "vision.yaml not found",
      );
    });

    test("generates prompt for new project (no requirements yet)", () => {
      writeVision();
      const projDir = join(docsDir, "projects", "new-proj");
      mkdirSync(projDir, { recursive: true });
      const output = generateRequirementsContext(docsDir, "new-proj");
      expect(output).toContain("# Requirements Gathering: new-proj");
      expect(output).toContain("No requirements defined yet");
    });

    test("includes existing requirements", () => {
      writeVision();
      writeProject("my-app");
      const output = generateRequirementsContext(docsDir, "my-app");
      expect(output).toContain("REQ-001");
      expect(output).toContain("Do something");
    });
  });

  // -----------------------------------------------------------------------
  // Design Brainstorm
  // -----------------------------------------------------------------------

  describe("generateDesignContext", () => {
    test("throws when vision.yaml is missing", () => {
      expect(() => generateDesignContext(docsDir, "test")).toThrow(
        "vision.yaml not found",
      );
    });

    test("throws when project requirements are missing", () => {
      writeVision();
      expect(() => generateDesignContext(docsDir, "no-proj")).toThrow(
        'requirements.yaml not found for project "no-proj"',
      );
    });

    test("generates design prompt with requirements", () => {
      writeVision();
      writeProject("my-app");
      const output = generateDesignContext(docsDir, "my-app");
      expect(output).toContain("# Design Brainstorm: my-app");
      expect(output).toContain("REQ-001");
      expect(output).toContain("Do something");
    });

    test("includes global design when present", () => {
      writeVision();
      writeProject("my-app");
      writeGlobalDesign();
      const output = generateDesignContext(docsDir, "my-app");
      expect(output).toContain("Global Design Decisions");
      expect(output).toContain("DEC-GLOBAL-001");
    });

    test("includes global validations when present", () => {
      writeVision();
      writeProject("my-app");
      writeGlobalValidations();
      const output = generateDesignContext(docsDir, "my-app");
      expect(output).toContain("Global Validations");
      expect(output).toContain("VAL-GENERAL-001");
    });
  });

  // -----------------------------------------------------------------------
  // Choose Design
  // -----------------------------------------------------------------------

  describe("generateChooseContext", () => {
    test("throws when design.yaml is missing", () => {
      writeVision();
      writeProject("my-app");
      expect(() => generateChooseContext(docsDir, "my-app")).toThrow(
        'design.yaml not found for project "my-app"',
      );
    });

    test("generates choose prompt with design options", () => {
      writeVision();
      writeProject("my-app");
      writeProjectDesign("my-app");
      const output = generateChooseContext(docsDir, "my-app");
      expect(output).toContain("# Design Decision Review: my-app");
      expect(output).toContain("Option A");
      expect(output).toContain("Option B");
      expect(output).toContain("chosen");
    });
  });

  // -----------------------------------------------------------------------
  // Implementation
  // -----------------------------------------------------------------------

  describe("generateImplementationContext", () => {
    test("throws when requirements are missing", () => {
      writeVision();
      expect(() => generateImplementationContext(docsDir, "no-proj")).toThrow(
        'requirements.yaml not found for project "no-proj"',
      );
    });

    test("generates implementation prompt with all context", () => {
      writeVision();
      writeProject("my-app");
      writeProjectDesign("my-app");
      writeGlobalDesign();
      writeGlobalValidations();
      const output = generateImplementationContext(docsDir, "my-app");
      expect(output).toContain("# Implementation Plan: my-app");
      expect(output).toContain("REQ-001");
      expect(output).toContain("DEC-TEST-001");
      expect(output).toContain("DEC-GLOBAL-001");
      expect(output).toContain("VAL-GENERAL-001");
    });

    test("works without optional design files", () => {
      writeVision();
      writeProject("my-app");
      const output = generateImplementationContext(docsDir, "my-app");
      expect(output).toContain("# Implementation Plan: my-app");
      expect(output).toContain("No design decisions have been made yet");
    });
  });

  // -----------------------------------------------------------------------
  // Validations
  // -----------------------------------------------------------------------

  describe("generateValidationsContext", () => {
    test("throws when vision.yaml is missing", () => {
      expect(() => generateValidationsContext(docsDir)).toThrow(
        "vision.yaml not found",
      );
    });

    test("generates prompt with no projects", () => {
      writeVision();
      const output = generateValidationsContext(docsDir);
      expect(output).toContain("# Global Validations");
      expect(output).toContain("No projects defined yet");
    });

    test("includes project summaries", () => {
      writeVision();
      writeProject("my-app");
      writeProjectDesign("my-app");
      const output = generateValidationsContext(docsDir);
      expect(output).toContain("my-app");
      expect(output).toContain("1 requirement(s)");
      expect(output).toContain("1 design decision(s)");
    });

    test("includes existing validations", () => {
      writeVision();
      writeGlobalValidations();
      const output = generateValidationsContext(docsDir);
      expect(output).toContain("VAL-GENERAL-001");
      expect(output).toContain("Refine or extend");
    });
  });
});
