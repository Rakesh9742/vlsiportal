@echo off
echo VLSI Portal Error Log Viewer
echo ============================
echo.

if not exist "logs" (
    echo No logs directory found. Start the server to generate error logs.
    pause
    goto :eof
)

echo Available error log files:
echo.
dir /b logs\error-*.log 2>nul
if errorlevel 1 (
    echo No error log files found.
    echo The server is running without errors!
    pause
    goto :eof
)

echo.
echo Latest error log:
echo ================
for /f "delims=" %%i in ('dir /b /o-d logs\error-*.log 2^>nul ^| findstr /r "error-.*\.log"') do (
    echo.
    echo File: %%i
    echo ----------------------------------------
    type "logs\%%i"
    goto :found
)

:found
echo.
echo ========================================
echo End of error log
echo.
echo To view errors in real-time, run:
echo powershell Get-Content logs\error-%%date:~-4,4%%-%%date:~-10,2%%-%%date:~-7,2%%.log -Wait -Tail 10
echo.
pause
