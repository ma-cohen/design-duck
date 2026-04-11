import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { init } from "./init";

describe("init", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `design-duck-test-${Date.now()}`);
    mkdirSync(testDir, { recursive: true });
    process.exitCode = 0;
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
    process.exitCode = 0;
  });

  test("creates design-duck/docs/ directory", () => {
    init(testDir);
    expect(existsSync(join(testDir, "design-duck", "docs"))).toBe(true);
  });

  test("creates AGENTS.md, vision.yaml, and example project requirements.yaml", () => {
    init(testDir);
    const duckDir = join(testDir, "design-duck");
    const docsDir = join(duckDir, "docs");
    expect(existsSync(join(duckDir, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(docsDir, "vision.yaml"))).toBe(true);
    expect(existsSync(join(docsDir, "projects", "example-project", "requirements.yaml"))).toBe(true);
  });

  test("AGENTS.md contains workflow instructions and context commands", () => {
    init(testDir);
    const content = readFileSync(join(testDir, "design-duck", "AGENTS.md"), "utf-8");
    expect(content).toContain("dd context vision");
    expect(content).toContain("dd context projects");
    expect(content).toContain("dd context requirements");
    expect(content).toContain("dd context design");
    expect(content).toContain("dd context choose");
    expect(content).toContain("dd context propagate");
    expect(content).toContain("YAML is the source of truth");
  });

  test("vision.yaml contains vision, mission, and problem fields", () => {
    init(testDir);
    const content = readFileSync(join(testDir, "design-duck", "docs", "vision.yaml"), "utf-8");
    expect(content).toContain("vision:");
    expect(content).toContain("mission:");
    expect(content).toContain("problem:");
  });

  test("example project requirements.yaml contains visionAlignment and empty requirements array", () => {
    init(testDir);
    const content = readFileSync(
      join(testDir, "design-duck", "docs", "projects", "example-project", "requirements.yaml"),
      "utf-8",
    );
    expect(content).toContain("visionAlignment:");
    expect(content).toContain("requirements: []");
  });

  test("aborts with exit code 1 if design-duck/docs/ already exists", () => {
    mkdirSync(join(testDir, "design-duck", "docs"), { recursive: true });
    init(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("does not create files when design-duck/docs/ already exists", () => {
    mkdirSync(join(testDir, "design-duck", "docs"), { recursive: true });
    init(testDir);
    expect(existsSync(join(testDir, "design-duck", "docs", "vision.yaml"))).toBe(false);
  });

  test("does not crash when .git does not exist", () => {
    init(testDir);
    expect(process.exitCode).not.toBe(1);
  });
});
