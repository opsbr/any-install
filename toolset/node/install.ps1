#!/usr/bin/env pwsh
# Built with Any Install v0.0.0-semantically-released

Set-strictmode -version latest

# Wrapper function to avoid leaking of any definitions to the current shell.
function _any_install_main {

  function main {

    if (Test-Path env:NODE_INSTALL) { $install_dir = (Get-Item env:NODE_INSTALL).Value } else { $install_dir = "${Env:ANY_INSTALL_ROOT}/.node" }
    anyi_info "install_dir=${install_dir}"
    
    anyi_verify_install_dir "${install_dir}"
    
    $url="https://nodejs.org/dist/v20.16.0/node-v20.16.0-win-x64.zip"
    anyi_info "url=${url}"
    
    $asset="${temp_dir}/node-v20.16.0-win-x64.zip"
    anyi_info "asset=${asset}"
    
    anyi_download "${url}" "${asset}"
    
    $extract_dir="${temp_dir}/extract"
    anyi_info "extract_dir=${extract_dir}"
    
    anyi_mkdir_p "${extract_dir}"
    
    anyi_extract_zip "${asset}" "${extract_dir}"
    
    Remove-Variable -Name "asset"
    
    $source_dir="$(anyi_find_stripped_path "${extract_dir}" "1")"
    anyi_info "source_dir=${source_dir}"
    
    anyi_install_directory "${source_dir}" "${install_dir}"

  }

  # The following code is derived from Any Install.
  # Copyright 2024 OpsBR Software Technology Inc. and contributors
  # SPDX-License-Identifier: Apache-2.0
  
  
  function anyi_mktemp_d {
    # Source: https://stackoverflow.com/a/34559554/2052892
    $parent = [System.IO.Path]::GetTempPath()
    [string] $name = [System.Guid]::NewGuid()
    $dir = Join-Path "${parent}" "${name}"
    New-Item -ItemType Directory -Path "${dir}" | Out-Null
    "${dir}"
  }
  
  function anyi_rm_fr ([string]$dir) {
    if (Test-Path "${dir}") {
      Remove-Item "${dir}" -Recurse -Force
    }
  }
  
  function anyi_info ([string]$message) {
    Write-Information "${message}" -InformationAction Continue
  }
  function anyi_warn ([string]$message) {
    Write-Warning "${message}"
  }
  
  function anyi_panic ([string]$message) {
    throw "${message}"
  }
  
  function anyi_mkdir_p ([string]$path) {
    New-Item -Path "${path}" -ItemType Directory -Force | Out-Null
    if (-not $?) { anyi_panic "Can't create ${path}" }
  }
  
  function anyi_verify_install_dir ([string]$target_dir) {
    $parent_dir = Split-Path -Parent "${target_dir}"
    if (!(Test-Path "${parent_dir}")) {
      anyi_panic "Install directory can't be created as its parent doesn't exist. Please create the parent directory first: ${parent_dir}"
    }
    elseif (Test-Path "${target_dir}") {
      anyi_panic "Install directory already exits. Please make sure it's removed first: ${target_dir}"
    }
  }
  
  function anyi_get_os {
    # Source: https://stackoverflow.com/a/68105970/2052892
    switch ([System.Environment]::OSVersion.Platform) {
      'Win32NT' { "windows" }
      default {
        if ($IsMacOS) { "macos" }
        elseif ($IsLinux) { "linux" }
        else { "windows" } # Fallback to windows
      }
    }
  }
  
  function anyi_get_arch {
    # Source: https://github.com/PowerShell/PowerShell/issues/6845#issuecomment-387563625
    switch (${env:PROCESSOR_ARCHITECTURE}) {
      "AMD64" { "x64" }
      "ARM64" { "arm64" }
      default {
        if ($IsMacOS -or $IsLinux) {
          switch ($(uname -m)) {
            "arm64" { "arm64" }
            "aarch64" { "arm64" }
            default { "x64" }
          }
        }
        else { "x64" } # Fallback to x64
      }
    }
  }
  
  function anyi_check_command ([string]$command) {
    try {
      Invoke-Expression "${command}"
      return $LastExitCode -eq 0
    }
    catch {
      return $False
    }
  }
  
  function anyi_download ([string]$url, [string]$outfile) {
    # Source: https://github.com/oven-sh/bun/blob/3ac9c3cc1ce1f782d22aafcb8fab2d155092b9d1/src/cli/install.ps1#L157-L173
    $has_curl = Get-Command curl.exe -ErrorAction SilentlyContinue
    if ("${has_curl}") {
      anyi_info "Downloading ${url} to ${outfile} by curl.exe"
      curl.exe "-#SfLo" "${outfile}" "${url}"
    }
    if (! "${has_curl}" -or ${LASTEXITCODE} -ne 0) {
      anyi_info "Downloading ${url} to ${outfile} by Invoke-RestMethod"
      Invoke-RestMethod -Uri "${url}" -OutFile "${outfile}"
      if (!$?) {
        anyi_panic "Failed to download from ${url}"
      }
    }
  }
  
  function anyi_extract_zip ([string]$src, [string]$dst) {
    if (Get-Command tar.exe -ErrorAction SilentlyContinue) {
      # Windows
      tar.exe -xzf "${src}" -C "${dst}"
    }
    elseif (Get-Command unzip -ErrorAction SilentlyContinue) {
      # Linux or macOS
      unzip -q -d "${dst}" -o "${src}"
    }
    else {
      anyi_panic "Neither tar.exe nor unzip is available."
    }
  }
  
  function anyi_extract_tar_gz ([string]$src, [string]$dst) {
    if (Get-Command tar.exe -ErrorAction SilentlyContinue) {
      # Windows
      tar.exe -xzf "${src}" -C "${dst}"
    }
    elseif (Get-Command tar -ErrorAction SilentlyContinue) {
      # Linux or macOS
      tar -xzf "${src}" -C "${dst}"
    }
    else {
      anyi_panic "Neither tar.exe nor tar is available."
    }
  }
  
  function anyi_extract_tar_xz ([string]$src, [string]$dst) {
    if (Get-Command 7z.exe -ErrorAction SilentlyContinue) {
      # Windows + 7z
      $temp_tar = [System.IO.Path]::GetTempFileName()
      7z.exe x -txz "${src}" -so > "${temp_tar}" && 7z.exe x -ttar "${temp_tar}" -o"${dst}"
      Remove-Item "${temp_tar}"
    }
    elseif ((Get-Command tar.exe -ErrorAction SilentlyContinue) -and (Get-Command xz.exe -ErrorAction SilentlyContinue)) {
      # Windows with xz + tar
      tar.exe -xJf "${src}" -C "${dst}"
    }
    elseif (Get-Command tar -ErrorAction SilentlyContinue) {
      # Linux or macOS
      tar -xJf "${src}" -C "${dst}"
    }
    else {
      anyi_panic "Neither 7z.exe nor tar.exe + xz nor tar is available."
    }
  }
  
  function anyi_install_executable ([string]$src, [string]$dst) {
    if (!(Test-Path "${src}")) {
      anyi_panic "Source doesn't exist: ${src}"
    }
    if (Test-Path "${dst}") {
      anyi_panic "Destination exists: ${dst}"
    }
    $parent = Split-Path -Parent "${dst}"
    if (!(Test-Path "${parent}")) {
      anyi_panic "Destination's parent doesn't exist: ${parent}"
    }
    Copy-Item -Path "${src}" -Destination "${dst}"
    switch ($(anyi_get_os)) {
      "windows" {
        # TODO
        break
      }
      default {
        chmod +x "${dst}"
        break
      }
    }
  }
  
  function anyi_install_directory ([string]$src, [string]$dst) {
    if (!(Test-Path "${src}")) {
      anyi_panic "Source doesn't exist: ${src}"
    }
    if (Test-Path "${dst}") {
      anyi_panic "Destination exists: ${dst}"
    }
    $parent = Split-Path -Parent "${dst}"
    if (!(Test-Path "${parent}")) {
      anyi_panic "Destination's parent doesn't exist: ${parent}"
    }
    Copy-Item -Path "${src}" -Destination "${dst}" -Recurse
  }
  
  function anyi_find_stripped_path ([string]$root, [string]$depth) {
    $stripped = "${root}".TrimEnd("/").TrimEnd("\")
    for ($i = 0; $i -lt "${depth}"; $i++) {
      $child = Get-ChildItem -Path "${stripped}" -Depth 0
      $children = (Get-ChildItem -Path "${stripped}" -Name -Depth 0 | Measure-Object -Line).Lines
      if ($children -gt 1) {
        anyi_panic "Too many children: $child"
      }
      elseif ($children -eq 0) {
        anyi_panic "No more children at ${stripped}"
      }
      $stripped = Join-Path "${stripped}" "$(Write-Output $child | Select-Object -expand Name)"
    }
    Write-Output "${stripped}"
  }

  try {
    $temp_dir="$(anyi_mktemp_d)"
    anyi_info "temp_dir=${temp_dir}"

    main
  } catch {
    $err = $_
  } finally {
    anyi_rm_fr "${temp_dir}"

    # Remove itself once it's done
    Remove-Item Function:_any_install_main
  }

  if (Get-Variable err -ErrorAction Ignore) {
    throw $err
  }

} # End of _any_install_main
_any_install_main