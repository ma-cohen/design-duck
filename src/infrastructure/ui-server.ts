/**
 * Built-in HTTP server for the Design Duck UI.
 *
 * Serves four things:
 * 1. Pre-built static UI files from dist-ui/ (shipped with the package)
 * 2. Requirements YAML files from the consumer's project (process.cwd())
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
import { dump as yamlDump } from "js-yaml";
import { watchRequirementsDir } from "./file-watcher";
import type { FileWatcherHandle } from "./file-watcher";
import {
  validateVision,
  validateRequirement,
  validateDecision,
} from "../domain/requirements/requirement";

/** Options for starting the UI server. */
export interface UiServerOptions {
  /** Port to listen on. @default 3456 */
  port?: number;
  /** Absolute path to the dist-ui/ directory with pre-built UI files. */
  distUiDir: string;
  /** Absolute path to the desgin-duck/requirements/ directory to serve YAML files from. */
  requirementsDir: string;
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
 * @throws Error if dist-ui/ or desgin-duck/requirements/ directories are missing
 */
export function startUiServer(options: UiServerOptions): UiServerHandle {
  const { port = 3456, distUiDir, requirementsDir, open = true } = options;

  if (!existsSync(distUiDir)) {
    throw new Error(
      `UI assets not found at ${distUiDir}. Run 'bun run build:ui' first.`,
    );
  }

  if (!existsSync(requirementsDir)) {
    throw new Error(
      `desgin-duck/requirements/ not found at ${requirementsDir}. Run 'design-duck init' first.`,
    );
  }

  console.log(
    `[design-duck:server] Serving UI from: ${distUiDir}`,
  );
  console.log(
    `[design-duck:server] Serving requirements from: ${requirementsDir}`,
  );

  // Track connected SSE clients (scoped to this server instance)
  const sseClients = new Set<ServerResponse>();

  // Set up file watcher to push SSE events on YAML changes
  let watcherHandle: FileWatcherHandle | null = null;
  try {
    watcherHandle = watchRequirementsDir(requirementsDir, () => {
      console.log(
        `[design-duck:server] Requirements changed, notifying ${sseClients.size} client(s)`,
      );
      for (const client of sseClients) {
        client.write("event: requirements-changed\ndata: {}\n\n");
      }
    });
    console.log("[design-duck:server] File watcher active on requirements/");
  } catch (err) {
    console.warn(
      `[design-duck:server] Could not start file watcher: ${err instanceof Error ? err.message : err}`,
    );
  }

  // Create HTTP server
  const server = createServer((req, res) => {
    const url = new URL(req.url || "/", `http://localhost:${port}`);
    const pathname = url.pathname;

    if (process.env.DEBUG) {
      console.error(`[design-duck:server] ${req.method} ${pathname}`);
    }

    // Handle CORS preflight for write APIs
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, PUT, DELETE, OPTIONS",
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
      handleProjectsList(requirementsDir, res);
      return;
    }

    // Write API: PUT /api/vision
    if (pathname === "/api/vision" && req.method === "PUT") {
      handlePutVision(req, res, requirementsDir);
      return;
    }

    // Write API: PUT /api/projects/:name/requirements
    const reqMatch = pathname.match(/^\/api\/projects\/([^/]+)\/requirements$/);
    if (reqMatch && req.method === "PUT") {
      handlePutRequirements(req, res, requirementsDir, decodeURIComponent(reqMatch[1]));
      return;
    }

    // Write API: PUT /api/projects/:name/design
    const designMatch = pathname.match(/^\/api\/projects\/([^/]+)\/design$/);
    if (designMatch && req.method === "PUT") {
      handlePutDesign(req, res, requirementsDir, decodeURIComponent(designMatch[1]));
      return;
    }

    // Delete API: DELETE /api/projects/:name
    const deleteMatch = pathname.match(/^\/api\/projects\/([^/]+)$/);
    if (deleteMatch && req.method === "DELETE") {
      handleDeleteProject(res, requirementsDir, decodeURIComponent(deleteMatch[1]));
      return;
    }

    // Serve requirements YAML files from the consumer's project
    if (pathname.startsWith("/requirements/")) {
      const filename = pathname.slice("/requirements/".length);
      const filePath = join(requirementsDir, filename);
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

  server.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(`\nDesign Duck UI running at ${url}\n`);

    if (open) {
      openBrowser(url);
    }
  });

  server.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${port} is already in use. Try a different port with --port.`,
      );
    } else {
      console.error(`[design-duck:server] Server error: ${err.message}`);
    }
  });

  return {
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
  requirementsDir: string,
  res: ServerResponse,
): void {
  try {
    const projectsDir = join(requirementsDir, "projects");
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
  requirementsDir: string,
): Promise<void> {
  try {
    const raw = JSON.parse(await readBody(req));
    const result = validateVision(raw);
    if (!result.valid) {
      jsonResponse(res, 400, { error: "Validation failed", details: result.errors });
      return;
    }
    const yamlContent = yamlDump(raw, { lineWidth: 120, noRefs: true });
    const filePath = join(requirementsDir, "vision.yaml");
    writeFileSync(filePath, yamlContent, "utf-8");
    jsonResponse(res, 200, { ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    jsonResponse(res, 400, { error: message });
  }
}

async function handlePutRequirements(
  req: IncomingMessage,
  res: ServerResponse,
  requirementsDir: string,
  projectName: string,
): Promise<void> {
  try {
    const raw = JSON.parse(await readBody(req));

    // Validate structure
    if (typeof raw.visionAlignment !== "string" || raw.visionAlignment.trim() === "") {
      jsonResponse(res, 400, { error: "visionAlignment must be a non-empty string" });
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
    const dirPath = join(requirementsDir, "projects", projectName);
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
  requirementsDir: string,
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
    const dirPath = join(requirementsDir, "projects", projectName);
    mkdirSync(dirPath, { recursive: true });
    writeFileSync(join(dirPath, "design.yaml"), yamlContent, "utf-8");
    jsonResponse(res, 200, { ok: true });
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
  requirementsDir: string,
  projectName: string,
): void {
  try {
    const dirPath = join(requirementsDir, "projects", projectName);
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
