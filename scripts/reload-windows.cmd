@echo off
setlocal
:: Reload Windows app without rebuilding the binary
call npx react-native run-windows --singleproc --no-packager --no-build --no-telemetry %*
