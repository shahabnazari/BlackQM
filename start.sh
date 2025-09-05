#!/bin/bash

# VQMethod PM2 Start Script
# Starts both frontend and backend servers with automatic port management

echo "🚀 Starting VQMethod servers..."

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to kill process using port
kill_port() {
    local port=$1
    echo "⚠️  Port $port is in use. Attempting to free it..."
    lsof -ti:$port | xargs kill -9 2>/dev/null
    sleep 2
}

# Check and free ports if needed
if check_port 3003; then
    echo "⚠️  Frontend port 3003 is already in use"
    read -p "Do you want to kill the existing process? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port 3003
        echo "✅ Port 3003 freed"
    else
        echo "❌ Cannot start frontend - port 3003 is in use"
        exit 1
    fi
fi

if check_port 3001; then
    echo "⚠️  Backend port 3001 is already in use"
    read -p "Do you want to kill the existing process? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kill_port 3001
        echo "✅ Port 3001 freed"
    else
        echo "❌ Cannot start backend - port 3001 is in use"
        exit 1
    fi
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Please install it with: npm install -g pm2"
    exit 1
fi

# Delete any existing PM2 processes for our apps
pm2 delete vqmethod-frontend 2>/dev/null
pm2 delete vqmethod-backend 2>/dev/null

# Start the applications with PM2
echo "📦 Starting applications with PM2..."
pm2 start ecosystem.config.js

# Show status
echo ""
echo "✅ VQMethod servers started successfully!"
echo ""
pm2 status

echo ""
echo "📝 Quick Commands:"
echo "  • View logs: pm2 logs"
echo "  • Monitor: pm2 monit"
echo "  • Stop: ./stop.sh or npm stop"
echo "  • Restart: ./restart.sh or npm restart"
echo ""
echo "🌐 Access Points:"
echo "  • Frontend: http://localhost:3003"
echo "  • Backend API: http://localhost:3001"
echo "  • API Docs: http://localhost:3001/api/docs"