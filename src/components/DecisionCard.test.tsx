import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { DecisionCard } from "./DecisionCard";
import type { Decision } from "../domain/requirements/requirement";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const DECISION: Decision = {
  id: "dec-001",
  topic: "Search Technology",
  context: "We need sub-second search across millions of products",
  category: "technology",
  requirementRefs: ["req-001", "req-002"],
  options: [
    {
      id: "opt-a",
      title: "Elasticsearch",
      description: "Dedicated search engine",
      pros: ["Fast search"],
      cons: ["Complex setup"],
    },
    {
      id: "opt-b",
      title: "PostgreSQL FTS",
      description: "Use existing database",
      pros: ["Simpler"],
      cons: ["Slower"],
    },
  ],
  chosen: "opt-a",
  chosenReason: "Performance is critical for our user experience",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("DecisionCard", () => {
  test("renders decision topic", () => {
    const html = renderToString(<DecisionCard decision={DECISION} />);
    expect(html).toContain("Search Technology");
  });

  test("renders decision context", () => {
    const html = renderToString(<DecisionCard decision={DECISION} defaultExpanded />);
    expect(html).toContain("We need sub-second search across millions of products");
  });

  test("renders data-testid with decision id", () => {
    const html = renderToString(<DecisionCard decision={DECISION} />);
    expect(html).toContain("decision-card-dec-001");
  });

  test("renders requirement refs", () => {
    const html = renderToString(<DecisionCard decision={DECISION} defaultExpanded />);
    expect(html).toContain("req-001");
    expect(html).toContain("req-002");
    expect(html).toContain("decision-refs-dec-001");
  });

  test("does not render refs section when empty", () => {
    const dec: Decision = { ...DECISION, requirementRefs: [] };
    const html = renderToString(<DecisionCard decision={dec} defaultExpanded />);
    expect(html).not.toContain("decision-refs-dec-001");
  });

  test("renders all options for unchosen decision", () => {
    const pending: Decision = { ...DECISION, chosen: null, chosenReason: null };
    const html = renderToString(<DecisionCard decision={pending} defaultExpanded />);
    expect(html).toContain("option-card-opt-a");
    expect(html).toContain("option-card-opt-b");
  });

  test("marks chosen option", () => {
    const html = renderToString(<DecisionCard decision={DECISION} defaultExpanded />);
    expect(html).toContain("option-chosen-badge-opt-a");
    expect(html).not.toContain("option-chosen-badge-opt-b");
  });

  test("renders chosen reason", () => {
    const html = renderToString(<DecisionCard decision={DECISION} defaultExpanded />);
    expect(html).toContain("decision-chosen-reason-dec-001");
    expect(html).toContain("Performance is critical for our user experience");
  });

  test("does not render chosen reason when no choice made", () => {
    const dec: Decision = { ...DECISION, chosen: null, chosenReason: null };
    const html = renderToString(<DecisionCard decision={dec} defaultExpanded />);
    expect(html).not.toContain("decision-chosen-reason-dec-001");
  });

  test("chosen decision shows only chosen option on default tab", () => {
    const html = renderToString(<DecisionCard decision={DECISION} defaultExpanded />);
    // Chosen option is visible on the default "chosen" tab
    expect(html).toContain("option-card-opt-a");
    // Alternative is hidden (in the alternatives tab, not rendered)
    expect(html).not.toContain("option-card-opt-b");
  });

  test("chosen decision renders tabs for chosen, alternatives, and notes", () => {
    const html = renderToString(<DecisionCard decision={DECISION} defaultExpanded />);
    expect(html).toContain("tab-chosen-dec-001");
    expect(html).toContain("tab-alternatives-dec-001");
    expect(html).toContain("tab-notes-dec-001");
  });

  test("pending decision shows all options flat without tabs", () => {
    const pending: Decision = { ...DECISION, chosen: null, chosenReason: null };
    const html = renderToString(<DecisionCard decision={pending} defaultExpanded />);
    expect(html).toContain("option-card-opt-a");
    expect(html).toContain("option-card-opt-b");
    expect(html).not.toContain("tab-chosen-");
    expect(html).not.toContain("tab-alternatives-");
  });
});
