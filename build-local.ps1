# PowerShell runner for EAS local builds
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
node "$scriptDir\scripts\build-local.js" @args
