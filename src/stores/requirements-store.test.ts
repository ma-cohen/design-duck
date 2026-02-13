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
    priority: high
    status: draft
  - id: req-002
    description: Users can save wishlists
    userValue: Return to considered items
    priority: medium
    status: review
`;

const EMPTY_PROJECT_YAML = `visionAlignment: "Some alignment"
requirements: []`;

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

/** Stub globalThis.fetch for the new vision + multi-project structure. */
function stubFetch(
  visionBody: string | null,
  projectNames: string[],
  projectBodies: Record<string, string>,
  options?: { visionStatus?: number; projectsStatus?: number; projectStatuses?: Record<string, number> },
) {
  const visionStatus = options?.visionStatus ?? (visionBody === null ? 404 : 200);
  const projectsStatus = options?.projectsStatus ?? 200;

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

    // Check for project requirements
    for (const name of Object.keys(projectBodies)) {
      if (urlStr.includes(`/projects/${name}/requirements.yaml`)) {
        const status = options?.projectStatuses?.[name] ?? 200;
        return Promise.resolve(
          makeResponse(projectBodies[name], status >= 200 && status < 300, status),
        );
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
    // Reset store to initial state before each test
    useRequirementsStore.setState({
      vision: null,
      projects: {},
      loading: false,
      error: null,
      watching: false,
    });

    // Ensure watcher is stopped between tests
    useRequirementsStore.getState().stopWatching();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    // Clean up any active watchers
    useRequirementsStore.getState().stopWatching();
  });

  // --- Initial state ---

  test("has correct initial state", () => {
    const state = useRequirementsStore.getState();

    expect(state.vision).toBeNull();
    expect(state.projects).toEqual({});
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  // --- Successful loads ---

  test("loadFromFiles() populates vision and project requirements", async () => {
    stubFetch(VALID_VISION_YAML, ["my-project"], {
      "my-project": VALID_PROJECT_YAML,
    });

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.vision).not.toBeNull();
    expect(state.vision!.vision).toBe("A world of great requirements");
    expect(Object.keys(state.projects)).toEqual(["my-project"]);
    expect(state.projects["my-project"].requirements).toHaveLength(2);
    expect(state.projects["my-project"].requirements[0].id).toBe("req-001");
    expect(state.projects["my-project"].visionAlignment).toBe("Helps achieve the vision by enabling search");
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  test("loadFromFiles() handles empty projects list", async () => {
    stubFetch(VALID_VISION_YAML, [], {});

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.vision).not.toBeNull();
    expect(state.projects).toEqual({});
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
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

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const calls = fetchMock.mock.calls.map((c) => c[0]);
    expect(calls).toContain("/custom/path/vision.yaml");
    expect(calls).toContain("/custom/api/projects");
  });

  test("loadFromFiles() defaults to /requirements and /api/projects paths", async () => {
    const fetchMock = stubFetch(VALID_VISION_YAML, [], {});

    await useRequirementsStore.getState().loadFromFiles();

    const calls = fetchMock.mock.calls.map((c) => c[0]);
    expect(calls).toContain("/requirements/vision.yaml");
    expect(calls).toContain("/api/projects");
  });

  // --- Fetch errors ---

  test("loadFromFiles() sets error when vision.yaml fetch fails", async () => {
    stubFetch(null, [], {}, { visionStatus: 404 });

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.error).toContain("vision.yaml");
    expect(state.error).toContain("404");
    expect(state.loading).toBe(false);
    expect(state.vision).toBeNull();
  });

  test("loadFromFiles() sets error when projects API fails", async () => {
    stubFetch(VALID_VISION_YAML, [], {}, { projectsStatus: 500 });

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.error).toContain("projects list");
    expect(state.loading).toBe(false);
  });

  // --- Parse errors ---

  test("loadFromFiles() sets error when vision.yaml has invalid YAML", async () => {
    stubFetch("not: valid: yaml: [", [], {});

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.error).toBeTruthy();
    expect(state.loading).toBe(false);
  });

  test("loadFromFiles() sets error when project has invalid requirement", async () => {
    const badProject = `visionAlignment: "align"
requirements:
  - id: req-001
    description: x
    priority: invalid
    status: draft
`;
    stubFetch(VALID_VISION_YAML, ["bad-project"], {
      "bad-project": badProject,
    });

    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.error).toBeTruthy();
    expect(state.loading).toBe(false);
  });

  // --- Loading state ---

  test("loadFromFiles() sets loading to true while in progress", async () => {
    let resolveVision!: (r: Response) => void;
    const visionPromise = new Promise<Response>((r) => {
      resolveVision = r;
    });

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
    // First call: fail
    stubFetch(null, [], {}, { visionStatus: 404 });
    await useRequirementsStore.getState().loadFromFiles();
    expect(useRequirementsStore.getState().error).toBeTruthy();

    // Second call: succeed
    stubFetch(VALID_VISION_YAML, [], {});
    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(state.error).toBeNull();
    expect(state.vision).not.toBeNull();
  });

  test("loadFromFiles() replaces previous data on reload", async () => {
    // First load
    stubFetch(VALID_VISION_YAML, ["my-project"], {
      "my-project": VALID_PROJECT_YAML,
    });
    await useRequirementsStore.getState().loadFromFiles();
    expect(Object.keys(useRequirementsStore.getState().projects)).toEqual(["my-project"]);

    // Second load with different data
    stubFetch(VALID_VISION_YAML, ["other-project"], {
      "other-project": EMPTY_PROJECT_YAML,
    });
    await useRequirementsStore.getState().loadFromFiles();

    const state = useRequirementsStore.getState();
    expect(Object.keys(state.projects)).toEqual(["other-project"]);
    expect(state.projects["other-project"].requirements).toEqual([]);
  });

  // --- Data fidelity ---

  test("loadFromFiles() preserves all requirement fields", async () => {
    stubFetch(VALID_VISION_YAML, ["my-project"], {
      "my-project": VALID_PROJECT_YAML,
    });

    await useRequirementsStore.getState().loadFromFiles();

    const req = useRequirementsStore.getState().projects["my-project"].requirements[0];
    expect(req).toEqual({
      id: "req-001",
      description: "Users need to search products",
      userValue: "Reduces time to find products",
      priority: "high",
      status: "draft",
    });
  });

  test("loadFromFiles() preserves all vision fields", async () => {
    stubFetch(VALID_VISION_YAML, [], {});

    await useRequirementsStore.getState().loadFromFiles();

    const vision = useRequirementsStore.getState().vision;
    expect(vision).toEqual({
      vision: "A world of great requirements",
      mission: "Provide tools for requirements",
      problem: "Teams struggle with requirements",
    });
  });

  // --- Watching state ---

  test("has watching=false in initial state", () => {
    const state = useRequirementsStore.getState();
    expect(state.watching).toBe(false);
  });

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
    const { pollingTimer: firstTimer } = _getWatcherInternals();

    useRequirementsStore.getState().startWatching();
    const { pollingTimer: secondTimer } = _getWatcherInternals();

    expect(useRequirementsStore.getState().watching).toBe(true);
    expect(secondTimer).toBe(firstTimer);
  });

  test("stopWatching() is a no-op when not watching", () => {
    useRequirementsStore.getState().stopWatching();
    expect(useRequirementsStore.getState().watching).toBe(false);
  });

  test("startWatching() falls back to polling when SSE is not available", () => {
    stubFetch(VALID_VISION_YAML, [], {});

    useRequirementsStore.getState().startWatching({ intervalMs: 5000 });

    const { pollingTimer } = _getWatcherInternals();
    expect(pollingTimer).not.toBeNull();

    useRequirementsStore.getState().stopWatching();
  });

  test("stopWatching() clears polling timer", () => {
    stubFetch(VALID_VISION_YAML, [], {});
    useRequirementsStore.getState().startWatching();

    const { pollingTimer: before } = _getWatcherInternals();
    expect(before).not.toBeNull();

    useRequirementsStore.getState().stopWatching();

    const { pollingTimer: after } = _getWatcherInternals();
    expect(after).toBeNull();
  });

  test("polling calls loadFromFiles periodically", async () => {
    const fetchMock = stubFetch(VALID_VISION_YAML, [], {});

    useRequirementsStore.getState().startWatching({
      intervalMs: 50,
      requirementsPath: "/test-requirements",
      projectsApiUrl: "/test-api/projects",
    });

    await sleep(120);

    const callCount = fetchMock.mock.calls.length;
    expect(callCount).toBeGreaterThanOrEqual(2);

    const urls = fetchMock.mock.calls.map((c) => c[0] as string);
    expect(urls.some((u) => u.includes("/test-requirements/"))).toBe(true);

    useRequirementsStore.getState().stopWatching();
  });
});

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
