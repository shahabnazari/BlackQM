#!/bin/bash

# VQMethod Server Stop Script

echo "🛑 Stopping VQMethod servers..."

# Stop PM2 processes
pm2 stop all 2>/dev/null || true

# Delete PM2 processes
pm2 delete all 2>/dev/null || true

# Kill any remaining processes on our ports
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

echo "✅ All servers stopped successfully!"