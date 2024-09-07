# Any Install

**Any Install** makes easier to maintain `curl ... | sh` and `irm ... | iex` installer scripts by its own manifest DSL. There are two main use cases:

- Tool authors can provide such installer scripts without writing tedious shell scripts by themselves.
- Tool consumers can write their own installer even if any official installer isn't provided.

In either case, only thing they need to do is crafting Any Install manifest like below. Since most of the tasks to install binaries are similar, Any Install provides several utilities for the manifest builders, such as `download`, `installDirectory`. The required shell script libraries to achieve the functionality of such utilities are inlined into the final output so that the generated installer script is almost self-contained (only relying on `curl`, `tar`, etc.)

## Any Install manifest

This is an example manifest for installing Node.js prebuilt binary:

```yaml
sh:
  file: install.sh
  install:
    - statement: setInstallDir
      with:
        env: NODE_INSTALL
        defaultValue: ${HOME}/.node
    - statement: setOs
    - statement: setArch
    - statement: switchCases
      with:
        target: "${os}-${arch}"
        cases:
          linux-x64:
            - statement: download
              with:
                url: https://nodejs.org/dist/v{{ version }}/node-v{{ version }}-linux-x64.tar.xz
          # Add more os-arch as you want
          default:
            - statement: panic
              with:
                message: Not supported yet
    - statement: installDirectory
      with:
        options:
          stripComponents: 1
```

> [!WARNING]
> TODO: We'll describe the manifest schema in our documentation soon.

This will be translated to a shell script like below by `any-install build -p version=22.7.0`:

```sh
main() {

  install_dir="${NODE_INSTALL:-"${HOME}/.node"}"
  anyi_info "install_dir=${install_dir}"

  anyi_verify_install_dir "${install_dir}"

  os="$(anyi_get_os)"
  anyi_info "os=${os}"

  arch="$(anyi_get_arch)"
  anyi_info "arch=${arch}"

  anyi_info "Switching by ${os}-${arch}"
  case "${os}-${arch}" in
    "linux-x64")
      url="https://nodejs.org/dist/v22.7.0/node-v22.7.0-linux-x64.tar.xz"
      anyi_info "url=${url}"

      asset="${temp_dir}/node-v22.7.0-linux-x64.tar.xz"
      anyi_info "asset=${asset}"

      anyi_download "${url}" "${asset}"

      extract_dir="${temp_dir}/extract"
      anyi_info "extract_dir=${extract_dir}"

      anyi_mkdir_p "${extract_dir}"

      anyi_extract_tar_xz "${asset}" "${extract_dir}"

      unset "asset"
      ;;
    *)
      anyi_panic "Not supported yet"
      ;;
  esac

  source_dir="$(anyi_find_stripped_path "${extract_dir}" "1")"
  anyi_info "source_dir=${source_dir}"

  anyi_install_directory "${source_dir}" "${install_dir}"

}

# `anyi_*` libraries are inlined here.
anyi_info() {
  ...
}
...

main
```

Then, this output is the installer script for Node.js v22.0.7. Once you upload this somewhere, people can install it by `curl ... | sh`.

## Install

> [!NOTE]
> Only installer builders need `any-install` CLI. Users who install the tool by the installer scripts don't have to install `any-install` CLI.

Of course, the installer scripts are provided by Any Install :)

For Linux and macOS:

```sh
curl https://github.com/opsbr/any-install/releases/latest/download/install.sh | sh

export PATH="${HOME}/.any-install:${PATH}"

any-install --version
```

For Windows (x64 only):

```pwsh
irm https://github.com/opsbr/any-install/releases/latest/download/install.ps1 | iex

$Env:Path = "${HOME}/.any-install;" + $Env:Path

any-install --version
```

> [!IMPORTANT]
> As you can see, managing PATH environment variable is out of the scope of Any Install.
> However, we're planning to release another software to make it easier and more powerful. Stay tuned!

### Customize the install directory

If you want to install your custom location, set `ANY_INSTALL` environment variable:

```sh
curl https://github.com/opsbr/any-install/releases/latest/download/install.sh | ANY_INSTALL="/path/to/dir" sh
```

```pwsh
$Env:ANY_INSTALL = "C:\path\to\dir"
irm https://github.com/opsbr/any-install/releases/latest/download/install.ps1 | iex
```

> [!NOTE]
> The parent directory must be created by yourself. (`/path/to` or `C:\path\to` in the example above)

## Usage

### `any-install init`

This command creates a initial manifest file on your current directory:

```
$ any-install init
Initialized /workspaces/any-install/any-install.yaml
```

It also creates `.any-install` directory to store JSON Schema and TypeScript type definition for aiding your IDE:

```
$ tree . -a
.
├── .any-install
│   ├── schema.d.ts
│   └── schema.json
└── any-install.yaml
```

> [!NOTE]
> You can add `.any-install` to `.gitignore`.
> We'll soon provide a way to update these schemas via CLI.

You can optionally specify the root directory and the format of the manifest file:

```
$ any-install init --help
Usage: any-install init [options] [root-dir]

initialize Any Install manifest file

Arguments:
  root-dir               directory to initialize (default: "/workspaces/any-install")

Options:
  -f, --format <format>  format of the manifest file (choices: "yaml", "json", "js", default: "yaml")
  -h, --help             display help for command
```

### `any-install build`

This command builds the installer scripts based on your manifest file. By default, it tries to find a manifest file on your current directory:

```
$ any-install build
Loaded /workspaces/any-install/any-install.yaml
Written /workspaces/any-install/install.sh
Written /workspaces/any-install/install.ps1
```

Optionally, you can specify the manifest file by `--manifest-file`:

```
$ any-install build -m /path/to/any-install.yaml
```

If your manifest contains parameters e.g. `{{ tag }}`, you need to provide all the parameters via `--parameters`:

```
$ any-install build -p tag=v1.18.0
Replacing https://github.com/opsbr/any-install/releases/download/{{ tag }}/any-install_linux-x64.tar.gz with tag=v1.18.0
Loaded /workspaces/any-install/any-install/any-install.yaml
Written /workspaces/any-install/any-install/install.sh
Written /workspaces/any-install/any-install/install.ps1
```

If you want to test the generated script on your local machine, `--test-sh` or `--test-ps1` will execute the script with installing to a temporary directory, then open a new shell on the directory so that you can explore the installation result. Here is the example of `gh` manifest in this repo:

```
$ any-install build -m toolset/gh/any-install.yaml --test-sh
Loaded toolset/gh/any-install.yaml
Written toolset/gh/install.sh
temp_dir=/tmp/tmp.iIteCw6GLx
install_dir=/tmp/cb8f6932326aadb35b8bec2c2f6379a2/sh
url=https://github.com/cli/cli/releases/download/v2.54.0/gh_2.54.0_linux_amd64.tar.gz
asset=/tmp/tmp.iIteCw6GLx/gh_2.54.0_linux_amd64.tar.gz
extract_dir=/tmp/tmp.iIteCw6GLx/extract
source_dir=/tmp/tmp.iIteCw6GLx/extract/gh_2.54.0_linux_amd64
$ ls
bin  LICENSE  share
$ exit
```
