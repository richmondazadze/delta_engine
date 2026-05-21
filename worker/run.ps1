# Run a worker script with the correct venv Python (has MetaTrader5).
# Usage: .\run.ps1 scripts\01_connect_account.py -a master-1

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [string]$Script,
    [Parameter(ValueFromRemainingArguments = $true)]
    $Remaining
)

$WorkerRoot = $PSScriptRoot
$Python = Join-Path $WorkerRoot "venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
    Write-Host "Worker venv missing. From repo root run: .\setup.ps1" -ForegroundColor Red
    exit 1
}

Set-Location $WorkerRoot
& $Python $Script @Remaining
