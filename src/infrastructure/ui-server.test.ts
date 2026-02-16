import {
  afterEach,
  beforeEach,
  describe,
  expect,
  test,
  mock,
} from "bun:test";
import { createServer as createTcpServer, type Server } from "node:net";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
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

  test("returns empty defaults for missing project implementation.yaml", async () => {
    const port = 19602;
    mkdirSync(join(docsDir, "projects", "my-project"), { recursive: true });

    handle = startUiServer({ port, distUiDir, docsDir, open: false });
    await sleep(500);

    const res = await fetch(`http://localhost:${port}/docs/projects/my-project/implementation.yaml`);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(body).toBe("todos: []\nvalidations: []\ntests: []\n");
  });

  test("returns 404 for missing non-optional YAML files", async () => {
    const port = 19603;

    handle = startUiServer({ port, distUiDir, docsDir, open: false });
    await sleep(500);

    const res = await fetch(`http://localhost:${port}/docs/projects/my-project/requirements.yaml`);
    expect(res.status).toBe(404);
  });
});
