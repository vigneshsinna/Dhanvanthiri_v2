@echo off
setlocal

echo.
echo ============================================
echo   Dhanvanthiri - Hostinger Production Build
echo   WaferKings-Style Deployment Package
echo ============================================
echo.

powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0deploy\hostinger\build-shared-package.ps1" -IncludeVendor %*
set EXIT_CODE=%ERRORLEVEL%

if not "%EXIT_CODE%"=="0" (
    echo.
    echo Hostinger package build failed with exit code %EXIT_CODE%.
    exit /b %EXIT_CODE%
)

echo.
echo Build complete. Zip the generated hostinger_deploy_* folder and upload it to Hostinger.
exit /b 0
