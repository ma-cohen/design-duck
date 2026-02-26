/**
 * Built-in HTTP server for the Design Duck UI.
 *
 * Serves four things:
 * 1. Pre-built static UI files from dist-ui/ (shipped with the package)
 * 2. Docs YAML files from the consumer's project (process.cwd())
 * 3. An SSE endpoint (/events) for real-time file change notifications
 * 4. A /api/projects endpoint listing available project directories
 *
 * This removes the need for Vite or any build tooling in consuming projects.
 */

import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { execSync } from "node:child_process";
import { dump as yamlDump, load as yamlLoad } from "js-yaml";
import { watchDocsDir } from "./file-watcher";
import type { FileWatcherHandle } from "./file-watcher";
import {
  validateRequirement,
  validateContextItem,
  validateDecision,
} from "../domain/requirements/requirement";

/** Options for starting the UI server. */
export interface UiServerOptions {
  /** Port to listen on. @default 3456 */
  port?: number;
  /** Absolute path to the dist-ui/ directory with pre-built UI files. */
  distUiDir: string;
  /** Absolute path to the desgin-duck/docs/ directory to serve YAML files from. */
  docsDir: string;
  /** Whether to open the browser automatically. @default true */
  open?: boolean;
}

/** Handle returned by startUiServer to control the server lifecycle. */
export interface UiServerHandle {
  /** Stop the server and release all resources. */
  close: () => void;
  /** The port the server is listening on. */
  port: number;
}

// ---------------------------------------------------------------------------
// MIME type mapping
// ---------------------------------------------------------------------------

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".yaml": "text/yaml; charset=utf-8",
  ".yml": "text/yaml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

/**
 * Starts the Design Duck UI server.
 *
 * @param options - Server configuration
 * @returns A handle with a `close()` method and the actual port
 * @throws Error if dist-ui/ or desgin-duck/docs/ directories are missing
 */
export function startUiServer(options: UiServerOptions): UiServerHandle {
  const { port = 3456, distUiDir, docsDir, open = true } = options;
  const maxPort = port + 100;
  let currentPort = port;

  if (!existsSync(distUiDir)) {
    throw new Error(
      `UI assets not found at ${distUiDir}. Run 'bun run build:ui' first.`,
    );
  }

  if (!existsSync(docsDir)) {
    throw new Error(
      `desgin-duck/docs/ not found at ${docsDir}. Run 'design-duck init' first.`,
    );
  }

  console.log(
    `[design-duck:server] Serving UI from: ${distUiDir}`,
  );
  console.log(
    `[design-duck:server] Serving docs from: ${docsDir}`,
  );

  // Track connected SSE clients (scoped to this server instance)
  const sseClients = new Set<ServerResponse>();

  // Set up file watcher to push SSE events on YAML changes
  let watcherHandle: FileWatcherHandle | null = null;
  try {
    watcherHandle = watchDocsDir(docsDir, () => {
      console.log(
        `[design-duck:server] Docs changed, notifying ${sseClients.size} client(s)`,
      );
      for (const client of sseClients) {
        client.write("event: docs-changed\ndata: {}\n\n");
      }
    });
    console.log("[design-duck:server] File watcher active on docs/");
  } catch (err) {
    console.warn(
      `[design-duck:server] Could not start file watcher: ${err instanceof Error ? err.message : err}`,
    );
  }

  // Create HTTP server
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://localhost:${currentPort}`);
    const pathname = url.pathname;

    if (process.env.DEBUG) {
      console.error(`[design-duck:server] ${req.method} ${pathname}`);
    }

    // Handle CORS preflight for write APIs
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
      return;
    }

    // SSE endpoint for file change notifications
    if (pathname === "/events") {
      handleSSE(res, sseClients);
      return;
    }

    // API: list project directories
    if (pathname === "/api/projects" && req.method === "GET") {
      handleProjectsList(docsDir, res);
      return;
    }

    // API: list playground directories
    if (pathname === "/api/playgrounds" && req.method === "GET") {
      handlePlaygroundsList(docsDir, res);
      return;
    }

    // Write API: PUT /api/vision
    if (pathname === "/api/vision" && req.method === "PUT") {
      handlePutVision(req, res, docsDir);
      return;
    }

    // Write API: PUT /api/design (root-level global design)
    if (pathname === "/api/design" && req.method === "PUT") {
      handlePutGlobalDesign(req, res, docsDir);
      return;
    }

    // Write API: PUT /api/context (root-level context)
    if (pathname === "/api/context" && req.method === "PUT") {
      handlePutContext(req, res, docsDir);
      return;
    }

    // Write API: PUT /api/projects/:name/context
    const ctxMatch = pathname.match(/^\/api\/projects\/([^/]+)\/context$/);
    if (ctxMatch && req.method === "PUT") {
      handlePutProjectContext(req, res, docsDir, decodeURIComponent(ctxMatch[1]));
      return;
    }

    // Write API: PUT /api/projects/:name/requirements
    const reqMatch = pathname.match(/^\/api\/projects\/([^/]+)\/requirements$/);
    if (reqMatch && req.method === "PUT") {
      handlePutRequirements(req, res, docsDir, decodeURIComponent(reqMatch[1]));
      return;
    }

    // Write API: PUT /api/projects/:name/design
    const designMatch = pathname.match(/^\/api\/projects\/([^/]+)\/design$/);
    if (designMatch && req.method === "PUT") {
      handlePutDesign(req, res, docsDir, decodeURIComponent(designMatch[1]));
      return;
    }

    // Write API: POST /api/projects/:name/design/propagate
    const propagateMatch = pathname.match(/^\/api\/projects\/([^/]+)\/design\/propagate$/);
    if (propagateMatch && req.method === "POST") {
      handlePropagateDecision(req, res, docsDir, decodeURIComponent(propagateMatch[1]));
      return;
    }

    // Delete API: DELETE /api/projects/:name
    const deleteMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (deleteMatch && req.method === "DELETE") {
      handleDeleteProject(res, docsDir, decodeURIComponent(deleteMatch[1]));
      return;
    }

    // Write API: PUT /api/playgrounds/:name/requirements
    const pgReqMatch = pathname.match(/^\/api\/playgrounds\/([^/]+)\/requirements$/);
    if (pgReqMatch && req.method === "PUT") {
      handlePutPlaygroundRequirements(req, res, docsDir, decodeURIComponent(pgReqMatch[1]));
      return;
    }

    // Write API: PUT /api/playgrounds/:name/context
    const pgCtxMatch = pathname.match(/^\/api\/playgrounds\/([^/]+)\/context$/);
    if (pgCtxMatch && req.method === "PUT") {
      handlePutPlaygroundContext(req, res, docsDir, decodeURIComponent(pgCtxMatch[1]));
      return;
    }

    // Write API: PUT /api/playgrounds/:name/design
    const pgDesignMatch = pathname.match(/^\/api\/playgrounds\/([^/]+)\/design$/);
    if (pgDesignMatch && req.method === "PUT") {
      handlePutPlaygroundDesign(req, res, docsDir, decodeURIComponent(pgDesignMatch[1]));
      return;
    }

    // Delete API: DELETE /api/playgrounds/:name
    const pgDeleteMatch = pathname.match(/^\/api\/playgrounds\/([^/]+)$/);
    if (pgDeleteMatch && req.method === "DELETE") {
      handleDeletePlayground(res, docsDir, decodeURIComponent(pgDeleteMatch[1]));
      return;
    }

    // Serve docs YAML files from the consumer's project
    if (pathname.startsWith("/docs/")) {
      const filename = pathname.slice("/docs/".length);
      const filePath = join(docsDir, filename);

      // For optional project YAML files that don't exist yet, return
      // sensible empty defaults instead of 404. These files are created
      // as the user progresses through the design workflow.
      if (!existsSync(filePath) && filename.endsWith(".yaml")) {
        const basename = filename.split("/").pop();
        const emptyDefaults: Record<string, string> = {
          "context.yaml": "contexts: []\n",
          "design.yaml": "decisions: []\n",
        };
        const defaultContent = basename ? emptyDefaults[basename] : undefined;
        if (defaultContent) {
          res.writeHead(200, {
            "Content-Type": "text/yaml; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
          });
          res.end(defaultContent);
          return;
        }
      }

      serveFile(filePath, res);
      return;
    }

    // Serve pre-built static UI files
    let filePath = join(distUiDir, pathname === "/" ? "index.html" : pathname);
    if (!existsSync(filePath)) {
      // SPA fallback: serve index.html for unmatched routes
      filePath = join(distUiDir, "index.html");
    }
    serveFile(filePath, res);
  });

  // Return handle — `port` is updated once the server successfully binds
  const handle: UiServerHandle = {
    port,
    close: () => {
      console.log("[design-duck:server] Shutting down...");
      watcherHandle?.close();
      for (const client of sseClients) {
        client.end();
      }
      sseClients.clear();
      server.close();
    },
  };

  // Retry-based port selection: try currentPort, increment on EADDRINUSE
  //
  // NOTE: We register the success handler via a single `server.once('listening')`
  // rather than passing a callback to each `server.listen()` call. In Node.js,
  // `server.listen(port, cb)` adds `cb` as a `once('listening')` listener, but
  // failed attempts (EADDRINUSE) do NOT remove those listeners. This caused a
  // bug where each retry accumulated another listener, and when the server
  // finally bound successfully ALL of them fired — opening many browser windows.
  let browserOpened = false;
  server.once("listening", () => {
    handle.port = currentPort;
    const url = `http://localhost:${currentPort}`;
    if (currentPort !== port) {
      console.log(`(Port ${port} was in use, using ${currentPort} instead)`);
    }
    console.log(`\nDesign Duck UI running at ${url}\n`);

    if (open && !browserOpened) {
      browserOpened = true;
      openBrowser(url);
    }
  });

  function tryListen() {
    server.listen(currentPort);
  }

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      if (currentPort < maxPort) {
        currentPort++;
        tryListen();
      } else {
        console.error(
          `All ports in range ${port}-${maxPort} are in use. Cannot start the UI server.`,
        );
      }
    } else {
      console.error(`[design-duck:server] Server error: ${err.message}`);
    }
  });

  tryListen();

  return handle;
}

// ---------------------------------------------------------------------------
// SSE handler
// ---------------------------------------------------------------------------

function handleSSE(
  res: ServerResponse,
  clients: Set<ServerResponse>,
): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "Access-Control-Allow-Origin": "*",
  });

  // Send initial connection event
  res.write("event: connected\ndata: {}\n\n");

  clients.add(res);
  console.log(
    `[design-duck:server] SSE client connected (${clients.size} total)`,
  );

  res.on("close", () => {
    clients.delete(res);
    console.log(
      `[design-duck:server] SSE client disconnected (${clients.size} remaining)`,
    );
  });
}

// ---------------------------------------------------------------------------
// Projects API
// ---------------------------------------------------------------------------

function handleProjectsList(
  docsDir: string,
  res: ServerResponse,
): void {
  try {
    const projectsDir = join(docsDir, "projects");
    let projects: string[] = [];

    if (existsSync(projectsDir)) {
      const entries = readdirSync(projectsDir);
      projects = entries.filter((entry) => {
        try {
          return statSync(join(projectsDir, entry)).isDirectory();
        } catch {
          return false;
        }
      });
    }

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify(projects));
  } catch {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Failed to list projects" }));
  }
}

// ---------------------------------------------------------------------------
// Playgrounds API
// ---------------------------------------------------------------------------

function handlePlaygroundsList(
  docsDir: string,
  res: ServerResponse,
): void {
  try {
    const playgroundsDir = join(docsDir, "playgrounds");
    let playgrounds: string[] = [];

    if (existsSync(playgroundsDir)) {
      const entries = readdirSync(playgroundsDir);
      playgrounds = entries.filter((entry) => {
        try {
          return statSync(join(playgroundsDir, entry)).isDirectory();
        } catch {
          return false;
        }
      });
    }

    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    });
    res.end(JSON.stringify(playgrounds));
  } catch {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Failed to list playgrounds" }));
  }
}

async function handlePutPlaygroundRequirements(
  req: IncomingMessage,
  res: ServerResponse,
  docsDir: string,
  playgroundName: string,
): Promise<void> {
  try {
    const raw = JSON.parse(await readBody(req));

    if (typeof raw.problemStatement !== "string") {
      jsonResponse(res, 400, { error: "problemStatement must be a string" });
      return;
    }
    if (!Array.isArray(raw.requirements)) {
      jsonResponse(res, 400, { error: "requirements must be an array" });
      return;
    }
    for (let i = 0; i < raw.requirements.length; i++) {
      const result = validateRequirement(raw.requirements[i]);
      if (!result.valid) {
        jsonResponse(res, 400, {
          error: `Requirement at index ${i} is invalid`,
          details: result.errors,
        });
        return;
      }
    }

    const yamlContent = yamlDump(raw, { lineWidth: 120, noRefs: true });
    const dirPath = join(docsDir, "playgrounds", playgroundName);
    mkdirSync(dirPath, { recursive: true });
    writeFileSync(join(dirPath, "requirements.yaml"), yamlContent, "utf-8");
    jsonResponse(res, 200, { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    jsonResponse(res, 400, { error: message });
  }
}

async function handlePutPlaygroundContext(
  req: IncomingMessage,
  res: ServerResponse,
  docsDir: string,
  playgroundName: string,
): Promise<void> {
  try {
    const raw = JSON.parse(await readBody(req));

    if (!Array.isArray(raw.contexts)) {
      jsonResponse(res, 400, { error: "contexts must be an array" });
      return;
    }
    for (let i = 0; i < raw.contexts.length; i++) {
      const result = validateContextItem(raw.contexts[i]);
      if (!result.valid) {
        jsonResponse(res, 400, {
          error: `Context item at index ${i} is invalid`,
          details: result.errors,
        });
        return;
      }
    }

    const yamlContent = yamlDump(raw, { lineWidth: 120, noRefs: true });
    const dirPath = join(docsDir, "playgrounds", playgroundName);
    mkdirSync(dirPath, { recursive: true });
    writeFileSync(join(dirPath, "context.yaml"), yamlContent, "utf-8");
    jsonResponse(res, 200, { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    jsonResponse(res, 400, { error: message });
  }
}

async function handlePutPlaygroundDesign(
  req: IncomingMessage,
  res: ServerResponse,
  docsDir: string,
  playgroundName: string,
): Promise<void> {
  try {
    const raw = JSON.parse(await readBody(req));

    if (raw.notes !== undefined && raw.notes !== null && typeof raw.notes !== "string") {
      jsonResponse(res, 400, { error: "notes must be a string or null" });
      return;
    }

    if (!Array.isArray(raw.decisions)) {
      jsonResponse(res, 400, { error: "decisions must be an array" });
      return;
    }
    for (let i = 0; i < raw.decisions.length; i++) {
      const result = validateDecision(raw.decisions[i]);
      if (!result.valid) {
        jsonResponse(res, 400, {
          error: `Decision at index ${i} is invalid`,
          details: result.errors,
        });
        return;
      }
    }

    const toWrite: Record<string, unknown> = {};
    if (raw.notes) {
      toWrite.notes = raw.notes;
    }
    toWrite.decisions = raw.decisions;

    const yamlContent = yamlDump(toWrite, { lineWidth: 120, noRefs: true });
    const dirPath = join(docsDir, "playgrounds", playgroundName);
    mkdirSync(dirPath, { recursive: true });
    writeFileSync(join(dirPath, "design.yaml"), yamlContent, "utf-8");
    jsonResponse(res, 200, { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    jsonResponse(res, 400, { error: message });
  }
}

function handleDeletePlayground(
  res: ServerResponse,
  docsDir: string,
  playgroundName: string,
): void {
  try {
    const dirPath = join(docsDir, "playgrounds", playgroundName);
    if (!existsSync(dirPath)) {
      jsonResponse(res, 404, { error: `Playground "${playgroundName}" not found` });
      return;
    }
    rmSync(dirPath, { recursive: true, force: true });
    console.log(`[design-duck:server] Deleted playground directory: ${dirPath}`);
    jsonResponse(res, 200, { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    jsonResponse(res, 500, { error: message });
  }
}

// ---------------------------------------------------------------------------
// Static file serving
// ---------------------------------------------------------------------------

function serveFile(filePath: string, res: ServerResponse): void {
  try {
    const content = readFileSync(filePath);
    const ext = extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";
    res.writeHead(200, { "Content-Type": contentType });
    res.end(content);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  }
}

// ---------------------------------------------------------------------------
// Request body helper
// ---------------------------------------------------------------------------

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

function jsonResponse(
  res: ServerResponse,
  status: number,
  body: unknown,
): void {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(body));
}

// ---------------------------------------------------------------------------
// Write API handlers
// ---------------------------------------------------------------------------

async function handlePutVision(
  req: IncomingMessage,
  res: ServerResponse,
  docsDir: string,
): Promise<void> {
  try {
    const raw = JSON.parse(await readBody(req));

    // Structural validation only — empty fields are allowed (strict checks live in the validate command)
    if (raw === null || typeof raw !== "object") {
      jsonResponse(res, 400, { error: "Body must be a JSON object" });
      return;
    }
    if (typeof raw.vision !== "string" || typeof raw.mission !== "string" || typeof raw.problem !== "string") {
      jsonResponse(res, 400, { error: "vision, mission, and problem must be strings" });
      return;
    }
    const yamlContent = yamlDump(raw, { lineWidth: 120, noRefs: true });
    const filePath = join(docsDir, "vision.yaml");
    writeFileSync(filePath, yamlContent, "utf-8");
    jsonResponse(res, 200, { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    jsonResponse(res, 400, { error: message });
  }
}

async function handlePutGlobalDesign(
  req: IncomingMessage,
  res: ServerResponse,
  docsDir: string,
): Promise<void> {
  try {
    const raw = JSON.parse(await readBody(req));

    // Validate optional notes field
    if (raw.notes !== undefined && raw.notes !== null && typeof raw.notes !== "string") {
      jsonResponse(res, 400, { error: "notes must be a string or null" });
      return;
    }

    if (!Array.isArray(raw.decisions)) {
      jsonResponse(res, 400, { error: "decisions must be an array" });
      return;
    }
    for (let i = 0; i < raw.decisions.length; i++) {
      const result = validateDecision(raw.decisions[i]);
      if (!result.valid) {
        jsonResponse(res, 400, {
          error: `Decision at index ${i} is invalid`,
          details: result.errors,
        });
        return;
      }
    }

    // Build clean object for YAML serialization (notes + decisions)
    const toWrite: Record<string, unknown> = {};
    if (raw.notes) {
      toWrite.notes = raw.notes;
    }
    toWrite.decisions = raw.decisions;

    const yamlContent = yamlDump(toWrite, { lineWidth: 120, noRefs: true });
    writeFileSync(join(docsDir, "design.yaml"), yamlContent, "utf-8");
    jsonResponse(res, 200, { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    jsonResponse(res, 400, { error: message });
  }
}

async function handlePutContext(
  req: IncomingMessage,
  res: ServerResponse,
  docsDir: string,
): Promise<void> {
  try {
    const raw = JSON.parse(await readBody(req));

    if (!Array.isArray(raw.contexts)) {
      jsonResponse(res, 400, { error: "contexts must be an array" });
      return;
    }
    for (let i = 0; i < raw.contexts.length; i++) {
      const result = validateContextItem(raw.contexts[i]);
      if (!result.valid) {
        jsonResponse(res, 400, {
          error: `Context item at index ${i} is invalid`,
          details: result.errors,
        });
        return;
      }
    }

    const yamlContent = yamlDump(raw, { lineWidth: 120, noRefs: true });
    writeFileSync(join(docsDir, "context.yaml"), yamlContent, "utf-8");
    jsonResponse(res, 200, { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    jsonResponse(res, 400, { error: message });
  }
}

async function handlePutProjectContext(
  req: IncomingMessage,
  res: ServerResponse,
  docsDir: string,
  projectName: string,
): Promise<void> {
  try {
    const raw = JSON.parse(await readBody(req));

    if (!Array.isArray(raw.contexts)) {
      jsonResponse(res, 400, { error: "contexts must be an array" });
      return;
    }
    for (let i = 0; i < raw.contexts.length; i++) {
      const result = validateContextItem(raw.contexts[i]);
      if (!result.valid) {
        jsonResponse(res, 400, {
          error: `Context item at index ${i} is invalid`,
          details: result.errors,
        });
        return;
      }
    }

    const yamlContent = yamlDump(raw, { lineWidth: 120, noRefs: true });
    const dirPath = join(docsDir, "projects", projectName);
    mkdirSync(dirPath, { recursive: true });
    writeFileSync(join(dirPath, "context.yaml"), yamlContent, "utf-8");
    jsonResponse(res, 200, { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    jsonResponse(res, 400, { error: message });
  }
}

async function handlePutRequirements(
  req: IncomingMessage,
  res: ServerResponse,
  docsDir: string,
  projectName: string,
): Promise<void> {
  try {
    const raw = JSON.parse(await readBody(req));

    // Structural validation only — empty visionAlignment is allowed (strict checks live in the validate command)
    if (typeof raw.visionAlignment !== "string") {
      jsonResponse(res, 400, { error: "visionAlignment must be a string" });
      return;
    }
    if (!Array.isArray(raw.requirements)) {
      jsonResponse(res, 400, { error: "requirements must be an array" });
      return;
    }
    for (let i = 0; i < raw.requirements.length; i++) {
      const result = validateRequirement(raw.requirements[i]);
      if (!result.valid) {
        jsonResponse(res, 400, {
          error: `Requirement at index ${i} is invalid`,
          details: result.errors,
        });
        return;
      }
    }

    const yamlContent = yamlDump(raw, { lineWidth: 120, noRefs: true });
    const dirPath = join(docsDir, "projects", projectName);
    mkdirSync(dirPath, { recursive: true });
    writeFileSync(join(dirPath, "requirements.yaml"), yamlContent, "utf-8");
    jsonResponse(res, 200, { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    jsonResponse(res, 400, { error: message });
  }
}

async function handlePutDesign(
  req: IncomingMessage,
  res: ServerResponse,
  docsDir: string,
  projectName: string,
): Promise<void> {
  try {
    const raw = JSON.parse(await readBody(req));

    // Validate optional notes field
    if (raw.notes !== undefined && raw.notes !== null && typeof raw.notes !== "string") {
      jsonResponse(res, 400, { error: "notes must be a string or null" });
      return;
    }

    if (!Array.isArray(raw.decisions)) {
      jsonResponse(res, 400, { error: "decisions must be an array" });
      return;
    }
    for (let i = 0; i < raw.decisions.length; i++) {
      const result = validateDecision(raw.decisions[i]);
      if (!result.valid) {
        jsonResponse(res, 400, {
          error: `Decision at index ${i} is invalid`,
          details: result.errors,
        });
        return;
      }
    }

    // Build clean object for YAML serialization (notes + decisions)
    const toWrite: Record<string, unknown> = {};
    if (raw.notes) {
      toWrite.notes = raw.notes;
    }
    toWrite.decisions = raw.decisions;

    const yamlContent = yamlDump(toWrite, { lineWidth: 120, noRefs: true });
    const dirPath = join(docsDir, "projects", projectName);
    mkdirSync(dirPath, { recursive: true });
    writeFileSync(join(dirPath, "design.yaml"), yamlContent, "utf-8");
    jsonResponse(res, 200, { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    jsonResponse(res, 400, { error: message });
  }
}

// ---------------------------------------------------------------------------
// Propagate Decision API handler
// ---------------------------------------------------------------------------

async function handlePropagateDecision(
  req: IncomingMessage,
  res: ServerResponse,
  docsDir: string,
  projectName: string,
): Promise<void> {
  try {
    const raw = JSON.parse(await readBody(req));

    if (!raw.decisionId || typeof raw.decisionId !== "string") {
      jsonResponse(res, 400, { error: "decisionId must be a non-empty string" });
      return;
    }

    const decisionId: string = raw.decisionId;

    // Read project design
    const projectDesignPath = join(docsDir, "projects", projectName, "design.yaml");
    if (!existsSync(projectDesignPath)) {
      jsonResponse(res, 404, { error: `design.yaml not found for project "${projectName}"` });
      return;
    }

    const projectDesignRaw = yamlLoad(readFileSync(projectDesignPath, "utf-8")) as Record<string, unknown>;
    if (!projectDesignRaw || !Array.isArray(projectDesignRaw.decisions)) {
      jsonResponse(res, 400, { error: "Project design.yaml is invalid" });
      return;
    }

    // Find the decision to propagate
    const decisionIndex = projectDesignRaw.decisions.findIndex(
      (d: Record<string, unknown>) => d.id === decisionId,
    );
    if (decisionIndex === -1) {
      jsonResponse(res, 404, { error: `Decision "${decisionId}" not found in project "${projectName}"` });
      return;
    }

    const decision = projectDesignRaw.decisions[decisionIndex] as Record<string, unknown>;

    // Ensure the decision has been chosen
    if (!decision.chosen) {
      jsonResponse(res, 400, { error: `Decision "${decisionId}" has not been chosen yet. Only chosen decisions can be propagated to global.` });
      return;
    }

    // Read existing global design (or create empty)
    const globalDesignPath = join(docsDir, "design.yaml");
    let globalDecisions: Record<string, unknown>[] = [];
    let globalNotes: string | null = null;

    if (existsSync(globalDesignPath)) {
      const globalDesignRaw = yamlLoad(readFileSync(globalDesignPath, "utf-8")) as Record<string, unknown> | null;
      if (globalDesignRaw && Array.isArray(globalDesignRaw.decisions)) {
        globalDecisions = globalDesignRaw.decisions;
      }
      if (globalDesignRaw && typeof globalDesignRaw.notes === "string") {
        globalNotes = globalDesignRaw.notes;
      }
    }

    // Assign a new DEC-GLOBAL-NNN ID for the propagated decision
    const existingGlobalNums = globalDecisions
      .map((d) => d.id as string)
      .filter((id) => /^DEC-GLOBAL-\d+$/.test(id))
      .map((id) => parseInt((id as string).replace("DEC-GLOBAL-", ""), 10));
    const nextNum = existingGlobalNums.length > 0 ? Math.max(...existingGlobalNums) + 1 : 1;
    const newGlobalId = `DEC-GLOBAL-${String(nextNum).padStart(3, "0")}`;

    // Check for ID collision (should not happen with sequential numbering, but guard anyway)
    if (globalDecisions.some((d) => d.id === newGlobalId)) {
      jsonResponse(res, 409, { error: `A global decision with ID "${newGlobalId}" already exists` });
      return;
    }

    // 1. Build the global decision: copy full decision, assign new ID, strip project-specific fields
    const globalDecision: Record<string, unknown> = { ...decision, id: newGlobalId };
    delete globalDecision.contextRefs;
    delete globalDecision.parentDecisionRef;
    delete globalDecision.globalDecisionRefs;
    globalDecisions.push(globalDecision);

    const globalToWrite: Record<string, unknown> = {};
    if (globalNotes) {
      globalToWrite.notes = globalNotes;
    }
    globalToWrite.decisions = globalDecisions;
    writeFileSync(globalDesignPath, yamlDump(globalToWrite, { lineWidth: 120, noRefs: true }), "utf-8");

    // 2. Remove decision from project design + update globalDecisionRefs on related decisions
    const propagatedReqRefs = new Set(
      Array.isArray(decision.requirementRefs) ? (decision.requirementRefs as string[]) : [],
    );
    const remainingDecisions = projectDesignRaw.decisions
      .filter((_: unknown, i: number) => i !== decisionIndex)
      .map((d: Record<string, unknown>) => {
        // If another decision shares requirementRefs with the propagated one, add a globalDecisionRef
        const dReqRefs = Array.isArray(d.requirementRefs) ? (d.requirementRefs as string[]) : [];
        const hasSharedRef = dReqRefs.some((ref: string) => propagatedReqRefs.has(ref));
        if (hasSharedRef) {
          const existingGlobalRefs = Array.isArray(d.globalDecisionRefs) ? (d.globalDecisionRefs as string[]) : [];
          if (!existingGlobalRefs.includes(newGlobalId)) {
            return { ...d, globalDecisionRefs: [...existingGlobalRefs, newGlobalId] };
          }
        }
        return d;
      });

    const projectToWrite: Record<string, unknown> = {};
    if (typeof projectDesignRaw.notes === "string" && projectDesignRaw.notes) {
      projectToWrite.notes = projectDesignRaw.notes;
    }
    projectToWrite.decisions = remainingDecisions;
    writeFileSync(projectDesignPath, yamlDump(projectToWrite, { lineWidth: 120, noRefs: true }), "utf-8");

    console.log(`[design-duck:server] Propagated decision "${decisionId}" from project "${projectName}" to global as "${newGlobalId}"`);
    jsonResponse(res, 200, { ok: true, globalDecisionId: newGlobalId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    jsonResponse(res, 400, { error: message });
  }
}

// ---------------------------------------------------------------------------
// Delete API handler
// ---------------------------------------------------------------------------

function handleDeleteProject(
  res: ServerResponse,
  docsDir: string,
  projectName: string,
): void {
  try {
    const dirPath = join(docsDir, "projects", projectName);
    if (!existsSync(dirPath)) {
      jsonResponse(res, 404, { error: `Project "${projectName}" not found` });
      return;
    }
    rmSync(dirPath, { recursive: true, force: true });
    console.log(`[design-duck:server] Deleted project directory: ${dirPath}`);
    jsonResponse(res, 200, { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    jsonResponse(res, 500, { error: message });
  }
}

// ---------------------------------------------------------------------------
// Browser opener
// ---------------------------------------------------------------------------

function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin"
      ? "open"
      : process.platform === "win32"
        ? "start"
        : "xdg-open";

  try {
    execSync(`${cmd} ${url}`, { stdio: "ignore" });
  } catch {
    // Silently fail — user can open manually
  }
}
