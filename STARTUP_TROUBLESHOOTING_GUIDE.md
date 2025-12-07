# 🔧 Startup Troubleshooting Guide

## Issue: Website Not Accessible in Strict Mode

This guide helps diagnose and fix issues preventing the website from loading.

---

## 🚨 Quick Fix Steps

### Step 1: Clean Everything

```bash
# Stop all processes
npm run stop:enterprise
pkill -f "next dev"
pkill -f "nest start"
pkill -f "dev-enterprise"

# Clear ports
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:4000 | xargs kill -9 2>/dev/null

# Remove lock files
rm -f .dev-enterprise.*
rm -f .dev-ultimate.*
rm -f frontend/.next/cache/*

# Clear caches
rm -rf frontend/.next
rm -rf backend/dist
```

### Step 2: Check for TypeScript Errors

```bash
# Check frontend
cd frontend
npx tsc --noEmit

# Check backend
cd ../backend
npx tsc --noEmit
```

**If you see errors:** Fix them before proceeding.

### Step 3: Start Services Individually

```bash
# Terminal 1: Start Backend
cd backend
npm run start:dev

# Wait for "Nest application successfully started"

# Terminal 2: Start Frontend
cd frontend
npm run dev

# Wait for "Ready in X ms"
```

### Step 4: Verify Services

```bash
# Check frontend
curl http://localhost:3000

# Check backend
curl http://localhost:4000/api

# Both should return 200 OK
```

---

## 🔍 Common Issues & Solutions

### Issue 1: TypeScript Compilation Errors

**Symptoms:**
- Dev server won't start
- Errors mentioning "TS" or "Type"

**Solution:**
```bash
cd frontend
npx tsc --noEmit 2>&1 | tee typescript-errors.log

# Review typescript-errors.log
# Fix all errors before proceeding
```

**Common TypeScript Errors:**

1. **IIFE Syntax Error**
   ```typescript
   // ❌ Wrong
   {(() => {
     return <div>...</div>
   })()}
   
   // ✅ Correct
   {(() => {
     return <div>...</div>
   })() as React.ReactNode}
   ```

2. **Null Safety**
   ```typescript
   // ❌ Wrong
   const value = obj.property
   
   // ✅ Correct
   const value = obj?.property || defaultValue
   ```

### Issue 2: Port Already in Use

**Symptoms:**
- Error: "Port 3000 is already in use"
- Error: "EADDRINUSE"

**Solution:**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Find and kill process on port 4000
lsof -ti:4000 | xargs kill -9

# Verify ports are free
lsof -i:3000
lsof -i:4000
# Should return nothing
```

### Issue 3: Stale Lock Files

**Symptoms:**
- "Another instance is already running"
- Dev manager won't start

**Solution:**
```bash
# Remove all lock files
rm -f .dev-enterprise.lock
rm -f .dev-enterprise.pid
rm -f .dev-enterprise-state.json
rm -f .dev-ultimate.lock
rm -f .dev-ultimate.pid
rm -f .dev-processes.json

# Verify removal
ls -la | grep "\.dev-"
# Should return nothing
```

### Issue 4: Cache Issues

**Symptoms:**
- Old code still running
- Changes not reflecting
- Build errors

**Solution:**
```bash
# Nuclear option - clear everything
rm -rf frontend/.next
rm -rf frontend/node_modules/.cache
rm -rf backend/dist
rm -rf backend/node_modules/.cache

# Reinstall if needed
cd frontend && npm install
cd ../backend && npm install
```

### Issue 5: Node Modules Issues

**Symptoms:**
- Module not found errors
- Import errors

**Solution:**
```bash
# Reinstall dependencies
cd frontend
rm -rf node_modules package-lock.json
npm install

cd ../backend
rm -rf node_modules package-lock.json
npm install

cd ..
npm install
```

---

## 🎯 Strict Mode Specific Issues

### Issue: Strict TypeScript Validation Fails

The enterprise strict mode runs TypeScript validation before startup. If validation fails, the dev environment won't start.

**Solution:**

1. **Disable strict mode temporarily:**
   ```bash
   # Use regular dev mode
   npm run dev
   ```

2. **Fix TypeScript errors:**
   ```bash
   cd frontend
   npx tsc --noEmit
   # Fix all errors
   
   cd ../backend
   npx tsc --noEmit
   # Fix all errors
   ```

3. **Re-enable strict mode:**
   ```bash
   npm run dev:strict
   ```

### Issue: Cache Clearing Fails

**Solution:**

Edit `scripts/dev-enterprise-strict.js` and temporarily disable cache clearing:

```javascript
// Find this line (around line 200):
await this.clearAllCaches();

// Comment it out:
// await this.clearAllCaches();
```

Then restart:
```bash
npm run dev:strict
```

---

## 📊 Diagnostic Commands

### Check Running Processes

```bash
# Check for Next.js
ps aux | grep "next dev"

# Check for NestJS
ps aux | grep "nest start"

# Check for dev managers
ps aux | grep "dev-enterprise\|dev-ultimate"
```

### Check Port Usage

```bash
# Check what's using port 3000
lsof -i:3000

# Check what's using port 4000
lsof -i:4000
```

### Check Logs

```bash
# Enterprise dev logs
ls -lt logs/enterprise-dev/
tail -100 logs/enterprise-dev/manager-*.log
tail -100 logs/enterprise-dev/frontend-*.log
tail -100 logs/enterprise-dev/backend-*.log

# Regular logs
ls -lt logs/
tail -100 logs/frontend-*.log
tail -100 logs/backend-*.log
```

### Check File Permissions

```bash
# Check if scripts are executable
ls -la scripts/dev-enterprise-strict.js
ls -la scripts/stop-enterprise.js

# Make executable if needed
chmod +x scripts/dev-enterprise-strict.js
chmod +x scripts/stop-enterprise.js
```

---

## 🔄 Step-by-Step Recovery Process

If nothing else works, follow this complete recovery process:

### 1. Complete Cleanup

```bash
# Stop everything
npm run stop:enterprise 2>/dev/null
pkill -f "node" 2>/dev/null

# Wait
sleep 5

# Clear ports
lsof -ti:3000,4000 | xargs kill -9 2>/dev/null

# Remove lock files
rm -f .dev-*

# Clear caches
rm -rf frontend/.next
rm -rf backend/dist
rm -rf logs/*.log
```

### 2. Verify Clean State

```bash
# No node processes
ps aux | grep node | grep -v grep
# Should return nothing

# No ports in use
lsof -i:3000,4000
# Should return nothing

# No lock files
ls -la | grep "\.dev-"
# Should return nothing
```

### 3. Test TypeScript

```bash
# Frontend
cd frontend
npx tsc --noEmit
echo "Frontend TypeScript: $?"

# Backend
cd ../backend
npx tsc --noEmit
echo "Backend TypeScript: $?"

cd ..
```

**Expected:** Both should return 0 (no errors)

### 4. Start Backend First

```bash
cd backend
npm run start:dev 2>&1 | tee /tmp/backend.log &

# Wait 10 seconds
sleep 10

# Check if running
curl http://localhost:4000/api
```

**Expected:** Should return 200 OK or 404 (but not connection refused)

### 5. Start Frontend

```bash
cd frontend
npm run dev 2>&1 | tee /tmp/frontend.log &

# Wait 20 seconds
sleep 20

# Check if running
curl http://localhost:3000
```

**Expected:** Should return 200 OK

### 6. Verify Both Services

```bash
# Frontend
curl -I http://localhost:3000

# Backend
curl -I http://localhost:4000/api

# Open in browser
open http://localhost:3000
```

---

## 🎓 Understanding the Error Messages

### "Cannot find module"

**Cause:** Missing dependency or incorrect import path

**Fix:**
```bash
npm install
# or
npm install <missing-package>
```

### "Port already in use"

**Cause:** Another process is using the port

**Fix:**
```bash
lsof -ti:3000 | xargs kill -9
```

### "TypeScript error"

**Cause:** Type checking failed

**Fix:**
```bash
npx tsc --noEmit
# Fix reported errors
```

### "ECONNREFUSED"

**Cause:** Service not running or wrong port

**Fix:**
```bash
# Check if service is running
ps aux | grep "next dev\|nest start"

# Check correct port
lsof -i:3000
lsof -i:4000
```

---

## 🚀 Recommended Startup Method

For most reliable startup:

```bash
# 1. Clean slate
npm run stop:enterprise
rm -f .dev-*
rm -rf frontend/.next backend/dist

# 2. Start with regular dev (no strict mode)
npm run dev

# 3. Wait for both services to be ready
# Frontend: http://localhost:3000
# Backend: http://localhost:4000

# 4. Test in browser
open http://localhost:3000

# 5. If working, try strict mode
npm run stop
npm run dev:strict
```

---

## 📞 Still Having Issues?

If you've tried everything above and still can't start the services:

1. **Check Node version:**
   ```bash
   node --version
   # Should be v20.x.x or higher
   ```

2. **Check npm version:**
   ```bash
   npm --version
   # Should be v10.x.x or higher
   ```

3. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules frontend/node_modules backend/node_modules
   rm -f package-lock.json frontend/package-lock.json backend/package-lock.json
   npm install
   ```

4. **Check disk space:**
   ```bash
   df -h
   # Ensure you have at least 1GB free
   ```

5. **Check for conflicting global packages:**
   ```bash
   npm list -g --depth=0
   # Look for conflicting Next.js or NestJS installations
   ```

---

## ✅ Success Checklist

Your environment is working when:

- [ ] No TypeScript errors: `npx tsc --noEmit` returns 0
- [ ] No processes on ports: `lsof -i:3000,4000` returns nothing (before start)
- [ ] No lock files: `ls -la | grep "\.dev-"` returns nothing (before start)
- [ ] Backend responds: `curl http://localhost:4000/api` returns 200
- [ ] Frontend responds: `curl http://localhost:3000` returns 200
- [ ] Browser loads: http://localhost:3000 shows the app
- [ ] No console errors in browser DevTools

---

**Last Updated:** 2024  
**Status:** Comprehensive Troubleshooting Guide
