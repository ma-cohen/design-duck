import { describe, expect, test } from "bun:test";
import {
  validateVision,
  validateRequirement,
  assertVision,
  assertRequirement,
  validateDesignOption,
  validateDecision,
  assertDesignOption,
  assertDecision,
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

  test("accepts empty vision field", () => {
    const v = { vision: "", mission: "m", problem: "p" };
    expect(validateVision(v)).toEqual({ valid: true });
  });

  test("accepts empty mission field", () => {
    const v = { vision: "v", mission: "", problem: "p" };
    expect(validateVision(v)).toEqual({ valid: true });
  });

  test("accepts empty problem field", () => {
    const v = { vision: "v", mission: "m", problem: "" };
    expect(validateVision(v)).toEqual({ valid: true });
  });

  test("accepts all fields empty (brainstorm-only)", () => {
    const v = { vision: "", mission: "", problem: "" };
    expect(validateVision(v)).toEqual({ valid: true });
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

  test("does not throw for empty vision (brainstorm-only)", () => {
    expect(() => assertVision({ vision: "", mission: "", problem: "" })).not.toThrow();
  });

  test("throws for non-object", () => {
    expect(() => assertVision(null)).toThrow(
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

// ---------------------------------------------------------------------------
// Design option validation
// ---------------------------------------------------------------------------

describe("validateDesignOption", () => {
  const validOption = {
    id: "opt-a",
    title: "Elasticsearch",
    description: "Dedicated search engine",
    pros: ["Fast", "Scales well"],
    cons: ["Operational overhead"],
  };

  test("accepts valid option", () => {
    expect(validateDesignOption(validOption)).toEqual({ valid: true });
  });

  test("rejects non-object", () => {
    expect(validateDesignOption(null)).toEqual({
      valid: false,
      errors: ["DesignOption must be an object"],
    });
  });

  test("rejects missing id", () => {
    const o = { ...validOption, id: "" };
    const result = validateDesignOption(o);
    expect(result.valid).toBe(false);
    expect((result as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("id")]),
    );
  });

  test("rejects missing title", () => {
    const o = { ...validOption, title: "" };
    const result = validateDesignOption(o);
    expect(result.valid).toBe(false);
    expect((result as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("title")]),
    );
  });

  test("rejects missing description", () => {
    const o = { ...validOption, description: "" };
    const result = validateDesignOption(o);
    expect(result.valid).toBe(false);
  });

  test("rejects non-array pros", () => {
    const o = { ...validOption, pros: "not an array" };
    const result = validateDesignOption(o);
    expect(result.valid).toBe(false);
    expect((result as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("pros")]),
    );
  });

  test("rejects non-array cons", () => {
    const o = { ...validOption, cons: 42 };
    const result = validateDesignOption(o);
    expect(result.valid).toBe(false);
    expect((result as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("cons")]),
    );
  });

  test("accepts empty pros and cons arrays", () => {
    const o = { ...validOption, pros: [], cons: [] };
    expect(validateDesignOption(o)).toEqual({ valid: true });
  });

  test("rejects pros with empty strings", () => {
    const o = { ...validOption, pros: ["good", ""] };
    const result = validateDesignOption(o);
    expect(result.valid).toBe(false);
    expect((result as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("pros")]),
    );
  });
});

// ---------------------------------------------------------------------------
// Decision validation
// ---------------------------------------------------------------------------

describe("validateDecision", () => {
  const validDecision = {
    id: "dec-001",
    topic: "Search Technology",
    context: "We need fast search",
    category: "technology",
    requirementRefs: ["req-001"],
    options: [
      {
        id: "opt-a",
        title: "Elasticsearch",
        description: "Dedicated search engine",
        pros: ["Fast"],
        cons: ["Complex"],
      },
    ],
    chosen: "opt-a",
    chosenReason: "Performance matters",
  };

  test("accepts valid decision", () => {
    expect(validateDecision(validDecision)).toEqual({ valid: true });
  });

  test("accepts decision with null chosen and chosenReason", () => {
    const d = { ...validDecision, chosen: null, chosenReason: null };
    expect(validateDecision(d)).toEqual({ valid: true });
  });

  test("rejects non-object", () => {
    expect(validateDecision(null)).toEqual({
      valid: false,
      errors: ["Decision must be an object"],
    });
  });

  test("rejects missing id", () => {
    const d = { ...validDecision, id: "" };
    const result = validateDecision(d);
    expect(result.valid).toBe(false);
    expect((result as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("id")]),
    );
  });

  test("rejects missing topic", () => {
    const d = { ...validDecision, topic: "" };
    const result = validateDecision(d);
    expect(result.valid).toBe(false);
  });

  test("rejects missing context", () => {
    const d = { ...validDecision, context: "" };
    const result = validateDecision(d);
    expect(result.valid).toBe(false);
  });

  test("rejects non-array requirementRefs", () => {
    const d = { ...validDecision, requirementRefs: "req-001" };
    const result = validateDecision(d);
    expect(result.valid).toBe(false);
    expect((result as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("requirementRefs")]),
    );
  });

  test("accepts empty options array (for settled/global decisions)", () => {
    const d = { ...validDecision, options: [] };
    const result = validateDecision(d);
    expect(result.valid).toBe(true);
  });

  test("rejects non-array options", () => {
    const d = { ...validDecision, options: "not an array" };
    const result = validateDecision(d);
    expect(result.valid).toBe(false);
  });

  test("reports invalid options with index", () => {
    const d = {
      ...validDecision,
      options: [
        validDecision.options[0],
        { id: "", title: "Bad", description: "d", pros: [], cons: [] },
      ],
    };
    const result = validateDecision(d);
    expect(result.valid).toBe(false);
    expect((result as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("option at index 1")]),
    );
  });

  test("rejects non-string chosen", () => {
    const d = { ...validDecision, chosen: 42 };
    const result = validateDecision(d);
    expect(result.valid).toBe(false);
    expect((result as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("chosen")]),
    );
  });

  test("rejects non-string chosenReason", () => {
    const d = { ...validDecision, chosenReason: 42 };
    const result = validateDecision(d);
    expect(result.valid).toBe(false);
    expect((result as { errors: string[] }).errors).toEqual(
      expect.arrayContaining([expect.stringContaining("chosenReason")]),
    );
  });
});

describe("assertDesignOption", () => {
  test("does not throw for valid option", () => {
    const o = {
      id: "opt-a",
      title: "t",
      description: "d",
      pros: ["p"],
      cons: ["c"],
    };
    expect(() => assertDesignOption(o)).not.toThrow();
  });

  test("throws for invalid option", () => {
    expect(() => assertDesignOption({ id: "" })).toThrow(/Invalid design option/);
  });
});

describe("assertDecision", () => {
  test("does not throw for valid decision", () => {
    const d = {
      id: "dec-001",
      topic: "t",
      context: "c",
      category: "other",
      requirementRefs: [],
      options: [
        { id: "opt-a", title: "t", description: "d", pros: [], cons: [] },
      ],
      chosen: null,
      chosenReason: null,
    };
    expect(() => assertDecision(d)).not.toThrow();
  });

  test("throws for invalid decision", () => {
    expect(() => assertDecision({ id: "" })).toThrow(/Invalid decision/);
  });
});
