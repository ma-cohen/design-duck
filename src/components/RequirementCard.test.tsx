import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { RequirementCard } from "./RequirementCard";
import type { Requirement } from "../domain/requirements/requirement";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const REQUIREMENT: Requirement = {
  id: "req-001",
  description: "Users need to search products",
  userValue: "Reduces time to find products",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RequirementCard", () => {
  test("renders requirement id", () => {
    const html = renderToString(<RequirementCard requirement={REQUIREMENT} />);
    expect(html).toContain("req-001");
  });

  test("renders requirement description", () => {
    const html = renderToString(<RequirementCard requirement={REQUIREMENT} />);
    expect(html).toContain("Users need to search products");
  });

  test("hides user value when collapsed", () => {
    const html = renderToString(<RequirementCard requirement={REQUIREMENT} />);
    expect(html).not.toContain("Reduces time to find products");
  });

  test("renders data-testid with requirement id", () => {
    const html = renderToString(<RequirementCard requirement={REQUIREMENT} />);
    expect(html).toContain("requirement-card-req-001");
  });

  test("renders different requirement", () => {
    const other: Requirement = {
      id: "req-042",
      description: "Users can export orders",
      userValue: "Keep records of purchases",
    };
    const html = renderToString(<RequirementCard requirement={other} />);
    expect(html).toContain("req-042");
    expect(html).toContain("Users can export orders");
  });

  test("renders toggle button", () => {
    const html = renderToString(<RequirementCard requirement={REQUIREMENT} />);
    expect(html).toContain("requirement-toggle-req-001");
  });
});
