import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { temporaryDirectory } from "tempy";

export const testRun = (
  outDir: string,
  {
    sh,
    ps1,
  }: {
    sh?: { file: string; env: string };
    ps1?: { file: string; env: string };
  },
) => {
  const tempDir = temporaryDirectory();
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
      stdio: ["inherit", "inherit", "inherit"],
    });
  }
};
