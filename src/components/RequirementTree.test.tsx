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
      },
      {
        id: "req-002",
        description: "Users can save wishlists",
        userValue: "Return to considered items",
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
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const noop = () => {};

describe("RequirementTree", () => {
  test("renders loading state", () => {
    const html = renderToString(
      <RequirementTree vision={null} projects={{}} loading={true} error={null} selectedProject={null} onSelectProject={noop} />,
    );
    expect(html).toContain("tree-loading");
    expect(html).toContain("Loading requirements");
  });

  test("does not render tree when loading", () => {
    const html = renderToString(
      <RequirementTree vision={VISION} projects={PROJECTS} loading={true} error={null} selectedProject={null} onSelectProject={noop} />,
    );
    expect(html).not.toContain("requirement-tree");
  });

  test("renders error state", () => {
    const html = renderToString(
      <RequirementTree vision={null} projects={{}} loading={false} error="Network error" selectedProject={null} onSelectProject={noop} />,
    );
    expect(html).toContain("tree-error");
    expect(html).toContain("Failed to load requirements");
    expect(html).toContain("Network error");
  });

  test("renders empty state when no vision and no projects", () => {
    const html = renderToString(
      <RequirementTree vision={null} projects={{}} loading={false} error={null} selectedProject={null} onSelectProject={noop} />,
    );
    expect(html).toContain("tree-empty");
    expect(html).toContain("No requirements found");
  });

  test("renders vision header", () => {
    const html = renderToString(
      <RequirementTree vision={VISION} projects={PROJECTS} loading={false} error={null} selectedProject={null} onSelectProject={noop} />,
    );
    expect(html).toContain("vision-header");
    expect(html).toContain("A world where teams manage requirements efficiently");
    expect(html).toContain("Provide simple tools for requirement gathering");
    expect(html).toContain("Teams struggle with requirements management");
  });

  test("renders project cards on home view", () => {
    const html = renderToString(
      <RequirementTree vision={VISION} projects={PROJECTS} loading={false} error={null} selectedProject={null} onSelectProject={noop} />,
    );
    expect(html).toContain("project-card-checkout-flow");
    expect(html).toContain("project-card-search-service");
  });

  test("renders project detail when selected", () => {
    const html = renderToString(
      <RequirementTree vision={VISION} projects={PROJECTS} loading={false} error={null} selectedProject="search-service" onSelectProject={noop} />,
    );
    expect(html).toContain("project-section-search-service");
    expect(html).toContain("requirement-card-req-001");
    expect(html).toContain("requirement-card-req-002");
  });

  test("renders vision alignment for each project card", () => {
    const html = renderToString(
      <RequirementTree vision={VISION} projects={PROJECTS} loading={false} error={null} selectedProject={null} onSelectProject={noop} />,
    );
    expect(html).toContain("Enables efficient product discovery");
    expect(html).toContain("Streamlines purchasing process");
  });

  test("renders requirement cards in detail view", () => {
    const html = renderToString(
      <RequirementTree vision={VISION} projects={PROJECTS} loading={false} error={null} selectedProject="checkout-flow" onSelectProject={noop} />,
    );
    expect(html).toContain("requirement-card-req-003");
  });

  test("renders no-projects message when vision exists but no projects", () => {
    const html = renderToString(
      <RequirementTree vision={VISION} projects={{}} loading={false} error={null} selectedProject={null} onSelectProject={noop} />,
    );
    expect(html).toContain("no-projects");
    expect(html).toContain("No projects found");
  });

  test("renders empty project correctly in detail view", () => {
    const emptyProjects: Record<string, ProjectRequirements> = {
      "empty-project": {
        visionAlignment: "Will help later",
        requirements: [],
      },
    };
    const html = renderToString(
      <RequirementTree vision={VISION} projects={emptyProjects} loading={false} error={null} selectedProject="empty-project" onSelectProject={noop} />,
    );
    expect(html).toContain("project-section-empty-project");
    expect(html).toContain("No requirements yet");
  });
});
