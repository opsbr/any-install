import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { temporaryDirectoryTask } from "tempy";

export const testRun = async (
  outDir: string,
  {
    sh,
    ps1,
  }: {
    sh?: { file: string; env: string };
    ps1?: { file: string; env: string };
  },
) =>
  temporaryDirectoryTask((tempDir) => {
    if (sh) {
      const script = readFileSync(join(outDir, sh.file));
      const installDir = join(tempDir, "sh");
      execFileSync("sh", {
        input: script,
        env: {
          ...process.env,
          [sh.env]: installDir,
        },
        stdio: ["pipe", "inherit", "inherit"],
      });
      execFileSync(process.env.SHELL ?? "sh", {
        cwd: installDir,
        env: {
          ...process.env,
          PATH: `${installDir}:${process.env.PATH}`,
        },
        stdio: ["inherit", "inherit", "inherit"],
      });
    }
    if (ps1) {
      const script = readFileSync(join(outDir, ps1.file));
      const installDir = join(tempDir, "ps1");
      execFileSync("pwsh", ["-c", "$Input | Out-String | iex"], {
        input: script,
        env: {
          ...process.env,
          [ps1.env]: installDir,
        },
        stdio: ["pipe", "inherit", "inherit"],
      });
      execFileSync("pwsh", {
        cwd: installDir,
        env: {
          ...process.env,
          PATH: `${installDir}:${process.env.PATH}`,
          Path: `${installDir};${process.env.Path}`,
        },
        stdio: ["inherit", "inherit", "inherit"],
      });
    }
  });
