#!/bin/bash

echo "Starting VLSI Portal Development Environment..."
echo "Frontend will run on port 420"
echo "Backend will run on port 520"

echo ""
echo "Starting Backend on port 520..."
cd backend && PORT=520 npm run dev &

echo ""
echo "Starting Frontend on port 420..."
cd ../frontend && PORT=420 npm run dev &

echo ""
echo "Development servers are starting..."
echo "Frontend: http://localhost:420"
echo "Backend: http://localhost:520"
echo ""
echo "Press Ctrl+C to stop all servers"
wait
