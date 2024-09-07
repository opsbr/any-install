import type { Manifest, Step } from "../schema";
import { ps1, sh, type Builder } from "../../core";
import type { Cases, Statement, Variable } from "../../core/builder";

export const build = (manifest: Manifest) => ({
  ...(manifest.sh && {
    sh: {
      file: manifest.sh.file,
      script: sh.build(manifest.sh.install.map(translate(sh))),
      env: findInstallEnv(manifest.sh.install),
    },
  }),
  ...(manifest.ps1 && {
    ps1: {
      file: manifest.ps1.file,
      script: ps1.build(manifest.ps1.install.map(translate(ps1))),
      env: findInstallEnv(manifest.ps1.install),
    },
  }),
});

const findInstallEnv = (steps: Step[]) => {
  const env = steps.find(
    (s) => typeof s !== "string" && s.statement === "setInstallDir",
  )?.with.env;
  if (!env) throw new Error(`Can't find setInstallDir.`);
  return env;
};

const translate =
  (b: Builder) =>
  (step: Step): Statement => {
    if (typeof step === "string") {
      return step;
    }
    switch (step.statement) {
      case "info":
        return b.info(step.with.message);
      case "warn":
        return b.warn(step.with.message);
      case "panic":
        return b.panic(step.with.message);
      case "setInstallDir": {
        const { env, defaultValue } = step.with;
        return b.setInstallDir(env, defaultValue);
      }
      case "setOs":
        return b.setOs();
      case "setArch":
        return b.setArch();
      case "download": {
        const { url, custom } = step.with;
        return b.download(url, custom);
      }
      case "installExecutable":
        return b.installExecutable(step.with.target);
      case "installDirectory": {
        return b.installDirectory(step.with?.options);
      }
      case "setVar": {
        const { variable, value } = step.with;
        return b.setVar(variable as Variable, value);
      }
      case "unsetVar": {
        const { variable } = step.with;
        return b.unsetVar(variable as Variable);
      }
      case "switchCases": {
        const { target, cases } = step.with;
        return b.switchCases(
          target,
          Object.entries(cases).reduce((acc, [key, value]) => {
            acc[key] = value.map(translate(b));
            return acc;
          }, {} as Cases),
        );
      }
      default:
        throw new Error(`Not implemented yet: ${JSON.stringify(step)}`);
    }
  };
