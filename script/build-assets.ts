import { $ } from "bun";
import { copyFile, mkdir } from "node:fs/promises";
import { join, resolve } from "node:path";

const distDir = resolve(Bun.argv[2]);
await mkdir(distDir, { recursive: true });

const targets = [
  {
    target: "linux-x64",
    bunTarget: "bun-linux-x64-baseline",
  },
  {
    target: "linux-arm64",
    bunTarget: "bun-linux-arm64",
  },
  {
    target: "macos-x64",
    bunTarget: "bun-darwin-x64-baseline",
  },
  {
    target: "macos-arm64",
    bunTarget: "bun-darwin-arm64",
  },
  {
    target: "windows-x64",
    bunTarget: "bun-windows-x64-baseline",
  },
  // {
  //   target: "windows-arm64",
  //   bunTarget: "bun-windows-arm64",
  // },
] as const;

const buildAsset = async ({ target, bunTarget }: (typeof targets)[number]) => {
  const outdir = join(import.meta.dir, "..", "dist", target);
  const outfile = join(outdir, "any-install");
  await $`bun build ./src/cli/main.ts --compile --minify --target ${bunTarget} --outfile "${outfile}"`.quiet();
  await Promise.all(
    ["LICENSE", "NOTICE", "THIRD_PARTY_LICENSES"].map((file) =>
      copyFile(join(import.meta.dir, "..", file), join(outdir, file)),
    ),
  );
  if (target.startsWith("windows")) {
    console.log(`Built ${outfile}.exe`);
    const file = join(distDir, `any-install_${target}.zip`);
    await $`zip "${file}" *`.cwd(outdir).quiet();
    console.log(`Archived ${file}`);
  } else {
    console.log(`Built ${outfile}`);
    await $`chmod +x "${outfile}"`.quiet();
    const file = join(distDir, `any-install_${target}.tar.gz`);
    await $`tar -cvzf "${file}" *`.cwd(outdir).quiet();
    console.log(`Archived ${file}`);
  }
};

await Promise.all(targets.map(buildAsset));

await $`bun any-install build -p tag=$(git tag --points-at HEAD)`;
