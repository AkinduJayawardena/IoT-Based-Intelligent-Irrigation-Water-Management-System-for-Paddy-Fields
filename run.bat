@echo off
echo ===================================================
echo   Starting Smart Irrigation Scheduler Web App...
echo ===================================================

:: Check if Python is installed and functional
python --version >nul 2>nul
if %ERRORLEVEL% equ 0 (
    echo [INFO] Python found. Launching local backend server...
    start /B python server.py
    timeout /t 2 /nobreak >nul
    echo [INFO] Opening browser at http://localhost:8000...
    start "" "http://localhost:8000"
) else (
    echo [WARNING] Python is not installed or functional. Running in Frontend-Only fallback mode...
    echo [INFO] Opening local HTML file directly...
    start "" "index.html"
)

exit
