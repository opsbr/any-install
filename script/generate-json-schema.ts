import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { format } from "prettier";
import { createGenerator } from "ts-json-schema-generator";

const jsonSchema = createGenerator({
  path: join(import.meta.dir, "..", "src", "cli", "schema.d.ts"),
  skipTypeCheck: true,
}).createSchema();

jsonSchema.$ref = "#/definitions/Manifest";

writeFileSync(
  join(import.meta.dir, "..", "src", "cli", "schema.json"),
  await format(JSON.stringify(jsonSchema), { filepath: "schema.json" }),
);
