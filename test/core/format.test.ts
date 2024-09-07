import { describe, expect, test } from "bun:test";

import { format, formatLibrary, formatLines } from "../../src/core/format";
import { libraryPs1, librarySh } from "../../src/core/library";

describe("formatLines", () => {
  test.each([
    ["a\nb", 0, "a\nb"],
    ["a\nb", 1, "a\n b"],
    ["   \na\n    ", 0, "a"],
  ])("%p, %p => %p", (lines, indent, expected) =>
    expect(formatLines(lines, indent)).toBe(expected),
  );
});

describe("format", () => {
  test.each([
    [[], 0, ""],
    [["a"], 0, "a"],
    [["a", "b"], 0, "a\n\nb"],
    [["a", ["b"]], 0, "a\n\nb"],
    [["a", ["b", "c"]], 0, "a\n\nb\n\nc"],
    [["a"], 1, "a"],
    [["a", "b"], 1, "a\n \n b"],
    [["a", ["b"]], 1, "a\n \n b"],
    [["a", ["b", "c"]], 1, "a\n \n b\n \n c"],
  ])("%p, %p => %p", (statements, indent, expected) =>
    expect(format(statements, indent)).toBe(expected),
  );
});

describe("formatLibrary", () => {
  const copyright =
    /# Copyright .+ OpsBR Software Technology Inc. and contributors/;
  const license = "# SPDX-License-Identifier: Apache-2.0";

  describe("librarySh", () => {
    const subject = formatLibrary(librarySh, 0);
    test("copyright", () => expect(subject).toMatch(copyright));
    test("license", () => expect(subject).toContain(license));
    test("no shebang", () => expect(subject).not.toContain("#!"));
  });

  describe("libraryPs1", () => {
    const subject = formatLibrary(libraryPs1, 0);
    test("copyright", () => expect(subject).toMatch(copyright));
    test("license", () => expect(subject).toContain(license));
    test("no shebang", () => expect(subject).not.toContain("#!"));
  });
});
