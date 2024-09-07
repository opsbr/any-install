import { Builder, type Statement, type Variable, type Cases } from "./builder";
import { format, formatLibrary } from "./format";
import { ghReleaseDownload } from "./github-release";
import { librarySh } from "./library";

export class BuilderSh extends Builder {
  setVar(variable: Variable, value: string): Statement {
    const name = variable.replace(/^\${(.+)}$/, "$1");
    return `
${name}="${value}"
${format(this.info(`${name}=\${${name}}`))}
    `;
  }

  setVarFromEnv(
    variable: Variable,
    env: string,
    defaultValue: string,
  ): Statement {
    const name = variable.replace(/^\${(.+)}$/, "$1");
    return `
${name}="\${${env}:-"${defaultValue}"}"
${format(this.info(`${name}=\${${name}}`))}
    `;
  }

  unsetVar(variable: Variable): Statement {
    const name = variable.replace(/^\${(.+)}$/, "$1");
    return `unset "${name}"`;
  }

  protected downloadGitHubRelease(assetUrl: string): Statement | undefined {
    const gh = ghReleaseDownload(assetUrl);
    if (!gh) return;
    return `
if anyi_check_command "gh auth status"; then
  ${gh}
else
  ${this.downloadDefault}
fi
    `;
  }

  switchCases(target: string, cases: Cases): Statement {
    if (Object.keys(cases).length === 0) return;
    const defaultKey = "default";
    const keys = Object.keys(cases)
      .filter((k) => k !== defaultKey)
      .sort();
    if (defaultKey in cases) keys.push(defaultKey);
    return `
anyi_info "Switching by ${target}"
case "${target}" in
  ${keys
    .map((key) =>
      `
  ${key === defaultKey ? "*" : `"${key}"`})
    ${format(cases[key], 4)}
    ;;
    `.trim(),
    )
    .join("\n  ")}
esac
    `.trim();
  }

  build(statements: Statement, library: string = librarySh): string {
    return `
#!/usr/bin/env sh
# ${this.builtWithAnyInstall}
# shellcheck shell=dash
# shellcheck disable=SC2039

set -eu

main() {

  ${format(statements, 2) || "true"}

}

${formatLibrary(library, 0)}

${format(this.setTempDir(), 0)}
trap '${format(this.rmTempDir())}' EXIT

main
    `.trim();
  }
}
