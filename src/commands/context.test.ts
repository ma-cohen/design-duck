import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { context, PHASES } from "./context";

describe("context command", () => {
  let testDir: string;
  let docsDir: string;
  let originalStdoutWrite: typeof process.stdout.write;
  let capturedOutput: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `design-duck-ctx-cmd-test-${Date.now()}`);
    docsDir = join(testDir, "desgin-duck", "docs");
    mkdirSync(join(docsDir, "projects"), { recursive: true });
    process.exitCode = 0;

    // Capture stdout
    capturedOutput = "";
    originalStdoutWrite = process.stdout.write;
    process.stdout.write = ((chunk: string | Uint8Array) => {
      capturedOutput += typeof chunk === "string" ? chunk : new TextDecoder().decode(chunk);
      return true;
    }) as typeof process.stdout.write;
  });

  afterEach(() => {
    process.stdout.write = originalStdoutWrite;
    rmSync(testDir, { recursive: true, force: true });
    process.exitCode = 0;
  });

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
      `visionAlignment: "Aligns"\nrequirements:\n  - id: REQ-001\n    description: "Test req"\n    userValue: "Test value"\n`,
      "utf-8",
    );
  }

  test("PHASES exports all 12 phases", () => {
    expect(PHASES).toHaveLength(12);
    expect(PHASES).toContain("vision");
    expect(PHASES).toContain("projects");
    expect(PHASES).toContain("requirements");
    expect(PHASES).toContain("design");
    expect(PHASES).toContain("choose");
    expect(PHASES).toContain("implementation");
    expect(PHASES).toContain("validations");
    expect(PHASES).toContain("playground");
    expect(PHASES).toContain("playground-requirements");
    expect(PHASES).toContain("playground-design");
    expect(PHASES).toContain("playground-choose");
    expect(PHASES).toContain("playground-implementation");
  });

  test("prints usage and sets exit code for unknown phase", () => {
    context(["unknown"], testDir);
    expect(process.exitCode).toBe(1);
  });

  test("prints usage and sets exit code for no arguments", () => {
    context([], testDir);
    expect(process.exitCode).toBe(1);
  });

  test("errors when project-phase is missing project name", () => {
    context(["requirements"], testDir);
    expect(process.exitCode).toBe(1);
  });

  test("errors when requirements dir does not exist for non-vision phase", () => {
    const emptyDir = join(tmpdir(), `empty-${Date.now()}`);
    mkdirSync(emptyDir, { recursive: true });
    context(["projects"], emptyDir);
    expect(process.exitCode).toBe(1);
    rmSync(emptyDir, { recursive: true, force: true });
  });

  test("vision phase outputs to stdout", () => {
    writeVision();
    context(["vision"], testDir);
    expect(process.exitCode).toBe(0);
    expect(capturedOutput).toContain("# Vision Definition");
    expect(capturedOutput).toContain("Test vision");
  });

  test("projects phase outputs to stdout", () => {
    writeVision();
    context(["projects"], testDir);
    expect(process.exitCode).toBe(0);
    expect(capturedOutput).toContain("# Project Breakdown");
  });

  test("requirements phase outputs to stdout", () => {
    writeVision();
    writeProject("my-app");
    context(["requirements", "my-app"], testDir);
    expect(process.exitCode).toBe(0);
    expect(capturedOutput).toContain("# Requirements Gathering: my-app");
  });

  test("handles generator errors gracefully", () => {
    writeVision();
    // No requirements for this project
    context(["design", "nonexistent"], testDir);
    expect(process.exitCode).toBe(1);
  });
});
