import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Tests for the upgrade command logic.
 *
 * The upgrade infrastructure tests verify version handling and migration registry.
 * The integration-aware tests call upgrade() end-to-end to verify command regeneration.
 */

import { migrations } from "../migrations";
import {
  readProjectVersion,
  writeProjectVersion,
  compareSemver,
} from "../infrastructure/version";
import { writeIntegration } from "../infrastructure/integration";
import { upgrade } from "./upgrade";
import { VERSION } from "../index";

describe("upgrade infrastructure", () => {
  let testDir: string;
  let duckDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `design-duck-upgrade-test-${Date.now()}`);
    duckDir = join(testDir, "design-duck");
    mkdirSync(duckDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test("VERSION matches package.json version", () => {
    const pkg = require("../../package.json");
    expect(VERSION).toBe(pkg.version);
  });

  test("migrations array has registered migrations", () => {
    expect(migrations.length).toBeGreaterThan(0);
  });

  test("writeProjectVersion writes the current VERSION", () => {
    writeProjectVersion(testDir);
    const version = readProjectVersion(testDir);
    expect(version).toBe(VERSION);
  });

  test("writeProjectVersion writes a custom version", () => {
    writeProjectVersion(testDir, "2.0.0");
    const version = readProjectVersion(testDir);
    expect(version).toBe("2.0.0");
  });

  test("readProjectVersion returns null when .version file is missing", () => {
    const emptyDir = join(tmpdir(), `design-duck-empty-${Date.now()}`);
    mkdirSync(join(emptyDir, "design-duck"), { recursive: true });
    const version = readProjectVersion(emptyDir);
    expect(version).toBeNull();
    rmSync(emptyDir, { recursive: true, force: true });
  });

  test("compareSemver returns 0 for equal versions", () => {
    expect(compareSemver("1.0.0", "1.0.0")).toBe(0);
  });

  test("compareSemver returns -1 for older version", () => {
    expect(compareSemver("0.3.5", "1.0.0")).toBe(-1);
  });

  test("compareSemver returns 1 for newer version", () => {
    expect(compareSemver("1.0.0", "0.3.5")).toBe(1);
  });

  test("no applicable migrations when project is at current VERSION", () => {
    writeProjectVersion(testDir, VERSION);
    const currentVersion = readProjectVersion(testDir);
    const applicable = migrations.filter(
      (m) =>
        compareSemver(m.version, currentVersion!) > 0 &&
        compareSemver(m.version, VERSION) <= 0,
    );
    expect(applicable).toHaveLength(0);
  });
});

describe("upgrade integration-aware command regeneration", () => {
  let testDir: string;
  let duckDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `design-duck-upgrade-integration-${Date.now()}`);
    duckDir = join(testDir, "design-duck");
    mkdirSync(duckDir, { recursive: true });
    // Write an older version so upgrade() doesn't return early
    writeProjectVersion(testDir, "0.1.0");
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  test('integration "claude" → regenerates .claude/commands/dd-new.md, not design-duck/commands/', () => {
    writeIntegration(testDir, "claude");
    upgrade(testDir);

    expect(existsSync(join(testDir, ".claude", "commands", "dd-new.md"))).toBe(true);
    expect(existsSync(join(duckDir, "commands", "dd-new.md"))).toBe(false);
  });

  test('integration "cursor" → regenerates .cursor/commands/dd-new.md, not design-duck/commands/', () => {
    writeIntegration(testDir, "cursor");
    upgrade(testDir);

    expect(existsSync(join(testDir, ".cursor", "commands", "dd-new.md"))).toBe(true);
    expect(existsSync(join(duckDir, "commands", "dd-new.md"))).toBe(false);
  });

  test('integration "tags" → regenerates design-duck/commands/dd-new.md', () => {
    writeIntegration(testDir, "tags");
    upgrade(testDir);

    expect(existsSync(join(duckDir, "commands", "dd-new.md"))).toBe(true);
    expect(existsSync(join(testDir, ".claude", "commands", "dd-new.md"))).toBe(false);
    expect(existsSync(join(testDir, ".cursor", "commands", "dd-new.md"))).toBe(false);
  });

  test("no .integration file → defaults to tags behavior (design-duck/commands/)", () => {
    // No writeIntegration call — file is absent
    upgrade(testDir);

    expect(existsSync(join(duckDir, "commands", "dd-new.md"))).toBe(true);
    expect(existsSync(join(testDir, ".claude", "commands", "dd-new.md"))).toBe(false);
    expect(existsSync(join(testDir, ".cursor", "commands", "dd-new.md"))).toBe(false);
  });

  test('integration "both" → regenerates .claude/commands/ and .cursor/commands/, not design-duck/commands/', () => {
    writeIntegration(testDir, "both");
    upgrade(testDir);

    expect(existsSync(join(testDir, ".claude", "commands", "dd-new.md"))).toBe(true);
    expect(existsSync(join(testDir, ".cursor", "commands", "dd-new.md"))).toBe(true);
    expect(existsSync(join(duckDir, "commands", "dd-new.md"))).toBe(false);
  });
});
