# Test Cycle 2: Heat Map & Stage Transition Bugs

## Test Cycle 1 Summary:
✅ **5 bugs found and fixed:**
1. Counter showed wrong numbers before backend data (fallback to 500 instead of estimated ~10,000)
2. Badge positioning at 0% could cause clipping
3. Checkpoint logging triggered multiple times
4. Missing validation for count ranges
5. Counter showed 0 even when bar was visible

---

## Test Cycle 2: Heat Map Visual & Stage Transitions

### 🐛 BUG #6: Stage Transition Happens in Frontend, Not Based on Backend Stage
**Severity**: HIGH
**Location**: `useProgressiveSearch.ts` - Stage transition logic

**Issue**:
The stage transition is based on TIME (15s = 50%) not on ACTUAL backend progress. The backend might complete Stage 1 in 3 seconds, but frontend won't show Stage 2 until 15 seconds have passed.

**Current Logic**:
```typescript
const elapsedTime = now - startTime;
const currentStage = elapsedTime < (STAGE1_DURATION * 1000) ? 1 : 2;
```

**Problem**:
- Backend finishes Stage 1 at 5s → sends stage1 data
- Frontend still shows Stage 1 until 15s
- User sees "collecting" when filtering is actually happening

**Expected**: Stage should transition when backend sends stage2 data
**Actual**: Stage transitions after fixed 15 seconds

---

### 🐛 BUG #7: Heat Map Gradient Doesn't Account for Stage Correctly
**Severity**: MEDIUM
**Location**: `ProgressiveLoadingIndicator.tsx` Line 418-440

**Issue**:
Heat map uses `currentStage` to determine color, but `currentStage` can be wrong (see Bug #6). Also, the gradient logic assumes:
- 0-50% = Stage 1
- 50-100% = Stage 2

But `currentStage` could be 2 while percentage is still 30% if backend is very fast.

**Expected**: Heat map should sync with actual backend stage
**Actual**: Heat map uses frontend's time-based stage

---

### 🐛 BUG #8: No Visual Indicator When Stage 1 Completes
**Severity**: LOW
**Location**: Progress messages

**Issue**:
When backend completes Stage 1 (sends totalCollected), there's no visual feedback. User doesn't know collection is done.

**Expected**: Show a brief "✅ Collected X papers" message
**Actual**: No feedback, just smooth animation continues

---

### 🐛 BUG #9: Percentage Calculation Can Exceed 100%
**Severity**: LOW
**Location**: `ProgressBar` Line 317-324

**Issue**:
```typescript
const percentage = currentStage === 1
  ? rawPercentage / 2              // Stage 1: 0-50%
  : 50 + (rawPercentage / 2);      // Stage 2: 50-100%
```

If `rawPercentage` is 101%, then:
- Stage 2: 50 + (101/2) = 100.5%

**Expected**: Percentage clamped to 100%
**Actual**: Could slightly exceed 100%

---

### 🐛 BUG #10: Heat Map at Exactly 50% Could Show Either Stage 1 or Stage 2 Color
**Severity**: LOW
**Location**: `getHeatMapGradient` Line 418-429

**Issue**:
At exactly 50%, the logic checks `if (currentStage === 1)`. But if stage just transitioned, the color could flicker between:
- Stage 1 color: `from-orange-500 via-red-500 to-red-600`
- Stage 2 color: `from-red-500 via-red-600 to-orange-500`

These are similar but different, causing a subtle visual jump.

**Expected**: Smooth transition at 50%
**Actual**: Potential color flicker

---

## Fixes to Implement:

1. **Fix #6**: Make stage transition based on backend data arrival, not fixed time
2. **Fix #7**: Sync heat map with backend stage, not frontend estimation
3. **Fix #8**: Add brief visual feedback when Stage 1 completes
4. **Fix #9**: Clamp percentage to 0-100% range
5. **Fix #10**: Ensure heat map at 50% uses consistent color

---

## Status: Ready to implement fixes

