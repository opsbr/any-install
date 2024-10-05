# shellcheck shell=bash

root="$(realpath "$(dirname "${BASH_SOURCE[0]}")/..")"

while IFS= read -r line; do
  export PATH="${line}:${PATH}"
done < "${root}/.any-install/path"

export GH_CONFIG_DIR="${root}/.any-install/.gh/config"
export GITHUB_TOKEN
GITHUB_TOKEN="$(gh auth token 2> /dev/null || true)"
