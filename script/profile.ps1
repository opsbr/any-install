$root = Split-Path -Parent -Path $PSScriptRoot

Get-Content "$(Join-Path "${root}" ".any-install" "path")" | ForEach-Object {
  $Env:Path = "$_;" + "$Env:Path"
}
