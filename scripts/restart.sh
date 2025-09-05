#!/bin/bash

# VQMethod PM2 Restart Script
# Gracefully restarts both frontend and backend servers

echo "🔄 Restarting VQMethod servers..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Please install it with: npm install -g pm2"
    exit 1
fi

# Restart the applications with zero-downtime reload
echo "📦 Performing zero-downtime restart..."
pm2 reload ecosystem.config.js

# Show status
echo ""
echo "✅ VQMethod servers restarted successfully!"
echo ""
pm2 status

echo ""
echo "📝 Quick Commands:"
echo "  • View logs: pm2 logs"
echo "  • Monitor: pm2 monit"
echo "  • Stop: ./stop.sh or npm stop"
echo ""
echo "🌐 Access Points:"
echo "  • Frontend: http://localhost:3003"
echo "  • Backend API: http://localhost:3001"
echo "  • API Docs: http://localhost:3001/api/docs"