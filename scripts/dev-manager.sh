#!/bin/bash
# ============================================================================
# VQMethod Development Manager v2.0
# Enterprise-grade process manager preventing multiple backend instances
# ============================================================================

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
BACKEND_PORT=4000
FRONTEND_PORT=3000
BACKEND_DIR="backend"
FRONTEND_DIR="frontend"
LOG_DIR="logs/dev-manager"
BACKEND_LOG="$LOG_DIR/backend-$(date +%Y%m%d-%H%M%S).log"
FRONTEND_LOG="$LOG_DIR/frontend-$(date +%Y%m%d-%H%M%S).log"
PID_FILE="$LOG_DIR/dev-manager.pid"

# ============================================================================
# Helper Functions
# ============================================================================

log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# ============================================================================
# Process Management
# ============================================================================

check_port() {
    local port=$1
    lsof -Pi :$port -sTCP:LISTEN -t 2>/dev/null
}

kill_port() {
    local port=$1
    local pids=$(check_port $port)
    
    if [ -n "$pids" ]; then
        log_warning "Port $port is in use by PIDs: $pids"
        log_step "Killing processes on port $port..."
        echo "$pids" | xargs -I {} kill -9 {} 2>/dev/null || true
        sleep 2
        
        # Verify killed
        if [ -z "$(check_port $port)" ]; then
            log_success "Port $port is now free"
            return 0
        else
            log_error "Failed to free port $port"
            return 1
        fi
    else
        log_info "Port $port is free"
        return 0
    fi
}

kill_all_node_processes() {
    log_warning "Killing ALL Node.js processes (nuclear option)..."
    killall -9 node 2>/dev/null || true
    sleep 3
    log_success "All Node.js processes killed"
}

count_backend_processes() {
    ps aux | grep "nest start" | grep -v grep | wc -l | xargs
}

# ============================================================================
# Validation
# ============================================================================

validate_environment() {
    log_step "Validating environment..."
    
    # Check if in project root
    if [ ! -f "package.json" ]; then
        log_error "Not in VQMethod project root directory"
        exit 1
    fi
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    log_info "Node.js version: $(node --version)"
    log_info "npm version: $(npm --version)"
    
    # Check directories
    if [ ! -d "$BACKEND_DIR" ]; then
        log_error "Backend directory not found"
        exit 1
    fi
    
    if [ ! -d "$FRONTEND_DIR" ]; then
        log_error "Frontend directory not found"
        exit 1
    fi
    
    log_success "Environment validation passed"
}

# ============================================================================
# Cleanup
# ============================================================================

cleanup_existing_processes() {
    log_step "Checking for existing processes..."
    
    local backend_count=$(count_backend_processes)
    log_info "Found $backend_count backend processes"
    
    # Kill backend processes
    if ! kill_port $BACKEND_PORT; then
        log_warning "Port-based kill failed, trying nuclear option..."
        kill_all_node_processes
    fi
    
    # Kill frontend processes
    kill_port $FRONTEND_PORT
    
    # Verify no backend processes remain
    local remaining=$(count_backend_processes)
    if [ "$remaining" -gt 0 ]; then
        log_error "Still have $remaining backend processes. Using nuclear option..."
        kill_all_node_processes
        remaining=$(count_backend_processes)
    fi
    
    if [ "$remaining" -eq 0 ]; then
        log_success "All existing processes cleaned up"
    else
        log_error "Failed to clean up all processes. Exiting."
        exit 1
    fi
}

# ============================================================================
# Startup
# ============================================================================

start_backend() {
    log_step "Starting backend server..."
    
    # Create log directory
    mkdir -p "$LOG_DIR"
    
    # Build backend first
    cd "$BACKEND_DIR"
    log_info "Building backend..."
    npm run build 2>&1 | tee -a "../$BACKEND_LOG" | tail -5
    
    # Start backend
    log_info "Starting backend on port $BACKEND_PORT..."
    npm run start:dev > "../$BACKEND_LOG" 2>&1 &
    local backend_pid=$!
    
    echo "$backend_pid" > "../$PID_FILE"
    log_info "Backend PID: $backend_pid (saved to $PID_FILE)"
    
    cd ..
    
    # Wait for backend to start
    log_info "Waiting for backend to start..."
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
            log_success "Backend is healthy on http://localhost:$BACKEND_PORT/api"
            return 0
        fi
        
        attempt=$((attempt + 1))
        echo -n "."
        sleep 1
    done
    
    echo ""
    log_error "Backend failed to start after $max_attempts seconds"
    log_info "Check logs: tail -f $BACKEND_LOG"
    return 1
}

verify_single_backend() {
    local count=$(count_backend_processes)
    
    if [ "$count" -eq 1 ]; then
        log_success "✅ Exactly 1 backend process running (expected)"
        return 0
    elif [ "$count" -eq 0 ]; then
        log_error "❌ No backend processes running (unexpected)"
        return 1
    else
        log_error "❌ Multiple backend processes ($count) detected!"
        log_warning "This should never happen with the dev manager"
        return 1
    fi
}

# ============================================================================
# Status & Monitoring
# ============================================================================

show_status() {
    echo ""
    echo "======================================================================"
    log_step "Current Status"
    echo "======================================================================"
    
    # Backend status
    local backend_pids=$(check_port $BACKEND_PORT)
    local backend_count=$(count_backend_processes)
    
    if [ -n "$backend_pids" ]; then
        log_success "Backend: Running on port $BACKEND_PORT"
        log_info "  PID(s): $backend_pids"
        log_info "  Total backend processes: $backend_count"
        
        if [ "$backend_count" -gt 1 ]; then
            log_error "  ⚠️  WARNING: Multiple backend processes detected!"
        fi
    else
        log_warning "Backend: Not running"
    fi
    
    # Frontend status
    local frontend_pids=$(check_port $FRONTEND_PORT)
    
    if [ -n "$frontend_pids" ]; then
        log_success "Frontend: Running on port $FRONTEND_PORT"
        log_info "  PID(s): $frontend_pids"
    else
        log_warning "Frontend: Not running"
    fi
    
    # Health check
    if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null 2>&1; then
        log_success "Backend health check: ✅ Healthy"
    else
        log_error "Backend health check: ❌ Unhealthy or not responding"
    fi
    
    echo ""
    log_info "Logs:"
    echo "  Backend:  tail -f $BACKEND_LOG"
    echo "  Frontend: tail -f $FRONTEND_LOG"
    echo "======================================================================"
    echo ""
}

# ============================================================================
# Main Script
# ============================================================================

main() {
    local action="${1:-start}"
    
    case "$action" in
        start)
            echo ""
            echo "======================================================================"
            echo "  🚀 VQMethod Development Manager v2.0"
            echo "  Enterprise-grade process manager"
            echo "======================================================================"
            echo ""
            
            validate_environment
            cleanup_existing_processes
            
            if start_backend; then
                verify_single_backend
                show_status
                
                log_success "Development environment is ready!"
                log_info "Backend API: http://localhost:$BACKEND_PORT/api"
                log_info "API Docs:    http://localhost:$BACKEND_PORT/api/docs"
                log_info ""
                log_info "To start frontend separately: cd frontend && npm run dev"
                log_info "To check status: ./scripts/dev-manager.sh status"
                log_info "To stop all: ./scripts/dev-manager.sh stop"
            else
                log_error "Failed to start backend"
                exit 1
            fi
            ;;
            
        stop)
            log_step "Stopping all development servers..."
            cleanup_existing_processes
            log_success "All servers stopped"
            ;;
            
        status)
            show_status
            ;;
            
        restart)
            log_step "Restarting development environment..."
            cleanup_existing_processes
            main start
            ;;
            
        *)
            echo "Usage: $0 {start|stop|status|restart}"
            echo ""
            echo "Commands:"
            echo "  start   - Start backend (cleans up any existing processes first)"
            echo "  stop    - Stop all development servers"
            echo "  status  - Show current status"
            echo "  restart - Restart all servers"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"

