#!/usr/bin/env node
import { rootCommand } from "./root-command";

const program = rootCommand();
try {
  await program.parseAsync();
} catch (e) {
  program.error(e instanceof Error ? e.message : String(e));
}
