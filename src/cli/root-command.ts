import {
  program as commanderProgram,
  Command,
} from "@commander-js/extra-typings";
import { initCommand } from "./init/init-command";
import { buildCommand } from "./build/build-command";
import { version } from "../../package.json";

export const rootCommand = (program: Command = commanderProgram) => {
  program
    .name("any-install")
    .description("Any Install is a tool for installer builders.")
    .version(version, "-v, --version");

  initCommand(program);
  buildCommand(program);

  return program;
};
