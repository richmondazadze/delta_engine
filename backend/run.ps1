# Start FastAPI dev server
$BackendDir = $PSScriptRoot
Set-Location $BackendDir
& .\venv\Scripts\Activate.ps1
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
