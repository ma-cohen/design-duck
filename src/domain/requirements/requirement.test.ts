import { describe, expect, test } from "bun:test";
import {
  validateVision,
  validateRequirement,
  assertVision,
  assertRequirement,
} from "./requirement";

describe("validateVision", () => {
  test("accepts valid vision", () => {
    const v = {
      vision: "A world where teams manage requirements efficiently",
      mission: "Provide simple tools for requirement gathering",
      problem: "Teams struggle with requirements management",
    };
    expect(validateVision(v)).toEqual({ valid: true });
  });

  test("rejects non-object", () => {
    expect(validateVision(null)).toEqual({
      valid: false,
      errors: ["Vision must be an object"],
    });
    expect(validateVision("x")).toEqual({
      valid: false,
      errors: ["Vision must be an object"],
    });
  });

  test("rejects missing or empty vision field", () => {
    const v = { vision: "", mission: "m", problem: "p" };
    const out = validateVision(v);
    expect(out.valid).toBe(false);
    expect((out as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("vision")]),
    );
  });

  test("rejects missing or empty mission field", () => {
    const v = { vision: "v", mission: "", problem: "p" };
    const out = validateVision(v);
    expect(out.valid).toBe(false);
    expect((out as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("mission")]),
    );
  });

  test("rejects missing or empty problem field", () => {
    const v = { vision: "v", mission: "m", problem: "" };
    const out = validateVision(v);
    expect(out.valid).toBe(false);
    expect((out as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("problem")]),
    );
  });

  test("rejects all fields empty", () => {
    const v = { vision: "", mission: "", problem: "" };
    const out = validateVision(v);
    expect(out.valid).toBe(false);
    expect((out as { errors: string[] }).errors).toHaveLength(3);
  });
});

describe("validateRequirement", () => {
  test("accepts valid requirement", () => {
    const r = {
      id: "req-001",
      description: "Users need to search by partial names",
      userValue: "Reduces time to find products",
    };
    expect(validateRequirement(r)).toEqual({ valid: true });
  });

  test("rejects non-object", () => {
    expect(validateRequirement(null)).toEqual({
      valid: false,
      errors: ["Requirement must be an object"],
    });
    expect(validateRequirement("x")).toEqual({
      valid: false,
      errors: ["Requirement must be an object"],
    });
  });

  test("rejects missing or invalid id", () => {
    expect(validateRequirement({ id: "" })).toEqual({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining("id")]),
    });
    expect(validateRequirement({ id: "  " })).toEqual({
      valid: false,
      errors: expect.arrayContaining([expect.stringContaining("id")]),
    });
  });

  test("rejects missing description", () => {
    const r = { id: "req-001", userValue: "y" };
    const out = validateRequirement(r);
    expect(out.valid).toBe(false);
    expect((out as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("description")]),
    );
  });

  test("rejects missing userValue", () => {
    const r = { id: "req-001", description: "x" };
    const out = validateRequirement(r);
    expect(out.valid).toBe(false);
    expect((out as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("userValue")]),
    );
  });
});

describe("assertVision", () => {
  test("does not throw for valid vision", () => {
    const v = {
      vision: "v",
      mission: "m",
      problem: "p",
    };
    expect(() => assertVision(v)).not.toThrow();
  });

  test("throws for invalid vision", () => {
    expect(() => assertVision({ vision: "" })).toThrow(
      /Invalid vision/,
    );
  });
});

describe("assertRequirement", () => {
  test("does not throw for valid requirement", () => {
    const r = {
      id: "req-001",
      description: "x",
      userValue: "y",
    };
    expect(() => assertRequirement(r)).not.toThrow();
  });

  test("throws for invalid requirement", () => {
    expect(() => assertRequirement({ id: "" })).toThrow(
      /Invalid requirement/,
    );
  });
});
