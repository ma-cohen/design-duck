import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { useRequirementsStore, _getWatcherInternals } from "./requirements-store";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const VALID_VISION_YAML = `vision: "A world of great requirements"
mission: "Provide tools for requirements"
problem: "Teams struggle with requirements"
`;

const VALID_PROJECT_YAML = `visionAlignment: "Helps achieve the vision by enabling search"
requirements:
  - id: req-001
    description: Users need to search products
    userValue: Reduces time to find products
  - id: req-002
    description: Users can save wishlists
    userValue: Return to considered items
`;

const EMPTY_PROJECT_YAML = `visionAlignment: "Some alignment"
requirements: []`;

const VALID_DESIGN_YAML = `decisions:
  - id: dec-001
    topic: Search Technology
    context: We need fast search
    requirementRefs:
      - req-001
    options:
      - id: opt-a
        title: Elasticsearch
        description: Dedicated search engine
        pros:
          - Fast search
        cons:
          - Complex setup
    chosen: opt-a
    chosenReason: Performance is critical
`;

function makeResponse(body: string, ok = true, status = 200): Response {
  return new Response(body, {
    status,
    statusText: ok ? "OK" : "Not Found",
  });
}

function makeJsonResponse(data: unknown, ok = true, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    statusText: ok ? "OK" : "Not Found",
    headers: { "Content-Type": "application/json" },
  });
}

function stubFetch(
  visionBody: string | null,
  projectNames: string[],
  projectBodies: Record<string, string>,
  options?: {
    visionStatus?: number;
    projectsStatus?: number;
    designBodies?: Record<string, string>;
  },
) {
  const visionStatus = options?.visionStatus ?? (visionBody === null ? 404 : 200);
  const projectsStatus = options?.projectsStatus ?? 200;
  const designBodies = options?.designBodies ?? {};

  const fn = mock((url: string | URL | Request) => {
    const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : url.url;

    if (urlStr.includes("vision.yaml")) {
      return Promise.resolve(
        makeResponse(visionBody ?? "", visionStatus >= 200 && visionStatus < 300, visionStatus),
      );
    }
    if (urlStr.includes("/api/projects")) {
      return Promise.resolve(
        makeJsonResponse(projectNames, projectsStatus >= 200 && projectsStatus < 300, projectsStatus),
      );
    }

    for (const name of Object.keys(projectBodies)) {
      if (urlStr.includes(`/projects/${name}/requirements.yaml`)) {
        return Promise.resolve(makeResponse(projectBodies[name]));
      }
    }

    for (const name of Object.keys(designBodies)) {
      if (urlStr.includes(`/projects/${name}/design.yaml`)) {
        return Promise.resolve(makeResponse(designBodies[name]));
      }
    }

    return Promise.resolve(makeResponse("", false, 404));
  });

  globalThis.fetch = fn as unknown as typeof globalThis.fetch;
  return fn;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("useRequirementsStore", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    useRequirementsStore.setState({
      vision: null,
      projects: {},
      designs: {},
      loading: false,
      error: null,
      watching: false,
    });
    useRequirementsStore.getState().stopWatching();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    useRequirementsStore.getState().stopWatching();
  });

  test("has correct initial state", () => {
    const state = useRequirementsStore.getState();
    expect(state.vision).toBeNull();
    expect(state.projects).toEqual({});
    expect(state.designs).toEqual({});
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  test("loadFromFiles() populates vision and project requirements", async () => {
    stubFetch(VALID_VISION_YAML, ["my-project"], { "my-project": VALID_PROJECT_YAML });

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.vision).not.toBeNull();
    expect(state.vision!.vision).toBe("A world of great requirements");
    expect(Object.keys(state.projects)).toEqual(["my-project"]);
    expect(state.projects["my-project"].requirements).toHaveLength(2);
    expect(state.projects["my-project"].requirements[0].id).toBe("req-001");
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  test("loadFromFiles() handles empty projects list", async () => {
    stubFetch(VALID_VISION_YAML, [], {});
    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.vision).not.toBeNull();
    expect(state.projects).toEqual({});
  });

  test("loadFromFiles() handles multiple projects", async () => {
    stubFetch(VALID_VISION_YAML, ["alpha", "beta"], {
      "alpha": VALID_PROJECT_YAML,
      "beta": EMPTY_PROJECT_YAML,
    });
    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(Object.keys(state.projects).sort()).toEqual(["alpha", "beta"]);
    expect(state.projects["alpha"].requirements).toHaveLength(2);
    expect(state.projects["beta"].requirements).toHaveLength(0);
  });

  test("loadFromFiles() uses custom paths", async () => {
    const fetchMock = stubFetch(VALID_VISION_YAML, [], {});
    await useRequirementsStore.getState().loadFromFiles("/custom/path", "/custom/api/projects");

    const calls = fetchMock.mock.calls.map((c) => c[0]);
    expect(calls).toContain("/custom/path/vision.yaml");
    expect(calls).toContain("/custom/api/projects");
  });

  test("loadFromFiles() sets error when vision.yaml fetch fails", async () => {
    stubFetch(null, [], {}, { visionStatus: 404 });
    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.error).toContain("vision.yaml");
    expect(state.loading).toBe(false);
  });

  test("loadFromFiles() sets error when projects API fails", async () => {
    stubFetch(VALID_VISION_YAML, [], {}, { projectsStatus: 500 });
    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.error).toContain("projects list");
  });

  test("loadFromFiles() sets error when vision.yaml has invalid YAML", async () => {
    stubFetch("not: valid: yaml: [", [], {});
    await useRequirementsStore.getState().loadFromFiles();
    expect(useRequirementsStore.getState().error).toBeTruthy();
  });

  test("loadFromFiles() sets loading to true while in progress", async () => {
    let resolveVision!: (r: Response) => void;
    const visionPromise = new Promise<Response>((r) => { resolveVision = r; });

    globalThis.fetch = mock((url: string | URL | Request) => {
      const urlStr = typeof url === "string" ? url : url instanceof URL ? url.href : url.url;
      if (urlStr.includes("vision.yaml")) return visionPromise;
      if (urlStr.includes("/api/projects")) return Promise.resolve(makeJsonResponse([]));
      return Promise.resolve(makeResponse("", false, 404));
    }) as unknown as typeof globalThis.fetch;

    const loadPromise = useRequirementsStore.getState().loadFromFiles();
    expect(useRequirementsStore.getState().loading).toBe(true);

    resolveVision(makeResponse(VALID_VISION_YAML));
    await loadPromise;
    expect(useRequirementsStore.getState().loading).toBe(false);
  });

  test("loadFromFiles() clears previous error on retry", async () => {
    stubFetch(null, [], {}, { visionStatus: 404 });
    await useRequirementsStore.getState().loadFromFiles();
    expect(useRequirementsStore.getState().error).toBeTruthy();

    stubFetch(VALID_VISION_YAML, [], {});
    await useRequirementsStore.getState().loadFromFiles();
    expect(useRequirementsStore.getState().error).toBeNull();
  });

  test("loadFromFiles() replaces previous data on reload", async () => {
    stubFetch(VALID_VISION_YAML, ["my-project"], { "my-project": VALID_PROJECT_YAML });
    await useRequirementsStore.getState().loadFromFiles();

    stubFetch(VALID_VISION_YAML, ["other"], { "other": EMPTY_PROJECT_YAML });
    await useRequirementsStore.getState().loadFromFiles();

    expect(Object.keys(useRequirementsStore.getState().projects)).toEqual(["other"]);
  });

  test("loadFromFiles() preserves all requirement fields", async () => {
    stubFetch(VALID_VISION_YAML, ["p"], { "p": VALID_PROJECT_YAML });
    await useRequirementsStore.getState().loadFromFiles();

    const req = useRequirementsStore.getState().projects["p"].requirements[0];
    expect(req).toEqual({
      id: "req-001",
      description: "Users need to search products",
      userValue: "Reduces time to find products",
    });
  });

  test("loadFromFiles() preserves all vision fields", async () => {
    stubFetch(VALID_VISION_YAML, [], {});
    await useRequirementsStore.getState().loadFromFiles();

    expect(useRequirementsStore.getState().vision).toEqual({
      vision: "A world of great requirements",
      mission: "Provide tools for requirements",
      problem: "Teams struggle with requirements",
    });
  });

  // --- Designs ---

  test("loadFromFiles() populates designs when design.yaml exists", async () => {
    stubFetch(VALID_VISION_YAML, ["my-project"], { "my-project": VALID_PROJECT_YAML }, {
      designBodies: { "my-project": VALID_DESIGN_YAML },
    });

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(Object.keys(state.designs)).toEqual(["my-project"]);
    expect(state.designs["my-project"].decisions).toHaveLength(1);
    expect(state.designs["my-project"].decisions[0].id).toBe("dec-001");
    expect(state.designs["my-project"].decisions[0].topic).toBe("Search Technology");
    expect(state.designs["my-project"].decisions[0].chosen).toBe("opt-a");
  });

  test("loadFromFiles() leaves designs empty when no design.yaml", async () => {
    stubFetch(VALID_VISION_YAML, ["my-project"], { "my-project": VALID_PROJECT_YAML });

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.designs).toEqual({});
  });

  test("loadFromFiles() handles mix of projects with and without designs", async () => {
    stubFetch(VALID_VISION_YAML, ["alpha", "beta"], {
      "alpha": VALID_PROJECT_YAML,
      "beta": EMPTY_PROJECT_YAML,
    }, {
      designBodies: { "alpha": VALID_DESIGN_YAML },
    });

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(Object.keys(state.designs)).toEqual(["alpha"]);
    expect(state.designs["alpha"].decisions).toHaveLength(1);
    expect(state.designs["beta"]).toBeUndefined();
  });

  // --- Empty / partial fields ---

  test("loadFromFiles() loads projects with empty visionAlignment", async () => {
    const emptyAlignmentYaml = `visionAlignment: ""
requirements: []`;

    stubFetch(VALID_VISION_YAML, ["my-project"], {
      "my-project": emptyAlignmentYaml,
    });

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.vision).not.toBeNull();
    expect(Object.keys(state.projects)).toEqual(["my-project"]);
    expect(state.projects["my-project"].visionAlignment).toBe("");
    expect(state.projects["my-project"].requirements).toHaveLength(0);
    expect(state.error).toBeNull();
  });

  test("loadFromFiles() loads projects with missing requirements array", async () => {
    const noRequirementsYaml = `visionAlignment: "Some alignment"`;

    stubFetch(VALID_VISION_YAML, ["my-project"], {
      "my-project": noRequirementsYaml,
    });

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.projects["my-project"].requirements).toHaveLength(0);
    expect(state.error).toBeNull();
  });

  test("loadFromFiles() loads empty vision fields without error", async () => {
    const emptyVisionYaml = `vision: ""
mission: ""
problem: ""`;

    stubFetch(emptyVisionYaml, [], {});

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.vision).not.toBeNull();
    expect(state.vision!.vision).toBe("");
    expect(state.vision!.mission).toBe("");
    expect(state.vision!.problem).toBe("");
    expect(state.error).toBeNull();
  });

  // --- Watching ---

  test("startWatching() sets watching to true", () => {
    stubFetch(VALID_VISION_YAML, [], {});
    useRequirementsStore.getState().startWatching();
    expect(useRequirementsStore.getState().watching).toBe(true);
  });

  test("stopWatching() sets watching to false", () => {
    stubFetch(VALID_VISION_YAML, [], {});
    useRequirementsStore.getState().startWatching();
    useRequirementsStore.getState().stopWatching();
    expect(useRequirementsStore.getState().watching).toBe(false);
  });

  test("startWatching() is a no-op when already watching", () => {
    stubFetch(VALID_VISION_YAML, [], {});
    useRequirementsStore.getState().startWatching();
    const { pollingTimer: first } = _getWatcherInternals();
    useRequirementsStore.getState().startWatching();
    const { pollingTimer: second } = _getWatcherInternals();
    expect(second).toBe(first);
  });

  test("stopWatching() clears polling timer", () => {
    stubFetch(VALID_VISION_YAML, [], {});
    useRequirementsStore.getState().startWatching();
    expect(_getWatcherInternals().pollingTimer).not.toBeNull();
    useRequirementsStore.getState().stopWatching();
    expect(_getWatcherInternals().pollingTimer).toBeNull();
  });

  test("polling calls loadFromFiles periodically", async () => {
    const fetchMock = stubFetch(VALID_VISION_YAML, [], {});
    useRequirementsStore.getState().startWatching({ intervalMs: 50, requirementsPath: "/test-req" });

    await sleep(120);

    expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2);
    const urls = fetchMock.mock.calls.map((c) => c[0] as string);
    expect(urls.some((u) => u.includes("/test-req/"))).toBe(true);

    useRequirementsStore.getState().stopWatching();
  });
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
