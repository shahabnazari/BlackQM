# Server Management Scripts

## Active Scripts (USE THESE)

### Primary Server Management
- **`dev-ultimate-v3.js`** - Latest development server manager with enhanced monitoring
  - Usage: `npm run dev` (default - uses V3)
  - Features:
    - Active HTTP health checks every 5 seconds
    - Automatic stall detection (30-second timeout)
    - Self-healing recovery mechanism
    - Detailed logging to `logs/dev-manager.log`
    - Force cleanup of orphaned processes
  - Manages both frontend (port 3000) and backend (port 4000)
  - **BEST FOR**: Production-like stability with automatic recovery

- **`dev-ultimate-v2.js`** - Previous version with basic monitoring
  - Usage: `npm run dev:v2`
  - Basic process monitoring
  - Legacy version (use V3 instead)

- **`dev-ultimate.js`** - Original ultimate manager
  - Usage: `npm run dev:ultimate`
  - Basic functionality
  - Legacy version (use V3 instead)

### Utility Scripts
- **`stop-ultimate.js`** - Stops all running servers
  - Usage: `npm run stop`
  - Kills all Node.js processes
  - Cleans ports 3000-3005, 4000-4005, 5000-5001
  - Removes all lock files

## NPM Scripts (package.json)

```bash
# Start development servers (RECOMMENDED)
npm run dev              # Uses V3 with enhanced monitoring (DEFAULT)
npm run dev:v3           # Explicitly use V3
npm run dev:v2           # Use legacy V2
npm run dev:ultimate     # Use original ultimate manager

# Stop all servers
npm run stop

# Restart servers
npm run restart          # Stop and start with V3

# Clean restart (removes build artifacts)
npm run dev:clean        # Clean build with V3

# Individual servers (for debugging only)
npm run dev:frontend-only   # Frontend only (if configured)
npm run dev:backend-only    # Backend only (if configured)
```

## V3 Features (Current Default)

### Enhanced Health Monitoring
- HTTP health checks every 5 seconds
- Verifies servers are actually responding
- Not just checking if process exists

### Automatic Recovery
- Detects stalled servers within 30 seconds
- Automatic restart on failure
- 3-failure threshold before forced restart

### Detailed Logging
- All events logged to `logs/dev-manager.log`
- Timestamped entries
- Console output with clear status indicators

### Better Process Management
- SIGKILL for guaranteed cleanup
- Port-specific process termination
- Extended wait times for port release

## Important Notes

1. **ALWAYS use `npm run dev`** for starting servers (uses V3 by default)
2. **ALWAYS use `npm run stop`** before manually starting servers
3. V3 prevents zombie processes and stalling
4. Default ports: Frontend=3000, Backend=4000
5. Health checks are active, not passive

## Troubleshooting

### Website Stalling or Not Responding
V3 automatically detects and recovers from stalls. If issues persist:

```bash
npm run stop          # Stop all servers
npm run dev:clean     # Clean restart with V3
```

### Check Server Status
Look for health check messages in console:
- ✅ Successful health checks (silent)
- ⚠️ Failed health checks (warnings shown)
- 🔄 Automatic restarts (logged)

### View Detailed Logs
```bash
tail -f logs/dev-manager.log   # Watch real-time logs
```

### Port Already in Use
```bash
npm run stop          # Stop all servers
lsof -i :3000,4000   # Check what's using ports
npm run dev           # Start fresh with V3
```

### Manual Recovery
If automatic recovery fails:
```bash
npm run stop          # Force stop everything
ps aux | grep node    # Check for zombies
npm run dev:clean     # Clean restart
```

## Migration from Old Managers

If you were using:
- `dev-manager-unified.js` → Now use `dev-ultimate-v3.js`
- `dev-manager.js` → Now use `dev-ultimate-v3.js`
- `enterprise-dev-manager.js` → Now use `dev-ultimate-v3.js`
- `dev-simple.js` → Now use `dev-ultimate-v3.js`

All functionality has been consolidated and improved in V3.

## Why V3?

1. **Reliability**: Active health monitoring prevents zombie processes
2. **Recovery**: Automatic detection and recovery from stalls
3. **Visibility**: Detailed logging for debugging
4. **Simplicity**: One manager handles all scenarios
5. **Performance**: Optimized health checks with minimal overhead