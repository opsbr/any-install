import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import schema from "./schema.json";
// @ts-expect-error TODO
import schemaDts from "./schema.d.ts" with { type: "text" };

const jsonSchema = JSON.stringify(schema, null, 2);

export const updateSchema = (schemaDir: string) => {
  mkdirSync(schemaDir, { recursive: true });
  writeFileSync(join(schemaDir, "schema.json"), jsonSchema);
  writeFileSync(join(schemaDir, "schema.d.ts"), schemaDts as string);
};
