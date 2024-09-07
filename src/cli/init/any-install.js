//@ts-check
/** @type {import("../schema.d.ts").Manifest} */
export default {
  sh: {
    file: "install.sh",
    install: [
      {
        statement: "setInstallDir",
        with: {
          env: "TEST_ENV",
          defaultValue: "${HOME}/.test",
        },
      },
    ],
  },
  ps1: {
    file: "install.ps1",
    install: [
      {
        statement: "setInstallDir",
        with: {
          env: "TEST_ENV",
          defaultValue: "${HOME}/.test",
        },
      },
    ],
  },
};