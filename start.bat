@echo off
title EverWed - Launcher
echo ========================================================
echo                    EverWed Launcher
echo ========================================================
echo.

set ROOT=%~dp0

echo [1/2] Starting Backend (FastAPI on http://localhost:8000)...
start "EverWed - Backend" cmd /k "cd /d %ROOT%backend && .venv\Scripts\uvicorn.exe app.main:app --reload --port 8000"

ping 127.0.0.1 -n 4 >nul

echo [2/2] Starting Frontend (Vite on http://localhost:5173)...
start "EverWed - Frontend" cmd /k "cd /d %ROOT%frontend && npm run dev"

ping 127.0.0.1 -n 3 >nul

echo.
echo ========================================================
echo All services launched!
echo.
echo   Frontend App:      http://localhost:5173
echo   Backend API:       http://localhost:8000
echo   Swagger API Docs:  http://localhost:8000/docs
echo   Health Check:      http://localhost:8000/api/v1/health
echo.
echo Opening EverWed in your default browser...
echo ========================================================
start http://localhost:5173
