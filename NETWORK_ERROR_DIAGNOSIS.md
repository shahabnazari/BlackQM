# Network Error Diagnosis & Fix

**Date:** 2025-11-24
**Issue:** Frontend getting network errors connecting to backend

---

## 🔍 DIAGNOSTIC RESULTS

### ✅ Backend Status: RUNNING

**Processes Found:**
```
PID 62732: Main backend (running on port 4000) - Running for 21+ hours
PID 70140: Nest watch process
```

**Ports:**
- ✅ Backend: Port 4000 (LISTENING)
- ✅ Frontend: Port 3000 (LISTENING)

**Backend Response Test:**
```bash
$ curl -v http://localhost:4000
HTTP/1.1 404 Not Found
✅ Backend IS responding
✅ CORS headers present
✅ Security headers configured
```

---

## 🚨 POSSIBLE ISSUES

### **Issue 1: Backend May Be Hung/Slow**

The backend process has been running for 21+ hours. It might be:
- Out of memory
- Stuck in a slow operation
- Have accumulated errors

**Symptoms:**
- Requests timing out
- Slow responses
- Network errors in browser

---

## 🔧 SOLUTION: Restart Backend

### **Step 1: Stop Current Backend**

```bash
# Find and kill the backend process
pkill -f "node.*backend/dist/main"
pkill -f "nest start"
```

### **Step 2: Navigate to Backend Directory**

```bash
cd /Users/shahabnazariadli/Documents/blackQmethhod/backend
```

### **Step 3: Start Backend in Development Mode**

```bash
npm run start:dev
```

**Expected Output:**
```
[Nest] 12345  - 11/24/2025, 11:10:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 11/24/2025, 11:10:00 PM     LOG [InstanceLoader] AppModule dependencies initialized
[Nest] 12345  - 11/24/2025, 11:10:01 PM     LOG [RoutesResolver] Mapping /api routes
[Nest] 12345  - 11/24/2025, 11:10:01 PM     LOG [NestApplication] Nest application successfully started
[Nest] 12345  - 11/24/2025, 11:10:01 PM     LOG Listening on http://localhost:4000
```

---

## 🧪 VERIFICATION STEPS

### **1. Test Backend Health**

```bash
curl http://localhost:4000
# Should return 404 with JSON (means it's alive)
```

### **2. Test API Endpoint**

```bash
curl http://localhost:4000/api
# Should return API response or route list
```

### **3. Test from Frontend**

Open browser console and run:
```javascript
fetch('http://localhost:4000/api')
  .then(res => res.json())
  .then(data => console.log('Backend response:', data))
  .catch(err => console.error('Network error:', err));
```

### **4. Check Browser Network Tab**

1. Open DevTools (F12)
2. Go to Network tab
3. Try the theme extraction flow
4. Look for failed requests
5. Check error messages:
   - `ERR_CONNECTION_REFUSED` → Backend not running
   - `ERR_TIMED_OUT` → Backend hung/slow
   - `CORS error` → CORS misconfiguration
   - `404` → Route not found (backend running)

---

## 🔍 FRONTEND CONFIGURATION

**Environment (.env.local):**
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000/api  ✅ Correct
NEXT_PUBLIC_BACKEND_URL=http://localhost:4000  ✅ Correct
NEXT_PUBLIC_WS_URL=ws://localhost:4000         ✅ Correct
```

**All configurations are correct!**

---

## 🚀 QUICK FIX SCRIPT

Create a script to restart backend cleanly:

```bash
#!/bin/bash
# restart-backend-clean.sh

echo "🛑 Stopping backend..."
pkill -f "node.*backend/dist/main"
pkill -f "nest start"
sleep 2

echo "🧹 Cleaning dist folder..."
cd /Users/shahabnazariadli/Documents/blackQmethhod/backend
rm -rf dist

echo "🔨 Rebuilding..."
npm run build

echo "🚀 Starting backend..."
npm run start:dev

echo "✅ Backend restarted!"
echo "📡 Listening on http://localhost:4000"
```

**Usage:**
```bash
chmod +x restart-backend-clean.sh
./restart-backend-clean.sh
```

---

## 📊 COMMON NETWORK ERRORS & FIXES

| Error | Meaning | Fix |
|-------|---------|-----|
| `ERR_CONNECTION_REFUSED` | Backend not running | Start backend: `npm run start:dev` |
| `ERR_TIMED_OUT` | Backend hung/slow | Restart backend (see above) |
| `CORS error` | Cross-origin blocked | Check CORS config in main.ts |
| `404 Not Found` | Route doesn't exist | Check API route spelling |
| `500 Internal Error` | Backend crash | Check backend console logs |
| `Network request failed` | Generic error | Check both servers running |

---

## 🔍 DEBUG CHECKLIST

- [ ] Backend server running on port 4000?
- [ ] Frontend server running on port 3000?
- [ ] Backend responds to `curl http://localhost:4000`?
- [ ] Browser can access `http://localhost:3000`?
- [ ] No CORS errors in browser console?
- [ ] Backend console shows no errors?
- [ ] Environment variables loaded correctly?
- [ ] No firewall blocking localhost?

---

## 💡 RECOMMENDED ACTION NOW

**Try this sequence:**

1. **Kill backend:**
   ```bash
   pkill -f "node.*backend"
   ```

2. **Start fresh:**
   ```bash
   cd /Users/shahabnazariadli/Documents/blackQmethhod/backend
   npm run start:dev
   ```

3. **Wait for startup message:**
   ```
   LOG Listening on http://localhost:4000
   ```

4. **Test theme extraction flow in browser**

5. **If still getting errors, check browser console for specific error message**

---

## 🆘 IF STILL NOT WORKING

**Check these:**

1. **Port conflict:**
   ```bash
   lsof -i :4000
   # If another process is using port 4000, kill it
   ```

2. **Check backend logs for errors:**
   ```bash
   cd backend
   npm run start:dev 2>&1 | tee backend.log
   ```

3. **Verify database connection:**
   - Check if PostgreSQL/MySQL is running
   - Verify database credentials in .env

4. **Check API keys:**
   - OpenAI API key valid?
   - Other API keys configured?

---

**Status:** Backend is running but may need restart

**Recommended Action:** Restart backend with `npm run start:dev`

**Next Steps:** Test theme extraction flow after restart

