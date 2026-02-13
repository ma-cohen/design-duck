/**
 * Zustand store for managing requirements state.
 *
 * Fetches vision.yaml and per-project requirements.yaml files over HTTP
 * (served by the built-in Design Duck server), then parses and validates
 * them using the shared parsing logic.
 *
 * Supports auto-reload via file watching:
 * - Primary: connects to the server's SSE endpoint (/events) for instant
 *   notifications when YAML files change on disk
 * - Fallback: polls at a configurable interval if SSE is unavailable
 */

import { create } from "zustand";
import {
  parseVisionYaml,
  parseProjectRequirementsYaml,
  parseProjectDesignYaml,
} from "../infrastructure/yaml-parser";
import type {
  Vision,
  ProjectRequirements,
  ProjectDesign,
} from "../domain/requirements/requirement";

/** Options for configuring file watching behavior. */
export interface WatchOptions {
  /**
   * Polling interval in milliseconds. Used as fallback when SSE is unavailable.
   * @default 2000
   */
  intervalMs?: number;
  /**
   * URL path prefix where YAML files are served.
   * @default "/requirements"
   */
  requirementsPath?: string;
  /**
   * SSE endpoint URL for real-time file change notifications.
   * @default "/events"
   */
  eventsUrl?: string;
  /**
   * API endpoint URL for listing projects.
   * @default "/api/projects"
   */
  projectsApiUrl?: string;
}

export interface RequirementsState {
  /** Validated vision document. */
  vision: Vision | null;
  /** Per-project requirements keyed by project name. */
  projects: Record<string, ProjectRequirements>;
  /** Per-project design documents keyed by project name (only present when design.yaml exists). */
  designs: Record<string, ProjectDesign>;
  /** True while a loadFromFiles() call is in progress. */
  loading: boolean;
  /** Human-readable error message from the last failed load, or null. */
  error: string | null;
  /** Whether the store is actively watching for file changes. */
  watching: boolean;

  /**
   * Fetches vision.yaml and all project requirements from the server,
   * parses them, and replaces the current store state with the result.
   *
   * @param requirementsPath - URL path prefix where the YAML files are served.
   *   Defaults to "/requirements" (served by the built-in Design Duck server).
   * @param projectsApiUrl - URL for the projects list API.
   *   Defaults to "/api/projects".
   */
  loadFromFiles: (requirementsPath?: string, projectsApiUrl?: string) => Promise<void>;

  /**
   * Starts watching for requirement file changes.
   * Connects to the server's SSE endpoint for instant notifications,
   * falls back to polling if SSE is unavailable.
   *
   * Safe to call multiple times — subsequent calls are no-ops while watching.
   */
  startWatching: (options?: WatchOptions) => void;

  /**
   * Stops watching for file changes and cleans up resources.
   * Safe to call multiple times or when not watching.
   */
  stopWatching: () => void;
}

// ---------------------------------------------------------------------------
// Internal state for the watcher (kept outside Zustand to avoid serialization)
// ---------------------------------------------------------------------------

let pollingTimer: ReturnType<typeof setInterval> | null = null;
let eventSource: EventSource | null = null;

/** Exported for testing — returns current internal watcher state. */
export function _getWatcherInternals() {
  return { pollingTimer, eventSource };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useRequirementsStore = create<RequirementsState>()((set, get) => ({
  vision: null,
  projects: {},
  designs: {},
  loading: false,
  error: null,
  watching: false,

  loadFromFiles: async (requirementsPath = "/requirements", projectsApiUrl = "/api/projects") => {
    console.log("[design-duck:store] Loading requirements...");
    set({ loading: true, error: null });

    try {
      // Fetch vision
      const visionRes = await fetch(`${requirementsPath}/vision.yaml`);
      if (!visionRes.ok) {
        throw new Error(
          `Failed to fetch vision.yaml: ${visionRes.status} ${visionRes.statusText}`,
        );
      }
      const visionContent = await visionRes.text();
      const vision = parseVisionYaml(visionContent);

      // Fetch project list
      const projectsRes = await fetch(projectsApiUrl);
      if (!projectsRes.ok) {
        throw new Error(
          `Failed to fetch projects list: ${projectsRes.status} ${projectsRes.statusText}`,
        );
      }
      const projectNames: string[] = await projectsRes.json();

      // Fetch all project requirements and designs in parallel
      const projects: Record<string, ProjectRequirements> = {};
      const designs: Record<string, ProjectDesign> = {};
      const projectFetches = projectNames.map(async (name) => {
        // Fetch requirements (required)
        const res = await fetch(`${requirementsPath}/projects/${name}/requirements.yaml`);
        if (!res.ok) {
          throw new Error(
            `Failed to fetch ${name}/requirements.yaml: ${res.status} ${res.statusText}`,
          );
        }
        const content = await res.text();
        projects[name] = parseProjectRequirementsYaml(content);

        // Fetch design (optional — 404 is fine)
        try {
          const designRes = await fetch(`${requirementsPath}/projects/${name}/design.yaml`);
          if (designRes.ok) {
            const designContent = await designRes.text();
            designs[name] = parseProjectDesignYaml(designContent);
          }
        } catch {
          // design.yaml not available — that's fine
        }
      });

      await Promise.all(projectFetches);

      const totalReqs = Object.values(projects).reduce(
        (sum, p) => sum + p.requirements.length,
        0,
      );
      const totalDecisions = Object.values(designs).reduce(
        (sum, d) => sum + d.decisions.length,
        0,
      );

      set({
        vision,
        projects,
        designs,
        loading: false,
        error: null,
      });

      console.log(
        `[design-duck:store] Loaded vision + ${Object.keys(projects).length} project(s) with ${totalReqs} requirements and ${totalDecisions} design decisions`,
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(
        `[design-duck:store] Failed to load requirements: ${message}`,
      );
      set({ loading: false, error: message });
    }
  },

  startWatching: (options?: WatchOptions) => {
    if (get().watching) {
      console.log("[design-duck:store] Already watching, skipping");
      return;
    }

    const {
      intervalMs = 2000,
      requirementsPath = "/requirements",
      eventsUrl = "/events",
      projectsApiUrl = "/api/projects",
    } = options ?? {};

    console.log("[design-duck:store] Starting file watcher integration");

    // Try SSE first (available when served by the Design Duck UI server)
    if (typeof EventSource !== "undefined") {
      try {
        console.log(
          `[design-duck:store] Connecting to SSE endpoint: ${eventsUrl}`,
        );

        const es = new EventSource(eventsUrl);

        es.addEventListener("requirements-changed", () => {
          console.log(
            "[design-duck:store] SSE event received, reloading requirements",
          );
          get().loadFromFiles(requirementsPath, projectsApiUrl);
        });

        es.addEventListener("connected", () => {
          console.log(
            "[design-duck:store] SSE connected to server",
          );
        });

        es.onerror = () => {
          console.warn(
            "[design-duck:store] SSE connection error, will retry automatically",
          );
        };

        eventSource = es;
        set({ watching: true });
        return;
      } catch {
        console.warn(
          "[design-duck:store] SSE failed, falling back to polling",
        );
      }
    }

    // Fallback: poll at regular intervals
    console.log(
      `[design-duck:store] SSE not available, polling every ${intervalMs}ms`,
    );

    pollingTimer = setInterval(() => {
      console.log("[design-duck:store] Polling for requirement changes");
      get().loadFromFiles(requirementsPath, projectsApiUrl);
    }, intervalMs);

    set({ watching: true });
  },

  stopWatching: () => {
    if (!get().watching) {
      return;
    }

    console.log("[design-duck:store] Stopping file watcher integration");

    if (eventSource !== null) {
      eventSource.close();
      eventSource = null;
    }

    if (pollingTimer !== null) {
      clearInterval(pollingTimer);
      pollingTimer = null;
    }

    set({ watching: false });
  },
}));
