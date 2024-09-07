import type { Statement } from "./builder";

// Need to append indent for the first line manually.
export const formatLines = (lines: string, indent: number = 0): string =>
  lines
    .trim()
    .split("\n")
    .join(`\n${" ".repeat(indent)}`);

export const formatLibrary = (library: string, indent: number = 0): string => {
  const stripped = library
    .split("\n")
    .filter((line) => !line.startsWith("#!"))
    .filter((line) => !line.startsWith("# shellcheck"))
    .join("\n");
  return formatLines(
    `
# The following code is derived from Any Install.
# Copyright 2024 OpsBR Software Technology Inc. and contributors
# SPDX-License-Identifier: Apache-2.0

${stripped}
    `,
    indent,
  );
};

export const format = (statement: Statement, indent: number = 0): string => {
  const flatten = (statements: Statement[]) =>
    statements
      .filter((s) => s !== undefined)
      .map((s): string => (typeof s === "string" ? s.trim() : flatten(s)))
      .join("\n\n");
  return formatLines(flatten([statement]), indent);
};
