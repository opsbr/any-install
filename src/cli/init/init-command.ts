import { Command, Option } from "@commander-js/extra-typings";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { updateSchema } from "../update-schema";
import { js, json, yaml } from "./init-file";

export const initCommand = (program: Command) => {
  const writeExampleFile = (path: string, content: string) => {
    if (existsSync(path)) return program.error(`File already exists: ${path}`);
    writeFileSync(path, content);
    console.log(`Initialized ${path}`);
  };
  return program
    .command("init")
    .description("initialize Any Install manifest file")
    .argument("[root-dir]", "directory to initialize", process.cwd())
    .addOption(
      new Option("-f, --format <format>", "format of the manifest file")
        .choices(["yaml", "json", "js"] as const)
        .default("yaml" as const),
    )
    .action((rootDir, { format }) => {
      const schemaDir = ".any-install";
      mkdirSync(rootDir, { recursive: true });
      switch (format) {
        case "yaml":
          writeExampleFile(
            join(rootDir, "any-install.yaml"),
            yaml(`./${schemaDir}`),
          );
          break;
        case "json":
          writeExampleFile(
            join(rootDir, "any-install.json"),
            json(`./${schemaDir}`),
          );
          break;
        case "js":
          writeExampleFile(
            join(rootDir, "any-install.js"),
            js(`./${schemaDir}`),
          );
          break;
      }
      updateSchema(join(rootDir, schemaDir));
    });
};
