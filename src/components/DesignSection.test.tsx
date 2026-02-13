import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { DesignSection } from "./DesignSection";
import type { ProjectDesign } from "../domain/requirements/requirement";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DESIGN: ProjectDesign = {
  notes: "Some research notes about the project architecture.",
  decisions: [
    {
      id: "dec-001",
      topic: "Search Technology",
      context: "We need fast search",
      requirementRefs: ["req-001"],
      options: [
        {
          id: "opt-a",
          title: "Elasticsearch",
          description: "Dedicated search",
          pros: ["Fast"],
          cons: ["Complex"],
        },
      ],
      chosen: "opt-a",
      chosenReason: "Speed matters",
    },
    {
      id: "dec-002",
      topic: "Storage Backend",
      context: "Need reliable data storage",
      requirementRefs: ["req-002"],
      options: [
        {
          id: "opt-x",
          title: "PostgreSQL",
          description: "Relational DB",
          pros: ["Reliable"],
          cons: ["Scaling"],
        },
      ],
      chosen: null,
      chosenReason: null,
    },
  ],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DesignSection", () => {
  test("renders all decisions", () => {
    const html = renderToString(<DesignSection design={DESIGN} projectName="test-project" />);
    expect(html).toContain("design-section");
    expect(html).toContain("decision-card-dec-001");
    expect(html).toContain("decision-card-dec-002");
  });

  test("renders design section heading", () => {
    const html = renderToString(<DesignSection design={DESIGN} projectName="test-project" />);
    expect(html).toContain("Design Decisions");
  });

  test("renders empty state when no decisions", () => {
    const empty: ProjectDesign = { notes: null, decisions: [] };
    const html = renderToString(<DesignSection design={empty} projectName="test-project" />);
    expect(html).toContain("design-section-empty");
    expect(html).toContain("No design decisions yet");
  });

  test("renders decision topics", () => {
    const html = renderToString(<DesignSection design={DESIGN} projectName="test-project" />);
    expect(html).toContain("Search Technology");
    expect(html).toContain("Storage Backend");
  });
});
