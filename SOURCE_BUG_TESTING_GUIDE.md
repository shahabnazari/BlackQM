# Source Selection Bug - Testing Guide
## Phase 10.6 Day 14.4: Debug Logging Enabled

**Status:** 🟡 DEBUG LOGGING ACTIVE - Ready for Testing
**Date:** November 11, 2025

---

## 🐛 THE BUG

**What You Reported:**
> "I only selected ERIC and searched for 'chemical', but the papers listed are not correct"

**What's Happening:**
- You select ERIC only in the UI
- Backend receives default sources (semantic_scholar, crossref, pubmed)
- Papers from PubMed/CrossRef shown instead of ERIC papers

**Root Cause:** Unknown (investigating with debug logging)

---

## ✅ WHAT I'VE DONE

### 1. Added Enterprise Debug Logging

I've added comprehensive debug logging at every step of the source selection flow:

**Frontend:**
- ✅ `AcademicResourcesPanel.tsx` - Logs when you click source buttons
- ✅ `useLiteratureSearch.ts` - Logs selected sources before search
- ✅ `literature-api.service.ts` - Logs sources being sent to backend

**Backend:**
- ✅ Already logging via `SearchLoggerService` what sources are received

### 2. Files Modified

**frontend/app/(researcher)/discover/literature/components/AcademicResourcesPanel.tsx**
- Added debug logs in `handleDatabaseToggle` (lines 246-257)

**frontend/lib/hooks/useLiteratureSearch.ts**
- Added debug logs before search (lines 200-204)
- Added debug logs after building params (lines 235-237)

**frontend/lib/services/literature-api.service.ts**
- Added debug logs before API call (lines 236-239)

---

## 🧪 TESTING INSTRUCTIONS

### Step 1: Open Browser DevTools

1. Open the literature search page
2. Press **F12** (or right-click → Inspect)
3. Go to the **Console** tab
4. **Clear the console** (trash icon or Ctrl+L)

### Step 2: Reproduce the Bug

1. **Deselect all sources** (click each one until none are selected)
2. **Select ONLY ERIC** (click the ERIC card)
3. Type "**chemical**" in the search box
4. **Click Search**

### Step 3: Check Console Output

You should see debug logs like this:

```
🔘 [DEBUG] AcademicResourcesPanel - Toggle clicked: eric
🔘 [DEBUG] Current academicDatabases: []
🔘 [DEBUG] Is currently selected: false
🔘 [DEBUG] New selection: ['eric']
🔘 [DEBUG] Calling onDatabasesChange with: ['eric']

... (when you click search) ...

🔍 [DEBUG] Selected Sources (academicDatabases): ['eric']
🔍 [DEBUG] Sources count: 1
🔍 [DEBUG] Sources type: object
🔍 [DEBUG] Is Array: true
🔍 [DEBUG] Sources JSON: ["eric"]

📤 [DEBUG] searchParams.sources: ['eric']
📤 [DEBUG] searchParams.sources type: object
📤 [DEBUG] searchParams.sources length: 1

📡 [DEBUG] API params.sources: ['eric']
📡 [DEBUG] API params.sources type: object
📡 [DEBUG] API params.sources length: 1
📡 [DEBUG] API params.sources JSON: ["eric"]
```

### Step 4: Take Screenshots

**Please take screenshots of:**
1. The console logs (all the debug output)
2. The papers shown (especially the source column)
3. The network tab showing the request payload

### Step 5: Check Backend Logs

```bash
# Check the most recent search
tail -1 backend/logs/searches/search-2025-11-11.log | python3 -m json.tool

# Look for the "sources" field
tail -1 backend/logs/searches/search-2025-11-11.log | jq '.sources'
```

**Expected:** `["eric"]`
**Actual:** Probably `["semantic_scholar", "crossref", "pubmed"]`

---

## 🔍 WHAT TO LOOK FOR

### Scenario 1: Sources Change After Toggle
**Console shows:**
```
🔘 [DEBUG] New selection: ['eric']          ← Correct
🔍 [DEBUG] Selected Sources: []             ← WRONG! State lost
```
**Root Cause:** State not persisting after toggle
**Fix:** Need to investigate React state update timing

### Scenario 2: Sources Lost Before API Call
**Console shows:**
```
🔍 [DEBUG] Selected Sources: ['eric']       ← Correct
📡 [DEBUG] API params.sources: []           ← WRONG! Lost in API call
```
**Root Cause:** Sources being filtered out or transformed
**Fix:** Check `searchParams` building logic

### Scenario 3: Sources Sent But Backend Ignores
**Console shows:**
```
📡 [DEBUG] API params.sources: ['eric']     ← Correct
```
**Backend log shows:**
```json
{
  "sources": ["semantic_scholar", "crossref", "pubmed"]  ← WRONG!
}
```
**Root Cause:** Backend transformation or DTO validation issue
**Fix:** Check backend DTO validation and transformation

---

## 📋 WHAT I NEED FROM YOU

Please provide:

1. **Console logs** - Full output from clicking ERIC to seeing results
2. **Backend log entry** - The most recent search from `backend/logs/searches/`
3. **Screenshots** - Console, Network tab, Papers list
4. **Answers to these questions:**
   - Did you see the `🔘 [DEBUG]` logs when you clicked ERIC?
   - What does `🔍 [DEBUG] Selected Sources` show?
   - What does `📡 [DEBUG] API params.sources` show?
   - Did the papers shown come from ERIC or other sources?

---

## 🎯 NEXT STEPS

Once I see the debug output, I can identify exactly where the state is being lost and implement the fix.

**Possible fixes:**
1. Fix state update timing
2. Fix state persistence override
3. Fix API parameter serialization
4. Fix backend DTO validation

---

## 🚀 HOW TO GET DEBUG OUTPUT

### Option 1: Copy from Console
1. Right-click in console
2. "Save as..." → save console output to file
3. Share the file

### Option 2: Take Screenshots
1. Expand all the debug logs in console
2. Take multiple screenshots if needed
3. Share screenshots

### Option 3: Copy Text
1. Select all debug output in console
2. Copy (Ctrl+C)
3. Paste into a text file
4. Share the text

---

**Status:** ✅ Debug logging active - Ready for your testing
**Next:** Please test and share debug output
**ETA:** Can fix within minutes once I see where state is lost
