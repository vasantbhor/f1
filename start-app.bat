@echo off
title Krushi Hisob - Farm Expense App
cd /d "%~dp0"
echo Starting Krushi Hisob (Farm Expense App)...
if not exist "node_modules\" (
  echo node_modules not found. Installing dependencies...
  if exist "package-lock.json" (
    call npm ci
  ) else (
    call npm install
  )
  if errorlevel 1 (
    echo Failed to install dependencies. Please make sure Node.js is installed.
    pause
    exit /b 1
  )
)
echo Open on PC: http://localhost:5173
echo For Mobile: Open the Network URL shown below on the same Wi-Fi!
start "" http://localhost:5173
call npm run dev
pause
