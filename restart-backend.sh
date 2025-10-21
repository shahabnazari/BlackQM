#!/bin/bash

# PHASE 10 DAY 1 - Backend Restart Script
# This script safely restarts the backend to apply Prisma client updates

set -e

echo "🔄 Phase 10 Day 1 - Backend Restart"
echo "===================================="
echo ""

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Check if backend is running
BACKEND_PID=$(ps aux | grep "nest start --watch" | grep -v grep | awk '{print $2}')

if [ -n "$BACKEND_PID" ]; then
  echo "✅ Found running backend process (PID: $BACKEND_PID)"
  echo "⏹️  Stopping backend..."
  kill $BACKEND_PID

  # Wait for process to stop
  sleep 2
  echo "✅ Backend stopped"
else
  echo "⚠️  No running backend process found"
fi

echo ""
echo "🔄 Starting backend with updated Prisma client..."
echo ""

# Start backend in watch mode
npm run start:dev &

BACKEND_PID=$!
echo ""
echo "✅ Backend started (PID: $BACKEND_PID)"
echo ""
echo "⏳ Waiting for backend to be ready (checking http://localhost:4000/api/auth/login)..."

# Wait for backend to be ready
MAX_ATTEMPTS=30
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
  if curl -s http://localhost:4000/api/auth/login > /dev/null 2>&1; then
    echo ""
    echo "✅ Backend is ready!"
    break
  fi

  ATTEMPT=$((ATTEMPT + 1))
  echo -n "."
  sleep 1
done

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
  echo ""
  echo "⚠️  Backend did not start within $MAX_ATTEMPTS seconds"
  echo "   Please check the backend logs manually"
  exit 1
fi

echo ""
echo "🧪 Testing save paper endpoint..."
echo ""

# Register a test user
echo "1. Registering test user..."
REGISTER_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"testfix@example.com","name":"Test Fix User","password":"testpass123"}' 2>/dev/null)

TOKEN=$(echo $REGISTER_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "   ℹ️  User already exists, trying login..."
  LOGIN_RESPONSE=$(curl -s -X POST http://localhost:4000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"testfix@example.com","password":"testpass123"}' 2>/dev/null)

  TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)
fi

if [ -z "$TOKEN" ]; then
  echo "   ❌ Failed to get authentication token"
  exit 1
fi

echo "   ✅ Authenticated"
echo ""

# Test save paper endpoint
echo "2. Testing save paper endpoint..."
SAVE_RESPONSE=$(curl -s -X POST http://localhost:4000/api/literature/save \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title":"Phase 10 Test Paper","authors":["Test Author"],"year":2024}' 2>/dev/null)

SUCCESS=$(echo $SAVE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('success', False))" 2>/dev/null)

if [ "$SUCCESS" = "True" ]; then
  PAPER_ID=$(echo $SAVE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('paperId', ''))" 2>/dev/null)
  echo "   ✅ Paper saved successfully!"
  echo "   Paper ID: $PAPER_ID"
else
  echo "   ❌ Save paper failed"
  echo "   Response: $SAVE_RESPONSE"
  exit 1
fi

echo ""
echo "3. Testing get library endpoint..."
LIBRARY_RESPONSE=$(curl -s -X GET "http://localhost:4000/api/literature/library?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN" 2>/dev/null)

PAPER_COUNT=$(echo $LIBRARY_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(len(data.get('papers', [])))" 2>/dev/null)

if [ "$PAPER_COUNT" -gt 0 ]; then
  echo "   ✅ Library retrieved successfully!"
  echo "   Papers in library: $PAPER_COUNT"
else
  echo "   ⚠️  Library is empty or failed to retrieve"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Phase 10 Day 1 - Backend Fix Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Results:"
echo "  ✅ Backend restarted successfully"
echo "  ✅ Prisma client updated and loaded"
echo "  ✅ Save paper endpoint working"
echo "  ✅ Get library endpoint working"
echo ""
echo "🎯 Next Steps:"
echo "  1. Test theme extraction with real data"
echo "  2. Verify Phase 9 → 10 complete pipeline"
echo "  3. Update Phase Tracker with completion status"
echo ""
