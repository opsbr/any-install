
$Env:ANY_INSTALL_ROOT = Join-Path $Pwd ".any-install"
New-Item -Path "${Env:ANY_INSTALL_ROOT}" -ItemType Directory -Force | Out-Null

$PathFile = if (Test-Path Env:GITHUB_PATH) {
  (Get-Item Env:GITHUB_PATH).Value
}
else {
  Join-Path "${Env:ANY_INSTALL_ROOT}" "path"
}

Write-Output "$PathFile"

function install_tool ([string]$name) {
  $ToolPath = "$(Join-Path "${Env:ANY_INSTALL_ROOT}" ".${name}")"
  if (-not(Test-Path "${ToolPath}")) {
    $ScriptPath = "$(Join-Path "toolset" "${name}" "install.ps1")"
    if (Test-Path "${ScriptPath}") {
      Get-Content "${ScriptPath}" -Raw | Invoke-Expression
    }
  }
  switch ($name) {
    "gh" { Write-Output "$(Join-Path "${ToolPath}" "bin")" >> "${PathFile}" }
    Default { Write-Output "${ToolPath}" >> "${PathFile}" }
  }
}

if ($Args.Length -eq 0) {
  $Tools = (Get-ChildItem "toolset").Name
}
else {
  $Tools = $Args
}

foreach ($Tool in $Tools) {
  install_tool $Tool
}
