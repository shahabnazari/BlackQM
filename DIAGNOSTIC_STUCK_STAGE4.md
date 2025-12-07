# Diagnostic Guide - Stuck at Theme Review Stage 4

**Date:** November 18, 2025
**Issue:** Theme extraction frozen at Stage 4 (Theme Review)

---

## 🔍 STEP-BY-STEP DIAGNOSTIC

### Step 1: Check Frontend Console Logs

**Open Browser Console:**
- Press F12 (or Cmd+Option+I on Mac)
- Go to Console tab
- Look for the MOST RECENT logs (scroll to bottom)

**What to look for:**

#### A. Last WebSocket Progress Update
```javascript
// Should see:
📊 Real-time progress update: { stageNumber: 4, ... }
   📊 Progress update: Stage 4/6 - Theme Review

// Check timestamp - is it recent or old?
```

#### B. Any Error Messages
```javascript
// Look for:
❌ WebSocket error: ...
🔴 [UnifiedThemeAPI] V2 extract failed: ...
⚠️ WARNING: ...
```

#### C. WebSocket Connection Status
```javascript
// Should see:
✅ WebSocket connected to theme-extraction namespace

// OR disconnected:
🔌 WebSocket disconnected: ...
```

#### D. API Call Status
```javascript
// Look for:
📡 Initiating API call to extractThemesV2...
// Then later (after completion):
✅ API call completed in X.Xs

// If NO completion message = API still running or hung
```

---

### Step 2: Check How Long It's Been Stuck

**Timer Check:**
- When did you click "Extract Themes"?
- Current time?
- Duration = ?

**Expected Durations:**
- Stage 1 (Familiarization): 5-15 seconds
- Stage 2 (Coding): 15-30 seconds
- Stage 3 (Theme Generation): 20-40 seconds
- Stage 4 (Theme Review): 20-40 seconds ← YOU ARE HERE
- Stage 5 (Theme Definition): 15-30 seconds
- Stage 6 (Report Production): 10-20 seconds

**Total Expected:** 2-3 minutes for 10 papers

**If stuck > 5 minutes:** Likely hung, not just slow

---

### Step 3: Check Backend Logs

**Terminal where backend is running:**

**Look for:**

#### A. Recent Activity
```bash
# Should see:
[ThemeExtractionService] Processing stage 4: Theme Review
[ThemeExtractionGateway] Emitting progress: stage 4

# Or error:
[ERROR] ...
```

#### B. Last Emitted Stage
```bash
# Find the last:
[ThemeExtractionGateway] Emitting progress to room: ...
   Stage: X/6
```

**If last stage emitted was 4:** Backend successfully sent stage 4 update

**If no recent logs:** Backend might be stuck processing

#### C. API Rate Limits or Timeouts
```bash
# Look for:
[OpenAI] Rate limit exceeded
[OpenAI] Request timeout
[ERROR] ECONNREFUSED
```

---

### Step 4: Network Tab Check

**Chrome DevTools:**
1. Press F12
2. Go to "Network" tab
3. Look for ongoing requests

**Check:**
- Is there a request to `/literature/themes/extract-themes-v2` still pending?
- Status: "Pending" (still running) or "200" (completed)?
- Time: How long has it been running?

---

## 🎯 COMMON SCENARIOS

### Scenario A: Backend Still Processing (Normal)

**Symptoms:**
- ✅ WebSocket connected
- ✅ No errors in console
- ✅ Backend logs show activity
- ⏰ Less than 3 minutes elapsed

**Action:** Wait a bit longer, backend is processing

---

### Scenario B: WebSocket Disconnected

**Symptoms:**
```javascript
🔌 WebSocket disconnected: transport close
```

**Action:**
- Backend stopped sending updates
- Check if backend crashed
- Restart backend: `npm run start:dev`

---

### Scenario C: Backend Hung/Crashed

**Symptoms:**
- ❌ No backend logs for >1 minute
- ❌ Terminal shows error or crash
- ⏰ Stuck for >5 minutes

**Action:**
1. Stop backend (Ctrl+C)
2. Restart: `npm run start:dev`
3. Try extraction again

---

### Scenario D: OpenAI API Issue

**Symptoms:**
```bash
# Backend logs show:
[ERROR] OpenAI API error: Rate limit exceeded
[ERROR] OpenAI API timeout
```

**Action:**
- OpenAI rate limit hit
- Wait 1 minute and try again
- Or check OpenAI API key quota

---

### Scenario E: 10-Minute Timeout

**Symptoms:**
- ⏰ Exactly 10 minutes elapsed
- Frontend shows error: "Request timeout"

**Action:**
- API call timed out
- Reduce number of papers (try 5 instead of 10)
- Or increase timeout in code

---

## 📊 WHAT TO REPORT BACK

Please provide:

### 1. Frontend Console Logs (Last 50 lines)
```
Right-click in console → Select All → Copy
Or take screenshot
```

### 2. Backend Terminal Output (Last 50 lines)
```
Copy recent output from terminal where npm run start:dev is running
```

### 3. Timing Info
- When clicked "Extract Themes": __:__
- Current time: __:__
- Duration stuck: __ minutes

### 4. Network Tab
- Request to extract-themes-v2: Pending or Completed?
- How long: __ seconds

---

## 🔧 QUICK FIXES TO TRY

### Fix #1: Refresh and Retry
```bash
# In frontend terminal:
rm -rf frontend/.next
# Refresh browser (Cmd+Shift+R)
# Try extraction again
```

### Fix #2: Restart Backend
```bash
# In backend terminal:
Ctrl+C (stop)
npm run start:dev
```

### Fix #3: Reduce Paper Count
- Try with just 3-5 papers instead of 10
- See if it completes

### Fix #4: Check Backend is Running
```bash
# Should see:
[Nest] INFO [NestApplication] Nest application successfully started
```

---

## 🚨 EMERGENCY: Force Stop

**If completely frozen:**

1. **Frontend:** Hard refresh (Cmd+Shift+R or Ctrl+Shift+R)
2. **Backend:** Ctrl+C → `npm run start:dev`
3. **Try again with fewer papers**

---

**Next Steps:** Provide the information above and I can diagnose the exact issue!
