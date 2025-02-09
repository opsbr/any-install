import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { initCommand } from "../../../src/cli/init/init-command";
import { mockProgram } from "../helper";
import { temporaryDirectoryTaskWithChdir } from "../../helper/util";

describe("success", () => {
  test.each([
    [[], "any-install.yaml"],
    [["-f", "yaml"], "any-install.yaml"],
    [["-f", "json"], "any-install.json"],
    [["-f", "js"], "any-install.js"],
  ])("%p", async (argv, file) =>
    temporaryDirectoryTaskWithChdir(async (tempDir) => {
      const { program } = mockProgram();
      const command = initCommand(program);
      await command.parseAsync(argv, { from: "user" });
      expect(existsSync(join(tempDir, file))).toBe(true);
      expect(existsSync(join(tempDir, ".any-install"))).toBe(true);
    }),
  );

  test("specify root dir", async () =>
    temporaryDirectoryTaskWithChdir(async (tempDir) => {
      const rootDir = join(tempDir, "custom");
      const { program } = mockProgram();
      const command = initCommand(program);
      await command.parseAsync([rootDir], { from: "user" });
      expect(existsSync(join(rootDir, "any-install.yaml"))).toBe(true);
      expect(existsSync(join(rootDir, ".any-install"))).toBe(true);
    }));
});

describe("already exists", () => {
  test.each([
    [["-f", "yaml"], "any-install.yaml"],
    [["-f", "json"], "any-install.json"],
    [["-f", "js"], "any-install.js"],
    [[], "any-install.yaml"],
  ])("%p", async (argv, file) =>
    temporaryDirectoryTaskWithChdir(async (tempDir) => {
      await Bun.write(join(tempDir, file), "");
      const { program } = mockProgram();
      const command = initCommand(program);
      expect(() =>
        command.parseAsync([tempDir, ...argv], { from: "user" }),
      ).toThrowError(file);
      expect(existsSync(join(tempDir, ".any-install"))).toBe(false);
    }),
  );
});
