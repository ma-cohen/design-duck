import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { RequirementTree } from "./RequirementTree";
import type {
  Vision,
  ProjectRequirements,
} from "../domain/requirements/requirement";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VISION: Vision = {
  vision: "A world where teams manage requirements efficiently",
  mission: "Provide simple tools for requirement gathering",
  problem: "Teams struggle with requirements management",
};

const PROJECTS: Record<string, ProjectRequirements> = {
  "search-service": {
    visionAlignment: "Enables efficient product discovery",
    requirements: [
      {
        id: "req-001",
        description: "Users need to search products",
        userValue: "Reduces time to find products",
        priority: "high",
        status: "draft",
      },
      {
        id: "req-002",
        description: "Users can save wishlists",
        userValue: "Return to considered items",
        priority: "medium",
        status: "review",
      },
    ],
  },
  "checkout-flow": {
    visionAlignment: "Streamlines purchasing process",
    requirements: [
      {
        id: "req-003",
        description: "Users can track delivery status",
        userValue: "Know when package arrives",
        priority: "high",
        status: "approved",
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("RequirementTree", () => {
  // --- Loading state ---

  test("renders loading state", () => {
    const html = renderToString(
      <RequirementTree
        vision={null}
        projects={{}}
        loading={true}
        error={null}
      />,
    );
    expect(html).toContain("tree-loading");
    expect(html).toContain("Loading requirements");
  });

  test("does not render tree when loading", () => {
    const html = renderToString(
      <RequirementTree
        vision={VISION}
        projects={PROJECTS}
        loading={true}
        error={null}
      />,
    );
    expect(html).not.toContain("requirement-tree");
  });

  // --- Error state ---

  test("renders error state", () => {
    const html = renderToString(
      <RequirementTree
        vision={null}
        projects={{}}
        loading={false}
        error="Network error"
      />,
    );
    expect(html).toContain("tree-error");
    expect(html).toContain("Failed to load requirements");
    expect(html).toContain("Network error");
  });

  test("does not render tree when error", () => {
    const html = renderToString(
      <RequirementTree
        vision={VISION}
        projects={PROJECTS}
        loading={false}
        error="Something went wrong"
      />,
    );
    expect(html).not.toContain("requirement-tree");
  });

  // --- Empty state ---

  test("renders empty state when no vision and no projects", () => {
    const html = renderToString(
      <RequirementTree
        vision={null}
        projects={{}}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("tree-empty");
    expect(html).toContain("No requirements found");
  });

  // --- Vision header ---

  test("renders vision header", () => {
    const html = renderToString(
      <RequirementTree
        vision={VISION}
        projects={PROJECTS}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("vision-header");
    expect(html).toContain("A world where teams manage requirements efficiently");
    expect(html).toContain("Provide simple tools for requirement gathering");
    expect(html).toContain("Teams struggle with requirements management");
  });

  // --- Project sections ---

  test("renders project sections for each project", () => {
    const html = renderToString(
      <RequirementTree
        vision={VISION}
        projects={PROJECTS}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("project-section-checkout-flow");
    expect(html).toContain("project-section-search-service");
  });

  test("renders project names", () => {
    const html = renderToString(
      <RequirementTree
        vision={VISION}
        projects={PROJECTS}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("checkout-flow");
    expect(html).toContain("search-service");
  });

  test("renders vision alignment for each project", () => {
    const html = renderToString(
      <RequirementTree
        vision={VISION}
        projects={PROJECTS}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("Enables efficient product discovery");
    expect(html).toContain("Streamlines purchasing process");
  });

  test("renders requirement cards inside project sections", () => {
    const html = renderToString(
      <RequirementTree
        vision={VISION}
        projects={PROJECTS}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("requirement-card-req-001");
    expect(html).toContain("requirement-card-req-002");
    expect(html).toContain("requirement-card-req-003");
  });

  test("renders requirement descriptions", () => {
    const html = renderToString(
      <RequirementTree
        vision={VISION}
        projects={PROJECTS}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("Users need to search products");
    expect(html).toContain("Users can save wishlists");
    expect(html).toContain("Users can track delivery status");
  });

  // --- Edge cases ---

  test("renders no-projects message when vision exists but no projects", () => {
    const html = renderToString(
      <RequirementTree
        vision={VISION}
        projects={{}}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("no-projects");
    expect(html).toContain("No projects found");
  });

  test("renders projects grid container", () => {
    const html = renderToString(
      <RequirementTree
        vision={VISION}
        projects={PROJECTS}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("projects-grid");
  });

  test("renders empty project correctly", () => {
    const emptyProjects: Record<string, ProjectRequirements> = {
      "empty-project": {
        visionAlignment: "Will help later",
        requirements: [],
      },
    };
    const html = renderToString(
      <RequirementTree
        vision={VISION}
        projects={emptyProjects}
        loading={false}
        error={null}
      />,
    );
    expect(html).toContain("project-section-empty-project");
    expect(html).toContain("empty-project-empty-project");
    expect(html).toContain("No requirements yet");
  });
});
