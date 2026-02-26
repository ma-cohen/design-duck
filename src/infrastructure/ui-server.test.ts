import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  mock,
} from "bun:test";
import { createServer as createTcpServer, type Server } from "node:net";
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { load as yamlLoad } from "js-yaml";
import { tmpdir } from "node:os";
import { join } from "node:path";

// ---------------------------------------------------------------------------
// Mock child_process.execSync to track openBrowser calls.
// Bun hoists mock.module calls so the mock is active before any imports.
// ---------------------------------------------------------------------------

const execSyncMock = mock(() => {});
mock.module("node:child_process", () => ({
  execSync: execSyncMock,
}));

import { startUiServer } from "./ui-server";
import type { UiServerHandle } from "./ui-server";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Creates a TCP server that occupies a port so startUiServer must retry. */
function occupyPort(port: number): Promise<Server> {
  return new Promise((resolve, reject) => {
    const srv = createTcpServer();
    srv.on("error", reject);
    srv.listen(port, () => resolve(srv));
  });
}

/** Closes a net.Server and waits for the port to be released. */
function closeServer(srv: Server): Promise<void> {
  return new Promise((resolve) => srv.close(() => resolve()));
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("startUiServer", () => {
  let distUiDir: string;
  let docsDir: string;
  let handle: UiServerHandle | null;
  let blockers: Server[];

  beforeEach(() => {
    const base = join(
      tmpdir(),
      `dd-ui-server-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    distUiDir = join(base, "dist-ui");
    docsDir = join(base, "docs");

    mkdirSync(distUiDir, { recursive: true });
    mkdirSync(docsDir, { recursive: true });
    writeFileSync(
      join(distUiDir, "index.html"),
      "<html><body>test</body></html>",
      "utf-8",
    );
    writeFileSync(
      join(docsDir, "vision.yaml"),
      "product_name: test\n",
      "utf-8",
    );

    handle = null;
    blockers = [];
    execSyncMock.mockClear();
  });

  afterEach(async () => {
    handle?.close();
    handle = null;

    for (const srv of blockers) {
      await closeServer(srv);
    }
    blockers = [];

    await sleep(50);
  });

  // -------------------------------------------------------------------------
  // Port retry behaviour
  // -------------------------------------------------------------------------

  test("binds to the requested port when it is available", async () => {
    const port = 19100;

    handle = startUiServer({
      port,
      distUiDir,
      docsDir,
      open: false,
    });

    await sleep(500);

    expect(handle.port).toBe(port);
  });

  test("retries on EADDRINUSE and binds to the next free port", async () => {
    const basePort = 19200;

    blockers.push(await occupyPort(basePort));

    handle = startUiServer({
      port: basePort,
      distUiDir,
      docsDir,
      open: false,
    });

    await sleep(500);

    expect(handle.port).toBe(basePort + 1);
  });

  // -------------------------------------------------------------------------
  // Browser opening — regression tests for the multiple-windows bug
  //
  // The old code passed the openBrowser callback directly to server.listen().
  // In Node.js, server.listen(port, cb) registers cb via once('listening').
  // Failed attempts (EADDRINUSE) did NOT remove those listeners, so when the
  // server finally bound, ALL accumulated callbacks fired — opening one
  // browser window per retry.
  // -------------------------------------------------------------------------

  test("opens browser exactly once when the first port is available", async () => {
    const port = 19300;

    handle = startUiServer({
      port,
      distUiDir,
      docsDir,
      open: true,
    });

    await sleep(500);

    expect(handle.port).toBe(port);
    expect(execSyncMock).toHaveBeenCalledTimes(1);
  });

  test("opens browser exactly once when port retries are needed (regression: multiple-windows bug)", async () => {
    const basePort = 19400;
    const portsToBlock = 5;

    // Occupy 5 consecutive ports so the server must retry 5 times
    for (let i = 0; i < portsToBlock; i++) {
      blockers.push(await occupyPort(basePort + i));
    }

    handle = startUiServer({
      port: basePort,
      distUiDir,
      docsDir,
      open: true,
    });

    // Wait long enough for all retries to complete
    await sleep(1000);

    // Server should have skipped past all blocked ports
    expect(handle.port).toBe(basePort + portsToBlock);

    // The whole point: openBrowser must be called exactly ONCE, not 6 times
    expect(execSyncMock).toHaveBeenCalledTimes(1);
  });

  test("does not open browser when open is false", async () => {
    const port = 19500;

    handle = startUiServer({
      port,
      distUiDir,
      docsDir,
      open: false,
    });

    await sleep(500);

    expect(handle.port).toBe(port);
    expect(execSyncMock).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Empty defaults for missing optional YAML files
  // -------------------------------------------------------------------------

  test("returns empty defaults for missing project context.yaml", async () => {
    const port = 19600;
    mkdirSync(join(docsDir, "projects", "my-project"), { recursive: true });
    writeFileSync(
      join(docsDir, "projects", "my-project", "requirements.yaml"),
      "visionAlignment: test\nrequirements: []\n",
      "utf-8",
    );

    handle = startUiServer({ port, distUiDir, docsDir, open: false });
    await sleep(500);

    const res = await fetch(`http://localhost:${port}/docs/projects/my-project/context.yaml`);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/yaml");
    const body = await res.text();
    expect(body).toBe("contexts: []\n");
  });

  test("returns empty defaults for missing project design.yaml", async () => {
    const port = 19601;
    mkdirSync(join(docsDir, "projects", "my-project"), { recursive: true });

    handle = startUiServer({ port, distUiDir, docsDir, open: false });
    await sleep(500);

    const res = await fetch(`http://localhost:${port}/docs/projects/my-project/design.yaml`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toBe("decisions: []\n");
  });

  test("returns 404 for missing non-optional YAML files", async () => {
    const port = 19603;

    handle = startUiServer({ port, distUiDir, docsDir, open: false });
    await sleep(500);

    const res = await fetch(`http://localhost:${port}/docs/projects/my-project/requirements.yaml`);
    expect(res.status).toBe(404);
  });

  // -------------------------------------------------------------------------
  // Propagate decision to global
  // -------------------------------------------------------------------------

  describe("propagate decision to global", () => {
    const PROJECT_NAME = "test-proj";
    const BASE_PORT = 19700;
    let portCounter = 0;

    function nextPort(): number {
      return BASE_PORT + portCounter++;
    }

    /** Writes a project design.yaml with the given YAML content. */
    function writeProjectDesign(yaml: string) {
      const dir = join(docsDir, "projects", PROJECT_NAME);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "requirements.yaml"), "visionAlignment: test\nrequirements: []\n", "utf-8");
      writeFileSync(join(dir, "design.yaml"), yaml, "utf-8");
    }

    /** Writes a global design.yaml with the given YAML content. */
    function writeGlobalDesign(yaml: string) {
      writeFileSync(join(docsDir, "design.yaml"), yaml, "utf-8");
    }

    /** Reads and parses the global design.yaml. */
    function readGlobalDesign(): Record<string, unknown> {
      return yamlLoad(readFileSync(join(docsDir, "design.yaml"), "utf-8")) as Record<string, unknown>;
    }

    /** Reads and parses the project design.yaml. */
    function readProjectDesign(): Record<string, unknown> {
      return yamlLoad(readFileSync(join(docsDir, "projects", PROJECT_NAME, "design.yaml"), "utf-8")) as Record<string, unknown>;
    }

    /** Sends a propagate request. */
    async function propagate(port: number, decisionId: string): Promise<Response> {
      return fetch(`http://localhost:${port}/api/projects/${PROJECT_NAME}/design/propagate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisionId }),
      });
    }

    const FULL_PROJECT_DESIGN = `decisions:
  - id: DEC-TP-001
    category: architecture
    topic: App form factor
    context: How users interact with the app.
    requirementRefs:
      - REQ-001
    contextRefs:
      - CTX-001
    globalDecisionRefs: []
    parentDecisionRef: null
    options:
      - id: web-app
        title: Web App
        description: A web application.
        pros:
          - Simple
        cons:
          - Needs hosting
      - id: extension
        title: Browser Extension
        description: A browser extension.
        pros:
          - No hosting needed
        cons:
          - Platform-specific
    chosen: extension
    chosenReason: Best fit for the use case.
  - id: DEC-TP-002
    category: technology
    topic: Database choice
    context: Where to store data.
    requirementRefs:
      - REQ-001
    contextRefs:
      - CTX-002
    globalDecisionRefs: []
    options:
      - id: sqlite
        title: SQLite
        description: Local database.
        pros:
          - Simple
        cons:
          - Not scalable
    chosen: sqlite
    chosenReason: Simplest option.
`;

    test("propagates full decision including options and assigns DEC-GLOBAL-001 ID", async () => {
      const port = nextPort();
      writeProjectDesign(FULL_PROJECT_DESIGN);

      handle = startUiServer({ port, distUiDir, docsDir, open: false });
      await sleep(500);

      const res = await propagate(port, "DEC-TP-001");
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.globalDecisionId).toBe("DEC-GLOBAL-001");

      // Global design should contain the full decision with options
      const global = readGlobalDesign();
      const decisions = global.decisions as Record<string, unknown>[];
      expect(decisions).toHaveLength(1);

      const propagated = decisions[0];
      expect(propagated.id).toBe("DEC-GLOBAL-001");
      expect(propagated.topic).toBe("App form factor");
      expect(propagated.chosen).toBe("extension");
      expect(propagated.chosenReason).toBe("Best fit for the use case.");
      expect(propagated.category).toBe("architecture");

      // Options must be fully preserved
      const options = propagated.options as Record<string, unknown>[];
      expect(options).toHaveLength(2);
      expect(options[0].id).toBe("web-app");
      expect(options[1].id).toBe("extension");
      expect(options[0].pros).toEqual(["Simple"]);
    });

    test("strips project-specific fields (contextRefs, parentDecisionRef, globalDecisionRefs)", async () => {
      const port = nextPort();
      writeProjectDesign(FULL_PROJECT_DESIGN);

      handle = startUiServer({ port, distUiDir, docsDir, open: false });
      await sleep(500);

      const res = await propagate(port, "DEC-TP-001");
      expect(res.status).toBe(200);

      const global = readGlobalDesign();
      const propagated = (global.decisions as Record<string, unknown>[])[0];

      expect(propagated.contextRefs).toBeUndefined();
      expect(propagated.parentDecisionRef).toBeUndefined();
      expect(propagated.globalDecisionRefs).toBeUndefined();

      // requirementRefs should be kept for traceability
      expect(propagated.requirementRefs).toEqual(["REQ-001"]);
    });

    test("removes propagated decision from project design", async () => {
      const port = nextPort();
      writeProjectDesign(FULL_PROJECT_DESIGN);

      handle = startUiServer({ port, distUiDir, docsDir, open: false });
      await sleep(500);

      await propagate(port, "DEC-TP-001");

      const project = readProjectDesign();
      const remaining = project.decisions as Record<string, unknown>[];
      expect(remaining).toHaveLength(1);
      expect(remaining[0].id).toBe("DEC-TP-002");
    });

    test("adds globalDecisionRef to remaining project decisions that share requirementRefs", async () => {
      const port = nextPort();
      writeProjectDesign(FULL_PROJECT_DESIGN);

      handle = startUiServer({ port, distUiDir, docsDir, open: false });
      await sleep(500);

      await propagate(port, "DEC-TP-001");

      const project = readProjectDesign();
      const remaining = (project.decisions as Record<string, unknown>[])[0];
      // DEC-TP-002 shares REQ-001 with DEC-TP-001, so it should get the new global ref
      expect(remaining.globalDecisionRefs).toEqual(["DEC-GLOBAL-001"]);
    });

    test("assigns sequential IDs when global decisions already exist", async () => {
      const port = nextPort();
      writeProjectDesign(FULL_PROJECT_DESIGN);
      writeGlobalDesign(`decisions:
  - id: DEC-GLOBAL-001
    category: other
    topic: Existing decision
    context: Already here.
    requirementRefs: []
    options: []
    chosen: null
    chosenReason: null
`);

      handle = startUiServer({ port, distUiDir, docsDir, open: false });
      await sleep(500);

      const res = await propagate(port, "DEC-TP-001");
      expect(res.status).toBe(200);

      const body = await res.json();
      expect(body.globalDecisionId).toBe("DEC-GLOBAL-002");

      const global = readGlobalDesign();
      const decisions = global.decisions as Record<string, unknown>[];
      expect(decisions).toHaveLength(2);
      expect(decisions[1].id).toBe("DEC-GLOBAL-002");
    });

    test("returns 400 when trying to propagate an unchosen decision", async () => {
      const port = nextPort();
      writeProjectDesign(`decisions:
  - id: DEC-TP-010
    category: other
    topic: Unchosen
    context: Not decided yet.
    requirementRefs: []
    options:
      - id: opt-a
        title: Option A
        description: First option.
        pros: []
        cons: []
    chosen: null
    chosenReason: null
`);

      handle = startUiServer({ port, distUiDir, docsDir, open: false });
      await sleep(500);

      const res = await propagate(port, "DEC-TP-010");
      expect(res.status).toBe(400);

      const body = await res.json();
      expect(body.error).toContain("has not been chosen yet");
    });

    test("returns 404 when decision ID does not exist in project", async () => {
      const port = nextPort();
      writeProjectDesign(FULL_PROJECT_DESIGN);

      handle = startUiServer({ port, distUiDir, docsDir, open: false });
      await sleep(500);

      const res = await propagate(port, "DEC-NONEXISTENT");
      expect(res.status).toBe(404);

      const body = await res.json();
      expect(body.error).toContain("not found");
    });

    test("returns 404 when project design.yaml does not exist", async () => {
      const port = nextPort();
      // Don't create project design file

      handle = startUiServer({ port, distUiDir, docsDir, open: false });
      await sleep(500);

      const res = await propagate(port, "DEC-TP-001");
      expect(res.status).toBe(404);
    });
  });
});
