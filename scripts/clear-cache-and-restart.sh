#!/bin/bash

###############################################################################
# Phase 10.6 Day 14.5: Cache Clearing and Server Restart Utility
#
# This script completely clears all caches and restarts development servers.
# Use this when browser continues to serve stale JavaScript despite restarts.
#
# Usage: ./scripts/clear-cache-and-restart.sh
###############################################################################

echo "🧹 CACHE CLEARING AND SERVER RESTART UTILITY"
echo "=============================================="
echo ""

# Step 1: Kill all node processes
echo "📛 Step 1: Killing all Node.js processes..."
killall -9 node 2>/dev/null || true
lsof -ti:4000 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:3002 | xargs kill -9 2>/dev/null || true
echo "   ✅ All Node.js processes killed"
sleep 2

# Step 2: Clear Next.js build cache
echo ""
echo "🗑️  Step 2: Clearing Next.js build cache..."
rm -rf frontend/.next
echo "   ✅ Removed frontend/.next"

# Step 3: Clear node_modules cache
echo ""
echo "🗑️  Step 3: Clearing node_modules cache..."
rm -rf frontend/node_modules/.cache
rm -rf backend/node_modules/.cache
rm -rf node_modules/.cache
echo "   ✅ Removed node_modules/.cache directories"

# Step 4: Clear npm/yarn cache
echo ""
echo "🗑️  Step 4: Clearing npm cache..."
npm cache clean --force 2>/dev/null || true
echo "   ✅ npm cache cleaned"

# Step 5: Clear macOS specific caches
echo ""
echo "🗑️  Step 5: Clearing macOS system caches..."
rm -rf ~/Library/Caches/Google/Chrome/Default/Cache/* 2>/dev/null || true
rm -rf ~/Library/Caches/Google/Chrome/Default/Code\ Cache/* 2>/dev/null || true
echo "   ✅ Chrome cache paths cleared (if accessible)"

# Step 6: Clear temporary files
echo ""
echo "🗑️  Step 6: Clearing temporary files..."
rm -rf .tmp.* 2>/dev/null || true
rm -rf frontend/.swc
echo "   ✅ Temporary files cleared"

# Step 7: Restart servers
echo ""
echo "🚀 Step 7: Restarting development servers..."
echo "   Starting backend on port 4000..."
echo "   Starting frontend on port 3000..."
echo ""

# Run the dev-lite script in background
nohup node scripts/dev-lite.js > logs/dev-servers.log 2>&1 &

echo "   ⏳ Waiting for servers to start (10 seconds)..."
sleep 10

# Check if servers are running
BACKEND_RUNNING=$(lsof -ti:4000 | wc -l | xargs)
FRONTEND_RUNNING=$(lsof -ti:3000 | wc -l | xargs)

if [ "$BACKEND_RUNNING" -gt 0 ] && [ "$FRONTEND_RUNNING" -gt 0 ]; then
  echo "   ✅ Backend running on http://localhost:4000"
  echo "   ✅ Frontend running on http://localhost:3000"
else
  echo "   ⚠️  Warning: Servers may not have started correctly"
  echo "   Check logs/dev-servers.log for details"
fi

# Step 8: Print browser instructions
echo ""
echo "🌐 Step 8: Browser Cache Clearing Instructions"
echo "=============================================="
echo ""
echo "To complete cache clearing, please do ONE of the following:"
echo ""
echo "Option 1 (BEST): Service Worker & Cache Management Tool"
echo "   Navigate to: http://localhost:3000/unregister-sw.html"
echo "   Click 'Clear Everything' button"
echo "   This unregisters service workers, clears caches, and localStorage"
echo ""
echo "Option 2: Open Incognito/Private Window"
echo "   • Chrome: Cmd+Shift+N"
echo "   • Firefox: Cmd+Shift+P"
echo "   • Safari: Cmd+Shift+N"
echo "   Then navigate to: http://localhost:3000"
echo ""
echo "Option 3: Empty Cache and Hard Reload (Chrome)"
echo "   1. Open DevTools (Cmd+Option+I)"
echo "   2. Right-click the refresh button"
echo "   3. Select 'Empty Cache and Hard Reload'"
echo ""
echo "Option 4: Safari Developer Menu"
echo "   1. Safari > Preferences > Advanced > Show Develop menu"
echo "   2. Develop > Empty Caches (Cmd+Option+E)"
echo "   3. Reload page (Cmd+R)"
echo ""
echo "✅ CACHE CLEARING COMPLETE!"
echo ""
echo "📊 Next Steps:"
echo "   1. Open browser using one of the options above"
echo "   2. Navigate to http://localhost:3000/discover/literature"
echo "   3. Search for 'cloth' or 'solar'"
echo "   4. Verify SearchProcessIndicator appears with metadata"
echo "   5. Check console for new logs: '📦 [Batch X] API Response'"
echo ""
