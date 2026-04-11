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

export const COMMANDS = ["init", "ui", "validate", "context", "upgrade", "reset"] as const;
type Command = (typeof COMMANDS)[number];

function isCommand(s: string): s is Command {
  return COMMANDS.includes(s as Command);
}

function printUsage(): void {
  console.error("Usage: dd <command> [options]");
  console.error("Commands: init | ui | validate | context | upgrade | reset");
  process.exitCode = 1;
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
  if (command !== "init" && command !== "upgrade" && command !== "reset") {
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
  }
}

main();
