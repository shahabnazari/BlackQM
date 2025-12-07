#!/bin/bash

echo "=========================================="
echo "Starting Development Environment"
echo "=========================================="
echo ""

# Kill any existing processes
echo "1. Cleaning up existing processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "nest start" 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
sleep 2

# Start backend
echo "2. Starting Backend (NestJS) on port 4000..."
cd backend
npm run start:dev > ../logs/backend-simple.log 2>&1 &
BACKEND_PID=$!
echo "   Backend PID: $BACKEND_PID"
cd ..

# Wait for backend
echo "3. Waiting for backend to initialize (10 seconds)..."
sleep 10

# Start frontend
echo "4. Starting Frontend (Next.js) on port 3000..."
cd frontend
npm run dev > ../logs/frontend-simple.log 2>&1 &
FRONTEND_PID=$!
echo "   Frontend PID: $FRONTEND_PID"
cd ..

# Wait for frontend
echo "5. Waiting for frontend to initialize (15 seconds)..."
sleep 15

# Check if services are running
echo ""
echo "=========================================="
echo "Checking Services..."
echo "=========================================="

# Check backend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:4000/api | grep -q "200\|404"; then
    echo "✅ Backend is running on http://localhost:4000"
else
    echo "❌ Backend is NOT responding"
    echo "   Check logs/backend-simple.log for errors"
fi

# Check frontend
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|404"; then
    echo "✅ Frontend is running on http://localhost:3000"
else
    echo "❌ Frontend is NOT responding"
    echo "   Check logs/frontend-simple.log for errors"
fi

echo ""
echo "=========================================="
echo "Development Environment Started"
echo "=========================================="
echo ""
echo "Frontend: http://localhost:3000"
echo "Backend:  http://localhost:4000"
echo ""
echo "Logs:"
echo "  Frontend: logs/frontend-simple.log"
echo "  Backend:  logs/backend-simple.log"
echo ""
echo "To stop: pkill -f 'next dev' && pkill -f 'nest start'"
echo ""
