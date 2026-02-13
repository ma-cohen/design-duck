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

  test("creates desgin-duck/requirements/ directory", () => {
    init(testDir);
    expect(existsSync(join(testDir, "desgin-duck", "requirements"))).toBe(true);
  });

  test("creates AGENTS.md, vision.yaml, and example project requirements.yaml", () => {
    init(testDir);
    const duckDir = join(testDir, "desgin-duck");
    const reqDir = join(duckDir, "requirements");
    expect(existsSync(join(duckDir, "AGENTS.md"))).toBe(true);
    expect(existsSync(join(reqDir, "vision.yaml"))).toBe(true);
    expect(existsSync(join(reqDir, "projects", "example-project", "requirements.yaml"))).toBe(true);
  });

  test("AGENTS.md contains workflow instructions and context commands", () => {
    init(testDir);
    const content = readFileSync(join(testDir, "desgin-duck", "AGENTS.md"), "utf-8");
    expect(content).toContain("design-duck context vision");
    expect(content).toContain("design-duck context projects");
    expect(content).toContain("design-duck context requirements");
    expect(content).toContain("design-duck context design");
    expect(content).toContain("design-duck context choose");
    expect(content).toContain("design-duck context implementation");
    expect(content).toContain("design-duck context validations");
    expect(content).toContain("YAML is the source of truth");
  });

  test("vision.yaml contains vision, mission, and problem fields", () => {
    init(testDir);
    const content = readFileSync(join(testDir, "desgin-duck", "requirements", "vision.yaml"), "utf-8");
    expect(content).toContain("vision:");
    expect(content).toContain("mission:");
    expect(content).toContain("problem:");
  });

  test("example project requirements.yaml contains visionAlignment and empty requirements array", () => {
    init(testDir);
    const content = readFileSync(
      join(testDir, "desgin-duck", "requirements", "projects", "example-project", "requirements.yaml"),
      "utf-8",
    );
    expect(content).toContain("visionAlignment:");
    expect(content).toContain("requirements: []");
  });

  test("aborts with exit code 1 if desgin-duck/requirements/ already exists", () => {
    mkdirSync(join(testDir, "desgin-duck", "requirements"), { recursive: true });
    init(testDir);
    expect(process.exitCode).toBe(1);
  });

  test("does not create files when desgin-duck/requirements/ already exists", () => {
    mkdirSync(join(testDir, "desgin-duck", "requirements"), { recursive: true });
    init(testDir);
    expect(existsSync(join(testDir, "desgin-duck", "requirements", "vision.yaml"))).toBe(false);
  });

  test("initializes git repo when .git does not exist", () => {
    init(testDir);
    expect(existsSync(join(testDir, ".git"))).toBe(true);
  });

  test("skips git init when .git already exists", () => {
    mkdirSync(join(testDir, ".git"));
    init(testDir);
    // .git should still be a plain directory (not replaced by real git init)
    expect(existsSync(join(testDir, ".git", "HEAD"))).toBe(false);
  });
});
