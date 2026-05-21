# Delta Engine - Full dev environment setup (Windows PowerShell)
# Run from repo root: .\setup.ps1

$ErrorActionPreference = "Stop"
$Root = $PSScriptRoot

function Ensure-Python312 {
    $check = py -3.12 -c "import sys; print(sys.version_info[:2])" 2>$null
    if ($check) {
        return "py -3.12"
    }
    Write-Host "  Python 3.12 not found. Installing via 'py install 3.12'..." -ForegroundColor Yellow
    py install 3.12
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to install Python 3.12. Run manually: py install 3.12"
    }
    return "py -3.12"
}

# Worker: default Python (3.14 OK for MetaTrader5)
$WorkerPython = "python"
if (Get-Command py -ErrorAction SilentlyContinue) {
    $WorkerPython = "py -3.12"
    $null = py -3.12 -c "pass" 2>$null
    if ($LASTEXITCODE -ne 0) { $WorkerPython = "python" }
}

# Backend: MUST use 3.12 (pydantic-core has no wheels for 3.14 yet)
$BackendPython = Ensure-Python312

Write-Host "=== Delta Engine Dev Setup ===" -ForegroundColor Cyan
Write-Host ("Worker Python:  " + $WorkerPython) -ForegroundColor Gray
Write-Host ("Backend Python: " + $BackendPython) -ForegroundColor Gray

Write-Host "`n[1/4] Worker Python environment..." -ForegroundColor Yellow
$WorkerDir = Join-Path $Root "worker"
Set-Location $WorkerDir

if (-not (Test-Path "venv")) {
    Invoke-Expression "$WorkerPython -m venv venv"
}
& .\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip -q
pip install -r requirements.txt -q
Write-Host "  Worker dependencies installed." -ForegroundColor Green

Write-Host "`n[2/4] Worker config files..." -ForegroundColor Yellow
$ConfigDir = Join-Path $WorkerDir "config"
$pairs = @(
    @("accounts.example.yaml", "accounts.yaml"),
    @("copiers.example.yaml", "copiers.yaml"),
    @("symbol_map.example.yaml", "symbol_map.yaml")
)
foreach ($pair in $pairs) {
    $dest = Join-Path $ConfigDir $pair[1]
    $src = Join-Path $ConfigDir $pair[0]
    if (-not (Test-Path $dest)) {
        Copy-Item $src $dest
        Write-Host ("  Created config/" + $pair[1]) -ForegroundColor Green
    } else {
        Write-Host ("  config/" + $pair[1] + " already exists.") -ForegroundColor Gray
    }
}

New-Item -ItemType Directory -Force -Path (Join-Path $WorkerDir "logs") | Out-Null

Write-Host "`n[3/4] Root .env file..." -ForegroundColor Yellow
Set-Location $Root
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    $encKey = Invoke-Expression "$BackendPython -c `"import secrets; print(secrets.token_hex(32))`""
    $workerKey = Invoke-Expression "$BackendPython -c `"import secrets; print(secrets.token_urlsafe(32))`""
    $envContent = Get-Content ".env" -Raw
    $envContent = $envContent.Replace("your-256-bit-hex-key-here", $encKey)
    $envContent = $envContent.Replace("generate-a-long-random-secret-here", $workerKey)
    Set-Content ".env" $envContent -NoNewline
    Write-Host "  Created .env with ENCRYPTION_KEY and WORKER_API_KEY." -ForegroundColor Green
} else {
    Write-Host "  .env already exists." -ForegroundColor Gray
}

Write-Host "`n[4/4] Backend Python environment (3.12 required)..." -ForegroundColor Yellow
$BackendDir = Join-Path $Root "backend"
Set-Location $BackendDir

# Recreate venv if it was built with wrong Python (e.g. 3.14)
$recreate = $false
if (Test-Path "venv\pyvenv.cfg") {
    $cfg = Get-Content "venv\pyvenv.cfg" -Raw
    if ($cfg -notmatch "3\.12") {
        Write-Host "  Removing old backend venv (not Python 3.12)..." -ForegroundColor Yellow
        Remove-Item -Recurse -Force venv
        $recreate = $true
    }
}
if (-not (Test-Path "venv")) {
    Invoke-Expression "$BackendPython -m venv venv"
}

& .\venv\Scripts\Activate.ps1
python -m pip install --upgrade pip -q
pip install -r requirements.txt -q
if ($LASTEXITCODE -ne 0) {
    Write-Host "  Backend install failed." -ForegroundColor Red
    exit 1
}
$ver = .\venv\Scripts\python.exe -c "import fastapi, pydantic; print(fastapi.__version__, pydantic.__version__)"
Write-Host ("  Backend OK: fastapi/pydantic " + $ver) -ForegroundColor Green

Set-Location $Root
Write-Host "`n=== Setup complete ===" -ForegroundColor Cyan
Write-Host "Edit worker\config\accounts.yaml then run pathway scripts from worker\ folder."
