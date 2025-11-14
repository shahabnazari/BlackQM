# Test Cycle 1: Code Review & Bug Discovery

## Bugs Found:

### 🐛 BUG #1: Counter Shows Wrong Numbers Before Backend Data Arrives
**Severity**: HIGH
**Location**: `ProgressiveLoadingIndicator.tsx` Line 338-340

**Issue**:
```typescript
const stage1Max = stage1TotalCollected || total;
```
When backend data hasn't arrived yet, `stage1TotalCollected` is undefined, so it falls back to `total` (e.g., 500). This means:
- Stage 1 counts: 0 → 500 (WRONG! Should be 0 → 15,500)
- User sees wrong numbers for first 5 seconds

**Expected**: Counter should show more meaningful placeholder or wait for real data
**Actual**: Counter shows fallback target (500) instead of real collected (15,500)

---

### 🐛 BUG #2: Counter Badge Visibility at 0%
**Severity**: MEDIUM
**Location**: `ProgressiveLoadingIndicator.tsx` Line 419-429

**Issue**:
```typescript
className="absolute -top-8 -right-2 px-3 py-1..."
```
When percentage is 0%, the badge is positioned at the very start of the bar, potentially:
- Clipping off screen
- Overlapping with other UI elements
- Not visible to user

**Expected**: Badge should be visible even at 0%
**Actual**: Badge position not optimized for very low percentages

---

### 🐛 BUG #3: Checkpoint Logging Triggers Multiple Times
**Severity**: LOW
**Location**: `ProgressiveLoadingIndicator.tsx` Line 370

**Issue**:
```typescript
if (percentage === 0 || Math.abs(percentage - 50) < 1 || Math.abs(percentage - 100) < 1)
```
The `Math.abs(percentage - 50) < 1` means any percentage between 49.0% and 51.0% will trigger logging. With updates every 100ms, this could log 10-20 times at 50%.

**Expected**: Log exactly once at transition points
**Actual**: Logs multiple times, cluttering console

---

### 🐛 BUG #4: Missing Validation for Zero/Negative Values
**Severity**: MEDIUM
**Location**: `ProgressiveLoadingIndicator.tsx` Line 343-346

**Issue**:
```typescript
const startCount = stage1TotalCollected || total;
const endCount = stage2FinalSelected || safeCurrent;
```
No validation that `startCount > endCount`. If startCount = 500 and endCount = 600:
- Countdown logic breaks (negative difference)
- Counter would COUNT UP instead of DOWN in Stage 2

**Expected**: Validate startCount > endCount
**Actual**: No validation, could cause visual bug

---

### 🐛 BUG #5: Counter Not Synced with Bar Progress at Very Start
**Severity**: LOW
**Location**: Counter display logic

**Issue**:
When bar is at 0.2%, counter might still show 0 due to `Math.floor()`. This creates a disconnect:
- Bar: 0.2% filled
- Counter: 0 papers

**Expected**: Counter should show at least 1 when bar has any fill
**Actual**: Counter shows 0 even when bar is slightly filled

---

## Fixes to Implement:

1. **Fix #1**: Use better fallback logic for counter before backend data arrives
2. **Fix #2**: Improve badge positioning at 0% and low percentages  
3. **Fix #3**: Debounce checkpoint logging to trigger only once
4. **Fix #4**: Add validation for startCount > endCount
5. **Fix #5**: Show "Connecting..." or minimum count of 1 when bar > 0%

---

## Status: Ready to implement fixes

