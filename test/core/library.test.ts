import { describe, expect, test } from "bun:test";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { platform } from "node:os";
import { basename, join } from "node:path";

import { temporaryDirectoryTask } from "tempy";
import {
  getFixtureAsset,
  getFixtureDirectory,
  getFixtureExecutable,
  getFixtureTarGz,
  getFixtureZip,
  serveFixture,
} from "../helper/fixture";
import { find, rm_fr, sha256, touch } from "../helper/util";
import { runPs1, runSh } from "../helper/run-shell";
import { libraryPs1, librarySh } from "../../src/core/library";

type Shell = "sh" | "ps1";

const suite = (shell: Shell) => {
  const run = async (commands: string[], env?: Record<string, string>) => {
    const run = shell === "sh" ? runSh : runPs1;
    const library = shell === "sh" ? librarySh : libraryPs1;
    const script = commands.join("\n");
    const {
      success,
      stdout: out,
      stderr: err,
    } = await run(library + "\n" + script, env);
    return { success, out, err };
  };

  describe("anyi_mktemp_d", () => {
    test("success", async () => {
      let subject = "";
      try {
        const { success, out, err } = await run(["anyi_mktemp_d"]);
        subject = out.trim();
        expect(success, err).toBeTrue();
        expect(err, err).toBe("\n");
        expect(subject, err).not.toBe("");
        expect(existsSync(subject), err).toBeTrue();
        expect(() => touch(join(subject, "foo")), err).not.toThrow();
      } finally {
        rm_fr(subject);
      }
    });
  });

  describe("anyi_rm_fr", () => {
    test("success", async () =>
      temporaryDirectoryTask(async (tempDir) => {
        const subject = join(tempDir, ".subject");
        mkdirSync(subject);
        touch(join(subject, "foo"));
        const { success, out, err } = await run([`anyi_rm_fr "${subject}"`]);
        expect(success, err).toBeTrue();
        expect(out, err).toBe("\n");
        expect(err, err).toBe("\n");
        expect(existsSync(subject), err).toBeFalse();
      }));
  });

  describe("anyi_info", () => {
    test("success", async () => {
      const message = "Hello world!";
      const { success, out, err } = await run([`anyi_info "${message}"`]);
      expect(success, err).toBeTrue();
      expect(out, err).toBe("\n");
      expect(err, err).toBe(`\n${message}\n`);
    });
  });

  describe("anyi_warn", () => {
    test("success", async () => {
      const message = "Hello world!";
      const { success, out, err } = await run([`anyi_warn "${message}"`]);
      expect(success, err).toBeTrue();
      expect(out, err).toBe("\n");
      expect(err, err).toBe(`\n${message}\n`);
    });
  });

  describe("anyi_panic", () => {
    test("success", async () => {
      const message = "Hello world!";
      const { success, out, err } = await run([
        `anyi_panic "${message}"; exit`,
      ]);
      expect(success, err).toBeFalse();
      expect(out, err).toBe("\n");
      expect(err, err).toContain(message);
    });
  });

  describe("anyi_mkdir_p", () => {
    test("success", async () =>
      temporaryDirectoryTask(async (tempDir) => {
        const subject = join(tempDir, "parent", "subject");
        const { success, out, err } = await run([
          `anyi_mkdir_p "${subject}"`,
          `anyi_mkdir_p "${subject}"`,
        ]);
        expect(success, err).toBeTrue();
        expect(out, err).toBe("\n");
        expect(err, err).toBe("\n");
        expect(existsSync(subject), err).toBeTrue();
      }));
  });

  describe("anyi_verify_install_dir", () => {
    test("success", async () =>
      temporaryDirectoryTask(async (tempDir) => {
        const subject = join(tempDir, "subject");
        const { success, out, err } = await run([
          `anyi_verify_install_dir "${subject}"`,
        ]);
        expect(success, err).toBeTrue();
        expect(out, err).toBe("\n");
        expect(err, err).toBe("\n");
        expect(existsSync(subject), err).toBeFalse();
      }));

    test("no parent dir", async () =>
      temporaryDirectoryTask(async (tempDir) => {
        const parent = join(tempDir, "parent");
        const subject = join(parent, "subject");
        const { success, out, err } = await run([
          `anyi_verify_install_dir "${subject}"`,
        ]);
        expect(success, err).toBeFalse();
        expect(out, err).toBe("\n");
        expect(err, err).toInclude(parent);
        expect(existsSync(parent), err).toBeFalse();
        expect(existsSync(subject), err).toBeFalse();
      }));

    test("already exists", async () =>
      temporaryDirectoryTask(async (tempDir) => {
        const subject = join(tempDir, "parent", "subject");
        const child = join(subject, "child");
        mkdirSync(child, { recursive: true });
        const { success, out, err } = await run([
          `anyi_verify_install_dir "${subject}"`,
        ]);
        expect(success, err).toBeFalse();
        expect(out, err).toBe("\n");
        expect(err, err).toInclude(subject);
        expect(existsSync(subject), err).toBeTrue();
        expect(existsSync(child), err).toBeTrue();
      }));
  });

  describe("anyi_get_os", () => {
    test("success", async () => {
      const { success, out, err } = await run([`anyi_get_os`]);
      expect(success, err).toBeTrue();
      // TODO: Mock OS environment
      expect(out, err).toBeOneOf(["\nwindows\n", "\nlinux\n", "\nmacos\n"]);
      expect(err, err).toBe("\n");
    });
  });

  describe("anyi_get_arch", () => {
    test("success", async () => {
      const { success, out, err } = await run([`anyi_get_arch`]);
      expect(success, err).toBeTrue();
      // TODO: Mock Arch environment
      expect(out, err).toBeOneOf(["\nx64\n", "\narm64\n"]);
      expect(err, err).toBe("\n");
    });
  });

  describe("anyi_check_command", () => {
    const script = (command: string) =>
      shell === "sh"
        ? `if anyi_check_command "${command}"; then echo Y; else echo N; fi`
        : `if (anyi_check_command "${command}") { echo Y } else { echo N }`;
    test("success", async () => {
      const { success, out, err } = await run([script("echo foo")]);
      expect(success, err).toBeTrue();
      expect(out, err).toBe("\nY\n");
      expect(err, err).toBe("\n");
    });

    test("fail", async () => {
      const { success, out, err } = await run([script("not_found error")]);
      expect(success, err).toBeTrue();
      expect(out, err).toBe("\nN\n");
      expect(err, err).toBe("\n");
    });
  });

  describe("anyi_download", () => {
    test("success", async () =>
      temporaryDirectoryTask(async (tempDir) => {
        const { assetFile, url, stop } = serveFixture("executable");
        const outFile = join(tempDir, basename(assetFile));
        const { success, out, err } = await run([
          `anyi_download "${url}" "${outFile}"`,
        ]);
        stop();
        expect(success, err).toBeTrue();
        expect(out, err).toBe("\n");
        expect(err, err).toContain(url);
        expect(err, err).toContain(outFile);
        expect(existsSync(outFile), err).toBeTrue();
        expect(sha256(assetFile), err).toBe(sha256(outFile));
      }));

    test("not found", async () =>
      temporaryDirectoryTask(async (tempDir) => {
        const url = "http://localhost:0";
        const outFile = join(tempDir, "output");
        const { success, out, err } = await run([
          `anyi_download "${url}" "${outFile}"`,
        ]);
        expect(success, err).toBeFalse();
        expect(out, err).toBe("\n");
        expect(err, err).toContain("Failed to download");
        expect(err, err).toContain(url);
        expect(err, err).toContain(outFile);
        expect(existsSync(outFile), err).toBeFalse();
      }));
  });

  describe("anyi_extract_zip", () => {
    test(
      "success",
      async () =>
        temporaryDirectoryTask(async (tempDir) => {
          const executableFile = getFixtureExecutable();
          const archiveFile = getFixtureZip();
          const installDir = join(tempDir, "install dir");
          const installFile = join(installDir, basename(executableFile));
          const { success, out, err } = await run([
            `anyi_mkdir_p "${installDir}"`,
            `anyi_extract_zip "${archiveFile}" "${installDir}"`,
          ]);
          expect(success, err).toBeTrue();
          expect(out, err).toBeDefined();
          expect(err, err).toBeDefined();
          expect(existsSync(installFile), err).toBeTrue();
          expect(sha256(installFile), err).toBe(sha256(executableFile));
          expect(Bun.spawnSync([installFile]).success, err).toBeTrue();
        }),
      { timeout: 60_000 },
    );
  });

  describe("anyi_extract_tar_gz", () => {
    test(
      "success",
      async () =>
        temporaryDirectoryTask(async (tempDir) => {
          const executableFile = getFixtureExecutable();
          const archiveFile = getFixtureAsset("tar.gz");
          const installDir = join(tempDir, "install dir");
          const installFile = join(installDir, basename(executableFile));
          const { success, out, err } = await run([
            `anyi_mkdir_p "${installDir}"`,
            `anyi_extract_tar_gz "${archiveFile}" "${installDir}"`,
          ]);
          expect(success, err).toBeTrue();
          expect(out, err).toBeDefined();
          expect(err, err).toBeDefined();
          expect(existsSync(installFile), err).toBeTrue();
          expect(sha256(installFile), err).toBe(sha256(executableFile));
          expect(Bun.spawnSync([installFile]).success, err).toBeTrue();
        }),
      {
        timeout: 60_000,
      },
    );
  });

  describe("anyi_extract_tar_xz", () => {
    test(
      "success",
      async () =>
        temporaryDirectoryTask(async (tempDir) => {
          const executableFile = getFixtureExecutable();
          const archiveFile = getFixtureAsset("tar.xz");
          const installDir = join(tempDir, "install dir");
          const installFile = join(installDir, basename(executableFile));
          const { success, out, err } = await run([
            `anyi_mkdir_p "${installDir}"`,
            `anyi_extract_tar_xz "${archiveFile}" "${installDir}"`,
          ]);
          expect(success, err).toBeTrue();
          expect(out, err).toBeDefined();
          expect(err, err).toBeDefined();
          expect(existsSync(installFile), err).toBeTrue();
          expect(sha256(installFile), err).toBe(sha256(executableFile));
          expect(Bun.spawnSync([installFile]).success, err).toBeTrue();
        }),
      {
        timeout: 60_000,
      },
    );
  });

  describe("anyi_install_executable", () => {
    test("success", async () =>
      temporaryDirectoryTask(async (tempDir) => {
        const executableFile = getFixtureExecutable();
        const installFile = join(tempDir, basename(executableFile));
        const { success, out, err } = await run([
          `anyi_install_executable "${executableFile}" "${installFile}"`,
        ]);
        expect(success, err).toBeTrue();
        expect(out, err).toBe("\n");
        expect(err, err).toBe("\n");
        expect(existsSync(installFile), err).toBeTrue();
        expect(sha256(installFile), err).toBe(sha256(executableFile));
        expect(Bun.spawnSync([installFile]).success, err).toBeTrue();
      }));

    test("destination exists", async () =>
      temporaryDirectoryTask(async (tempDir) => {
        const executableFile = getFixtureExecutable();
        const installFile = join(tempDir, basename(executableFile));
        writeFileSync(installFile, "");
        const { success, out, err } = await run([
          `anyi_install_executable "${executableFile}" "${installFile}"`,
        ]);
        expect(success, err).toBeFalse();
        expect(out, err).toBe("\n");
        expect(err, err).toInclude(installFile);
        expect(existsSync(installFile), err).toBeTrue();
        expect(sha256(installFile), err).not.toBe(sha256(executableFile));
      }));

    test("parent doesn't exist", async () =>
      temporaryDirectoryTask(async (tempDir) => {
        const executableFile = getFixtureExecutable();
        const parent = join(tempDir, "parent");
        const installFile = join(tempDir, "parent", basename(executableFile));
        const { success, out, err } = await run([
          `anyi_install_executable "${executableFile}" "${installFile}"`,
        ]);
        expect(success, err).toBeFalse();
        expect(out, err).toBe("\n");
        expect(err, err).toInclude(`${parent}\n`);
        expect(existsSync(installFile), err).toBeFalse();
        expect(existsSync(parent), err).toBeFalse();
      }));
  });

  describe("anyi_install_directory", () => {
    test("new directory", async () =>
      temporaryDirectoryTask(async (tempDir) => {
        const src = getFixtureDirectory();
        const dst = join(tempDir, "install dir");
        const { success, out, err } = await run([
          `anyi_install_directory "${src}" "${dst}"`,
        ]);
        expect(success, err).toBeTrue();
        expect(out, err).toBe("\n");
        expect(err, err).toBe("\n");
        expect(find(dst), err).toEqual(find(src));
      }));

    test("existing directory", async () =>
      temporaryDirectoryTask(async (tempDir) => {
        const src = getFixtureDirectory();
        const dst = join(tempDir, "install dir");
        mkdirSync(dst);
        touch(join(dst, "foo"));
        const { success, out, err } = await run([
          `anyi_install_directory "${src}" "${dst}"`,
        ]);
        expect(success, err).toBeFalse();
        expect(out, err).toBe("\n");
        expect(err, err).toContain(dst);
        expect(find(dst), err).not.toEqual(find(src));
      }));

    test("parent doesn't exist", async () =>
      temporaryDirectoryTask(async (tempDir) => {
        const src = getFixtureDirectory();
        const parent = join(tempDir, "parent");
        const dst = join(tempDir, "parent", "install dir");
        const { success, out, err } = await run([
          `anyi_install_directory "${src}" "${dst}"`,
        ]);
        expect(success, err).toBeFalse();
        expect(out, err).toBe("\n");
        expect(err, err).toContain(`${parent}\n`);
        expect(existsSync(parent), err).toBeFalse();
      }));
  });

  describe("anyi_find_stripped_path", () => {
    test.each([
      [0, ""],
      [1, join("a")],
      [2, join("a", "b")],
      [3, join("a", "b", "c")],
    ])("%i", async (depth, expected) =>
      temporaryDirectoryTask(async (tempDir) => {
        mkdirSync(join(tempDir, "a", "b", "c"), { recursive: true });
        const { success, out, err } = await run([
          `anyi_find_stripped_path "${tempDir}/" "${depth}"`,
        ]);
        const subject = out.trim();
        expect(success, err).toBeTrue();
        expect(subject, err).toBe(join(tempDir, expected));
        expect(err, err).toBe("\n");
      }),
    );

    test("too deep", async () =>
      temporaryDirectoryTask(async (tempDir) => {
        const c = join(tempDir, "a", "b", "c");
        mkdirSync(c, { recursive: true });
        const { success, out, err } = await run([
          `anyi_find_stripped_path "${tempDir}/" "4"`,
        ]);
        expect(success, err).toBeFalse();
        expect(out, err).toBe("\n");
        expect(err, err).toInclude(c);
      }));

    test("sibling exists", async () =>
      temporaryDirectoryTask(async (tempDir) => {
        const c = join(tempDir, "a", "b", "c");
        const d = join(tempDir, "a", "b", "d");
        mkdirSync(c, { recursive: true });
        mkdirSync(d, { recursive: true });
        const { success, out, err } = await run([
          `anyi_find_stripped_path "${tempDir}/" "3"`,
        ]);
        expect(success, err).toBeFalse();
        expect(out, err).toBe("\n");
        expect(err, err).toInclude(c);
        expect(err, err).toInclude(d);
      }));
  });
};

// describe.each() doesn't work --test-name-pattern
if (platform() !== "win32") describe("library.sh ", () => suite("sh"));
describe("library.ps1", () => suite("ps1"));
