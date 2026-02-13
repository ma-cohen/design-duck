import { existsSync } from "node:fs";
import { join } from "node:path";
import { readVision, listProjects, readProjectRequirements } from "../infrastructure/file-store";

/**
 * Validates all requirement files in the desgin-duck/requirements/ directory.
 * Reports validation errors to stdout.
 * 
 * @param targetDir - Directory containing desgin-duck/requirements/ folder (defaults to cwd)
 * @returns void - exits with code 1 if validation fails, 0 if successful
 */
export function validate(targetDir: string = process.cwd()): void {
  const reqDir = join(targetDir, "desgin-duck", "requirements");

  if (process.env.DEBUG) {
    console.error("[design-duck:validate] targetDir:", targetDir);
    console.error("[design-duck:validate] reqDir:", reqDir);
  }

  // Check if requirements directory exists
  if (!existsSync(reqDir)) {
    console.error("Error: desgin-duck/requirements/ directory not found.");
    console.error("Run 'design-duck init' first to create the requirements structure.");
    process.exitCode = 1;
    return;
  }

  let hasErrors = false;

  // Validate vision.yaml
  console.log("Validating vision.yaml...");
  try {
    readVision(reqDir);
    console.log("✓ vision.yaml is valid");
    
    if (process.env.DEBUG) {
      console.error("[design-duck:validate] Successfully validated vision.yaml");
    }
  } catch (err) {
    hasErrors = true;
    const msg = err instanceof Error ? err.message : String(err);
    console.error("✗ vision.yaml validation failed:");
    console.error(`  ${msg}`);
    
    if (process.env.DEBUG) {
      console.error("[design-duck:validate] vision.yaml error:", err);
    }
  }

  // Validate all project requirements
  const projects = listProjects(reqDir);
  let totalRequirements = 0;

  if (projects.length === 0) {
    console.log("No projects found in desgin-duck/requirements/projects/.");
  }

  for (const projectName of projects) {
    console.log(`Validating project "${projectName}"...`);
    try {
      const projectReqs = readProjectRequirements(reqDir, projectName);
      totalRequirements += projectReqs.requirements.length;
      console.log(
        `✓ ${projectName}/requirements.yaml is valid (${projectReqs.requirements.length} requirements)`,
      );
      
      if (process.env.DEBUG) {
        console.error(
          `[design-duck:validate] Successfully validated project "${projectName}" with ${projectReqs.requirements.length} requirements`,
        );
      }
    } catch (err) {
      hasErrors = true;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${projectName}/requirements.yaml validation failed:`);
      console.error(`  ${msg}`);
      
      if (process.env.DEBUG) {
        console.error(`[design-duck:validate] ${projectName} error:`, err);
      }
    }
  }

  // Summary
  console.log("");
  if (hasErrors) {
    console.error("Validation failed. Fix the errors above and try again.");
    process.exitCode = 1;
  } else {
    console.log(
      `All requirements are valid! (${projects.length} project(s), ${totalRequirements} total requirements)`,
    );
    process.exitCode = 0;
  }
}
