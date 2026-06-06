@echo off
setlocal
set MinimumVisualStudioVersion=18.0
node "%~dp0patch-vs-detection.js"
if errorlevel 1 exit /b 1
node "%~dp0ensure-windows-sdk.js"
if errorlevel 1 exit /b 1
call npx react-native run-windows %*
