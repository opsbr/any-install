//@ts-expect-error TODO
import yamlFile from "./any-install.yaml" with { type: "text" };
import jsonFile from "./any-install.json" with { type: "text" };
import jsFile from "./any-install.js" with { type: "text" };

export const yaml = (schemaDir: string) =>
  (yamlFile as string).replace("../schema.json", `${schemaDir}/schema.json`);

export const json = (schemaDir: string) =>
  (jsonFile as unknown as string).replace(
    "../schema.json",
    `${schemaDir}/schema.json`,
  );

export const js = (schemaDir: string) =>
  (jsFile as string).replace("../schema.d.ts", `${schemaDir}/schema.d.ts`);
