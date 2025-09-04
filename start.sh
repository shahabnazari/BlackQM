#!/bin/bash

# VQMethod Server Startup Script
# This script uses PM2 to manage both frontend and backend servers

echo "🚀 Starting VQMethod servers with PM2..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Installing PM2 globally..."
    npm install -g pm2
fi

# Kill any existing processes on our ports
echo "🧹 Cleaning up old processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Stop any existing PM2 processes
pm2 delete all 2>/dev/null || true

# Start servers with PM2
echo "🎯 Starting servers..."
pm2 start ecosystem.config.js

# Wait for servers to start
echo "⏳ Waiting for servers to initialize..."
sleep 10

# Check server status
echo "📊 Server Status:"
pm2 status

# Show how to access the application
echo ""
echo "✅ VQMethod is running!"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001/api"
echo "📚 API Docs: http://localhost:3001/api/docs"
echo ""
echo "📝 Useful PM2 Commands:"
echo "  pm2 status        - Check server status"
echo "  pm2 logs          - View server logs"
echo "  pm2 restart all   - Restart both servers"
echo "  pm2 stop all      - Stop both servers"
echo "  pm2 delete all    - Remove servers from PM2"
echo "  pm2 monit         - Live monitoring dashboard"
echo ""
echo "💡 To stop servers: ./stop.sh or pm2 stop all"