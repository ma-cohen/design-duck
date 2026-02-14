import { describe, expect, test } from "bun:test";
import { migrations } from "./index";

describe("migrations registry", () => {
  test("migrations array is empty for v1.0.0 (first public release)", () => {
    expect(migrations).toEqual([]);
  });

  test("migrations is an array", () => {
    expect(Array.isArray(migrations)).toBe(true);
  });
});
