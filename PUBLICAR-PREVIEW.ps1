$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'scripts\publicar-preview.ps1') -Source $PSScriptRoot
