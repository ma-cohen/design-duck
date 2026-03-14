import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Tests for the upgrade command logic.
 *
 * Note: We test the version infrastructure and migration registry directly
 * rather than calling `upgrade()` end-to-end, since upgrade() does npm install
 * and re-exec which requires a real npm package install.
 */

import { migrations } from "../migrations";
import {
  readProjectVersion,
  writeProjectVersion,
  compareSemver,
} from "../infrastructure/version";
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
