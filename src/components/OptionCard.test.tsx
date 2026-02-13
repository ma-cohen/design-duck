import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import { OptionCard } from "./OptionCard";
import type { DesignOption } from "../domain/requirements/requirement";

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const OPTION: DesignOption = {
  id: "opt-a",
  title: "Elasticsearch",
  description: "Dedicated search engine",
  pros: ["Sub-200ms full-text search", "Scales horizontally"],
  cons: ["Operational overhead", "Extra infrastructure cost"],
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OptionCard", () => {
  test("renders option title", () => {
    const html = renderToString(<OptionCard option={OPTION} isChosen={false} />);
    expect(html).toContain("Elasticsearch");
  });

  test("renders option description", () => {
    const html = renderToString(<OptionCard option={OPTION} isChosen={false} />);
    expect(html).toContain("Dedicated search engine");
  });

  test("renders pros", () => {
    const html = renderToString(<OptionCard option={OPTION} isChosen={false} />);
    expect(html).toContain("Sub-200ms full-text search");
    expect(html).toContain("Scales horizontally");
  });

  test("renders cons", () => {
    const html = renderToString(<OptionCard option={OPTION} isChosen={false} />);
    expect(html).toContain("Operational overhead");
    expect(html).toContain("Extra infrastructure cost");
  });

  test("renders data-testid with option id", () => {
    const html = renderToString(<OptionCard option={OPTION} isChosen={false} />);
    expect(html).toContain("option-card-opt-a");
  });

  test("shows chosen badge when isChosen is true", () => {
    const html = renderToString(<OptionCard option={OPTION} isChosen={true} />);
    expect(html).toContain("option-chosen-badge-opt-a");
    expect(html).toContain("chosen");
  });

  test("does not show chosen badge when isChosen is false", () => {
    const html = renderToString(<OptionCard option={OPTION} isChosen={false} />);
    expect(html).not.toContain("option-chosen-badge-opt-a");
  });

  test("renders with empty pros", () => {
    const opt: DesignOption = { ...OPTION, pros: [] };
    const html = renderToString(<OptionCard option={opt} isChosen={false} />);
    expect(html).not.toContain("option-pros-opt-a");
  });

  test("renders with empty cons", () => {
    const opt: DesignOption = { ...OPTION, cons: [] };
    const html = renderToString(<OptionCard option={opt} isChosen={false} />);
    expect(html).not.toContain("option-cons-opt-a");
  });
});
