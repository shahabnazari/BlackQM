#!/bin/bash

echo "Starting ScienceDirect Extraction Test..."
echo "Waiting for backend to be ready..."

# Wait for backend
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
  if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is ready!"
    break
  fi
  attempt=$((attempt + 1))
  echo "Waiting... ($attempt/$max_attempts)"
  sleep 2
done

if [ $attempt -eq $max_attempts ]; then
  echo "❌ Backend failed to start after 60 seconds"
  echo "Please start it manually: cd backend && npm run start:dev"
  exit 1
fi

echo ""
echo "Running test..."
node backend/test-sciencedirect-simple.js 2>&1 | tee backend/test-results.txt

echo ""
echo "✅ Test complete! Results saved to backend/test-results.txt"
