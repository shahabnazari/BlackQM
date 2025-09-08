# Server Management Scripts

## Active Scripts (USE THESE)

### Primary Server Management
- **`dev-manager-unified.js`** - Main development server manager
  - Usage: `npm run dev` (standard mode)
  - Modes: simple, standard, enterprise
  - Manages both frontend (port 3000) and backend (port 4000)
  - Handles health checks, auto-restart, and port cleanup
  - **IMPROVED**: Atomic lock file prevents duplicates
  - **IMPROVED**: Blocks Next.js port fallback (3001-3003)
  - **IMPROVED**: Cleans orphaned processes

### Utility Scripts
- **`stop-all.js`** - Stops all running servers
  - Usage: `npm run stop`
  - Kills processes on ports 3000, 4000, 5000
  - Used by the unified dev manager

- **`restart.sh`** - Restarts all servers
  - Usage: `npm run restart`
  - Runs stop, waits 2 seconds, then starts dev

- **`check-duplicates.js`** - Diagnose duplicate process issues
  - Usage: `npm run check:duplicates`
  - Detects multiple Next.js instances
  - Identifies "spinning website" cause
  - Auto-fix: `npm run fix:duplicates`

### Testing & Monitoring
- **`test-cors-ports.js`** - Tests CORS and port configuration
- **`monitor.js`** - Monitors server health (if exists)
- **`test-duplicate-prevention.js`** - Validates duplicate prevention

## NPM Scripts (package.json)

```bash
# Start development servers (RECOMMENDED)
npm run dev              # Standard mode with health checks
npm run dev:simple       # Simple mode, minimal overhead  
npm run dev:enterprise   # Enterprise mode with full monitoring
npm run dev:debug        # Simple mode with verbose output

# Stop all servers
npm run stop

# Restart servers
npm run restart

# Clean restart (removes build artifacts)
npm run dev:clean

# Check for duplicate processes
npm run check:duplicates

# Auto-fix duplicate issues
npm run fix:duplicates

# Individual servers (for debugging only)
npm run dev:frontend-only
npm run dev:backend-only
```

## Archived Scripts

Old/redundant scripts have been moved to `scripts/archive-legacy/`:
- dev-manager.js (replaced by unified)
- enterprise-dev-manager.js (replaced by unified)
- port-manager.js (functionality in unified)
- port-manager-enhanced.js (functionality in unified)
- start-safe.js (replaced by unified)
- start-safe-enhanced.js (replaced by unified)
- start.sh (replaced by npm scripts)
- stop.sh (replaced by stop-all.js)

## Important Notes

1. **ALWAYS use `npm run dev`** for starting servers
2. **ALWAYS use `npm run stop`** before manually starting servers
3. The unified dev manager prevents duplicate processes
4. Default ports: Frontend=3000, Backend=4000
5. Health checks run every 30 seconds in standard/enterprise modes

## Troubleshooting

### Website "Spinning" or Slow
This is usually caused by multiple Next.js instances on different ports.

**Quick Fix:**
```bash
npm run fix:duplicates
npm run dev
```

**Manual Diagnosis:**
```bash
npm run check:duplicates
# Review the output
# If duplicates found, run fix:duplicates
```

### Port Already in Use
```bash
npm run stop          # Stop all servers
npm run fix:duplicates # Clean all ports
npm run dev           # Start fresh
```

### Lock File Issues
If you see "Another instance is already running":
1. Check if servers are actually running: `npm run check:duplicates`
2. If no servers running, the lock file is stale
3. Run: `npm run fix:duplicates` to clean it up