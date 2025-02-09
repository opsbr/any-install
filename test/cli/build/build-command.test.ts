import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

import { buildCommand } from "../../../src/cli/build/build-command";
import { mockProgram } from "../helper";

// @ts-expect-error
import yaml from "../../../src/cli/init/any-install.yaml" with { type: "text" };
import json from "../../../src/cli/init/any-install.json" with { type: "text" };
import js from "../../../src/cli/init/any-install.js" with { type: "text" };
import { temporaryDirectoryTaskWithChdir } from "../../helper/util.js";

describe("success", () => {
  test.each([
    ["any-install.yaml", yaml],
    ["any-install.yml", yaml],
    ["any-install.json", json],
    ["any-install.js", js],
    ["any-install.mjs", js],
  ])("default %s", async (name, content) =>
    temporaryDirectoryTaskWithChdir(async (tempDir) => {
      await Bun.write(name, content);
      const { program } = mockProgram();
      const command = buildCommand(program);
      await command.parseAsync([], { from: "user" });
      expect(existsSync(join(tempDir, "install.sh"))).toBeTrue();
      expect(existsSync(join(tempDir, "install.ps1"))).toBeTrue();
    }),
  );

  test("specify manifest", async () =>
    temporaryDirectoryTaskWithChdir(async (tempDir) => {
      const dir = join(tempDir, "custom");
      const file = join(dir, "custom.yaml");
      mkdirSync(dir, { recursive: true });
      await Bun.write(file, yaml);
      const { program } = mockProgram();
      const command = buildCommand(program);
      await command.parseAsync(["-m", file], { from: "user" });
      expect(existsSync(join(dir, "install.sh"))).toBeTrue();
      expect(existsSync(join(dir, "install.ps1"))).toBeTrue();
    }));

  test("no manifest", async () =>
    temporaryDirectoryTaskWithChdir(async (tempDir) => {
      const { program } = mockProgram();
      const command = buildCommand(program);
      expect(() => command.parseAsync([], { from: "user" })).toThrowError();
      expect(existsSync(join(tempDir, "install.sh"))).toBeFalse();
      expect(existsSync(join(tempDir, "install.ps1"))).toBeFalse();
    }));

  test("with parameter", async () =>
    temporaryDirectoryTaskWithChdir(async (tempDir) => {
      const file = join(tempDir, "any-install.yaml");
      const yamlWithParameter = `
sh:
  file: install.sh
  install:
    - statement: setInstallDir
      with:
        env: TEST_ENV
        defaultValue: \${HOME}/.test
    - statement: info
      with:
        message: "{{ message1 }}"
    - echo "{{ message2 }}"
`;
      await Bun.write(file, yamlWithParameter);
      const { program } = mockProgram();
      const command = buildCommand(program);
      await command.parseAsync(["-p", "message1=aaa", "-p", "message2=bbb"], {
        from: "user",
      });
      expect(existsSync(join(tempDir, "install.sh"))).toBeTrue();
      const installSh = await Bun.file(join(tempDir, "install.sh")).text();
      expect(installSh, installSh).toContain(`anyi_info "aaa"`);
      expect(installSh, installSh).toContain(`echo "bbb"`);
    }));
});
