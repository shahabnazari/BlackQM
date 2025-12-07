# 🚀 Quick Start - Enterprise Development Environment

## TL;DR - Get Started in 30 Seconds

```bash
# Start development (RECOMMENDED)
npm run dev:strict

# Stop development
npm run stop:enterprise
# or press Ctrl+C

# Clean restart (if issues)
npm run dev:clean:strict
```

**That's it!** Your enterprise development environment is ready.

---

## 📍 Access Your Services

Once started, open:

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:4000
- **API Docs:** http://localhost:4000/api/docs

---

## ✅ What You Get

When you run `npm run dev:strict`:

✅ **Automatic cache clearing** every 5 minutes  
✅ **TypeScript validation** before startup  
✅ **Health monitoring** every 15 seconds  
✅ **Auto-restart** on crashes (max 3 attempts)  
✅ **Comprehensive logging** in `logs/enterprise-dev/`  
✅ **Port management** (auto-frees 3000 & 4000)  
✅ **Process isolation** with PID tracking  

---

## 🎯 Common Commands

```bash
# Start development
npm run dev:strict

# Stop development
npm run stop:enterprise

# Restart (keeps caches)
npm run restart:strict

# Clean restart (clears all caches)
npm run dev:clean:strict

# View logs
tail -f logs/enterprise-dev/manager-*.log
tail -f logs/enterprise-dev/frontend-*.log
tail -f logs/enterprise-dev/backend-*.log
```

---

## 🔧 Troubleshooting

### "Another instance is already running"
```bash
npm run stop:enterprise
npm run dev:strict
```

### TypeScript errors preventing startup
```bash
# Check errors
cd frontend && npx tsc --noEmit
cd backend && npx tsc --noEmit

# Fix errors, then:
npm run dev:strict
```

### Ports still in use
```bash
lsof -ti:3000 | xargs kill -9
lsof -ti:4000 | xargs kill -9
npm run dev:strict
```

### Cache issues
```bash
npm run dev:clean:strict
```

### Nuclear option (if all else fails)
```bash
npm run stop:enterprise
rm -rf frontend/.next backend/dist
rm -f .dev-enterprise.*
npm run dev:strict
```

---

## 📊 Success Indicators

You'll see this when everything is working:

```
================================================================================
✅ [STEP 10/10] ENTERPRISE DEVELOPMENT ENVIRONMENT READY
================================================================================

🎯 Services:
   Frontend:  http://localhost:3000
   Backend:   http://localhost:4000
   API Docs:  http://localhost:4000/api/docs

📊 Process IDs:
   Manager:   12344
   Frontend:  12346
   Backend:   12345

🔍 Monitoring:
   Health checks:  Every 15 seconds
   Cache clearing: Every 5 minutes
   Strict mode:    ENABLED ✅
```

---

## 🎓 Daily Workflow

### Morning
```bash
npm run dev:strict
```

### During Development
- Make changes
- Hot reload happens automatically
- Monitor console for any issues

### Evening
```bash
# Press Ctrl+C or:
npm run stop:enterprise
```

---

## 📝 Where Are My Logs?

All logs are in `logs/enterprise-dev/`:

```bash
logs/enterprise-dev/
├── manager-20240101.log      # Dev manager logs
├── frontend-20240101.log     # Next.js logs
├── backend-20240101.log      # NestJS logs
└── last-error.json           # Last error (if any)
```

---

## 🆚 Why Use `dev:strict` Instead of `dev`?

| Feature | dev:strict | dev |
|---------|-----------|-----|
| Cache clearing | ✅ Auto | ❌ Manual |
| TypeScript check | ✅ Yes | ❌ No |
| Health monitoring | ✅ Yes | ❌ No |
| Auto-restart | ✅ Yes | ❌ No |
| Enterprise logs | ✅ Yes | ⚠️ Basic |

**Recommendation:** Always use `dev:strict` for production-quality development.

---

## 🎯 Familiarization Counts Fix

The familiarization counts issue is **FIXED** ✅

**What was fixed:**
- Real-time article counts now update correctly
- Word counts display properly
- Visual indicators show data source (🟢 LIVE / 🔵 CACHED)
- No more stuck "Counting..." states

**To test:**
1. Start dev environment: `npm run dev:strict`
2. Navigate to Literature Discovery
3. Select papers and click "Extract Themes"
4. Watch Stage 1 counts update in real-time ✅

---

## 📚 Full Documentation

For detailed information:

- **[ENTERPRISE_DEV_ENVIRONMENT_COMPLETE.md](./ENTERPRISE_DEV_ENVIRONMENT_COMPLETE.md)** - Complete dev environment guide
- **[FAMILIARIZATION_COUNTS_FINAL_SOLUTION.md](./FAMILIARIZATION_COUNTS_FINAL_SOLUTION.md)** - Complete fix documentation
- **[FAMILIARIZATION_COUNTS_FIX_COMPLETE.md](./FAMILIARIZATION_COUNTS_FIX_COMPLETE.md)** - Implementation details

---

## 💡 Pro Tips

1. **Use clean restart after pulling changes:**
   ```bash
   npm run dev:clean:strict
   ```

2. **Check logs if something seems off:**
   ```bash
   tail -f logs/enterprise-dev/manager-*.log
   ```

3. **Monitor health in real-time:**
   - Watch console output
   - Health checks run every 15 seconds

4. **Let the system handle caches:**
   - Auto-clears every 5 minutes
   - No manual intervention needed

---

## 🎉 You're Ready!

Start developing with:

```bash
npm run dev:strict
```

Then open http://localhost:3000 and start coding! 🚀

---

**Questions?** Check the full documentation or logs directory.

**Status:** ✅ Production Ready | **Version:** 6.0.0-enterprise
