import { expect } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import type { Statement } from "../../src/core/builder";
import { format } from "../../src/core/format";

export const expectToMatchSnapshot = (value: Statement) =>
  // Need to replace `${` due to https://github.com/oven-sh/bun/issues/4722
  expect(format(value).replaceAll(/\${/g, "$<")).toMatchSnapshot();

export const touch = (path: string) => writeFileSync(path, "");

export const rm_fr = (path: string) => {
  if (path) rmSync(path, { recursive: true, force: true });
};

export const sha256 = (file: string) =>
  createHash("sha256").update(readFileSync(file)).digest("hex");

export const find = (dir: string) =>
  readdirSync(dir, { recursive: true }).sort();
