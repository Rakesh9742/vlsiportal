@echo off
echo Starting VLSI Portal Development Environment...
echo Frontend will run on port 420
echo Backend will run on port 3000

echo.
echo Starting Backend on port 3000...
start "Backend" cmd /k "cd backend && set PORT=3000 && npm run dev"

echo.
echo Starting Frontend on port 420...
start "Frontend" cmd /k "cd frontend && set PORT=420 && npm run dev"

echo.
echo Development servers are starting...
echo Frontend: http://localhost:420
echo Backend: http://localhost:3000
echo.
pause
