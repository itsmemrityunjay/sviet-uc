@echo off
title Sviet Uncensored - Backend Server

echo Starting Sviet Uncensored Backend Server...
echo Time: %date% %time%
echo.

cd backend

if not exist .env (
    echo ERROR: .env file not found in backend directory!
    echo Please run setup.bat first and configure your environment variables.
    echo.
    pause
    exit /b 1
)

echo Checking dependencies...
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)

echo.
echo Starting server on http://localhost:5000
echo Press Ctrl+C to stop the server
echo.

call npm run dev
