#!/usr/bin/env bun
/**
 * Design Duck CLI – requirements gathering and management.
 * Commands: init | ui | validate | context
 */

import { init } from "./commands/init";
import { ui } from "./commands/ui";
import { validate } from "./commands/validate";
import { context } from "./commands/context";

export const COMMANDS = ["init", "ui", "validate", "context"] as const;
type Command = (typeof COMMANDS)[number];

function isCommand(s: string): s is Command {
  return COMMANDS.includes(s as Command);
}

function printUsage(): void {
  console.error("Usage: design-duck <command>");
  console.error("Commands: init | ui | validate | context");
  process.exitCode = 1;
}

function cmdInit(): void {
  init();
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
  }
}

if (import.meta.main) {
  main();
}
