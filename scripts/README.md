# Server Management Scripts

## Active Scripts (USE THESE)

### Primary Server Management

- **`dev-ultimate.js`** - Enhanced development server manager (V5)
  - Usage: `npm run dev` (default)
  - Features:
    - Process group management for reliable cleanup
    - No shell spawning - direct process control
    - Robust error handling and recovery
    - Process tracking via .dev-processes.json
    - Clean shutdown handling with proper signals
    - Prevents orphaned processes
    - Force cleanup of stale processes
  - Manages both frontend (port 3000) and backend (port 4000)
  - **BEST FOR**: Reliable development with clean process management

### Utility Scripts

- **`stop-ultimate.js`** - Stops all running servers
  - Usage: `npm run stop`
  - Kills all Node.js processes
  - Cleans ports 3000-3005, 4000-4005, 5000-5001
  - Removes all lock files

## NPM Scripts (package.json)

```bash
# Start development servers (RECOMMENDED)
npm run dev              # Start development servers

# Stop all servers
npm run stop

# Restart servers
npm run restart          # Stop and start servers

# Clean restart (removes build artifacts)
npm run dev:clean        # Clean build and restart
```

## Features

### Process Group Management

- Direct process control without shell spawning
- Clean process tree management
- No orphaned processes

### Reliable Cleanup

- Process tracking via .dev-processes.json
- Guaranteed cleanup on exit
- Proper signal handling (SIGTERM, SIGINT)

### Error Recovery

- Robust error handling
- Clean port release
- Extended wait times for resource cleanup

## Important Notes

1. **ALWAYS use `npm run dev`** for starting servers
2. **ALWAYS use `npm run stop`** before manually starting servers
3. Prevents zombie processes through process group management
4. Default ports: Frontend=3000, Backend=4000
5. Process tracking via .dev-processes.json file

## Troubleshooting

### Website Stalling or Not Responding

If servers are not responding:

```bash
npm run stop          # Stop all servers
npm run dev:clean     # Clean restart
```

### Check Server Status

Process information is stored in .dev-processes.json:

- Contains PIDs for manager, frontend, and backend
- Automatically cleaned up on exit

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

All previous manager versions have been archived. The current `dev-ultimate.js` (V5) is the only active manager.

Archived versions (in scripts/archived-managers/):

- `dev-ultimate-v2.js` - Basic monitoring version
- `dev-ultimate-v3.js` - HTTP health check version
- `dev-ultimate-v4.js` - Intermediate version
- Previous `dev-ultimate.js` - Original version

## Why This Manager?

1. **Reliability**: Process group management prevents zombie processes
2. **Simplicity**: Direct process control without shell complications
3. **Tracking**: Process IDs saved for reliable cleanup
4. **Performance**: Minimal overhead with efficient process management
5. **Stability**: Proven to handle long-running development sessions
