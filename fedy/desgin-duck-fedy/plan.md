# Plan

<!-- Task status: [ ] Pending, [~] Planning, [R] Ready, [-] In Progress, [x] Completed -->
<!-- Use | e2e: <feature> to show product value, | depends: <task> for dependencies -->

- [x] Scaffold Bun package with TypeScript, CLI entry (init/ui/validate stubs), and package.json bin | e2e: Run Design Duck CLI
- [x] Implement init command to create requirements/ with vision.yaml and example project | e2e: Project bootstrap | depends: Scaffold Bun package
- [x] Run git init in init command when directory is not already a git repo | e2e: Project bootstrap | depends: Implement init command to create requirements/
- [x] Add requirement domain types and validation (Vision + Requirement) in src/domain/requirements/ | e2e: Requirements data model
- [x] Implement YAML file reader in src/infrastructure/file-store.ts to parse vision.yaml and per-project requirements.yaml into domain types | e2e: Validate Requirements CLI
- [x] Implement validate command to read vision and all project requirement files, reporting errors to stdout | e2e: Validate Requirements CLI | depends: Implement YAML file reader
- [x] Add unit tests for file-store YAML parsing with valid, malformed, and missing file cases | e2e: Validate Requirements CLI | depends: Implement YAML file reader
- [x] Install React, Vite, Tailwind CSS, and Zustand; scaffold UI app entry point (index.html, src/ui/main.tsx, src/ui/App.tsx) | e2e: View Requirements UI
- [x] Create Zustand requirements store with loadFromFiles() that fetches vision + per-project requirements | e2e: View Requirements UI | depends: Install React, Vite, Tailwind CSS, and Zustand
- [x] Build VisionHeader, ProjectSection, RequirementList and RequirementCard components to render vision and per-project requirements with priority and status badges | e2e: View Requirements UI | depends: Create Zustand requirements store
- [x] Implement recursive file watcher in src/infrastructure/file-watcher.ts to watch requirements/ for YAML changes and invoke a callback | e2e: Real-time Agent Collaboration
- [x] Build RequirementTree component to render vision header with per-project requirement sections | e2e: View Requirements UI | depends: Build VisionHeader, ProjectSection and RequirementCard components
- [x] Integrate file watcher into Zustand store to auto-reload requirements when YAML files change on disk | e2e: Real-time Agent Collaboration | depends: Implement file watcher, Create Zustand requirements store
