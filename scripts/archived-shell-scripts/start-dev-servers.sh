#!/bin/bash

# Enterprise-Grade Development Server Startup Script
# Ensures clean port usage and proper server initialization

set -e

echo "========================================="
echo "  Enterprise Dev Server Manager"
echo "========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0 # Port is in use
    else
        return 1 # Port is free
    fi
}

# Function to kill process on port
kill_port() {
    local port=$1
    local pids=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pids" ]; then
        echo -e "${YELLOW}[CLEANUP] Killing processes on port $port: $pids${NC}"
        kill -9 $pids 2>/dev/null || true
        sleep 1
    fi
}

# Function to verify server health
check_health() {
    local url=$1
    local name=$2
    local max_attempts=10
    local attempt=1

    echo -e "${YELLOW}[HEALTH] Checking $name...${NC}"

    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}[HEALTH] ✅ $name is healthy${NC}"
            return 0
        fi
        echo -e "${YELLOW}[HEALTH] Attempt $attempt/$max_attempts - waiting for $name...${NC}"
        sleep 2
        attempt=$((attempt + 1))
    done

    echo -e "${RED}[HEALTH] ❌ $name failed to start${NC}"
    return 1
}

# Step 1: Clean up existing processes
echo -e "${YELLOW}[STEP 1] Cleaning up existing processes...${NC}"

# Kill all dev server processes
pkill -f "nest start" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true
pkill -f "playwright" 2>/dev/null || true

# Kill processes on specific ports
kill_port 3000
kill_port 4000

sleep 2

# Verify ports are free
if check_port 3000; then
    echo -e "${RED}[ERROR] Port 3000 still in use after cleanup${NC}"
    exit 1
fi

if check_port 4000; then
    echo -e "${RED}[ERROR] Port 4000 still in use after cleanup${NC}"
    exit 1
fi

echo -e "${GREEN}[STEP 1] ✅ All ports are clean${NC}"

# Step 2: Start Backend Server
echo -e "${YELLOW}[STEP 2] Starting backend server on port 4000...${NC}"
cd /Users/shahabnazariadli/Documents/blackQmethhod/backend

# Start backend in background
nohup npm run start:dev > /tmp/backend-dev.log 2>&1 &
BACKEND_PID=$!

echo -e "${GREEN}[STEP 2] Backend started with PID: $BACKEND_PID${NC}"

# Wait for backend to initialize
sleep 8

# Step 3: Start Frontend Server
echo -e "${YELLOW}[STEP 3] Starting frontend server on port 3000...${NC}"
cd /Users/shahabnazariadli/Documents/blackQmethhod/frontend

# Start frontend in background
nohup npm run dev > /tmp/frontend-dev.log 2>&1 &
FRONTEND_PID=$!

echo -e "${GREEN}[STEP 3] Frontend started with PID: $FRONTEND_PID${NC}"

# Wait for frontend to initialize
sleep 8

# Step 4: Health Checks
echo -e "${YELLOW}[STEP 4] Running health checks...${NC}"

if ! check_health "http://localhost:4000/api/health" "Backend"; then
    echo -e "${RED}[ERROR] Backend health check failed${NC}"
    echo -e "${YELLOW}[DEBUG] Backend logs:${NC}"
    tail -50 /tmp/backend-dev.log
    exit 1
fi

if ! check_health "http://localhost:3000" "Frontend"; then
    echo -e "${RED}[ERROR] Frontend health check failed${NC}"
    echo -e "${YELLOW}[DEBUG] Frontend logs:${NC}"
    tail -50 /tmp/frontend-dev.log
    exit 1
fi

# Step 5: Final Status
echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  ✅ All Servers Running Successfully${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${GREEN}Backend:${NC}  http://localhost:4000 (PID: $BACKEND_PID)"
echo -e "${GREEN}Frontend:${NC} http://localhost:3000 (PID: $FRONTEND_PID)"
echo ""
echo -e "${YELLOW}Logs:${NC}"
echo -e "  Backend:  tail -f /tmp/backend-dev.log"
echo -e "  Frontend: tail -f /tmp/frontend-dev.log"
echo ""
echo -e "${YELLOW}To stop servers:${NC}"
echo -e "  kill $BACKEND_PID $FRONTEND_PID"
echo ""
