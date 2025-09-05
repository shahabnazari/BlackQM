#!/bin/bash

# VQMethod PM2 Stop Script
# Stops both frontend and backend servers

echo "🛑 Stopping VQMethod servers..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Please install it with: npm install -g pm2"
    exit 1
fi

# Stop the applications
pm2 stop vqmethod-frontend vqmethod-backend

# Show status
echo ""
echo "✅ VQMethod servers stopped"
echo ""
pm2 status

echo ""
echo "📝 Quick Commands:"
echo "  • Start again: ./start.sh or npm start"
echo "  • Delete from PM2: pm2 delete all"
echo "  • View logs: pm2 logs"