@echo off
echo VLSI Portal Environment Switcher
echo ================================

if "%1"=="localhost" (
    echo Switching to localhost configuration...
    copy frontend\.env.localhost frontend\.env >nul
    echo ✓ Switched to localhost mode
    echo.
    echo To start the application with localhost:
    echo   npm run dev
) else if "%1"=="production" (
    echo Switching to production configuration...
    copy frontend\.env.production frontend\.env >nul
    echo ✓ Switched to production mode
    echo.
    echo To start the application with production:
    echo   npm run dev
) else (
    echo Usage: switch-env.bat [localhost^|production]
    echo.
    echo Examples:
    echo   switch-env.bat localhost   - Switch to localhost mode
    echo   switch-env.bat production  - Switch to production mode
    echo.
    echo Current configuration:
    if exist frontend\.env (
        echo   Active: frontend\.env
    ) else (
        echo   No active configuration found
    )
)
