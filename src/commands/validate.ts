import { existsSync } from "node:fs";
import { join } from "node:path";
import { readVision, listProjects, readProjectRequirements, readProjectDesign, readGlobalDesign, readRootContext, readProjectContext } from "../infrastructure/file-store";
import { validateVision } from "../domain/requirements/requirement";

/**
 * Validates all requirement files in the design-duck/docs/ directory.
 * Reports validation errors to stdout.
 * 
 * @param targetDir - Directory containing design-duck/docs/ folder (defaults to cwd)
 * @returns void - exits with code 1 if validation fails, 0 if successful
 */
export function validate(targetDir: string = process.cwd()): void {
  const docsDir = join(targetDir, "design-duck", "docs");

  if (process.env.DEBUG) {
    console.error("[design-duck:validate] targetDir:", targetDir);
    console.error("[design-duck:validate] docsDir:", docsDir);
  }

  // Check if requirements directory exists
  if (!existsSync(docsDir)) {
    console.error("Error: design-duck/docs/ directory not found.");
    console.error("Run 'design-duck init' first to create the docs structure.");
    process.exitCode = 1;
    return;
  }

  let hasErrors = false;

  // Validate vision.yaml
  console.log("Validating vision.yaml...");
  try {
    const vision = readVision(docsDir);
    // Parser is lenient — run strict validation explicitly
    const visionResult = validateVision(vision);
    if (!visionResult.valid) {
      hasErrors = true;
      console.error("✗ vision.yaml validation failed:");
      for (const e of visionResult.errors) {
        console.error(`  ${e}`);
      }
    } else {
      console.log("✓ vision.yaml is valid");
    }

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

  // Validate root-level context.yaml (optional)
  let rootContextIds: Set<string> = new Set();
  console.log("Validating context.yaml...");
  try {
    const rootContext = readRootContext(docsDir);
    if (rootContext) {
      rootContextIds = new Set(rootContext.contexts.map((c) => c.id));
      console.log(
        `✓ context.yaml is valid (${rootContext.contexts.length} context items)`,
      );
    } else {
      console.log("– context.yaml not found (optional, skipping)");
    }
  } catch (err) {
    hasErrors = true;
    const msg = err instanceof Error ? err.message : String(err);
    console.error("✗ context.yaml validation failed:");
    console.error(`  ${msg}`);
  }

  // Validate root-level design.yaml (optional)
  let globalDecisionIds: Set<string> = new Set();
  let totalGlobalDecisions = 0;
  console.log("Validating design.yaml (global)...");
  try {
    const globalDesign = readGlobalDesign(docsDir);
    if (globalDesign) {
      totalGlobalDecisions = globalDesign.decisions.length;
      globalDecisionIds = new Set(globalDesign.decisions.map((d) => d.id));
      console.log(
        `✓ design.yaml is valid (${globalDesign.decisions.length} global decisions)`,
      );
    } else {
      console.log("– design.yaml not found (optional, skipping)");
    }
  } catch (err) {
    hasErrors = true;
    const msg = err instanceof Error ? err.message : String(err);
    console.error("✗ design.yaml validation failed:");
    console.error(`  ${msg}`);
  }

  // Validate all project requirements
  const projects = listProjects(docsDir);
  let totalRequirements = 0;

  if (projects.length === 0) {
    console.log("No projects found in design-duck/docs/projects/.");
  }

  let totalDecisions = 0;

  for (const projectName of projects) {
    console.log(`Validating project "${projectName}"...`);

    // Validate requirements.yaml (required)
    let requirementIds: string[] = [];
    try {
      const projectReqs = readProjectRequirements(docsDir, projectName);
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

    // Validate project context.yaml (optional)
    let projectContextIds: Set<string> = new Set();
    try {
      const projectContext = readProjectContext(docsDir, projectName);
      if (projectContext) {
        projectContextIds = new Set(projectContext.contexts.map((c) => c.id));
        console.log(
          `✓ ${projectName}/context.yaml is valid (${projectContext.contexts.length} context items)`,
        );
      }
    } catch (err) {
      hasErrors = true;
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`✗ ${projectName}/context.yaml validation failed:`);
      console.error(`  ${msg}`);
    }

    // Validate design.yaml (optional)
    try {
      const design = readProjectDesign(docsDir, projectName);
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

        // Cross-reference: check that globalDecisionRefs point to actual global decision IDs
        if (globalDecisionIds.size > 0) {
          for (const dec of design.decisions) {
            if (dec.globalDecisionRefs) {
              for (const ref of dec.globalDecisionRefs) {
                if (!globalDecisionIds.has(ref)) {
                  hasErrors = true;
                  console.error(
                    `✗ ${projectName}/design.yaml: decision "${dec.id}" references unknown global decision "${ref}"`,
                  );
                }
              }
            }
          }
        }

        // Cross-reference: check that contextRefs point to actual context item IDs
        // (from either root context or project context)
        const allContextIds = new Set([...rootContextIds, ...projectContextIds]);
        if (allContextIds.size > 0) {
          for (const dec of design.decisions) {
            if (dec.contextRefs) {
              for (const ref of dec.contextRefs) {
                if (!allContextIds.has(ref)) {
                  hasErrors = true;
                  console.error(
                    `✗ ${projectName}/design.yaml: decision "${dec.id}" references unknown context item "${ref}"`,
                  );
                }
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
    const globalDesignSummary = totalGlobalDecisions > 0 ? `, ${totalGlobalDecisions} global design decisions` : "";
    const designSummary = totalDecisions > 0 ? `, ${totalDecisions} project design decisions` : "";
    console.log(
      `All files are valid! (${projects.length} project(s), ${totalRequirements} total requirements${globalDesignSummary}${designSummary})`,
    );
    process.exitCode = 0;
  }
}
