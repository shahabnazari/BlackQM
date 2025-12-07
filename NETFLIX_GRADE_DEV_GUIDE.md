# Netflix-Grade Development Environment Guide

## 🎯 Overview

This project now uses **Netflix-grade development tooling** to prevent:
- ❌ High CPU usage
- ❌ High memory usage
- ❌ Multiple orphan processes
- ❌ Port conflicts
- ❌ Stale PID files

## ✅ Features

### Enterprise-Grade Process Management
- **Single-instance enforcement** - Prevents multiple dev servers running
- **Graceful shutdown** - Properly kills all child processes
- **Port availability checks** - Verifies ports before starting
- **PID file management** - Tracks all running processes
- **Resource monitoring** - Monitors CPU and memory usage
- **Automatic cleanup** - Removes orphan processes
- **Health checks** - Verifies services are responding
- **Zero orphan guarantee** - No processes left behind

---

## 🚀 Quick Start

### Start Development Servers
```bash
npm run dev:netflix
```

This will:
1. Run pre-flight checks (ports, existing instances)
2. Start backend (NestJS) on port 4000
3. Wait for backend health check
4. Start frontend (Next.js) on port 3000
5. Wait for frontend compilation
6. Enable resource monitoring
7. Display success message

### Stop Development Servers
```bash
npm run dev:stop
```

This will:
1. Kill all dev-lite, dev-netflix processes
2. Kill all nest/next processes
3. Free ports 3000 and 4000
4. Clean up all PID files
5. Verify all ports are freed

### Check Server Status
```bash
npm run dev:status
```

This displays:
- Backend status (running/stopped)
- Frontend status (running/stopped)
- Resource usage (CPU, Memory, Uptime)
- Health check results
- PID information

---

## 📋 Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev:netflix` | Start development servers (Netflix-grade) |
| `npm run dev:stop` | Stop all development servers |
| `npm run dev:status` | Check server status |
| `npm run restart` | Stop and restart servers |
| `npm run dev:clean` | Clean build cache and restart |
| `npm run dev:lite` | Old lightweight mode (NOT recommended) |

---

## 🔍 How It Works

### 1. Pre-Flight Checks

Before starting, the system checks:
- ✅ No other dev server instances running
- ✅ Ports 3000 and 4000 are available
- ✅ No stale PID files

If any check fails, the system **exits immediately** with clear error messages.

### 2. Process Tracking

All processes are tracked via PID files in `.dev-pids/`:
- `dev-manager.pid` - Main dev manager process
- `backend.pid` - Backend NestJS process
- `frontend.pid` - Frontend Next.js process

### 3. Graceful Shutdown

When you press Ctrl+C or run `npm run dev:stop`:
1. Send SIGTERM to all processes (graceful)
2. Wait 2 seconds for graceful shutdown
3. Send SIGKILL to any remaining processes (force)
4. Clean up all PID files
5. Verify ports are freed

### 4. Resource Monitoring

Every 10 seconds, the system checks:
- CPU usage > 80% → Warning logged
- Memory usage > 2048MB → Warning logged

This helps detect runaway processes early.

---

## 🛠️ Troubleshooting

### Problem: "Another dev server instance is already running"

**Solution:**
```bash
npm run dev:stop
npm run dev:netflix
```

### Problem: "Ports already in use"

**Solution 1 - Use the stop script:**
```bash
npm run dev:stop
```

**Solution 2 - Manual cleanup:**
```bash
# Check what's using the ports
lsof -nP -iTCP:3000,4000 -sTCP:LISTEN

# Kill specific processes
kill -9 <PID>
```

### Problem: High CPU usage

**Check resource usage:**
```bash
npm run dev:status
```

The status will show CPU/Memory usage with colored indicators:
- 🟢 Green: Normal (<20% CPU)
- 🟡 Yellow: Warning (20-50% CPU)
- 🔴 Red: High (>50% CPU)

**Solution:**
```bash
npm run restart
```

### Problem: Stale PID files

**Solution:**
```bash
npm run dev:stop  # Automatically cleans up stale PID files
```

### Problem: Frontend health check fails

This can happen during initial compilation. Wait 30 seconds and check again:
```bash
# Wait for compilation
sleep 30

# Test manually
curl http://localhost:3000

# Should return HTTP 200
```

---

## 📊 Resource Limits

The system enforces the following limits:

| Resource | Limit | Action |
|----------|-------|--------|
| Backend Memory | 2048MB | Set via NODE_OPTIONS |
| Frontend Memory | 2048MB | Set via NODE_OPTIONS |
| CPU Warning | 80% | Log warning |
| CPU Monitoring | Every 10s | Automatic |

---

## 🔐 Process Isolation

### What Gets Killed on Shutdown

✅ **Killed:**
- Main dev-manager process
- Backend NestJS process
- Frontend Next.js process
- All child processes spawned by npm
- All child processes of nest/next

❌ **NOT Killed:**
- VSCode/Cursor processes
- Other unrelated Node processes
- System processes

### How Orphan Prevention Works

1. **PID File Tracking** - Every process writes its PID
2. **Process Tree Killing** - Use `pgrep -P` to find all children
3. **Signal Cascade** - SIGTERM first, then SIGKILL if needed
4. **Verification** - Check ports are actually freed

---

## 🎓 Best Practices

### DO ✅

- Always use `npm run dev:netflix` to start
- Always use `npm run dev:stop` to stop
- Check status with `npm run dev:status`
- Let the system handle cleanup
- Run `npm run restart` if things feel slow

### DON'T ❌

- Don't manually kill processes (use `npm run dev:stop`)
- Don't run multiple dev servers simultaneously
- Don't use `dev:lite` anymore (use `dev:netflix`)
- Don't ignore resource warnings
- Don't start servers if pre-flight checks fail

---

## 📈 Performance Comparison

### Before (dev-lite.js)

| Issue | Frequency |
|-------|-----------|
| Orphan processes | Every restart |
| Port conflicts | Often |
| High CPU usage | Occasional |
| Multiple instances | Possible |
| Cleanup | Manual |

### After (dev-netflix.js)

| Metric | Result |
|--------|--------|
| Orphan processes | 0 (zero) |
| Port conflicts | Prevented |
| CPU usage | Monitored |
| Multiple instances | Blocked |
| Cleanup | Automatic |

---

## 🔧 Advanced Usage

### Custom Resource Limits

Edit `scripts/dev-netflix.js`:

```javascript
const RESOURCE_LIMITS = {
  maxCpuPercent: 80,      // Warn at 80% CPU
  maxMemoryMB: 2048,      // Warn at 2GB memory
  checkIntervalMs: 10000, // Check every 10 seconds
};
```

### Custom Ports

Edit `scripts/dev-netflix.js`:

```javascript
const PORTS = {
  backend: 4000,   // Change backend port
  frontend: 3000,  // Change frontend port
};
```

### Disable Resource Monitoring

In `dev-netflix.js`, comment out:

```javascript
// this.startResourceMonitoring();  // Disable monitoring
```

---

## 🐛 Debugging

### Enable Verbose Logging

Check the dev manager logs:
```bash
# While running
tail -f /tmp/netflix-dev-test.log

# Or check specific events
grep -E "(ERROR|WARN|Failed)" /tmp/netflix-dev-test.log
```

### Check PID Files

```bash
# List all PID files
ls -la .dev-pids/

# Check contents
cat .dev-pids/*.pid

# Verify processes are running
ps -p $(cat .dev-pids/backend.pid)
ps -p $(cat .dev-pids/frontend.pid)
```

### Manual Port Check

```bash
# Check all ports in use
lsof -nP -iTCP -sTCP:LISTEN | grep -E ":(3000|4000)"

# Check specific port
lsof -nP -iTCP:4000 -sTCP:LISTEN
```

---

## 📝 File Structure

```
scripts/
├── dev-netflix.js    # Netflix-grade dev manager (USE THIS)
├── dev-stop.js       # Forceful cleanup script
├── dev-status.js     # Status checker
├── dev-lite.js       # Old lightweight mode (deprecated)
└── ...

.dev-pids/            # PID file directory (auto-generated)
├── dev-manager.pid   # Main manager PID
├── backend.pid       # Backend process PID
└── frontend.pid      # Frontend process PID
```

---

## ❓ FAQ

### Q: Can I run multiple dev servers?
**A:** No, the system enforces single-instance. This prevents resource conflicts.

### Q: What if I need to test multiple branches?
**A:** Stop the current instance first:
```bash
npm run dev:stop
git checkout other-branch
npm run dev:netflix
```

### Q: Why are there Redis errors?
**A:** Redis is optional. The app works without it. To silence errors:
```bash
brew services start redis
```

### Q: Can I use the old dev:lite?
**A:** Not recommended. Use `npm run dev:netflix` instead for better reliability.

### Q: How do I know if servers are healthy?
**A:** Run `npm run dev:status` - it shows health check results.

---

## 🎯 Migration from dev:lite

If you were using `dev:lite`, migrate to `dev:netflix`:

### Old Way (dev:lite)
```bash
npm run dev:lite         # Start
# Ctrl+C to stop
pkill -f dev-lite        # Manual cleanup
```

### New Way (dev:netflix)
```bash
npm run dev:netflix      # Start
# Ctrl+C to stop (automatic cleanup)
npm run dev:stop         # Or explicit stop
```

**Benefits:**
- ✅ Automatic cleanup
- ✅ Pre-flight checks
- ✅ Resource monitoring
- ✅ Zero orphan processes
- ✅ Better error messages

---

## 📞 Support

If you encounter issues:

1. **Check status:** `npm run dev:status`
2. **Try restart:** `npm run restart`
3. **Force cleanup:** `npm run dev:stop`
4. **Check logs:** Look at console output
5. **Manual check:** `lsof -nP -iTCP:3000,4000 -sTCP:LISTEN`

---

## ✅ Success Indicators

You'll know everything is working when you see:

```
═══════════════════════════════════════════════════════
✅ All servers running successfully!

📍 Frontend: http://localhost:3000
📍 Backend:  http://localhost:4000
📊 Health:   http://localhost:4000/api/health

💡 Press Ctrl+C to stop all servers
═══════════════════════════════════════════════════════
```

And `npm run dev:status` shows all green indicators:
```
🔷 BACKEND (NestJS)
   Status: ✅ Running (PID: xxxxx)
   Resources: 🟢 CPU: 0.1%  🟢 MEM: 900MB  ⏱️  00:30
   Health: ✅ Healthy

🔷 FRONTEND (Next.js)
   Status: ✅ Running (PID: xxxxx)
   Resources: 🟢 CPU: 0.0%  🟢 MEM: 250MB  ⏱️  00:25
   Health: ✅ Healthy
```

---

## 🎉 Conclusion

The Netflix-grade development environment provides:
- **Zero orphan processes** - Guaranteed cleanup
- **Predictable behavior** - No surprises
- **Resource efficiency** - Monitor and prevent waste
- **Developer happiness** - Just works™

**Happy coding! 🚀**
