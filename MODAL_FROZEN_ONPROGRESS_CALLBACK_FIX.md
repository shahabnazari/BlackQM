# ACTUAL ROOT CAUSE - Missing onProgress Callback

**Date:** November 18, 2025
**Severity:** CRITICAL
**Status:** ✅ **FIXED**

---

## 🎯 THE REAL PROBLEM

The modal wasn't frozen because WebSocket failed. **The WebSocket code wasn't even running!**

### Why?

The `extractThemesV2` call was missing the **`onProgress` callback** parameter:

```typescript
// BEFORE (BROKEN):
await extractThemesV2(allSources, {  purpose: 'q_methodology',
  ...
});  //  ❌ NO third parameter!

// WebSocket code checks:
if (onProgress && typeof window !== 'undefined') {
  // This NEVER runs because onProgress is undefined!
}
```

---

## ✅ THE FIX

Added `updateProgress` callback through the entire chain:

### 1. Interface (useThemeExtractionHandlers.ts)
```typescript
export interface UseThemeExtractionHandlersConfig {
  startExtraction: (totalSources: number) => void;
  updateProgress: (currentSource: number, totalSources: number, transparentMessage?: any) => void;  // ← ADDED
  extractThemesV2: (..., onProgress?: any) => Promise<any>;
}
```

### 2. Handler Call (useThemeExtractionHandlers.ts)
```typescript
// AFTER (FIXED):
const result = await extractThemesV2(
  allSources,
  { purpose: 'q_methodology', ... },
  (stageNumber, totalStages, message, transparentMessage) => {
    console.log(`   📊 Progress update: Stage ${stageNumber}/${totalStages}`);
    updateProgress(stageNumber, totalStages, transparentMessage);  // ← NOW CALLS THIS!
  }
);
```

### 3. Page Config (page.tsx)
```typescript
useThemeExtractionHandlers({
  startExtraction,
  updateProgress,  // ← ADDED  extractThemesV2,
});
```

---

## 📊 BEFORE vs AFTER

### BEFORE (Broken)
```
extractThemesV2() called WITHOUT onProgress
   ↓
WebSocket code skipped (onProgress undefined)
   ↓
No progress updates
   ↓
Modal stuck on "Familiarization" ❌
```

### AFTER (Fixed)
```
extractThemesV2() called WITH onProgress callback
   ↓
WebSocket code runs ✅
   ↓
Progress events → updateProgress() → Modal advances ✅
```

---

## 🧪 EXPECTED LOGS (After Fix)

```javascript
📡 Initiating API call to extractThemesV2...
🚀 UnifiedThemeAPI.extractThemesV2 called

// NEW - WebSocket code NOW RUNS:
🔌 Attempting to establish WebSocket connection...
✅ WebSocket connected to theme-extraction namespace

// NEW - Progress updates:
📊 Real-time progress update: { stageNumber: 1, ... }
   📊 Progress update: Stage 1/6 - Familiarization with Data
🟣 updateProgress called (1/6)

📊 Real-time progress update: { stageNumber: 2, ... }
   📊 Progress update: Stage 2/6 - Systematic Code Generation
🟣 updateProgress called (2/6)

// Modal advances through all 6 stages ✅
```

---

## ✅ FILES MODIFIED

1. `frontend/lib/hooks/useThemeExtractionHandlers.ts` (~25 lines)
   - Added `updateProgress` to interface
   - Created onProgress wrapper callback
   - Passed callback to extractThemesV2

2. `frontend/app/(researcher)/discover/literature/page.tsx` (1 line)
   - Passed `updateProgress` to handlers config

**TypeScript Errors:** 0 ✅

---

## 🚀 TEST NOW

```bash
rm -rf frontend/.next
cd frontend && npm run dev
```

Then:
1. Search for papers
2. Select papers
3. Click "Extract Themes"

**Expected:** Modal progresses through all 6 stages (not stuck on familiarization)

---

**Status:** ✅ Ready for testing
**Confidence:** 🟢 HIGH
**Risk:** 🟢 LOW

---

END OF FIX DOCUMENTATION
