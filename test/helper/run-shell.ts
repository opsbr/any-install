import { join } from "node:path";
import { temporaryDirectoryTask } from "tempy";

const sanitize = (s: string) =>
  "\n" +
  s
    .replaceAll(/\r/g, "")
    .replaceAll(
      /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g,
      "",
    );

export const runSh = async (script: string, env?: Record<string, string>) => {
  const proc = Bun.spawn(["sh", "-c", script], {
    env,
    stdout: "pipe",
    stderr: "pipe",
  });
  await proc.exited;
  const success = proc.exitCode === 0;
  const stdout = sanitize(await new Response(proc.stdout).text());
  const stderr = sanitize(await new Response(proc.stderr).text());
  return { success, stdout, stderr };
};

export const runPs1 = async (script: string, env?: Record<string, string>) => {
  return await temporaryDirectoryTask(async (outputDir) => {
    const infoFile = join(outputDir, "stderr");
    const warnFile = join(outputDir, "warn");
    const proc = Bun.spawn(
      ["pwsh", "-c", `$(${script}) 6> ${infoFile} 3> ${warnFile}`],
      {
        env,
        stdout: "pipe",
        stderr: "pipe",
      },
    );
    await proc.exited;
    const success = proc.exitCode === 0;
    const stdout = sanitize(await new Response(proc.stdout).text());
    const err = await new Response(proc.stderr).text();
    const info = await Bun.file(infoFile).text();
    const warn = await Bun.file(warnFile).text();
    const stderr = sanitize(info + warn + err);
    return { success, stdout, stderr };
  });
};
