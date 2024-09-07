#!/usr/bin/env sh
# Built with Any Install v0.0.0-semantically-released
# shellcheck shell=dash
# shellcheck disable=SC2039

set -eu

main() {

  install_dir="${BUN_INSTALL:-"${ANY_INSTALL_ROOT}/.bun"}"
  anyi_info "install_dir=${install_dir}"

  anyi_verify_install_dir "${install_dir}"

  os="$(anyi_get_os)"
  anyi_info "os=${os}"

  arch="$(anyi_get_arch)"
  anyi_info "arch=${arch}"

  anyi_info "Switching by ${os}-${arch}"
  case "${os}-${arch}" in
    "linux-x64")
      url="https://github.com/oven-sh/bun/releases/latest/download/bun-linux-x64.zip"
      anyi_info "url=${url}"

      asset="${temp_dir}/bun-linux-x64.zip"
      anyi_info "asset=${asset}"

      if anyi_check_command "gh auth status"; then
        gh release download --repo "https://github.com/oven-sh/bun" --pattern "bun-linux-x64.zip" --output "${asset}"
      else
        anyi_download "${url}" "${asset}"
      fi

      extract_dir="${temp_dir}/extract"
      anyi_info "extract_dir=${extract_dir}"

      anyi_mkdir_p "${extract_dir}"

      anyi_extract_zip "${asset}" "${extract_dir}"

      unset "asset"
      ;;
    "macos-arm64")
      url="https://github.com/oven-sh/bun/releases/latest/download/bun-darwin-aarch64.zip"
      anyi_info "url=${url}"

      asset="${temp_dir}/bun-darwin-aarch64.zip"
      anyi_info "asset=${asset}"

      if anyi_check_command "gh auth status"; then
        gh release download --repo "https://github.com/oven-sh/bun" --pattern "bun-darwin-aarch64.zip" --output "${asset}"
      else
        anyi_download "${url}" "${asset}"
      fi

      extract_dir="${temp_dir}/extract"
      anyi_info "extract_dir=${extract_dir}"

      anyi_mkdir_p "${extract_dir}"

      anyi_extract_zip "${asset}" "${extract_dir}"

      unset "asset"
      ;;
  esac

  source_dir="$(anyi_find_stripped_path "${extract_dir}" "1")"
  anyi_info "source_dir=${source_dir}"

  anyi_install_directory "${source_dir}" "${install_dir}"

  cd "${install_dir}" && ln -sf ./bun ./bunx

}

# The following code is derived from Any Install.
# Copyright 2024 OpsBR Software Technology Inc. and contributors
# SPDX-License-Identifier: Apache-2.0

anyi_mktemp_d() {
  mktemp -d
}

anyi_rm_fr() {
  rm -fr "${1}"
}

anyi_info() {
  echo >&2 "${1}"
}

anyi_warn() {
  if [ -t 1 ]; then
    printf "%b" "\033[33m${1}\033[m\n" >&2
  else
    echo >&2 "${1}"
  fi
}

anyi_panic() {
  if [ -t 1 ]; then
    printf "%b" "\033[31m${1}\033[m\n" >&2
  else
    echo >&2 "${1}"
  fi
  exit 1
}

anyi_mkdir_p() {
  mkdir -p "${1}"
}

anyi_verify_install_dir() {
  local target_dir="${1}"
  local parent_dir
  parent_dir="$(dirname "${target_dir}")"
  if ! [ -e "${parent_dir}" ]; then
    anyi_panic "Install directory can't be created as its parent doesn't exist. Please create the parent directory first: ${parent_dir}"
  elif [ -e "${target_dir}" ]; then
    anyi_panic "Install directory already exits. Please make sure it's removed first: ${target_dir}"
  fi
}

anyi_get_os() {
  case "$(uname -s)" in
    'Darwin')
      echo 'macos'
      ;;
    'MINGW'*)
      echo 'windows'
      ;;
    'CYGWIN'*)
      echo 'windows'
      ;;
    *)
      echo 'linux'
      ;;
  esac
}

anyi_get_arch() {
  case "$(uname -m)" in
    'arm64' | 'aarch64')
      echo 'arm64'
      ;;
    *)
      echo 'x64'
      ;;
  esac
}

anyi_check_command() {
  ${1} > /dev/null 2> /dev/null
  return $?
}

anyi_download() {
  local url="${1}"
  local outfile="${2}"
  anyi_info "Downloading ${url} to ${outfile}"
  curl --fail --location --progress-bar --output "${outfile}" "${url}" \
    || anyi_panic "Failed to download from ${url}"
}

anyi_extract_zip() {
  unzip -q -o "${1}" -d "${2}" 1>&2
}

anyi_extract_tar_gz() {
  tar -xzf "${1}" -C "${2}" 1>&2
}

anyi_extract_tar_xz() {
  tar -xJf "${1}" -C "${2}" 1>&2
}

anyi_install_executable() {
  local src="${1}"
  local dst="${2}"
  local parent
  parent="$(dirname "${dst}")"
  [ -e "${src}" ] || anyi_panic "Source doesn't exist: ${src}"
  [ -e "${dst}" ] && anyi_panic "Destination exists: ${dst}"
  [ -e "${parent}" ] || anyi_panic "Destination's parent doesn't exist: ${parent}"
  cp -p "${src}" "${dst}"
  chmod +x "${dst}"
}

anyi_install_directory() {
  local src="${1}"
  local dst="${2}"
  local parent
  parent="$(dirname "${dst}")"
  [ -e "${src}" ] || anyi_panic "Source doesn't exist: ${src}"
  [ -e "${dst}" ] && anyi_panic "Destination exists: ${dst}"
  [ -e "${parent}" ] || anyi_panic "Destination's parent doesn't exist: ${parent}"
  cp -pr "${src}" "${dst}"
}

anyi_find_stripped_path() {
  local root="${1}"
  local depth="${2}"
  local i=0
  local children=0
  local stripped="${root%/}"
  child() { find "${stripped}" -maxdepth 1 -mindepth 1; }
  while [ "${i}" -lt "${depth}" ]; do
    i=$((i + 1))
    children=$(child | wc -l)
    if [ "${children}" -gt 1 ]; then
      anyi_panic "Too many children: \n$(child)"
    elif [ "${children}" -eq 0 ]; then
      anyi_panic "No more children at ${stripped}"
    fi
    stripped="${stripped}/$(basename "$(child)")"
  done
  echo "${stripped}"
}

temp_dir="$(anyi_mktemp_d)"
anyi_info "temp_dir=${temp_dir}"
trap 'anyi_rm_fr "${temp_dir}"' EXIT

main
