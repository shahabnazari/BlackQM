# Test Cycle 3: Counter Logic & Interpolation Bugs

## Test Cycles 1-2 Summary:
✅ **10 bugs found and fixed:**
1-5: Counter fallback, badge positioning, checkpoint logging, validation, minimum count
6-10: Stage transition timing, heat map sync, visual feedback, percentage overflow, 50% flicker

---

## Test Cycle 3: Counter Counting Logic

### 🐛 BUG #11: Counter Jumps When Backend Data Arrives
**Severity**: MEDIUM
**Location**: `displayCount` calculation Line 339-344

**Issue**:
When backend data arrives ~5 seconds in:
- Before: Counter uses fallback (total × 20 = 10,000)
- After: Counter uses real data (e.g., 15,500)

If percentage is at 20% when data arrives:
- Before data: 10,000 × (20%/50) = 2,000
- After data: 15,500 × (20%/50) = 3,100
- **Counter jumps from 2,000 → 3,100 instantly!**

**Expected**: Smooth transition when data arrives
**Actual**: Counter jumps/stutters

---

### 🐛 BUG #12: Counter Shows Incorrect Scale Before Backend Data
**Severity**: LOW
**Location**: Line 339 - Fallback multiplier

**Issue**:
```typescript
const stage1Max = stage1TotalCollected || (total * 20);
```

This assumes collection rate is exactly 20x. But:
- For niche topics: might collect only 200 papers (20 final = 10x rate)
- For broad topics: might collect 50,000 papers (500 final = 100x rate)

**Expected**: More intelligent estimation or show "Connecting..." placeholder
**Actual**: Fixed 20x multiplier could be way off

---

### 🐛 BUG #13: Math.floor() Causes Counter to Lag Behind Bar
**Severity**: LOW
**Location**: Line 341, 357

**Issue**:
```typescript
const count = Math.floor(stage1Max * stage1Percent);
```

At 49.9%:
- Bar: 49.9% filled
- Counter: Math.floor(11,000 × 0.998) = 10,978

At 50.0%:
- Bar: 50.0% filled
- Counter: Math.floor(11,000 × 1.0) = 11,000

**This creates a 22-paper jump at the very end of Stage 1!**

**Expected**: Smooth counting (maybe use Math.round() or smoother interpolation)
**Actual**: Small jumps due to floor rounding

---

### 🐛 BUG #14: Counter Doesn't Stick to Exact Max at 50%
**Severity**: LOW
**Location**: Counter display at stage transition

**Issue**:
At exactly 50%, the counter should show the MAX collected value (e.g., 15,500). But due to rounding:
```typescript
// At 50.0%:
percentage = 50.0
stage1Percent = 50.0 / 50 = 1.0
count = Math.floor(15,500 × 1.0) = 15,500 ✅

// At 49.99%:
percentage = 49.99
stage1Percent = 49.99 / 50 = 0.9998
count = Math.floor(15,500 × 0.9998) = 15,496 ❌
```

The counter might not reach the exact max before transitioning to Stage 2.

**Expected**: Ensure counter hits exact max at 50%
**Actual**: Might be 1-4 papers short

---

### 🐛 BUG #15: No Throttling on Counter Updates
**Severity**: VERY LOW (Performance)
**Location**: Counter render

**Issue**:
The counter updates on every `displayCount` change, which could be 60-100 times per second. Each update triggers:
- Framer Motion animation
- Number formatting (toLocaleString())
- Re-render of badge

**Expected**: Throttle updates to ~10-20 per second max
**Actual**: Updates as fast as React can render

---

## Fixes to Implement:

1. **Fix #11**: Smooth transition when backend data arrives (interpolate from old to new)
2. **Fix #12**: Better estimation or show "..." when no data
3. **Fix #13**: Use Math.round() or ensure smooth counting
4. **Fix #14**: Force counter to exact values at 0%, 50%, 100%
5. **Fix #15**: Throttle counter updates for performance

---

## Status: Ready to implement fixes

