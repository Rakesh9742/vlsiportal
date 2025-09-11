@echo off
echo Restarting VLSI Portal Backend for Production...
echo This will restart the backend with updated CORS configuration
echo.

echo Stopping any existing backend processes...
taskkill /f /im node.exe 2>nul

echo.
echo Starting Backend with Production Environment...
cd backend
set NODE_ENV=production
npm start

echo.
echo Backend restarted with production configuration
echo CORS has been updated to allow VNC access
pause
