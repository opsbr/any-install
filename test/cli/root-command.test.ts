import { describe, expect, test } from "bun:test";

import { rootCommand } from "../../src/cli/root-command";
import { mockProgram } from "./helper";

const version = "0.0.0-semantically-released";
const help = "(outputHelp)";

describe("success", () => {
  test("version", async () => {
    const { program, stdout, stderr } = mockProgram();
    const command = rootCommand(program);
    expect(() => command.parseAsync(["-v"], { from: "user" })).toThrowError(
      version,
    );
    expect(stdout.join("")).toContain(version);
    expect(stderr.join("")).toBe("");
  });

  test("help", async () => {
    const { program, stdout, stderr } = mockProgram();
    const command = rootCommand(program);
    expect(() => command.parseAsync(["-h"], { from: "user" })).toThrowError(
      help,
    );
    expect(stdout.join("")).toContain("Usage: any-install ");
    expect(stderr.join("")).toBe("");
  });

  test.each(["init", "build"])("%s help", async (subcommand) => {
    const { program, stdout, stderr } = mockProgram();
    const command = rootCommand(program);
    expect(() =>
      command.parseAsync([subcommand, "-h"], { from: "user" }),
    ).toThrowError(help);
    expect(stdout.join("")).toContain(`Usage: any-install ${subcommand} `);
    expect(stderr.join("")).toBe("");
  });
});
