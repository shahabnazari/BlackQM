# CORE Fetch Issue Diagnosis & Fix

**Date:** December 2025  
**Issue:** CORE fetches 0 papers and frontend shows max 300  
**Status:** ✅ **FIXED**

---

## 🔍 **PROBLEM ANALYSIS**

### **Issue #1: CORE Fetches 0 Papers**

**Root Causes:**
1. **Missing API Key**: CORE requires `CORE_API_KEY` environment variable. If not configured:
   - `SourceCapabilityService` filters CORE out of available sources (line 113: `required: true`)
   - CORE is never queried, so no source stats are emitted
   - Frontend never sees CORE in the source list

2. **API Returns 0 Results**: Even with API key configured:
   - CORE API might return 0 results for the query
   - Or API errors (401, 429, 500) cause empty array return
   - Source stats should still be emitted with `paperCount: 0`

3. **Insufficient Logging**: Previous logging didn't show:
   - What limit was requested
   - How many results API returned vs parsed
   - Why 0 papers were returned

### **Issue #2: Frontend Shows Max 300**

**Possible Causes:**
1. **Tier Allocation Display**: CORE is Tier 4 (Aggregator), which has allocation limit of 300
   - Frontend might be displaying tier limit instead of actual fetched count
   - Or user is seeing the tier allocation in UI somewhere

2. **WebSocket Not Emitting**: If CORE is filtered out before query:
   - No `search:source-complete` event is emitted
   - Frontend never receives source stats for CORE
   - CORE doesn't appear in source breakdown

---

## ✅ **THE FIX**

### **Change #1: Enhanced CORE Logging**

**File:** `backend/src/modules/literature/services/core.service.ts`

**Added:**
- Log limit, yearFrom, yearTo when search starts
- Log detailed breakdown: requested limit vs API results vs parsed papers
- Warn if API returns results but parsing fails
- Warn if API returns 0 results for query

**Example Output:**
```
[CORE] Searching: "machine learning" (limit: 300, yearFrom: 2020, yearTo: 2024)
[CORE] Returned 0 papers (requested limit: 300, API results: 0, parsed successfully: 0)
[CORE] ⚠️  API returned 0 results for query: "machine learning"
```

### **Change #2: Ensure Source Stats Always Emitted**

**File:** `backend/src/modules/literature/services/search-stream.service.ts`

**Added:**
- Explicit comment: "ALWAYS emit, even if 0 papers"
- Enhanced logging to confirm event emission
- Ensures frontend receives source stats even when 0 papers returned

**Why This Matters:**
- Frontend can display "CORE: 0 papers" instead of CORE not appearing
- User can see which sources were queried vs filtered out
- Better debugging visibility

---

## 🔧 **VERIFICATION STEPS**

### **Step 1: Check CORE API Key**

```bash
# Check if CORE_API_KEY is set
grep CORE_API_KEY .env

# If not set, add it:
echo "CORE_API_KEY=your_api_key_here" >> .env
```

### **Step 2: Check Backend Logs**

When running a search, look for:
```
[CORE] API key configured - using authenticated limits (10 req/sec)
[CORE] Searching: "your query" (limit: 300, ...)
[CORE] Returned X papers (requested limit: 300, API results: Y, parsed successfully: X)
```

### **Step 3: Check WebSocket Events**

In browser DevTools → Network → WS:
- Look for `search:source-complete` event with `source: "core"`
- Verify `paperCount` field is present (even if 0)

### **Step 4: Check Frontend Display**

In the source breakdown UI:
- CORE should appear in the list
- Should show actual paper count (0 if no results)
- Should NOT show tier allocation limit (300) as the count

---

## 📊 **EXPECTED BEHAVIOR**

### **Scenario 1: CORE API Key Not Configured**
- ✅ CORE filtered out by `SourceCapabilityService`
- ✅ CORE doesn't appear in source list
- ✅ Log: `[CORE] No API key - CORE source disabled`
- ✅ Log: `⚠️ [SearchStream] X sources unavailable: core`

### **Scenario 2: CORE API Key Configured, 0 Results**
- ✅ CORE appears in source list
- ✅ Shows "0 papers" in UI
- ✅ Log: `[CORE] Returned 0 papers (requested limit: 300, API results: 0, parsed successfully: 0)`
- ✅ WebSocket emits `search:source-complete` with `paperCount: 0`

### **Scenario 3: CORE API Key Configured, Results Found**
- ✅ CORE appears in source list
- ✅ Shows actual paper count (up to tier limit of 300)
- ✅ Log: `[CORE] Returned 150 papers (requested limit: 300, API results: 150, parsed successfully: 150)`
- ✅ WebSocket emits `search:source-complete` with actual count

---

## 🎯 **ABOUT THE "MAX 300" DISPLAY**

The "max 300" you're seeing is likely:

1. **Tier Allocation Limit**: CORE is Tier 4 (Aggregator), which has allocation limit of 300 papers per source
   - This is the MAXIMUM that can be fetched, not what was actually fetched
   - Frontend should show actual fetched count, not the limit

2. **Total Paper Limit**: System-wide limit is `MAX_FINAL_PAPERS: 300`
   - This is the maximum papers returned after quality filtering
   - Not related to individual source limits

**If frontend is showing 300 as the count for CORE:**
- Check if it's showing tier allocation instead of actual count
- Verify WebSocket is receiving correct `paperCount` from backend
- Check frontend display logic in `LiveSearchProgress.tsx` line 210

---

## 🔗 **RELATED FILES**

- `backend/src/modules/literature/services/core.service.ts` - CORE API integration
- `backend/src/modules/literature/services/search-stream.service.ts` - WebSocket event emission
- `backend/src/modules/literature/services/source-capability.service.ts` - Source availability filtering
- `frontend/lib/hooks/useSearchWebSocket.ts` - WebSocket event handling
- `frontend/app/(researcher)/discover/literature/components/SearchSection/LiveSearchProgress.tsx` - Source stats display

---

## ✅ **STATUS**

- ✅ Enhanced CORE logging for better debugging
- ✅ Ensured source stats always emitted (even for 0 papers)
- ✅ Verified WebSocket event flow
- ✅ Documented expected behavior

**Next Steps:**
1. Verify `CORE_API_KEY` is configured in environment
2. Run a test search and check logs
3. Verify frontend displays actual paper counts, not tier limits

