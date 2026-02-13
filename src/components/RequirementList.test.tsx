import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { RequirementList } from "./RequirementList";
import type { Requirement } from "../domain/requirements/requirement";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const REQUIREMENTS: Requirement[] = [
  {
    id: "req-001",
    description: "Users need to search products",
    userValue: "Reduces time to find products",
  },
  {
    id: "req-002",
    description: "Users can save wishlists",
    userValue: "Return to considered items",
  },
];

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RequirementList", () => {
  test("renders loading state", () => {
    const html = renderToString(
      <RequirementList requirements={[]} loading={true} error={null} />,
    );
    expect(html).toContain("requirements-loading");
    expect(html).toContain("Loading requirements");
  });

  test("does not render cards when loading", () => {
    const html = renderToString(
      <RequirementList requirements={REQUIREMENTS} loading={true} error={null} />,
    );
    expect(html).not.toContain("requirement-card-req-001");
  });

  test("renders error state", () => {
    const html = renderToString(
      <RequirementList requirements={[]} loading={false} error="Network error" />,
    );
    expect(html).toContain("requirements-error");
    expect(html).toContain("Failed to load requirements");
    expect(html).toContain("Network error");
  });

  test("does not render cards when error", () => {
    const html = renderToString(
      <RequirementList
        requirements={REQUIREMENTS}
        loading={false}
        error="Something went wrong"
      />,
    );
    expect(html).not.toContain("requirement-card-req-001");
  });

  test("renders empty state when no requirements", () => {
    const html = renderToString(
      <RequirementList requirements={[]} loading={false} error={null} />,
    );
    expect(html).toContain("requirements-empty");
    expect(html).toContain("No requirements found");
  });

  test("renders list container with data-testid", () => {
    const html = renderToString(
      <RequirementList requirements={REQUIREMENTS} loading={false} error={null} />,
    );
    expect(html).toContain("requirements-list");
  });

  test("renders all requirement cards", () => {
    const html = renderToString(
      <RequirementList requirements={REQUIREMENTS} loading={false} error={null} />,
    );
    expect(html).toContain("requirement-card-req-001");
    expect(html).toContain("requirement-card-req-002");
  });

  test("renders requirement descriptions", () => {
    const html = renderToString(
      <RequirementList requirements={REQUIREMENTS} loading={false} error={null} />,
    );
    expect(html).toContain("Users need to search products");
    expect(html).toContain("Users can save wishlists");
  });

  test("renders single requirement", () => {
    const html = renderToString(
      <RequirementList
        requirements={[REQUIREMENTS[0]]}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("requirement-card-req-001");
    expect(html).not.toContain("requirement-card-req-002");
  });
});
