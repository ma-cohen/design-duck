import { existsSync } from "node:fs";
import { join } from "node:path";
import { readVision, listProjects, readProjectRequirements, readProjectDesign } from "../infrastructure/file-store";

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

  let totalDecisions = 0;

  for (const projectName of projects) {
    console.log(`Validating project "${projectName}"...`);

    // Validate requirements.yaml (required)
    let requirementIds: string[] = [];
    try {
      const projectReqs = readProjectRequirements(reqDir, projectName);
      totalRequirements += projectReqs.requirements.length;
      requirementIds = projectReqs.requirements.map((r) => r.id);
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

    // Validate design.yaml (optional)
    try {
      const design = readProjectDesign(reqDir, projectName);
      if (design) {
        totalDecisions += design.decisions.length;
        console.log(
          `✓ ${projectName}/design.yaml is valid (${design.decisions.length} decisions)`,
        );

        // Cross-reference: check that requirementRefs point to actual requirement IDs
        if (requirementIds.length > 0) {
          const reqIdSet = new Set(requirementIds);
          for (const dec of design.decisions) {
            for (const ref of dec.requirementRefs) {
              if (!reqIdSet.has(ref)) {
                hasErrors = true;
                console.error(
                  `✗ ${projectName}/design.yaml: decision "${dec.id}" references unknown requirement "${ref}"`,
                );
              }
            }
          }
        }

        if (process.env.DEBUG) {
          console.error(
            `[design-duck:validate] Successfully validated design for project "${projectName}" with ${design.decisions.length} decisions`,
          );
        }
      }
    } catch (err) {
      hasErrors = true;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${projectName}/design.yaml validation failed:`);
      console.error(`  ${msg}`);
      
      if (process.env.DEBUG) {
        console.error(`[design-duck:validate] ${projectName} design error:`, err);
      }
    }
  }

  // Summary
  console.log("");
  if (hasErrors) {
    console.error("Validation failed. Fix the errors above and try again.");
    process.exitCode = 1;
  } else {
    const designSummary = totalDecisions > 0 ? `, ${totalDecisions} design decisions` : "";
    console.log(
      `All files are valid! (${projects.length} project(s), ${totalRequirements} total requirements${designSummary})`,
    );
    process.exitCode = 0;
  }
}
