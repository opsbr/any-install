import { $ } from "bun";
import { arch, platform } from "node:os";
import { basename, dirname, join } from "node:path";
import { existsSync } from "node:fs";
import { mkdir, rm } from "node:fs/promises";

const bunTargets = [
  "bun-linux-x64",
  "bun-linux-arm64",
  "bun-windows-x64",
  "bun-darwin-x64",
  "bun-darwin-arm64",
] as const;
export type BunTarget = (typeof bunTargets)[number];

const getBunTarget = (): BunTarget => {
  switch (platform()) {
    case "linux": {
      switch (arch()) {
        case "x64":
          return "bun-linux-x64";
        case "arm64":
          return "bun-linux-arm64";
      }
      break;
    }
    case "win32": {
      switch (arch()) {
        case "x64":
          return "bun-windows-x64";
      }
      break;
    }
    case "darwin": {
      switch (arch()) {
        case "x64":
          return "bun-darwin-x64";
        case "arm64":
          return "bun-darwin-arm64";
      }
      break;
    }
  }
  throw new Error(`Unsupported environment: ${platform()}, ${arch()}`);
};

export const getExecutableFileName = (target: BunTarget) => {
  switch (target) {
    case "bun-linux-x64":
      return "executable-linux-x64";
    case "bun-linux-arm64":
      return "executable-linux-arm64";
    case "bun-windows-x64":
      return "executable-windows-x64.exe";
    case "bun-darwin-x64":
      return "executable-darwin-x64";
    case "bun-darwin-arm64":
      return "executable-darwin-arm64";
  }
};

const compileExecutable = async (target: BunTarget) => {
  const source = join(import.meta.dirname, "fixture-executable.ts");
  const fileName = getExecutableFileName(target);
  const outfile = join(import.meta.dirname, "..", "fixture", fileName);
  await $`bun build --compile --minify --target ${target} "${source}" --outfile "${outfile}"`.quiet();
  if (platform() !== "win32") await $`chmod -x "${outfile}"`;
};

const createDirectory = async () => {
  const dir = getFixtureDirectory();
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  await Bun.write(join(dir, "level1"), "");
  await mkdir(join(dir, "child"));
  await Bun.write(join(dir, "child", "level2"), "");
  await mkdir(join(dir, "child", "child"));
  await Bun.write(join(dir, "child", "child", "level3"), "");
};

export const getFixtureExecutable = () => {
  const fileName = getExecutableFileName(getBunTarget());
  const executable = join(import.meta.dirname, "..", "fixture", fileName);
  if (!existsSync(executable))
    throw new Error(`Fixture doesn't exist: ${executable}`);
  return executable;
};

export const getFixtureZip = (executable = getFixtureExecutable()) => {
  const archive = `${executable}.zip`;
  if (existsSync(archive)) return archive;
  const dir = dirname(executable);
  const file = basename(executable);
  if (platform() === "win32") {
    const script = `cd "${dir}" && tar -cvzf "${file}.zip" "${file}"`;
    Bun.spawnSync(["pwsh", "-c", script]);
  } else {
    const script = `cd "${dir}" && chmod +x "${file}" && zip "${file}.zip" "${file}" && chmod -x "${file}"`;
    Bun.spawnSync(["sh", "-c", script]);
  }
  return archive;
};

export const getFixtureTarGz = (executable = getFixtureExecutable()) => {
  const archive = `${executable}.tar.gz`;
  if (existsSync(archive)) return archive;
  const dir = dirname(executable);
  const file = basename(executable);
  if (platform() === "win32") {
    const script = `cd "${dir}" && tar -cvzf "${file}.tar.gz" "${file}"`;
    Bun.spawnSync(["pwsh", "-c", script]);
  } else {
    const script = `cd "${dir}" && chmod +x "${file}" && tar -cvzf "${file}.tar.gz" "${file}" && chmod -x "${file}"`;
    Bun.spawnSync(["sh", "-c", script]);
  }
  return archive;
};

export const getFixtureTarXz = (executable = getFixtureExecutable()) => {
  const archive = `${executable}.tar.xz`;
  if (existsSync(archive)) return archive;
  const dir = dirname(executable);
  const file = basename(executable);
  if (platform() === "win32") {
    const script = `cd "${dir}" && 7z.exe a -ttar "${file}.tar" "${file}" && 7z.exe a -txz "${file}.tar.xz" "${file}.tar"`;
    Bun.spawnSync(["pwsh", "-c", script]);
  } else {
    const script = `cd "${dir}" && chmod +x "${file}" && tar -cvJf "${file}.tar.xz" "${file}" && chmod -x "${file}"`;
    Bun.spawnSync(["sh", "-c", script]);
  }
  return archive;
};

export const getFixtureAsset = (fixture: Fixture) => {
  switch (fixture) {
    case "executable":
      return getFixtureExecutable();
    case "zip":
      return getFixtureZip();
    case "tar.gz":
      return getFixtureTarGz();
    case "tar.xz":
      return getFixtureTarXz();
  }
};

export const getFixtureDirectory = () =>
  join(import.meta.dirname, "..", "fixture", "directory");

type Fixture = "executable" | "zip" | "tar.gz" | "tar.xz";

export const serveFixture = (fixture: Fixture) => {
  const assetFile = getFixtureAsset(fixture);
  const fetch = async () => new Response(Bun.file(assetFile));
  const server = Bun.serve({ fetch });
  return {
    assetFile,
    url: server.url.toString(),
    stop: () => server.stop(true),
  };
};

await compileExecutable(getBunTarget());
await createDirectory();
