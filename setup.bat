@echo off
REM Orchestra Setup Script for React Native Windows
REM This script automates the initial setup of the Orchestra project

setlocal enabledelayedexpansion

echo ======================================
echo Orchestra - React Native Windows Setup
echo ======================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    exit /b 1
)

echo [1/4] Node.js version:
node --version
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm is not installed or not in PATH
    exit /b 1
)

echo [2/4] npm version:
npm --version
echo.

REM Install dependencies
echo [3/4] Installing npm dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: npm install failed
    exit /b 1
)
echo Dependencies installed successfully!
echo.

REM Add React Native Windows support
echo [4/4] Adding React Native Windows support...
echo This will initialize the Windows platform with C++ and WinUI 3...
call npx react-native-windows-init --overwrite --language cpp --useWinUI3
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: react-native-windows-init failed
    exit /b 1
)
echo.

echo ======================================
echo Setup Complete!
echo ======================================
echo.
echo Next steps:
echo 1. Open windows\Orchestra.sln in Visual Studio 2022
echo 2. Build the solution (Ctrl+Shift+B)
echo 3. Or run: npm run windows
echo.
echo For more information, see README.md
echo ======================================

endlocal
