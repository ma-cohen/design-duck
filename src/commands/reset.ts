import { existsSync, rmSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline";
import { scaffoldDocs, scaffoldCommands } from "./init";
import { writeProjectVersion } from "../infrastructure/version";

function confirm(message: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(message, (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "y");
    });
  });
}

export async function reset(args: string[] = []): Promise<void> {
  const force = args.includes("--force");
  const targetDir = process.cwd();
  const duckDir = join(targetDir, "design-duck");
  const docsDir = join(duckDir, "docs");
  const commandsDir = join(duckDir, "commands");

  if (!existsSync(duckDir)) {
    console.error("design-duck/ not found. Run 'dd init' first.");
    process.exitCode = 1;
    return;
  }

  if (!force) {
    const ok = await confirm(
      "This will delete all Design Duck docs and start fresh. Are you sure? (y/N) "
    );
    if (!ok) {
      console.log("Aborted.");
      return;
    }
  }

  // Remove existing docs/ and commands/
  if (existsSync(docsDir)) {
    rmSync(docsDir, { recursive: true, force: true });
  }
  if (existsSync(commandsDir)) {
    rmSync(commandsDir, { recursive: true, force: true });
  }
  console.log("Deleted design-duck/docs/ and commands/");

  // Re-scaffold from templates
  scaffoldDocs(duckDir);
  scaffoldCommands(duckDir);
  writeProjectVersion(targetDir);
  console.log("  Updated .version");

  console.log("\nReset complete! All docs have been restored to empty templates.");
}
