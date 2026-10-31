# EverWed / Royal Knot OS - PowerShell Launcher
Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "      EverWed (ShaadiOS) - Royal Knot OS Launcher" -ForegroundColor Yellow
Write-Host "========================================================" -ForegroundColor Cyan

$root = $PSScriptRoot

Write-Host "`n[1/2] Starting Backend (FastAPI on http://localhost:8000)..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$root\backend`" && .venv\Scripts\uvicorn.exe app.main:app --reload --port 8000"

Start-Sleep -Seconds 3

Write-Host "[2/2] Starting Frontend (Vite on http://localhost:5173)..." -ForegroundColor Green
Start-Process cmd.exe -ArgumentList "/k", "cd /d `"$root\frontend`" && npm run dev"

Start-Sleep -Seconds 2

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "All services launched successfully!" -ForegroundColor Green
Write-Host "  Frontend App:      http://localhost:5173" -ForegroundColor White
Write-Host "  Backend API:       http://localhost:8000" -ForegroundColor White
Write-Host "  Swagger API Docs:  http://localhost:8000/docs" -ForegroundColor White
Write-Host "  Health Check:      http://localhost:8000/api/v1/health" -ForegroundColor White
Write-Host "========================================================`n" -ForegroundColor Cyan

Start-Process "http://localhost:5173"

