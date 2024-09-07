import { Command } from "@commander-js/extra-typings";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { load } from "./load";
import { build } from "./build";
import { testRun } from "./test-run";

export const buildCommand = (program: Command) => {
  const defaultManifestFile = () => {
    const candidates = [
      "any-install.yaml",
      "any-install.yml",
      "any-install.json",
      "any-install.js",
      "any-install.mjs",
    ];
    for (const candidate of candidates) {
      const path = join(process.cwd(), candidate);
      if (existsSync(path)) return path;
    }
  };
  const writeScript = (
    outDir: string,
    params: { file: string; script: string },
  ) => {
    const file = join(outDir, params.file);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, params.script);
    console.log(`Written ${join(outDir, params.file)}`);
  };
  return program
    .command("build")
    .description("build installer scripts from Any Install manifest")
    .option(
      "-m, --manifest-file <file>",
      "file path to the manifest",
      defaultManifestFile(),
    )
    .option("-p, --parameters <key=value...>", "parameters to substitute")
    .option("--test-sh", "test the sh installer script after build", false)
    .option("--test-ps1", "test the ps1 installer script after build", false)
    .action(async ({ manifestFile, parameters, testSh, testPs1 }) => {
      if (!manifestFile)
        return program.error(
          `Can't detect manifest file. Please specify yours by -m/--manifest-file.`,
        );
      const outDir = dirname(manifestFile);
      const manifest = await load(manifestFile, parameters);
      console.log(`Loaded ${manifestFile}`);
      const { sh, ps1 } = build(manifest);
      if (sh) writeScript(outDir, sh);
      if (ps1) writeScript(outDir, ps1);
      if (testSh) testRun(outDir, { sh });
      if (testPs1) testRun(outDir, { ps1 });
    });
};
