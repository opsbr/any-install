import { resolve } from "node:path";
import { readFile } from "node:fs/promises";
import YAML from "yaml";
import Ajv from "ajv";
import traverse from "traverse";
import type { Manifest } from "../schema";
import schema from "../schema.json";

const ajv = new Ajv();
const isValidData = ajv.compile<Manifest>(schema);

const parseYaml = async (file: string) => {
  const content = (await readFile(file)).toString();
  return YAML.parse(content) as unknown;
};

const parseJson = async (file: string) => {
  const content = (await readFile(file)).toString();
  return JSON.parse(content) as unknown;
};

const parseJs = async (file: string) => {
  const content = (await import(file)) as { default: unknown };
  return content.default;
};

const parseFile = async (file: string) => {
  try {
    return await parseYaml(file);
  } catch {
    /* empty */
  }
  try {
    return await parseJson(file);
  } catch {
    /* empty */
  }
  try {
    return await parseJs(file);
  } catch {
    /* empty */
  }
  throw new Error(`Failed to parse: ${file}`);
};

const namePattern = "[a-zA-Z0-9_-]+";

const parseParameters = (parameters: string[]) => {
  const template = new RegExp(`^${namePattern}$`);
  return Object.fromEntries(
    parameters.map((p) => {
      const [name, value] = p.split("=");
      if (!name.match(template))
        throw new Error(`Invalid parameter name: ${name}`);
      return [name, value];
    }),
  );
};

const replaceParameters = (
  manifest: unknown,
  parameters: Record<string, string>,
) => {
  const template = new RegExp(`{{\\s*(${namePattern})\\s*}}`, "g");
  traverse(manifest).forEach(function (x) {
    if (typeof x !== "string") return;
    this.update(
      x.replaceAll(template, (_, name: string) => {
        if (!(name in parameters))
          throw new Error(`Parameter isn't specified: ${name}`);
        console.log(`Replacing ${x} with ${name}=${parameters[name]}`);
        return parameters[name];
      }),
    );
  });
};

export const load = async (file: string, parameters: string[] = []) => {
  const manifest = await parseFile(resolve(file));
  replaceParameters(manifest, parseParameters(parameters));
  if (!isValidData(manifest))
    throw new Error(`Invalid data: ${JSON.stringify(manifest)}`);
  return manifest;
};
