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
    init(testDir, "tags");
    expect(existsSync(join(testDir, "design-duck", "docs"))).toBe(true);
  });

  test("creates vision.yaml and example project requirements.yaml", () => {
    init(testDir, "tags");
    const duckDir = join(testDir, "design-duck");
    const docsDir = join(duckDir, "docs");
    expect(existsSync(join(docsDir, "vision.yaml"))).toBe(true);
    expect(existsSync(join(docsDir, "projects", "example-project", "requirements.yaml"))).toBe(true);
  });

  test("does not create AGENTS.md", () => {
    init(testDir, "tags");
    expect(existsSync(join(testDir, "design-duck", "AGENTS.md"))).toBe(false);
  });

  test("creates dd-new.md, dd-extend.md, and dd-chat.md command files", () => {
    init(testDir, "tags");
    const commandsDir = join(testDir, "design-duck", "commands");
    expect(existsSync(join(commandsDir, "dd-new.md"))).toBe(true);
    expect(existsSync(join(commandsDir, "dd-extend.md"))).toBe(true);
    expect(existsSync(join(commandsDir, "dd-chat.md"))).toBe(true);
  });

  test("dd-new.md contains context commands and workflow instructions", () => {
    init(testDir, "tags");
    const content = readFileSync(join(testDir, "design-duck", "commands", "dd-new.md"), "utf-8");
    expect(content).toContain("dd context new");
    expect(content).toContain("YAML is the source of truth");
  });

  test("vision.yaml contains vision, mission, and problem fields", () => {
    init(testDir, "tags");
    const content = readFileSync(join(testDir, "design-duck", "docs", "vision.yaml"), "utf-8");
    expect(content).toContain("vision:");
    expect(content).toContain("mission:");
    expect(content).toContain("problem:");
  });

  test("example project requirements.yaml contains visionAlignment and empty requirements array", () => {
    init(testDir, "tags");
    const content = readFileSync(
      join(testDir, "design-duck", "docs", "projects", "example-project", "requirements.yaml"),
      "utf-8",
    );
    expect(content).toContain("visionAlignment:");
    expect(content).toContain("requirements: []");
  });

  test("aborts with exit code 1 if design-duck/docs/ already exists", () => {
    mkdirSync(join(testDir, "design-duck", "docs"), { recursive: true });
    init(testDir, "tags");
    expect(process.exitCode).toBe(1);
  });

  test("does not create files when design-duck/docs/ already exists", () => {
    mkdirSync(join(testDir, "design-duck", "docs"), { recursive: true });
    init(testDir, "tags");
    expect(existsSync(join(testDir, "design-duck", "docs", "vision.yaml"))).toBe(false);
  });

  test("does not crash when .git does not exist", () => {
    init(testDir, "tags");
    expect(process.exitCode).not.toBe(1);
  });

  // ---------------------------------------------------------------------------
  // Claude integration
  // ---------------------------------------------------------------------------

  test("init claude creates .claude/commands/dd-new.md, dd-extend.md, dd-chat.md", () => {
    init(testDir, "claude");
    const claudeCommandsDir = join(testDir, ".claude", "commands");
    expect(existsSync(join(claudeCommandsDir, "dd-new.md"))).toBe(true);
    expect(existsSync(join(claudeCommandsDir, "dd-extend.md"))).toBe(true);
    expect(existsSync(join(claudeCommandsDir, "dd-chat.md"))).toBe(true);
  });

  test("init claude does NOT create design-duck/commands/", () => {
    init(testDir, "claude");
    expect(existsSync(join(testDir, "design-duck", "commands"))).toBe(false);
  });

  test(".claude/commands/dd-new.md contains $ARGUMENTS", () => {
    init(testDir, "claude");
    const content = readFileSync(join(testDir, ".claude", "commands", "dd-new.md"), "utf-8");
    expect(content).toContain("$ARGUMENTS");
  });

  test("init claude saves design-duck/.integration with value 'claude'", () => {
    init(testDir, "claude");
    const integration = readFileSync(join(testDir, "design-duck", ".integration"), "utf-8").trim();
    expect(integration).toBe("claude");
  });

  // ---------------------------------------------------------------------------
  // Cursor integration
  // ---------------------------------------------------------------------------

  test("init cursor creates .cursor/commands/ files", () => {
    init(testDir, "cursor");
    const cursorCommandsDir = join(testDir, ".cursor", "commands");
    expect(existsSync(join(cursorCommandsDir, "dd-new.md"))).toBe(true);
    expect(existsSync(join(cursorCommandsDir, "dd-extend.md"))).toBe(true);
    expect(existsSync(join(cursorCommandsDir, "dd-chat.md"))).toBe(true);
  });

  test("init cursor does NOT create design-duck/commands/", () => {
    init(testDir, "cursor");
    expect(existsSync(join(testDir, "design-duck", "commands"))).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Both integration
  // ---------------------------------------------------------------------------

  test("init both creates .claude/commands/ and .cursor/commands/", () => {
    init(testDir, "both");
    expect(existsSync(join(testDir, ".claude", "commands", "dd-new.md"))).toBe(true);
    expect(existsSync(join(testDir, ".cursor", "commands", "dd-new.md"))).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Tags integration — .integration file
  // ---------------------------------------------------------------------------

  test("init tags saves design-duck/.integration with value 'tags'", () => {
    init(testDir, "tags");
    const integration = readFileSync(join(testDir, "design-duck", ".integration"), "utf-8").trim();
    expect(integration).toBe("tags");
  });
});
