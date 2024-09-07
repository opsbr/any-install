import { basename } from "node:path";
import { version } from "../../package.json";

export type Statement = string | undefined | Statement[];

export type Variable = `\${${string}}`;

export const temp_dir: Variable = "${temp_dir}";
export const extract_dir: Variable = "${extract_dir}";
export const source_dir: Variable = "${source_dir}";
export const install_dir: Variable = "${install_dir}";
export const os: Variable = "${os}";
export const arch: Variable = "${arch}";
export const url: Variable = "${url}";
export const asset: Variable = "${asset}";

export const anyi_info = "anyi_info";
export const anyi_warn = "anyi_warn";
export const anyi_panic = "anyi_panic";
export const anyi_get_os = "anyi_get_os";
export const anyi_get_arch = "anyi_get_arch";
export const anyi_mktemp_d = "anyi_mktemp_d";
export const anyi_mkdir_p = "anyi_mkdir_p";
export const anyi_verify_install_dir = "anyi_verify_install_dir";
export const anyi_rm_fr = "anyi_rm_fr";
export const anyi_check_command = "anyi_check_command";
export const anyi_download = "anyi_download";
export const anyi_extract_zip = "anyi_extract_zip";
export const anyi_extract_tar_gz = "anyi_extract_tar_gz";
export const anyi_extract_tar_xz = "anyi_extract_tar_xz";
export const anyi_install_executable = "anyi_install_executable";
export const anyi_install_directory = "anyi_install_directory";
export const anyi_find_stripped_path = "anyi_find_stripped_path";

export type Cases = Record<string, Statement>;

export abstract class Builder {
  info(message: string): Statement {
    return `${anyi_info} "${message}"`;
  }

  warn(message: string): Statement {
    return `${anyi_warn} "${message}"`;
  }

  panic(message: string): Statement {
    return `${anyi_panic} "${message}"`;
  }

  setInstallDir(env: string, defaultValue: string): Statement {
    return [
      this.setVarFromEnv(install_dir, env, defaultValue),
      `${anyi_verify_install_dir} "${install_dir}"`,
    ];
  }

  setOs(): Statement {
    return this.setVar(os, `$(${anyi_get_os})`);
  }

  setArch(): Statement {
    return this.setVar(arch, `$(${anyi_get_arch})`);
  }

  download(
    assetUrl: string,
    custom?: {
      download?: Statement;
      extract?: Statement;
    },
  ): Statement {
    const filename = basename(new URL(assetUrl).pathname);
    const downloadStatement =
      custom?.download ??
      this.downloadGitHubRelease(assetUrl) ??
      this.downloadDefault;
    const statement: Statement = [
      this.setVar(url, assetUrl),
      this.setVar(asset, `${temp_dir}/${filename}`),
      downloadStatement,
    ];
    const extractStatement = custom?.extract ?? this.extract(assetUrl);
    if (extractStatement)
      statement.push([
        this.setVar(extract_dir, `${temp_dir}/extract`),
        `${anyi_mkdir_p} "${extract_dir}"`,
        extractStatement,
        this.unsetVar(asset),
      ]);
    return statement;
  }

  installExecutable(target: string): Statement {
    if (basename(target.replaceAll("\\", "/")) !== target)
      throw new Error(`Target can't contain directory: ${target}`);
    return [
      `${anyi_mkdir_p} "${install_dir}"`,
      `${anyi_install_executable} "${asset}" "${install_dir}/${target}"`,
    ];
  }

  installDirectory(options?: { stripComponents?: number }): Statement {
    const setSourceDir = this.setVar(
      source_dir,
      options?.stripComponents
        ? `$(${anyi_find_stripped_path} "${extract_dir}" "${options.stripComponents}")`
        : extract_dir,
    );
    return [
      setSourceDir,
      `${anyi_install_directory} "${source_dir}" "${install_dir}"`,
    ];
  }

  abstract setVar(variable: Variable, value: string): Statement;
  abstract setVarFromEnv(
    variable: Variable,
    env: string,
    defaultValue: string,
  ): Statement;
  abstract unsetVar(variable: Variable): Statement;
  abstract switchCases(target: string, cases: Cases): Statement;
  abstract build(statement: Statement, library?: string): string;

  protected setTempDir(): Statement {
    return this.setVar(temp_dir, `$(${anyi_mktemp_d})`);
  }

  protected rmTempDir(): Statement {
    return `${anyi_rm_fr} "${temp_dir}"`;
  }

  protected readonly downloadDefault: string = `${anyi_download} "${url}" "${asset}"`;
  protected abstract downloadGitHubRelease(
    assetUrl: string,
  ): Statement | undefined;

  protected extract(assetUrl: string): Statement {
    const supported = [
      { ext: ".zip", statement: this.extractZip },
      { ext: ".tar.gz", statement: this.extractTarGz },
      { ext: ".tar.xz", statement: this.extractTarXz },
    ];
    return supported.find(({ ext }) => assetUrl.endsWith(ext))?.statement;
  }

  protected readonly extractZip: Statement = `${anyi_extract_zip} "${asset}" "${extract_dir}"`;
  protected readonly extractTarGz: Statement = `${anyi_extract_tar_gz} "${asset}" "${extract_dir}"`;
  protected readonly extractTarXz: Statement = `${anyi_extract_tar_xz} "${asset}" "${extract_dir}"`;

  protected readonly builtWithAnyInstall = `Built with Any Install v${version}`;
}
