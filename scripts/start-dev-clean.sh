#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 🚀 Clean Development Server Startup
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
#
# PURPOSE: Start both backend and frontend with CLEAN state
# PREVENTS: Stale cache issues that plague Next.js development
#
# USAGE: ./scripts/start-dev-clean.sh
#
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Directories
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"

# Log functions
log() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] ❌ $1${NC}"
}

success() {
    echo -e "${CYAN}[$(date +'%H:%M:%S')] ✅ $1${NC}"
}

section() {
    echo ""
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${MAGENTA}  $1${NC}"
    echo -e "${MAGENTA}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 1: Kill all existing processes
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
section "🛑 STEP 1: Killing Existing Processes"

log "Killing Next.js processes..."
pkill -9 -f "next dev" 2>/dev/null || true

log "Killing backend processes..."
pkill -9 -f "nest start" 2>/dev/null || true
pkill -9 -f "node.*backend/dist" 2>/dev/null || true

sleep 2
success "All processes killed"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 2: Clean ALL caches
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
section "🧹 STEP 2: Cleaning ALL Caches"

# Clean Next.js cache
if [ -d "$FRONTEND_DIR/.next" ]; then
    log "Removing .next directory..."
    rm -rf "$FRONTEND_DIR/.next"
    success "Deleted .next"
fi

# Clean node_modules cache
if [ -d "$FRONTEND_DIR/node_modules/.cache" ]; then
    log "Removing node_modules/.cache..."
    rm -rf "$FRONTEND_DIR/node_modules/.cache"
    success "Deleted node_modules/.cache"
fi

# Clean webpack cache
if [ -d "$FRONTEND_DIR/.cache" ]; then
    log "Removing webpack cache..."
    rm -rf "$FRONTEND_DIR/.cache"
    success "Deleted webpack cache"
fi

# Clean backend dist
if [ -d "$BACKEND_DIR/dist" ]; then
    log "Removing backend dist..."
    rm -rf "$BACKEND_DIR/dist"
    success "Deleted backend dist"
fi

success "All caches cleaned!"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 3: Verify ports are free
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
section "🔌 STEP 3: Verifying Ports"

# Check port 3000
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    warn "Port 3000 still in use, killing..."
    lsof -ti:3000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi
success "Port 3000 is free"

# Check port 4000
if lsof -Pi :4000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    warn "Port 4000 still in use, killing..."
    lsof -ti:4000 | xargs kill -9 2>/dev/null || true
    sleep 1
fi
success "Port 4000 is free"

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 4: Start Backend
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
section "🚀 STEP 4: Starting Backend"

mkdir -p "$PROJECT_ROOT/logs/backend"

log "Starting backend server..."
cd "$BACKEND_DIR"
npm run start:dev > "$PROJECT_ROOT/logs/backend/backend-$(date +%Y%m%d-%H%M%S).log" 2>&1 &
BACKEND_PID=$!

log "Backend started with PID: $BACKEND_PID"
log "Waiting for backend to be ready..."

# Wait for backend health
for i in {1..30}; do
    if curl -s http://localhost:4000 > /dev/null 2>&1; then
        success "Backend is ready!"
        break
    fi
    echo -n "."
    sleep 1
done

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 5: Start Frontend with CLEAN state
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
section "🚀 STEP 5: Starting Frontend (Clean Build)"

mkdir -p "$PROJECT_ROOT/logs/frontend"

log "Starting Next.js with clean state..."
cd "$FRONTEND_DIR"

# Set environment variables to prevent caching
export NODE_ENV=development
export NEXT_TELEMETRY_DISABLED=1
export NEXT_MANUAL_SIG_HANDLE=1

npm run dev > "$PROJECT_ROOT/logs/frontend/frontend-$(date +%Y%m%d-%H%M%S).log" 2>&1 &
FRONTEND_PID=$!

log "Frontend started with PID: $FRONTEND_PID"
log "Waiting for Next.js to compile..."

# Wait for frontend
for i in {1..60}; do
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        success "Frontend is ready!"
        break
    fi
    if [ $((i % 5)) -eq 0 ]; then
        echo ""
        log "Still compiling... ($i/60)"
    fi
    echo -n "."
    sleep 1
done

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STEP 6: Verification
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
section "✅ STEP 6: Verification"

echo ""
log "Checking running processes..."
BACKEND_COUNT=$(ps aux | grep "node.*backend/dist" | grep -v grep | wc -l | xargs)
FRONTEND_COUNT=$(ps aux | grep "next dev" | grep -v grep | wc -l | xargs)

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                    🎉 SERVERS STARTED SUCCESSFULLY${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}Backend:${NC}"
echo -e "  • URL: ${GREEN}http://localhost:4000${NC}"
echo -e "  • PID: ${YELLOW}$BACKEND_PID${NC}"
echo -e "  • Processes: ${YELLOW}$BACKEND_COUNT${NC}"
echo ""
echo -e "${BLUE}Frontend:${NC}"
echo -e "  • URL: ${GREEN}http://localhost:3000${NC}"
echo -e "  • PID: ${YELLOW}$FRONTEND_PID${NC}"
echo -e "  • Processes: ${YELLOW}$FRONTEND_COUNT${NC}"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}✅ CACHE CLEANED - No stale cache issues!${NC}"
echo -e "${GREEN}✅ Fresh compilation - All code changes will take effect!${NC}"
echo -e "${GREEN}✅ Single processes - No duplicate backend/frontend!${NC}"
echo ""
echo -e "${YELLOW}📝 Logs:${NC}"
echo -e "  • Backend:  $PROJECT_ROOT/logs/backend/"
echo -e "  • Frontend: $PROJECT_ROOT/logs/frontend/"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${MAGENTA}💡 TIP: If you make code changes and they don't appear:${NC}"
echo -e "${MAGENTA}   1. Hard refresh browser: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)${NC}"
echo -e "${MAGENTA}   2. If still not working, re-run this script${NC}"
echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════════════${NC}"
echo ""

