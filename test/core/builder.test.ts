import { describe, expect, test } from "bun:test";
import { platform } from "node:os";

import {
  Builder,
  temp_dir,
  type Statement,
  type Variable,
} from "../../src/core/builder";
import { BuilderSh } from "../../src/core/builder-sh";
import { BuilderPs1 } from "../../src/core/builder-ps1";
import { expectToMatchSnapshot } from "../helper/util";
import { runPs1, runSh } from "../helper/run-shell";

const run = async (
  b: Builder,
  statements: Statement[],
  env?: Record<string, string>,
  library?: string,
) => {
  const runShell = b instanceof BuilderSh ? runSh : runPs1;
  const script = b.build([`echo "${temp_dir}"`, ...statements], library);
  const { success, stdout: stdoutRaw, stderr } = await runShell(script, env);
  const tempDir = stdoutRaw.split("\n")[1];
  const stdout = "\n" + stdoutRaw.split("\n").splice(2).join("\n");
  return { success, stdout, stderr, tempDir };
};

const suite = (b: Builder) => {
  describe("info", () => {
    describe("snapshot", () => {
      test.each(["Hello world!"])("%p", (message) =>
        expectToMatchSnapshot(b.info(message)),
      );
    });

    describe("evaluate", () => {
      test.each(["Hello world!"])("%p", async (message) => {
        const { success, stdout, stderr } = await run(b, [b.info(message)]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toBe("\n");
        expect(stderr, stderr).toInclude(`\n${message}\n`);
      });
    });
  });

  describe("warn", () => {
    describe("snapshot", () => {
      test.each(["Hello world!"])("%p", (message) =>
        expectToMatchSnapshot(b.warn(message)),
      );
    });

    describe("evaluate", () => {
      test.each(["Hello world!"])("%p", async (message) => {
        const { success, stdout, stderr } = await run(b, [b.warn(message)]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toBe("\n");
        expect(stderr, stderr).toInclude(`\n${message}\n`);
      });
    });
  });

  describe("setVar", () => {
    describe("snapshot", () => {
      test("", async () => {
        const variable = "${name}" as Variable;
        const value = "new value";
        expectToMatchSnapshot(b.setVar(variable, value));
      });
    });

    describe("evaluate", () => {
      test("", async () => {
        const variable = "${name}" as Variable;
        const value = "new value";
        const name = variable.replace(/^\${(.+)}$/, "$1");
        const { success, stdout, stderr } = await run(b, [
          b.setVar(variable, value),
        ]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toBe("\n");
        expect(stderr, stderr).toInclude(`\n${name}=${value}\n`);
      });
    });
  });

  describe("setVarFromEnv", () => {
    describe("snapshot", () => {
      test("", () => {
        const variable = "${name}" as Variable;
        const env = "MY_ENV";
        const defaultValue = "default value";
        expectToMatchSnapshot(b.setVarFromEnv(variable, env, defaultValue));
      });
    });

    describe("evaluate", () => {
      const variable = "${name}" as Variable;
      const name = "name";
      const env = "MY_ENV";
      const defaultValue = "default value";

      test("MY_ENV undefined", async () => {
        const { success, stdout, stderr } = await run(b, [
          b.setVarFromEnv(variable, env, defaultValue),
        ]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toBe("\n");
        expect(stderr, stderr).toInclude(`\n${name}=${defaultValue}\n`);
      });

      test("MY_ENV defined", async () => {
        const value = "new value";
        const { success, stdout, stderr } = await run(
          b,
          [b.setVarFromEnv(variable, env, defaultValue)],
          {
            [env]: value,
          },
        );
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toBe("\n");
        expect(stderr, stderr).toInclude(`\n${name}=${value}\n`);
      });
    });
  });

  describe("unsetVar", () => {
    describe("snapshot", () => {
      test("", async () => {
        const variable = "${name}" as Variable;
        expectToMatchSnapshot(b.unsetVar(variable));
      });
    });

    describe("evaluate", () => {
      const check_name =
        b instanceof BuilderSh
          ? `if [ -n "\${name+x}" ]; then echo "name is set"; else echo "name is unset"; fi`
          : `if (gv name -ea Ignore) { echo "name is set" } else { echo "name is unset" }`;

      test("", async () => {
        const variable = "${name}" as Variable;
        const value = "new value";
        const { success, stdout, stderr } = await run(b, [
          b.setVar(variable, "foo"),
          b.unsetVar(variable),
          check_name,
        ]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toContain("\nname is unset\n");
        expect(stderr, stderr).toBeDefined();
      });
    });
  });

  describe("setInstallDir", () => {
    describe("snapshot", () => {
      test.each([["MY_ENV", "default value"]])("%p %p", (env, defaultValue) =>
        expectToMatchSnapshot(b.setInstallDir(env, defaultValue)),
      );
    });

    describe("evaluate", () => {
      const env = "MY_ENV";
      const defaultValue = "${temp_dir}/install dir";

      test("MY_ENV undefined", async () => {
        const { success, stdout, stderr, tempDir } = await run(b, [
          b.setInstallDir(env, defaultValue),
        ]);
        const expected = `${tempDir}/install dir`;
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toBe("\n");
        expect(stderr, stderr).toContain(`\ninstall_dir=${expected}\n`);
      });

      test("MY_ENV defined", async () => {
        const { success, stdout, stderr } = await run(
          b,
          [b.setInstallDir(env, defaultValue)],
          {
            [env]: "./custom dir",
          },
        );
        const expected = `./custom dir`;
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toBe("\n");
        expect(stderr, stderr).toContain(`\ninstall_dir=${expected}\n`);
      });
    });
  });

  describe("setOs", () => {
    describe("snapshot", () => {
      test("", () => expectToMatchSnapshot(b.setOs()));
    });

    describe("evaluate", () => {
      test("", async () => {
        const { success, stdout, stderr } = await run(b, [b.setOs()]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toBe("\n");
        expect(stderr, stderr).toMatch(/\nos=(linux|macos|windows)\n/);
      });
    });
  });

  describe("setArch", () => {
    describe("snapshot", () => {
      test("", () => expectToMatchSnapshot(b.setArch()));
    });

    describe("evaluate", () => {
      test("", async () => {
        const { success, stdout, stderr } = await run(b, [b.setArch()]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toBe("\n");
        expect(stderr, stderr).toMatch(/\narch=(x64|arm64)\n/);
      });
    });
  });

  describe("download", () => {
    describe("snapshot", () => {
      test.each([
        ["http://localhost/foo", undefined],
        ["http://localhost/foo.zip", undefined],
        ["http://localhost/foo.tar.gz", undefined],
        ["http://localhost/foo.tar.xz", undefined],
        [
          "http://localhost/foo",
          {
            download: "download",
            extract: "extract",
          },
        ],
        ["http://localhost/owner/repo/releases/download/tag/foo", undefined],
        ["http://localhost/owner/repo/releases/latest/download/foo", undefined],
      ])("%p %j", (url, custom) =>
        expectToMatchSnapshot(b.download(url, custom)),
      );
    });

    describe("evaluate", () => {
      const mock_anyi_download =
        b instanceof BuilderSh
          ? `anyi_download() { echo anyi_download "$1" "$2"; }`
          : `function anyi_download($1, $2) { echo "anyi_download $1 $2"; }`;
      const mock_gh =
        b instanceof BuilderSh
          ? `gh() { echo "gh $@"; }`
          : `function gh { echo "gh $($args | Join-String -Sep ' ')"; }`;
      const mock_gh_not_existing =
        b instanceof BuilderSh
          ? `org=anyi_check_command; anyi_check_command() { if [ "$1" = "gh auth status" ]; then return 1; else $org "$1"; fi }`
          : `$org=Get-Command anyi_check_command; function anyi_check_command($1) { if ($1 -eq "gh auth status") { return $False } & $org @PSBoundParameters }`;
      const mock_anyi_extract_zip =
        b instanceof BuilderSh
          ? `anyi_extract_zip() { echo anyi_extract_zip "$1" "$2"; }`
          : `function anyi_extract_zip($1, $2) { echo "anyi_extract_zip $1 $2"; }`;
      const mock_anyi_extract_tar_gz =
        b instanceof BuilderSh
          ? `anyi_extract_tar_gz() { echo anyi_extract_tar_gz "$1" "$2"; }`
          : `function anyi_extract_tar_gz($1, $2) { echo "anyi_extract_tar_gz $1 $2"; }`;
      const mock_anyi_extract_tar_xz =
        b instanceof BuilderSh
          ? `anyi_extract_tar_xz() { echo anyi_extract_tar_xz "$1" "$2"; }`
          : `function anyi_extract_tar_xz($1, $2) { echo "anyi_extract_tar_xz $1 $2"; }`;
      const check_asset =
        b instanceof BuilderSh
          ? `if [ -n "\${asset+x}" ]; then echo "asset is set"; else echo "asset is unset"; fi`
          : `if (gv asset -ea Ignore) { echo "asset is set" } else { echo "asset is unset" }`;
      const check_extract_dir =
        b instanceof BuilderSh
          ? `if [ -n "\${extract_dir+x}" ]; then echo "extract_dir is set"; else echo "extract_dir is unset"; fi`
          : `if (gv extract_dir -ea Ignore) { echo "extract_dir is set" } else { echo "extract_dir is unset" }`;

      test("regular file", async () => {
        const url = "http://localhost/foo";
        const { success, stdout, stderr, tempDir } = await run(b, [
          mock_anyi_download,
          b.download(url),
          check_asset,
          check_extract_dir,
        ]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toContain(
          `\nanyi_download ${url} ${tempDir}/foo\n`,
        );
        expect(stdout, stderr).toContain(`\nasset is set\n`);
        expect(stdout, stderr).toContain(`\nextract_dir is unset\n`);
        expect(stderr, stderr).toContain(`\nurl=${url}\n`);
        expect(stderr, stderr).toContain(`\nasset=${tempDir}/foo\n`);
      });

      test("zip file", async () => {
        const url = "http://localhost/foo.zip";
        const { success, stdout, stderr, tempDir } = await run(b, [
          mock_anyi_download,
          mock_anyi_extract_zip,
          b.download(url),
          check_asset,
          check_extract_dir,
        ]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toContain(
          `\nanyi_download ${url} ${tempDir}/foo.zip\n`,
        );
        expect(stdout, stderr).toContain(
          `\nanyi_extract_zip ${tempDir}/foo.zip ${tempDir}/extract\n`,
        );
        expect(stdout, stderr).toContain(`\nasset is unset\n`);
        expect(stdout, stderr).toContain(`\nextract_dir is set\n`);
        expect(stderr, stderr).toContain(`\nurl=${url}\n`);
        expect(stderr, stderr).toContain(`\nasset=${tempDir}/foo.zip\n`);
        expect(stderr, stderr).toContain(`\nextract_dir=${tempDir}/extract\n`);
      });

      test("tar.gz", async () => {
        const file = "foo.tar.gz";
        const url = `http://localhost/${file}`;
        const { success, stdout, stderr, tempDir } = await run(b, [
          mock_anyi_download,
          mock_anyi_extract_tar_gz,
          b.download(url),
          check_asset,
          check_extract_dir,
        ]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toContain(
          `\nanyi_download ${url} ${tempDir}/${file}\n`,
        );
        expect(stdout, stderr).toContain(
          `\nanyi_extract_tar_gz ${tempDir}/${file} ${tempDir}/extract\n`,
        );
        expect(stdout, stderr).toContain(`\nasset is unset\n`);
        expect(stdout, stderr).toContain(`\nextract_dir is set\n`);
        expect(stderr, stderr).toContain(`\nurl=${url}\n`);
        expect(stderr, stderr).toContain(`\nasset=${tempDir}/${file}\n`);
        expect(stderr, stderr).toContain(`\nextract_dir=${tempDir}/extract\n`);
      });

      test("tar.xz", async () => {
        const file = "foo.tar.xz";
        const url = `http://localhost/${file}`;
        const { success, stdout, stderr, tempDir } = await run(b, [
          mock_anyi_download,
          mock_anyi_extract_tar_xz,
          b.download(url),
          check_asset,
          check_extract_dir,
        ]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toContain(
          `\nanyi_download ${url} ${tempDir}/${file}\n`,
        );
        expect(stdout, stderr).toContain(
          `\nanyi_extract_tar_xz ${tempDir}/${file} ${tempDir}/extract\n`,
        );
        expect(stdout, stderr).toContain(`\nasset is unset\n`);
        expect(stdout, stderr).toContain(`\nextract_dir is set\n`);
        expect(stderr, stderr).toContain(`\nurl=${url}\n`);
        expect(stderr, stderr).toContain(`\nasset=${tempDir}/${file}\n`);
        expect(stderr, stderr).toContain(`\nextract_dir=${tempDir}/extract\n`);
      });

      test("custom download", async () => {
        const url = "http://localhost/foo";
        const { success, stdout, stderr, tempDir } = await run(b, [
          mock_anyi_download,
          b.download(url, { download: `echo "custom download"` }),
          check_asset,
          check_extract_dir,
        ]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toContain(`\ncustom download\n`);
        expect(stdout, stderr).not.toContain(
          `\nanyi_download ${url} ${tempDir}/foo\n`,
        );
        expect(stdout, stderr).toContain(`\nasset is set\n`);
        expect(stdout, stderr).toContain(`\nextract_dir is unset\n`);
        expect(stderr, stderr).toContain(`\nurl=${url}\n`);
        expect(stderr, stderr).toContain(`\nasset=${tempDir}/foo\n`);
      });

      test("custom extract", async () => {
        const url = "http://localhost/foo.zip";
        const { success, stdout, stderr, tempDir } = await run(b, [
          mock_anyi_download,
          mock_anyi_extract_zip,
          b.download(url, { extract: `echo "custom extract"` }),
          check_asset,
          check_extract_dir,
        ]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toContain(
          `\nanyi_download ${url} ${tempDir}/foo.zip\n`,
        );
        expect(stdout, stderr).not.toContain(
          `\nanyi_extract_zip ${tempDir}/foo.zip ${tempDir}/extract\n`,
        );
        expect(stdout, stderr).toContain(`\ncustom extract\n`);
        expect(stdout, stderr).toContain(`\nasset is unset\n`);
        expect(stdout, stderr).toContain(`\nextract_dir is set\n`);
        expect(stderr, stderr).toContain(`\nurl=${url}\n`);
        expect(stderr, stderr).toContain(`\nasset=${tempDir}/foo.zip\n`);
        expect(stderr, stderr).toContain(`\nextract_dir=${tempDir}/extract\n`);
      });

      test.each([
        [
          "http://localhost/owner/repo/releases/download/tag/file",
          "gh release download tag --repo http://localhost/owner/repo --pattern file",
        ],
        [
          "http://localhost/owner/repo/releases/latest/download/file",
          "gh release download --repo http://localhost/owner/repo --pattern file",
        ],
      ])("github release download with gh %s", async (url, gh) => {
        const { success, stdout, stderr, tempDir } = await run(b, [
          mock_gh,
          mock_anyi_download,
          b.download(url),
          check_asset,
          check_extract_dir,
        ]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toContain(`\n${gh} --output ${tempDir}/file\n`);
        expect(stdout, stderr).not.toContain(
          `\nanyi_download ${url} ${tempDir}/file\n`,
        );
        expect(stdout, stderr).toContain(`\nasset is set\n`);
        expect(stdout, stderr).toContain(`\nextract_dir is unset\n`);
        expect(stderr, stderr).toContain(`\nurl=${url}\n`);
        expect(stderr, stderr).toContain(`\nasset=${tempDir}/file\n`);
      });

      test.each([
        "http://localhost/owner/repo/releases/download/tag/file",
        "http://localhost/owner/repo/releases/latest/download/file",
      ])("github release download without gh %s", async (url) => {
        const { success, stdout, stderr, tempDir } = await run(b, [
          mock_gh_not_existing,
          mock_gh,
          mock_anyi_download,
          b.download(url),
          check_asset,
          check_extract_dir,
        ]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).not.toContain(`\ngh release download`);
        expect(stdout, stderr).toContain(
          `\nanyi_download ${url} ${tempDir}/file\n`,
        );
        expect(stdout, stderr).toContain(`\nasset is set\n`);
        expect(stdout, stderr).toContain(`\nextract_dir is unset\n`);
        expect(stderr, stderr).toContain(`\nurl=${url}\n`);
        expect(stderr, stderr).toContain(`\nasset=${tempDir}/file\n`);
      });
    });
  });

  describe("installExecutable", () => {
    describe("snapshot", () => {
      test.each(["my command"])("%p", (target) =>
        expectToMatchSnapshot(b.installExecutable(target)),
      );
    });

    describe("evaluate", () => {
      const checkExist = (path: string) =>
        b instanceof BuilderSh
          ? `if [ -e "${path}" ]; then echo "${path} exists"; else echo "${path} doesn't exist"; fi`
          : `if (Test-Path "${path}") { echo "${path} exists" } else { echo "${path} doesn't exist" }`;

      test("", async () => {
        const target = "my command";
        const installDir = "${temp_dir}/install";
        const asset = "${temp_dir}/asset";
        const { success, stdout, stderr, tempDir } = await run(b, [
          `echo "" > "${asset}"`,
          b.setVar("${install_dir}", installDir),
          b.setVar("${asset}", asset),
          b.installExecutable(target),
          checkExist(installDir),
          checkExist(`${installDir}/${target}`),
        ]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toInclude(`\n${tempDir}/install exists\n`);
        expect(stdout, stderr).toInclude(
          `\n${tempDir}/install/${target} exists\n`,
        );
      });

      test.each(["a/b", "a\\b", "a/", "a\\", "/a", "\\a"])(
        "invalid target %s",
        async (target) => {
          expect(() => b.installExecutable(target)).toThrowError(target);
        },
      );
    });
  });

  describe("installDirectory", () => {
    describe("snapshot", () => {
      test("default", () => expectToMatchSnapshot(b.installDirectory()));
      test("stripComponents", () =>
        expectToMatchSnapshot(b.installDirectory({ stripComponents: 1 })));
    });

    describe("evaluate", () => {
      const checkExist = (path: string) =>
        b instanceof BuilderSh
          ? `if [ -e "${path}" ]; then echo "${path} exists"; else echo "${path} doesn't exist"; fi`
          : `if (Test-Path "${path}") { echo "${path} exists" } else { echo "${path} doesn't exist" }`;

      test("default", async () => {
        const installDir = "${temp_dir}/install";
        const extractDir = "${temp_dir}/extract";
        const { success, stdout, stderr, tempDir } = await run(b, [
          `anyi_mkdir_p "${extractDir}/child"`,
          b.setVar("${install_dir}", installDir),
          b.setVar("${extract_dir}", extractDir),
          b.installDirectory(),
          checkExist(installDir),
          checkExist(`${installDir}/child`),
        ]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toInclude(`\n${tempDir}/install exists\n`);
        expect(stdout, stderr).toInclude(`\n${tempDir}/install/child exists\n`);
      });

      test("stripComponents", async () => {
        const installDir = "${temp_dir}/install";
        const extractDir = "${temp_dir}/extract";
        const oneMoreDir = `${extractDir}/level1`;
        const { success, stdout, stderr, tempDir } = await run(b, [
          `anyi_mkdir_p "${oneMoreDir}/child"`,
          b.setVar("${install_dir}", installDir),
          b.setVar("${extract_dir}", extractDir),
          b.installDirectory({ stripComponents: 1 }),
          checkExist(installDir),
          checkExist(`${installDir}/child`),
        ]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toInclude(`\n${tempDir}/install exists\n`);
        expect(stdout, stderr).toInclude(`\n${tempDir}/install/child exists\n`);
      });
    });
  });

  describe("switchCases", () => {
    describe("snapshot", () => {
      test.each([
        {},
        { a: "aaa" },
        { a: "aaa", b: ["bb", "bb"] },
        { default: "default", a: "aaa" },
      ])("%j", (cases) =>
        expectToMatchSnapshot(b.switchCases("target", cases)),
      );
    });

    describe("evaluate", () => {
      test.each([
        { a: "echo aaa" },
        { a: "echo aaa", b: "echo bbb" },
        { a: "echo aaa", default: "echo default" },
      ])("%j", async (cases) => {
        const target = "${target}";
        const { success, stdout, stderr } = await run(b, [
          b.setVar(target, "a"),
          b.switchCases(target, cases),
        ]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toContain("\naaa\n");
        expect(stderr, stderr).toContain("\nSwitching by a\n");
      });

      test("{}", async () => {
        const target = "${target}";
        const { success, stdout, stderr } = await run(b, [
          b.setVar(target, "a"),
          b.switchCases(target, {}),
        ]);
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toContain("\n");
        expect(stderr, stderr).not.toContain("\nSwitching by a\n");
      });
    });
  });

  describe("build", () => {
    describe("snapshot", () => {
      test.each([
        [[]],
        [["a"]],
        [["a", "b"]],
        [["a", ["b"]]],
        [["a", ["b", "c"]]],
        [["\na\nb"]],
      ])("%j", (statements) =>
        expectToMatchSnapshot(b.build(statements, "library")),
      );
    });

    describe("temp_dir", () => {
      const library =
        b instanceof BuilderSh
          ? `
anyi_mktemp_d() { echo anyi_mktemp_d; }
anyi_rm_fr() { echo anyi_rm_fr; }
anyi_info() { echo anyi_info "$1"; }
            `
          : `
function anyi_mktemp_d { echo anyi_mktemp_d; }
function anyi_rm_fr { echo anyi_rm_fr; }
function anyi_info($1) { echo anyi_info "$1"; }
            `;

      test("success", async () => {
        const { success, stdout, stderr } = await run(
          b,
          [`echo "\${temp_dir}"`],
          undefined,
          library,
        );
        expect(success, stderr).toBeTrue();
        expect(stdout, stderr).toContain("\nanyi_mktemp_d\n");
        expect(stdout, stderr).toContain("\nanyi_rm_fr\n");
        expect(stderr, stderr).toBe("\n");
      });

      test("fail", async () => {
        const { success, stdout, stderr } = await run(
          b,
          [`echo "\${temp_dir}"`, "anyi_undefined"],
          undefined,
          library,
        );
        expect(success, stderr).toBeFalse();
        expect(stdout, stderr).toContain("\nanyi_mktemp_d\n");
        expect(stdout, stderr).toContain("\nanyi_rm_fr\n");
        expect(stderr, stderr).toContain("anyi_undefined");
      });
    });

    describe.if(b instanceof BuilderPs1)("wrapper", () => {
      test("", async () => {
        const library =
          "function anyi_mktemp_d {}; function anyi_rm_fr {}; function anyi_info {}";
        const script = b.build(["echo _any_install_main"], library);
        const { success, stdout, stderr } = await runPs1(
          script + "\n_any_install_main", // Must fail to call _any_install_main
        );
        expect(success, stderr).toBeFalse();
        expect(stdout, stderr).toBe("\n_any_install_main\n");
        expect(stderr, stderr).toInclude("_any_install_main");
      });
    });
  });
};

// describe.each() doesn't work --test-name-pattern
if (platform() !== "win32") describe("sh ", () => suite(new BuilderSh()));
describe("ps1", () => suite(new BuilderPs1()));
