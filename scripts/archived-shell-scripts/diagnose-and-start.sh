#!/bin/bash

LOG_FILE="startup-diagnostic.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "=========================================="
echo "DIAGNOSTIC AND STARTUP SCRIPT"
echo "Time: $(date)"
echo "=========================================="
echo ""

# Step 1: Check Node and npm
echo "Step 1: Checking Node.js and npm..."
node --version
npm --version
echo ""

# Step 2: Check if directories exist
echo "Step 2: Checking project structure..."
ls -la | grep -E "frontend|backend|package.json"
echo ""

# Step 3: Kill existing processes
echo "Step 3: Killing existing processes..."
pkill -9 -f "next dev" 2>/dev/null && echo "  Killed next dev" || echo "  No next dev running"
pkill -9 -f "nest start" 2>/dev/null && echo "  Killed nest start" || echo "  No nest start running"
lsof -ti:3000 | xargs kill -9 2>/dev/null && echo "  Freed port 3000" || echo "  Port 3000 already free"
lsof -ti:4000 | xargs kill -9 2>/dev/null && echo "  Freed port 4000" || echo "  Port 4000 already free"
sleep 3
echo ""

# Step 4: Check frontend package.json
echo "Step 4: Checking frontend configuration..."
if [ -f "frontend/package.json" ]; then
    echo "  ✓ frontend/package.json exists"
    grep -A 3 '"scripts"' frontend/package.json | head -5
else
    echo "  ✗ frontend/package.json NOT FOUND"
fi
echo ""

# Step 5: Check backend package.json
echo "Step 5: Checking backend configuration..."
if [ -f "backend/package.json" ]; then
    echo "  ✓ backend/package.json exists"
    grep -A 3 '"scripts"' backend/package.json | head -5
else
    echo "  ✗ backend/package.json NOT FOUND"
fi
echo ""

# Step 6: Check for node_modules
echo "Step 6: Checking dependencies..."
if [ -d "frontend/node_modules" ]; then
    echo "  ✓ frontend/node_modules exists"
else
    echo "  ✗ frontend/node_modules NOT FOUND - Running npm install..."
    cd frontend && npm install && cd ..
fi

if [ -d "backend/node_modules" ]; then
    echo "  ✓ backend/node_modules exists"
else
    echo "  ✗ backend/node_modules NOT FOUND - Running npm install..."
    cd backend && npm install && cd ..
fi
echo ""

# Step 7: Check for TypeScript errors
echo "Step 7: Checking for TypeScript errors in frontend..."
cd frontend
npx tsc --noEmit 2>&1 | head -20 || echo "TypeScript check completed"
cd ..
echo ""

# Step 8: Start backend
echo "Step 8: Starting backend..."
cd backend
nohup npm run start:dev > ../logs/backend-live.log 2>&1 &
BACKEND_PID=$!
echo "  Backend started with PID: $BACKEND_PID"
cd ..
echo "  Waiting 12 seconds for backend to initialize..."
sleep 12
echo ""

# Step 9: Check backend
echo "Step 9: Checking backend status..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api 2>&1)
echo "  Backend HTTP status: $BACKEND_STATUS"
if [ "$BACKEND_STATUS" = "200" ] || [ "$BACKEND_STATUS" = "404" ]; then
    echo "  ✓ Backend is responding"
else
    echo "  ✗ Backend is NOT responding"
    echo "  Last 20 lines of backend log:"
    tail -20 logs/backend-live.log
fi
echo ""

# Step 10: Start frontend
echo "Step 10: Starting frontend..."
cd frontend
nohup npm run dev > ../logs/frontend-live.log 2>&1 &
FRONTEND_PID=$!
echo "  Frontend started with PID: $FRONTEND_PID"
cd ..
echo "  Waiting 20 seconds for frontend to initialize..."
sleep 20
echo ""

# Step 11: Check frontend
echo "Step 11: Checking frontend status..."
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>&1)
echo "  Frontend HTTP status: $FRONTEND_STATUS"
if [ "$FRONTEND_STATUS" = "200" ] || [ "$FRONTEND_STATUS" = "404" ]; then
    echo "  ✓ Frontend is responding"
else
    echo "  ✗ Frontend is NOT responding"
    echo "  Last 30 lines of frontend log:"
    tail -30 logs/frontend-live.log
fi
echo ""

# Step 12: Final status
echo "=========================================="
echo "FINAL STATUS"
echo "=========================================="
echo ""
echo "Backend:"
echo "  URL: http://localhost:4000"
echo "  PID: $BACKEND_PID"
echo "  Status: $BACKEND_STATUS"
echo "  Log: logs/backend-live.log"
echo ""
echo "Frontend:"
echo "  URL: http://localhost:3000"
echo "  PID: $FRONTEND_PID"
echo "  Status: $FRONTEND_STATUS"
echo "  Log: logs/frontend-live.log"
echo ""
echo "Running processes:"
ps aux | grep -E "next dev|nest start" | grep -v grep
echo ""
echo "To view logs:"
echo "  tail -f logs/frontend-live.log"
echo "  tail -f logs/backend-live.log"
echo ""
echo "To stop:"
echo "  pkill -f 'next dev' && pkill -f 'nest start'"
echo ""
echo "Full diagnostic log saved to: $LOG_FILE"
echo "=========================================="
