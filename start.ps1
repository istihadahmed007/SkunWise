# SkinWise AI - Full-Stack Local Launcher (PowerShell)
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " Starting SkinWise AI Platform (Full-Stack Engine)" -ForegroundColor White
Write-Host "==================================================" -ForegroundColor Cyan

$RootPath = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. Start Python FastAPI Backend
Write-Host "[1/2] Launching FastAPI Backend on http://127.0.0.1:8000..." -ForegroundColor Green
$BackendPath = Join-Path $RootPath "backend"
$PythonExe = Join-Path $BackendPath ".venv\Scripts\python.exe"

if (-not (Test-Path $PythonExe)) {
    Write-Host "Virtual environment not detected at $PythonExe. Using system python..." -ForegroundColor Yellow
    $PythonExe = "python"
}

Start-Process -FilePath $PythonExe -ArgumentList "-m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload" -WorkingDirectory $BackendPath

Start-Sleep -Seconds 2

# 2. Start Next.js Frontend
Write-Host "[2/2] Launching Next.js Frontend on http://localhost:3000..." -ForegroundColor Green
$FrontendPath = Join-Path $RootPath "frontend"

Start-Process -FilePath "cmd.exe" -ArgumentList "/c npm run dev" -WorkingDirectory $FrontendPath

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host " SkinWise AI is running:" -ForegroundColor White
Write-Host "   Frontend:  http://localhost:3000" -ForegroundColor Yellow
Write-Host "   Backend:   http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "   API Docs:  http://127.0.0.1:8000/docs" -ForegroundColor Yellow
Write-Host "==================================================" -ForegroundColor Cyan

