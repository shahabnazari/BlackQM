#!/bin/bash

# VQMethod Development Server Startup Script
# Purpose: Clean startup of both frontend and backend servers
# Usage: ./start-servers.sh

set -e  # Exit on error

echo "======================================================================"
echo "  VQMethod Development Server Startup"
echo "======================================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to kill processes on specific ports
kill_port() {
    local port=$1
    echo -e "${YELLOW}Checking port $port...${NC}"

    local pid=$(lsof -ti:$port)
    if [ -n "$pid" ]; then
        echo -e "${YELLOW}Killing process $pid on port $port${NC}"
        kill -9 $pid 2>/dev/null || true
        sleep 1
    else
        echo -e "${GREEN}Port $port is free${NC}"
    fi
}

# Kill existing processes
echo "Step 1: Cleaning up existing processes..."
kill_port 3000  # Frontend
kill_port 4000  # Backend
echo ""

# Verify environment files exist
echo "Step 2: Verifying environment configuration..."
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}ERROR: backend/.env not found${NC}"
    echo "Please copy backend/.env.example to backend/.env and configure it"
    exit 1
fi

if [ ! -f "frontend/.env.local" ]; then
    echo -e "${RED}ERROR: frontend/.env.local not found${NC}"
    echo "Please copy frontend/.env.local.example to frontend/.env.local"
    exit 1
fi

echo -e "${GREEN}Environment files found${NC}"
echo ""

# Start backend
echo "Step 3: Starting backend server..."
cd backend
npm run start:dev > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "${GREEN}Backend starting (PID: $BACKEND_PID)${NC}"
echo ""

# Wait for backend to be ready
echo "Step 4: Waiting for backend to start..."
MAX_WAIT=30
WAIT_TIME=0
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if curl -s http://localhost:4000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}Backend is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
    WAIT_TIME=$((WAIT_TIME + 1))
done
echo ""

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    echo -e "${RED}ERROR: Backend failed to start within $MAX_WAIT seconds${NC}"
    echo "Check backend.log for errors"
    exit 1
fi

# Start frontend
echo "Step 5: Starting frontend server..."
cd frontend
npm run dev > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "${GREEN}Frontend starting (PID: $FRONTEND_PID)${NC}"
echo ""

# Wait for frontend to be ready
echo "Step 6: Waiting for frontend to start..."
MAX_WAIT=15
WAIT_TIME=0
while [ $WAIT_TIME -lt $MAX_WAIT ]; do
    if lsof -ti:3000 > /dev/null 2>&1; then
        echo -e "${GREEN}Frontend is ready!${NC}"
        break
    fi
    echo -n "."
    sleep 1
    WAIT_TIME=$((WAIT_TIME + 1))
done
echo ""

if [ $WAIT_TIME -ge $MAX_WAIT ]; then
    echo -e "${RED}ERROR: Frontend failed to start within $MAX_WAIT seconds${NC}"
    echo "Check frontend.log for errors"
    exit 1
fi

# Display final status
echo "======================================================================"
echo -e "${GREEN}  ✓ All servers started successfully!${NC}"
echo "======================================================================"
echo ""
echo "  Frontend: http://localhost:3000 (PID: $FRONTEND_PID)"
echo "  Backend:  http://localhost:4000/api (PID: $BACKEND_PID)"
echo "  Docs:     http://localhost:4000/api/docs"
echo ""
echo "  Logs:"
echo "    - Backend:  tail -f backend.log"
echo "    - Frontend: tail -f frontend.log"
echo ""
echo "  To stop servers:"
echo "    kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "======================================================================"
