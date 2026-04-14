import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { integrationFilePath, readIntegration, writeIntegration, Integration } from "./integration";

describe("integration.ts", () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `integration-test-${Date.now()}`);
    mkdirSync(join(testDir, "design-duck"), { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe("integrationFilePath", () => {
    test("returns the correct path to .integration file", () => {
      const path = integrationFilePath(testDir);
      expect(path).toBe(join(testDir, "design-duck", ".integration"));
    });

    test("uses process.cwd() as default when targetDir is not provided", () => {
      const path = integrationFilePath();
      expect(path).toContain("design-duck");
      expect(path.endsWith(".integration")).toBe(true);
    });
  });

  describe("readIntegration", () => {
    test("returns null when file does not exist", () => {
      const result = readIntegration(testDir);
      expect(result).toBe(null);
    });

    test("returns 'claude' when file contains 'claude'", () => {
      const filePath = integrationFilePath(testDir);
      writeFileSync(filePath, "claude\n", "utf-8");
      const result = readIntegration(testDir);
      expect(result).toBe("claude");
    });

    test("returns 'cursor' when file contains 'cursor'", () => {
      const filePath = integrationFilePath(testDir);
      writeFileSync(filePath, "cursor\n", "utf-8");
      const result = readIntegration(testDir);
      expect(result).toBe("cursor");
    });

    test("returns 'both' when file contains 'both'", () => {
      const filePath = integrationFilePath(testDir);
      writeFileSync(filePath, "both\n", "utf-8");
      const result = readIntegration(testDir);
      expect(result).toBe("both");
    });

    test("returns 'tags' when file contains 'tags'", () => {
      const filePath = integrationFilePath(testDir);
      writeFileSync(filePath, "tags\n", "utf-8");
      const result = readIntegration(testDir);
      expect(result).toBe("tags");
    });

    test("returns null when file contains invalid integration value", () => {
      const filePath = integrationFilePath(testDir);
      writeFileSync(filePath, "invalid\n", "utf-8");
      const result = readIntegration(testDir);
      expect(result).toBe(null);
    });

    test("trims whitespace when reading file", () => {
      const filePath = integrationFilePath(testDir);
      writeFileSync(filePath, "  claude  \n", "utf-8");
      const result = readIntegration(testDir);
      expect(result).toBe("claude");
    });
  });

  describe("writeIntegration", () => {
    test("writes 'claude' to file", () => {
      writeIntegration(testDir, "claude");
      const filePath = integrationFilePath(testDir);
      const content = readFileSync(filePath, "utf-8");
      expect(content).toBe("claude\n");
    });

    test("writes 'cursor' to file", () => {
      writeIntegration(testDir, "cursor");
      const filePath = integrationFilePath(testDir);
      const content = readFileSync(filePath, "utf-8");
      expect(content).toBe("cursor\n");
    });

    test("writes 'both' to file", () => {
      writeIntegration(testDir, "both");
      const filePath = integrationFilePath(testDir);
      const content = readFileSync(filePath, "utf-8");
      expect(content).toBe("both\n");
    });

    test("writes 'tags' to file", () => {
      writeIntegration(testDir, "tags");
      const filePath = integrationFilePath(testDir);
      const content = readFileSync(filePath, "utf-8");
      expect(content).toBe("tags\n");
    });

  });

  describe("round-trip tests", () => {
    test("writeIntegration + readIntegration round-trips 'claude'", () => {
      const integration: Integration = "claude";
      writeIntegration(testDir, integration);
      const result = readIntegration(testDir);
      expect(result).toBe(integration);
    });

    test("writeIntegration + readIntegration round-trips 'cursor'", () => {
      const integration: Integration = "cursor";
      writeIntegration(testDir, integration);
      const result = readIntegration(testDir);
      expect(result).toBe(integration);
    });

    test("writeIntegration + readIntegration round-trips 'both'", () => {
      const integration: Integration = "both";
      writeIntegration(testDir, integration);
      const result = readIntegration(testDir);
      expect(result).toBe(integration);
    });

    test("writeIntegration + readIntegration round-trips 'tags'", () => {
      const integration: Integration = "tags";
      writeIntegration(testDir, integration);
      const result = readIntegration(testDir);
      expect(result).toBe(integration);
    });
  });
});
