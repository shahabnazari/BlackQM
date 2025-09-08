#!/bin/bash

# DEPRECATED: PM2 restart script - conflicts with unified dev manager
# For development, use: npm run restart
# This script is for PM2 production deployments only

echo "⚠️  WARNING: This PM2 script conflicts with the dev manager"
echo "   For development restart, use: npm run restart"
echo ""
read -p "Continue with PM2 restart? (y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Use 'npm run restart' for development"
    exit 0
fi

echo "🔄 Restarting VQMethod servers with PM2..."

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Please install it with: npm install -g pm2"
    exit 1
fi

# Check if ecosystem file exists
if [ ! -f "ecosystem.production.js" ]; then
    echo "❌ ecosystem.production.js not found"
    echo "   For development, use: npm run restart"
    exit 1
fi

# Restart the applications with zero-downtime reload
echo "📦 Performing zero-downtime restart..."
pm2 reload ecosystem.production.js

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