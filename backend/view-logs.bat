@echo off
echo VLSI Portal Log Viewer
echo ====================
echo.

if "%1"=="" (
    echo Usage: view-logs.bat [command]
    echo.
    echo Commands:
    echo   list     - List all log files
    echo   errors   - Show error logs
    echo   recent   - Show recent logs
    echo   help     - Show detailed help
    echo.
    echo Examples:
    echo   view-logs.bat list
    echo   view-logs.bat errors
    echo   view-logs.bat recent
    goto :eof
)

if "%1"=="help" (
    node scripts/view-logs.js help
    goto :eof
)

if "%1"=="list" (
    node scripts/view-logs.js list
    goto :eof
)

if "%1"=="errors" (
    node scripts/view-logs.js errors
    goto :eof
)

if "%1"=="recent" (
    node scripts/view-logs.js recent
    goto :eof
)

echo Unknown command: %1
echo Use 'view-logs.bat help' for more information
