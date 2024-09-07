import {
  Builder,
  type Statement,
  type Variable,
  type Cases,
  anyi_check_command,
} from "./builder";
import { format, formatLibrary } from "./format";
import { ghReleaseDownload } from "./github-release";
import { libraryPs1 } from "./library";

export class BuilderPs1 extends Builder {
  setVar(variable: Variable, value: string): Statement {
    const name = variable.replace(/^\${(.+)}$/, "$1");
    return `
$${name}="${value}"
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
if (Test-Path env:${env}) { $${name} = (Get-Item env:${env}).Value } else { $${name} = "${defaultValue}" }
${format(this.info(`${name}=\${${name}}`))}
`;
  }

  unsetVar(variable: Variable): Statement {
    const name = variable.replace(/^\${(.+)}$/, "$1");
    return `Remove-Variable -Name "${name}"`;
  }

  protected downloadGitHubRelease(assetUrl: string): Statement | undefined {
    const gh = ghReleaseDownload(assetUrl);
    if (!gh) return;
    return `
if (${anyi_check_command} "gh auth status") {
  ${gh}
} else {
  ${this.downloadDefault}
}
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
switch ("${target}") {
  ${keys
    .map((key) =>
      `
  ${key === defaultKey ? "default" : `"${key}"`} {
    ${format(cases[key], 4)}
    break
  }
    `.trim(),
    )
    .join("\n  ")}
}
    `.trim();
  }

  build(statement: Statement, library: string = libraryPs1): string {
    return `
#!/usr/bin/env pwsh
# ${this.builtWithAnyInstall}

Set-strictmode -version latest

# Wrapper function to avoid leaking of any definitions to the current shell.
function _any_install_main {

  function main {

    ${format(statement, 4)}

  }

  ${formatLibrary(library, 2)}

  try {
    ${format(this.setTempDir(), 4)}

    main
  } catch {
    $err = $_
  } finally {
    ${format(this.rmTempDir())}

    # Remove itself once it's done
    Remove-Item Function:_any_install_main
  }

  if (Get-Variable err -ErrorAction Ignore) {
    throw $err
  }

} # End of _any_install_main
_any_install_main
    `.trim();
  }
}
