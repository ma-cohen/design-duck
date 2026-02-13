import { execSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const VISION_YAML = `# Vision, mission, and core problem
vision: ""
mission: ""
problem: ""
`;

const GLOBAL_DESIGN_YAML = `# High-level design decisions that all projects must follow
decisions: []
`;

const EXAMPLE_REQUIREMENTS_YAML = `# Project requirements - user-value focused
visionAlignment: ""

requirements: []
`;

export function init(targetDir: string = process.cwd()): void {
  const duckDir = join(targetDir, "desgin-duck");
  const reqDir = join(duckDir, "requirements");

  if (process.env.DEBUG) {
    console.error("[design-duck:init] targetDir:", targetDir);
  }

  if (existsSync(reqDir)) {
    console.error("desgin-duck/requirements/ already exists. Aborting init.");
    process.exitCode = 1;
    return;
  }

  const exampleProjectDir = join(reqDir, "projects", "example-project");
  mkdirSync(exampleProjectDir, { recursive: true });
  console.log("Created desgin-duck/requirements/");

  // Write vision.yaml
  const visionPath = join(reqDir, "vision.yaml");
  writeFileSync(visionPath, VISION_YAML, "utf-8");
  console.log("  Created desgin-duck/requirements/vision.yaml");

  // Write global design.yaml
  const designPath = join(reqDir, "design.yaml");
  writeFileSync(designPath, GLOBAL_DESIGN_YAML, "utf-8");
  console.log("  Created desgin-duck/requirements/design.yaml");

  // Write example project requirements
  const reqPath = join(exampleProjectDir, "requirements.yaml");
  writeFileSync(reqPath, EXAMPLE_REQUIREMENTS_YAML, "utf-8");
  console.log("  Created desgin-duck/requirements/projects/example-project/requirements.yaml");

  if (!existsSync(join(targetDir, ".git"))) {
    try {
      execSync("git init", { cwd: targetDir, stdio: "pipe" });
      console.log("Initialized git repository.");
    } catch {
      console.warn("Warning: git init failed. Is git installed?");
    }
  } else if (process.env.DEBUG) {
    console.error("[design-duck:init] git repo already exists, skipping git init");
  }

  console.log("\nDesign Duck initialized. Start by filling in desgin-duck/requirements/vision.yaml.");
}
