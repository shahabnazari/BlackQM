#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🛡️ Next.js Cache Prevention Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# PURPOSE: Prevent Next.js from using stale cached files
# USAGE: ./scripts/prevent-cache-issues.sh [start|watch|clean]
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
NEXT_DIR="$FRONTEND_DIR/.next"
CACHE_SENTINEL="$PROJECT_ROOT/.cache-timestamp"

# Log function
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Function: Check if cache is stale
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
check_cache_staleness() {
    log "Checking for stale cache..."
    
    if [ ! -d "$NEXT_DIR" ]; then
        log "No .next directory found - cache is clean ✅"
        return 0
    fi
    
    # Find newest source file modification time
    NEWEST_SOURCE=$(find "$FRONTEND_DIR" -type f \
        \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
        -not -path "*/node_modules/*" \
        -not -path "*/.next/*" \
        -printf '%T@ %p\n' | sort -n | tail -1)
    
    # Find oldest .next file
    OLDEST_CACHE=$(find "$NEXT_DIR" -type f -printf '%T@ %p\n' | sort -n | head -1)
    
    if [ -n "$NEWEST_SOURCE" ] && [ -n "$OLDEST_CACHE" ]; then
        SOURCE_TIME=$(echo "$NEWEST_SOURCE" | cut -d' ' -f1 | cut -d'.' -f1)
        CACHE_TIME=$(echo "$OLDEST_CACHE" | cut -d' ' -f1 | cut -d'.' -f1)
        
        if [ "$SOURCE_TIME" -gt "$CACHE_TIME" ]; then
            warn "STALE CACHE DETECTED!"
            warn "Source files modified: $(date -r $SOURCE_TIME)"
            warn ".next cache created: $(date -r $CACHE_TIME)"
            return 1
        fi
    fi
    
    log "Cache is up-to-date ✅"
    return 0
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Function: Clean Next.js cache completely
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
clean_cache() {
    log "🧹 Cleaning Next.js cache..."
    
    # Kill any running Next.js processes
    pkill -9 -f "next dev" 2>/dev/null || true
    log "Killed running Next.js processes"
    
    # Remove .next directory
    if [ -d "$NEXT_DIR" ]; then
        rm -rf "$NEXT_DIR"
        log "Deleted .next directory"
    fi
    
    # Remove node_modules/.cache if it exists
    if [ -d "$FRONTEND_DIR/node_modules/.cache" ]; then
        rm -rf "$FRONTEND_DIR/node_modules/.cache"
        log "Deleted node_modules/.cache"
    fi
    
    # Update cache sentinel
    date +%s > "$CACHE_SENTINEL"
    
    log "✅ Cache cleaned successfully"
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Function: Start Next.js with cache prevention
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
start_nextjs() {
    log "🚀 Starting Next.js with cache prevention..."
    
    # Clean cache first
    clean_cache
    
    # Create log directory
    mkdir -p "$PROJECT_ROOT/logs/frontend"
    
    # Start Next.js
    cd "$FRONTEND_DIR"
    log "Starting Next.js dev server..."
    
    # Set environment variables to prevent aggressive caching
    export NODE_ENV=development
    export NEXT_TELEMETRY_DISABLED=1
    
    npm run dev > "$PROJECT_ROOT/logs/frontend/nextjs-$(date +%Y%m%d-%H%M%S).log" 2>&1 &
    
    NEXT_PID=$!
    log "Next.js started with PID: $NEXT_PID"
    
    # Wait for Next.js to be ready
    log "Waiting for Next.js to compile..."
    sleep 5
    
    for i in {1..30}; do
        if curl -s http://localhost:3000 > /dev/null 2>&1; then
            log "✅ Next.js is ready and serving!"
            return 0
        fi
        echo -n "."
        sleep 1
    done
    
    error "Next.js failed to start within 30 seconds"
    return 1
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Function: Watch for file changes and auto-clean cache if needed
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
watch_files() {
    log "👁️  Starting file watcher..."
    log "Monitoring: $FRONTEND_DIR/lib/hooks/"
    log "Press Ctrl+C to stop"
    
    # Use fswatch if available, otherwise use a simple loop
    if command -v fswatch &> /dev/null; then
        fswatch -o "$FRONTEND_DIR/lib/hooks" "$FRONTEND_DIR/components" | while read; do
            warn "File change detected! Checking cache..."
            if ! check_cache_staleness; then
                warn "Restarting Next.js with clean cache..."
                start_nextjs
            fi
        done
    else
        log "⚠️  fswatch not installed. Using basic polling (install with: brew install fswatch)"
        
        while true; do
            sleep 10
            if ! check_cache_staleness; then
                warn "Stale cache detected! Restarting Next.js..."
                start_nextjs
            fi
        done
    fi
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Main Script
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🛡️  Next.js Cache Prevention System"
echo "  Prevents stale cache issues automatically"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

COMMAND=${1:-start}

case "$COMMAND" in
    start)
        start_nextjs
        ;;
    watch)
        watch_files
        ;;
    clean)
        clean_cache
        ;;
    check)
        check_cache_staleness
        ;;
    *)
        error "Unknown command: $COMMAND"
        echo ""
        echo "Usage: $0 [start|watch|clean|check]"
        echo ""
        echo "Commands:"
        echo "  start  - Clean cache and start Next.js"
        echo "  watch  - Monitor files and auto-restart on stale cache"
        echo "  clean  - Just clean the cache"
        echo "  check  - Check if cache is stale"
        echo ""
        exit 1
        ;;
esac

echo ""
log "✅ Done!"
echo ""

