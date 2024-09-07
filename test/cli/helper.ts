import { afterEach, mock, spyOn } from "bun:test";
import { Command } from "@commander-js/extra-typings";

export const mockProgram = () => {
  const stdout = [] as string[];
  const stderr = [] as string[];
  spyOn(console, "log").mockImplementation((...message) =>
    stdout.push(`${message}`),
  );
  spyOn(console, "error").mockImplementation((...message) =>
    stderr.push(`${message}`),
  );
  afterEach(() => {
    mock.restore();
  });
  return {
    stdout,
    stderr,
    program: new Command().exitOverride().configureOutput({
      writeOut: (message) => stdout.push(message),
      writeErr: (message) => stderr.push(message),
    }),
  };
};
