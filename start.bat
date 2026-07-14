@echo off
echo Starting Investment Dashboard...

:: Start API server in background
echo [1/2] Starting Yahoo Finance API server on port 3001...
start "API Server" cmd /k "cd /d %~dp0server && python main.py"

:: Give the server a moment to start
timeout /t 2 /nobreak >nul

:: Start React dev server
echo [2/2] Starting React frontend on port 5173...
start "React App" cmd /k "cd /d %~dp0 && npm run dev"

echo.
echo Dashboard: http://localhost:5173/
echo API:       http://localhost:3001/api/quotes?tickers=AAPL
