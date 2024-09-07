#!/usr/bin/env bash

export ANY_INSTALL_ROOT="${PWD}/.any-install"
mkdir -p "${ANY_INSTALL_ROOT}"

path_file="${GITHUB_PATH:-"${ANY_INSTALL_ROOT}/path"}"

install_tool() {
  [ -d "${ANY_INSTALL_ROOT}/.${1}" ] || sh < "toolset/${1}/install.sh"
  case "${1}" in
    "gh" | "node")
      echo "${ANY_INSTALL_ROOT}/.${1}/bin" >> "${path_file}"
      ;;
    *)
      echo "${ANY_INSTALL_ROOT}/.${1}" >> "${path_file}"
      ;;
  esac
}

if [ "${#@}" -eq 0 ]; then
  tools=$(ls toolset)
else
  tools=$*
fi

for i in $tools; do
  install_tool "$i" &
done

wait
