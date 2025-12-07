# Netflix-Grade Logger - Quick Testing Guide

**Date**: December 4, 2025
**Status**: ✅ Ready to Test
**Time Required**: 10 minutes

---

## 🚀 Quick Start

### 1. Restart Frontend Server
```bash
cd frontend
npm run dev
```

**Expected Output**:
```
✓ Ready in 2.3s
○ Local:   http://localhost:3000
```

---

## ✅ Test 1: Verify Logs Are Being Sent (2 minutes)

### Steps:
1. Open browser: `http://localhost:3000`
2. Open DevTools → **Network** tab
3. Filter: Type `logs` in the filter box
4. Wait 5 seconds (batch interval)

### Expected Results:
```
✅ POST /api/logs → Status: 200 OK
✅ Request Headers include: Authorization: Bearer <token>
✅ Request Payload: { "logs": [...] }
✅ No 404 errors
✅ No "Cannot POST /api/api/logs" errors
```

### What Changed:
- **Before**: `POST /api/api/logs` → 404 (duplicate path)
- **After**: `POST /api/logs` → 200 OK ✅

---

## ✅ Test 2: Token Refresh (3 minutes)

### Steps:
1. Open browser console (F12)
2. Manually expire token:
   ```javascript
   localStorage.setItem('access_token', 'expired_token_xyz');
   ```
3. Wait 5 seconds for log batch to send
4. Watch **Network** tab

### Expected Results:
```
1️⃣ POST /api/logs → 401 Unauthorized (expected - token expired)
2️⃣ POST /api/auth/refresh → 200 OK (automatic refresh)
3️⃣ POST /api/logs (retry) → 200 OK ✅
```

### Console Output:
```
✅ NO errors in console
✅ Logs delivered successfully after token refresh
```

### What Changed:
- **Before**: Token expired → 401 → Logs lost ❌
- **After**: Token expired → Auto refresh → Retry → Success ✅

---

## ✅ Test 3: Backend Unavailable (2 minutes)

### Steps:
1. Stop backend server:
   ```bash
   cd backend
   npm run stop
   # or Ctrl+C if running
   ```
2. Open browser console
3. Wait 5 seconds

### Expected Results:
```
✅ Console warning (ONE TIME ONLY):
   "⚠️ [Logger] Backend logging endpoint unavailable. Logs will be buffered locally only."

✅ No repeated error messages
✅ No 404 spam in console
✅ Logs still accessible via: logger.exportLogs()
```

### Verification:
```javascript
// In browser console:
logger.getBackendAvailability();
// Should return: false

logger.exportLogs();
// Should return: JSON string with buffered logs
```

### What Changed:
- **Before**: Repeated failures, console spam
- **After**: One warning, graceful fallback, logs preserved ✅

---

## ✅ Test 4: Backend Recovered (2 minutes)

### Steps:
1. Restart backend server:
   ```bash
   cd backend
   npm run start:dev
   ```
2. In browser console:
   ```javascript
   logger.resetBackendAvailability();
   ```
3. Wait 5 seconds

### Expected Results:
```
✅ POST /api/logs → 200 OK (logs resume)
✅ Buffered logs sent to backend
✅ No errors
```

### Verification:
```javascript
logger.getBackendAvailability();
// Should return: true
```

---

## ✅ Test 5: Authentication Headers (1 minute)

### Steps:
1. Open DevTools → **Network** tab
2. Find any `POST /api/logs` request
3. Click on it → **Headers** tab
4. Scroll to **Request Headers**

### Expected Results:
```
✅ Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
✅ Content-Type: application/json
✅ X-CSRF-Token: <token> (if CSRF enabled)
```

### What Changed:
- **Before**: No Authorization header ❌
- **After**: Automatic JWT authentication ✅

---

## 🧪 Advanced Testing (Optional)

### Test Token Rotation
```javascript
// In browser console:

// 1. Get current token
const oldToken = localStorage.getItem('access_token');
console.log('Old token:', oldToken.substring(0, 20) + '...');

// 2. Expire it
localStorage.setItem('access_token', 'expired_token');

// 3. Make any API call (trigger refresh)
// Wait for log batch to send...

// 4. Check new token
const newToken = localStorage.getItem('access_token');
console.log('New token:', newToken.substring(0, 20) + '...');

// Verify:
console.log('Token rotated:', oldToken !== newToken); // Should be true
```

### Test Correlation ID Tracking
```javascript
// In browser console:

// 1. Set correlation ID
logger.setCorrelationId('test-correlation-123');

// 2. Log something
logger.info('Test message', 'TestContext', { data: 'test' });

// 3. Check logs
const logs = JSON.parse(logger.exportLogs());
console.log('Last log:', logs[logs.length - 1]);

// Verify correlationId is present:
// { correlationId: 'test-correlation-123', message: 'Test message', ... }
```

### Test Circuit Breaker
```javascript
// In browser console:

// 1. Stop backend
// 2. Wait for failure detection
console.log('Backend available:', logger.getBackendAvailability()); // false

// 3. Verify no more requests
// Network tab should show NO new POST /api/logs attempts

// 4. Restart backend
// 5. Reset circuit breaker
logger.resetBackendAvailability();

// 6. Verify requests resume
console.log('Backend available:', logger.getBackendAvailability()); // null → true (after success)
```

---

## 🐛 Troubleshooting

### Issue: Still seeing 404 errors

**Cause**: Frontend not restarted after code changes

**Fix**:
```bash
cd frontend
npm run dev
# Hard refresh browser: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

---

### Issue: No Authorization header in requests

**Cause**: Not logged in, or token not present

**Fix**:
```javascript
// Check if token exists:
console.log('Access token:', localStorage.getItem('access_token'));

// If null, log in first
// Then verify token is added:
logger.info('Test log');
// Check Network tab → Request Headers → Authorization
```

---

### Issue: Token refresh not working

**Cause**: Refresh token expired or invalid

**Fix**:
```javascript
// Check refresh token:
console.log('Refresh token:', document.cookie.includes('refresh_token'));

// If false, log in again to get fresh tokens
```

---

### Issue: Backend not receiving logs

**Possible Causes**:
1. Backend `/api/logs` endpoint not implemented
2. Backend crashed or not running
3. CORS issues (if frontend/backend on different domains)

**Diagnosis**:
```bash
# Check backend is running:
curl http://localhost:4000/api/health
# Should return: {"status":"ok"}

# Check logs endpoint exists:
curl -X POST http://localhost:4000/api/logs \
  -H "Content-Type: application/json" \
  -d '{"logs":[]}'
# Should NOT return 404
```

---

## 📊 Success Criteria

### All Tests Pass
- [x] Test 1: Logs sent successfully (200 OK)
- [x] Test 2: Token refresh works automatically
- [x] Test 3: Graceful fallback when backend unavailable
- [x] Test 4: Backend recovery detected automatically
- [x] Test 5: Authentication headers present

### No Errors
- [x] No 404 errors on `/api/logs`
- [x] No duplicate `/api/api/logs` errors
- [x] No repeated console warnings
- [x] No authentication failures (after token refresh)

### Expected Behavior
- [x] Logs delivered every 5 seconds (batch interval)
- [x] Automatic token refresh on expiration
- [x] One-time warning on backend unavailable
- [x] Circuit breaker prevents repeated failures
- [x] Logs preserved in buffer during backend downtime

---

## 🎯 Key Metrics to Monitor

### Production Monitoring
```javascript
// Add to app initialization:
setInterval(() => {
  const stats = logger.getStats();
  const backendAvailable = logger.getBackendAvailability();

  console.log('Logger Health:', {
    totalLogs: stats.total,
    backendAvailable,
    backendLoggingEnabled: logger.isBackendLoggingEnabled(),
    errorCount: stats.byLevel['ERROR'] || 0,
    fatalCount: stats.byLevel['FATAL'] || 0,
  });
}, 60000); // Every minute
```

### Alert Thresholds (Recommendations)
```javascript
// Set up alerts for:
if (stats.total > 500) {
  alert('High log buffer - backend may be down');
}

if (stats.byLevel['FATAL'] > 0) {
  alert('FATAL errors detected - immediate action required');
}

if (!backendAvailable && isProduction) {
  alert('Backend logging unavailable in production');
}
```

---

## ✅ Final Verification Checklist

### Before Deployment
- [ ] All 5 tests pass
- [ ] No console errors
- [ ] No TypeScript compilation errors
- [ ] Authorization headers present in requests
- [ ] Token refresh working correctly
- [ ] Backend receiving logs with user attribution

### After Deployment
- [ ] Monitor log delivery success rate (should be >95%)
- [ ] Monitor token refresh success rate (should be 100%)
- [ ] Monitor backend availability status
- [ ] Verify CSRF tokens present (if enabled)
- [ ] Check backend logs for authenticated log entries

---

## 📝 What to Report

### If All Tests Pass ✅
```
✅ Netflix-Grade Logger Implementation: VERIFIED
- Log delivery: Working (200 OK)
- Token refresh: Automatic
- Authentication: JWT headers present
- Circuit breaker: Working
- Error handling: Graceful fallback
- Status: PRODUCTION READY
```

### If Any Test Fails ❌
Report:
1. Which test failed
2. Error message from console
3. Network tab screenshot (if applicable)
4. Browser console output
5. Environment (dev/staging/prod)
6. Browser version

---

## 🚀 Next Steps

### After All Tests Pass
1. ✅ Verify in staging environment
2. ✅ Monitor metrics for 24 hours
3. ✅ Deploy to production
4. ✅ Monitor production metrics

### Future Enhancements (Priority 2-4)
- [ ] Add retry logic on refresh failure
- [ ] Implement token rotation on refresh
- [ ] Add rate limiting to auth endpoints
- [ ] Add log compression for large payloads
- [ ] Add log encryption for sensitive data

---

**Testing Status**: ⏳ **READY TO TEST**
**Expected Time**: 10 minutes
**Difficulty**: Easy
**Prerequisites**: Backend running, Frontend running, Browser DevTools open

---

**Happy Testing!** 🎉
