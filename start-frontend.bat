@echo off
title Sviet Uncensored - Frontend

echo Starting Sviet Uncensored Frontend...
echo Time: %date% %time%
echo.

if not exist .env (
    echo ERROR: .env file not found!
    echo Please run setup.bat first and configure your environment variables.
    echo.
    pause
    exit /b 1
)

echo Checking dependencies...
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)

echo.
echo Starting development server on http://localhost:5173
echo Press Ctrl+C to stop the server
echo.

call npm run dev
