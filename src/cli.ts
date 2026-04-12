#!/usr/bin/env node
/**
 * Design Duck CLI – requirements gathering and management.
 * Commands: init | ui | validate | context | upgrade
 */

import { init } from "./commands/init";
import { ui } from "./commands/ui";
import { validate } from "./commands/validate";
import { context } from "./commands/context";
import { upgrade } from "./commands/upgrade";
import { reset } from "./commands/reset";
import { checkVersionMismatch } from "./infrastructure/version";

export const COMMANDS = ["init", "ui", "validate", "context", "upgrade", "reset", "help"] as const;
type Command = (typeof COMMANDS)[number];

function isCommand(s: string): s is Command {
  return COMMANDS.includes(s as Command);
}

function printUsage(): void {
  console.error("Usage: dd <command> [options]");
  console.error("Commands: init | ui | validate | context | upgrade | reset | help");
  process.exitCode = 1;
}

function cmdHelp(): void {
  console.log(`
Design Duck — vision-driven requirements and design management

3 WORKFLOWS

  1. Start a new project (full design cycle in one shot)
       @dd-new "describe your idea here"

  2. Add a new problem to an existing project
       @dd-extend "describe the new problem"

  3. Continue work at any stage
       @dd-chat "ask anything, or pick up where you left off"

CLI COMMANDS

  dd init                         Scaffold design-duck/ in this directory
  dd ui                           Open the live dashboard (auto-selects port from 3456)
  dd validate                     Validate all YAML files
  dd context <phase> [project]    Generate a context prompt for a specific phase
    Phases: vision | projects | requirements | design | choose | propagate | solve | add
  dd upgrade                      Apply migrations and regenerate templates
  dd reset                        Wipe docs/ and start fresh (prompts for confirmation)
  dd help                         Show this message

TAG-AND-GO SHORTCUTS (use in AI chat)

  Full cycle
    @dd-new          Start a new project — vision through chosen design
    @dd-extend       Add a new problem to an existing project
    @dd-chat         Continue from any stage

  Individual phases
    @dd-vision       Define or refine the product vision
    @dd-projects     Split the vision into projects
    @dd-requirements Gather requirements for a project
    @dd-design       Brainstorm design decisions
    @dd-choose       Evaluate and choose design options
    @dd-propagate    Review decisions for global propagation

  Utilities
    @dd-validate     Validate all YAML files
    @dd-ui           Start the live UI
    @dd-upgrade      Upgrade to the latest version
    @dd-reset        Reset to a clean state
`);
}

function cmdInit(): void {
  init(process.cwd());
}

function cmdUi(): void {
  ui();
}

function cmdValidate(): void {
  validate();
}

function cmdContext(args: string[]): void {
  context(args);
}

function cmdUpgrade(): void {
  upgrade(process.cwd());
}

async function cmdReset(args: string[]): Promise<void> {
  await reset(args);
}

function main(): void {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || !isCommand(command)) {
    printUsage();
    return;
  }

  if (process.env.DEBUG) {
    console.error("[design-duck] command:", command);
  }

  // Version-mismatch warning for commands other than init and upgrade
  if (command !== "init" && command !== "upgrade" && command !== "reset" && command !== "help") {
    checkVersionMismatch();
  }

  switch (command) {
    case "init":
      cmdInit();
      break;
    case "ui":
      cmdUi();
      break;
    case "validate":
      cmdValidate();
      break;
    case "context":
      cmdContext(args.slice(1));
      break;
    case "upgrade":
      cmdUpgrade();
      break;
    case "reset":
      cmdReset(args.slice(1));
      break;
    case "help":
      cmdHelp();
      break;
  }
}

main();
