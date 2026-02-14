import { describe, expect, test } from "bun:test";
import { migrations } from "./index";

describe("migrations registry", () => {
  test("migrations is an array with registered migrations", () => {
    expect(Array.isArray(migrations)).toBe(true);
    expect(migrations.length).toBeGreaterThan(0);
  });

  test("migrations are sorted by version", () => {
    for (let i = 1; i < migrations.length; i++) {
      const prev = migrations[i - 1].version;
      const curr = migrations[i].version;
      expect(prev < curr).toBe(true);
    }
  });

  test("v1.1.0 migration is registered", () => {
    const m = migrations.find((m) => m.version === "1.1.0");
    expect(m).toBeDefined();
    expect(m!.description).toContain("category");
  });
});
