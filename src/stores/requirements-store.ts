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
  parsePlaygroundRequirementsYaml,
  parseContextYaml,
  parseProjectDesignYaml,
  parseGeneralValidationsYaml,
  parseProjectImplementationYaml,
} from "../infrastructure/yaml-parser";
import type {
  Vision,
  ProjectRequirements,
  PlaygroundRequirements,
  ContextDocument,
  ProjectDesign,
  GlobalDesign,
  GeneralValidations,
  ProjectImplementation,
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
  /** Root-level context items (from context.yaml). */
  rootContext: ContextDocument | null;
  /** Root-level global design decisions that all projects must follow. */
  globalDesign: GlobalDesign | null;
  /** Per-project requirements keyed by project name. */
  projects: Record<string, ProjectRequirements>;
  /** Per-project context documents keyed by project name. */
  projectContexts: Record<string, ContextDocument>;
  /** Per-project design documents keyed by project name (only present when design.yaml exists). */
  designs: Record<string, ProjectDesign>;
  /** Root-level general validations (from implementation.yaml). */
  generalValidations: GeneralValidations | null;
  /** Per-project implementation documents keyed by project name. */
  implementations: Record<string, ProjectImplementation>;
  /** Per-playground requirements keyed by playground name. */
  playgrounds: Record<string, PlaygroundRequirements>;
  /** Per-playground context documents keyed by playground name. */
  playgroundContexts: Record<string, ContextDocument>;
  /** Per-playground design documents keyed by playground name. */
  playgroundDesigns: Record<string, ProjectDesign>;
  /** Per-playground implementation documents keyed by playground name. */
  playgroundImplementations: Record<string, ProjectImplementation>;
  /** True while a loadFromFiles() call is in progress. */
  loading: boolean;
  /** Human-readable error message from the last failed load, or null. */
  error: string | null;
  /** Whether the store is actively watching for file changes. */
  watching: boolean;

  /**
   * Fetches vision.yaml and all project requirements from the server,
   * parses them, and replaces the current store state with the result.
   */
  loadFromFiles: (requirementsPath?: string, projectsApiUrl?: string) => Promise<void>;

  /**
   * Starts watching for requirement file changes.
   * Connects to the server's SSE endpoint for instant notifications,
   * falls back to polling if SSE is unavailable.
   */
  startWatching: (options?: WatchOptions) => void;

  /**
   * Stops watching for file changes and cleans up resources.
   */
  stopWatching: () => void;

  /** Saves the vision document to the server (PUT /api/vision). */
  saveVision: (vision: Vision) => Promise<void>;

  /** Saves the root-level context document to the server (PUT /api/context). */
  saveRootContext: (data: ContextDocument) => Promise<void>;

  /** Saves a project's context document to the server (PUT /api/projects/:name/context). */
  saveProjectContext: (projectName: string, data: ContextDocument) => Promise<void>;

  /** Saves a project's requirements to the server (PUT /api/projects/:name/requirements). */
  saveProjectRequirements: (projectName: string, data: ProjectRequirements) => Promise<void>;

  /** Saves the root-level global design document to the server (PUT /api/design). */
  saveGlobalDesign: (data: GlobalDesign) => Promise<void>;

  /** Saves a project's design document to the server (PUT /api/projects/:name/design). */
  saveProjectDesign: (projectName: string, data: ProjectDesign) => Promise<void>;

  /** Saves the root-level general validations to the server (PUT /api/implementation). */
  saveGeneralValidations: (data: GeneralValidations) => Promise<void>;

  /** Saves a project's implementation document to the server (PUT /api/projects/:name/implementation). */
  saveProjectImplementation: (projectName: string, data: ProjectImplementation) => Promise<void>;

  /** Deletes a project from the server (DELETE /api/projects/:name). */
  deleteProject: (projectName: string) => Promise<void>;

  /** Saves a playground's requirements to the server (PUT /api/playgrounds/:name/requirements). */
  savePlaygroundRequirements: (playgroundName: string, data: PlaygroundRequirements) => Promise<void>;

  /** Saves a playground's context document to the server (PUT /api/playgrounds/:name/context). */
  savePlaygroundContext: (playgroundName: string, data: ContextDocument) => Promise<void>;

  /** Saves a playground's design document to the server (PUT /api/playgrounds/:name/design). */
  savePlaygroundDesign: (playgroundName: string, data: ProjectDesign) => Promise<void>;

  /** Saves a playground's implementation document to the server (PUT /api/playgrounds/:name/implementation). */
  savePlaygroundImplementation: (playgroundName: string, data: ProjectImplementation) => Promise<void>;

  /** Deletes a playground from the server (DELETE /api/playgrounds/:name). */
  deletePlayground: (playgroundName: string) => Promise<void>;
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
  rootContext: null,
  globalDesign: null,
  projects: {},
  projectContexts: {},
  designs: {},
  generalValidations: null,
  implementations: {},
  playgrounds: {},
  playgroundContexts: {},
  playgroundDesigns: {},
  playgroundImplementations: {},
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

      // Fetch root-level context (optional — 404 is fine)
      let rootContext: ContextDocument | null = null;
      try {
        const rootCtxRes = await fetch(`${requirementsPath}/context.yaml`);
        if (rootCtxRes.ok) {
          const rootCtxContent = await rootCtxRes.text();
          rootContext = parseContextYaml(rootCtxContent);
        }
      } catch {
        // context.yaml not available — that's fine
      }

      // Fetch root-level global design (optional — 404 is fine)
      let globalDesign: GlobalDesign | null = null;
      try {
        const globalDesignRes = await fetch(`${requirementsPath}/design.yaml`);
        if (globalDesignRes.ok) {
          const globalDesignContent = await globalDesignRes.text();
          globalDesign = parseProjectDesignYaml(globalDesignContent);
        }
      } catch {
        // design.yaml not available — that's fine
      }

      // Fetch root-level general validations (optional — 404 is fine)
      let generalValidations: GeneralValidations | null = null;
      try {
        const implRes = await fetch(`${requirementsPath}/implementation.yaml`);
        if (implRes.ok) {
          const implContent = await implRes.text();
          generalValidations = parseGeneralValidationsYaml(implContent);
        }
      } catch {
        // implementation.yaml not available — that's fine
      }

      // Fetch project list
      const projectsRes = await fetch(projectsApiUrl);
      if (!projectsRes.ok) {
        throw new Error(
          `Failed to fetch projects list: ${projectsRes.status} ${projectsRes.statusText}`,
        );
      }
      const projectNames: string[] = await projectsRes.json();

      // Fetch all project requirements, contexts, designs, and implementations in parallel
      const projects: Record<string, ProjectRequirements> = {};
      const projectContexts: Record<string, ContextDocument> = {};
      const designs: Record<string, ProjectDesign> = {};
      const implementations: Record<string, ProjectImplementation> = {};
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

        // Fetch project context (optional — 404 is fine)
        try {
          const ctxRes = await fetch(`${requirementsPath}/projects/${name}/context.yaml`);
          if (ctxRes.ok) {
            const ctxContent = await ctxRes.text();
            projectContexts[name] = parseContextYaml(ctxContent);
          }
        } catch {
          // context.yaml not available — that's fine
        }

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

        // Fetch implementation (optional — 404 is fine)
        try {
          const implRes = await fetch(`${requirementsPath}/projects/${name}/implementation.yaml`);
          if (implRes.ok) {
            const implContent = await implRes.text();
            implementations[name] = parseProjectImplementationYaml(implContent);
          }
        } catch {
          // implementation.yaml not available — that's fine
        }
      });

      await Promise.all(projectFetches);

      // Fetch playground list
      const playgrounds: Record<string, PlaygroundRequirements> = {};
      const playgroundContexts: Record<string, ContextDocument> = {};
      const playgroundDesigns: Record<string, ProjectDesign> = {};
      const playgroundImplementations: Record<string, ProjectImplementation> = {};
      try {
        const playgroundsRes = await fetch("/api/playgrounds");
        if (playgroundsRes.ok) {
          const playgroundNames: string[] = await playgroundsRes.json();

          const playgroundFetches = playgroundNames.map(async (name) => {
            // Fetch requirements (required)
            const res = await fetch(`${requirementsPath}/playgrounds/${name}/requirements.yaml`);
            if (!res.ok) return; // skip if missing
            const content = await res.text();
            playgrounds[name] = parsePlaygroundRequirementsYaml(content);

            // Fetch playground context (optional)
            try {
              const ctxRes = await fetch(`${requirementsPath}/playgrounds/${name}/context.yaml`);
              if (ctxRes.ok) {
                const ctxContent = await ctxRes.text();
                playgroundContexts[name] = parseContextYaml(ctxContent);
              }
            } catch {
              // context.yaml not available — that's fine
            }

            // Fetch design (optional)
            try {
              const designRes = await fetch(`${requirementsPath}/playgrounds/${name}/design.yaml`);
              if (designRes.ok) {
                const designContent = await designRes.text();
                playgroundDesigns[name] = parseProjectDesignYaml(designContent);
              }
            } catch {
              // design.yaml not available — that's fine
            }

            // Fetch implementation (optional)
            try {
              const implRes = await fetch(`${requirementsPath}/playgrounds/${name}/implementation.yaml`);
              if (implRes.ok) {
                const implContent = await implRes.text();
                playgroundImplementations[name] = parseProjectImplementationYaml(implContent);
              }
            } catch {
              // implementation.yaml not available — that's fine
            }
          });

          await Promise.all(playgroundFetches);
        }
      } catch {
        // playgrounds API not available — that's fine
      }

      const totalReqs = Object.values(projects).reduce(
        (sum, p) => sum + p.requirements.length,
        0,
      );
      const totalDecisions = Object.values(designs).reduce(
        (sum, d) => sum + d.decisions.length,
        0,
      );
      const globalDecisionCount = globalDesign ? globalDesign.decisions.length : 0;
      const playgroundCount = Object.keys(playgrounds).length;

      set({
        vision,
        rootContext,
        globalDesign,
        projects,
        projectContexts,
        designs,
        generalValidations,
        implementations,
        playgrounds,
        playgroundContexts,
        playgroundDesigns,
        playgroundImplementations,
        loading: false,
        error: null,
      });

      console.log(
        `[design-duck:store] Loaded vision + ${globalDecisionCount} global decision(s) + ${Object.keys(projects).length} project(s) with ${totalReqs} requirements and ${totalDecisions} design decisions` +
        (playgroundCount > 0 ? ` + ${playgroundCount} playground(s)` : ""),
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

  saveVision: async (vision: Vision) => {
    console.log("[design-duck:store] Saving vision...");
    const res = await fetch("/api/vision", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vision),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Failed to save vision");
    }
    // SSE will trigger a reload automatically; also update local state immediately
    set({ vision });
  },

  saveRootContext: async (data: ContextDocument) => {
    console.log("[design-duck:store] Saving root context...");
    const res = await fetch("/api/context", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Failed to save root context");
    }
    set({ rootContext: data });
  },

  saveProjectContext: async (projectName: string, data: ContextDocument) => {
    console.log(`[design-duck:store] Saving context for ${projectName}...`);
    const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/context`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Failed to save project context");
    }
    set({ projectContexts: { ...get().projectContexts, [projectName]: data } });
  },

  saveProjectRequirements: async (projectName: string, data: ProjectRequirements) => {
    console.log(`[design-duck:store] Saving requirements for ${projectName}...`);
    const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/requirements`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Failed to save requirements");
    }
    set({ projects: { ...get().projects, [projectName]: data } });
  },

  saveGlobalDesign: async (data: GlobalDesign) => {
    console.log("[design-duck:store] Saving global design...");
    const res = await fetch("/api/design", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Failed to save global design");
    }
    set({ globalDesign: data });
  },

  saveProjectDesign: async (projectName: string, data: ProjectDesign) => {
    console.log(`[design-duck:store] Saving design for ${projectName}...`);
    const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/design`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Failed to save design");
    }
    set({ designs: { ...get().designs, [projectName]: data } });
  },

  saveGeneralValidations: async (data: GeneralValidations) => {
    console.log("[design-duck:store] Saving general validations...");
    const res = await fetch("/api/implementation", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Failed to save general validations");
    }
    set({ generalValidations: data });
  },

  saveProjectImplementation: async (projectName: string, data: ProjectImplementation) => {
    console.log(`[design-duck:store] Saving implementation for ${projectName}...`);
    const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}/implementation`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Failed to save implementation");
    }
    set({ implementations: { ...get().implementations, [projectName]: data } });
  },

  deleteProject: async (projectName: string) => {
    console.log(`[design-duck:store] Deleting project ${projectName}...`);
    const res = await fetch(`/api/projects/${encodeURIComponent(projectName)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Failed to delete project");
    }
    // Remove from local state immediately
    const { [projectName]: _p, ...remainingProjects } = get().projects;
    const { [projectName]: _c, ...remainingContexts } = get().projectContexts;
    const { [projectName]: _d, ...remainingDesigns } = get().designs;
    const { [projectName]: _i, ...remainingImplementations } = get().implementations;
    set({ projects: remainingProjects, projectContexts: remainingContexts, designs: remainingDesigns, implementations: remainingImplementations });
  },

  savePlaygroundRequirements: async (playgroundName: string, data: PlaygroundRequirements) => {
    console.log(`[design-duck:store] Saving playground requirements for ${playgroundName}...`);
    const res = await fetch(`/api/playgrounds/${encodeURIComponent(playgroundName)}/requirements`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Failed to save playground requirements");
    }
    set({ playgrounds: { ...get().playgrounds, [playgroundName]: data } });
  },

  savePlaygroundContext: async (playgroundName: string, data: ContextDocument) => {
    console.log(`[design-duck:store] Saving playground context for ${playgroundName}...`);
    const res = await fetch(`/api/playgrounds/${encodeURIComponent(playgroundName)}/context`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Failed to save playground context");
    }
    set({ playgroundContexts: { ...get().playgroundContexts, [playgroundName]: data } });
  },

  savePlaygroundDesign: async (playgroundName: string, data: ProjectDesign) => {
    console.log(`[design-duck:store] Saving playground design for ${playgroundName}...`);
    const res = await fetch(`/api/playgrounds/${encodeURIComponent(playgroundName)}/design`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Failed to save playground design");
    }
    set({ playgroundDesigns: { ...get().playgroundDesigns, [playgroundName]: data } });
  },

  savePlaygroundImplementation: async (playgroundName: string, data: ProjectImplementation) => {
    console.log(`[design-duck:store] Saving playground implementation for ${playgroundName}...`);
    const res = await fetch(`/api/playgrounds/${encodeURIComponent(playgroundName)}/implementation`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Failed to save playground implementation");
    }
    set({ playgroundImplementations: { ...get().playgroundImplementations, [playgroundName]: data } });
  },

  deletePlayground: async (playgroundName: string) => {
    console.log(`[design-duck:store] Deleting playground ${playgroundName}...`);
    const res = await fetch(`/api/playgrounds/${encodeURIComponent(playgroundName)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error || "Failed to delete playground");
    }
    const { [playgroundName]: _p, ...remainingPlaygrounds } = get().playgrounds;
    const { [playgroundName]: _c, ...remainingContexts } = get().playgroundContexts;
    const { [playgroundName]: _d, ...remainingDesigns } = get().playgroundDesigns;
    const { [playgroundName]: _i, ...remainingImpls } = get().playgroundImplementations;
    set({ playgrounds: remainingPlaygrounds, playgroundContexts: remainingContexts, playgroundDesigns: remainingDesigns, playgroundImplementations: remainingImpls });
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
