# Progress Bar - 5 Round Comprehensive Test Plan

## Test Objectives
- Verify real backend data integration (NO fake numbers)
- Verify counter behavior (UP in Stage 1, DOWN in Stage 2)
- Verify color transitions (Light Green → Red → Green)
- Verify progress never goes backwards
- Verify messages are clear and accurate
- Verify UX smoothness and polish

---

## Test Rounds

### Round 1: Basic Functionality & Data Flow
**Focus**: Core mechanics, backend data reception

**Checklist**:
- [ ] Progress bar appears on search start
- [ ] Counter starts at 0
- [ ] Stage 1: Counter counts UP to stage1.totalCollected
- [ ] Stage 2: Counter counts DOWN to stage2.finalSelected
- [ ] Backend data properly received and displayed
- [ ] No fake estimates or hardcoded numbers shown

---

### Round 2: Color Transitions & Visual Accuracy
**Focus**: Heat map gradient correctness

**Checklist**:
- [ ] 0-12.5%: Light Green (green-300, emerald-400, teal-400)
- [ ] 12.5-25%: Green to Yellow (teal-400, lime-500, yellow-400)
- [ ] 25-37.5%: Yellow to Orange (yellow-400, amber-500, orange-500)
- [ ] 37.5-50%: Orange to RED (orange-500, red-500, red-600)
- [ ] 50-62.5%: Red to Orange (red-500, red-600, orange-500)
- [ ] 62.5-75%: Orange to Yellow (orange-400, amber-500, yellow-500)
- [ ] 75-87.5%: Yellow to Light Green (yellow-400, lime-500, green-400)
- [ ] 87.5-100%: Light Green to Green (green-400, emerald-500, green-500)
- [ ] No color reversions or flickering

---

### Round 3: Message Accuracy & Clarity
**Focus**: User communication at each stage

**Checklist**:
- [ ] 0%: "Starting search..."
- [ ] <1%: "Fetching eligible papers from N sources..." OR "Connecting..."
- [ ] 1-49%: "Stage 1: Fetching eligible papers from N sources"
- [ ] ~50%: "✅ Fetched X papers - Starting quality filtering..."
- [ ] 51-99%: "Stage 2: Filtering to highest quality papers"
- [ ] 100%: "✅ Finalized X high-quality papers"
- [ ] All numbers are REAL backend data (no fake)
- [ ] Messages update at correct percentage thresholds

---

### Round 4: Counter Logic & Interpolation
**Focus**: Math accuracy, no backwards movement

**Checklist**:
- [ ] Counter is 0 at start
- [ ] Counter increases smoothly in Stage 1
- [ ] Counter reaches exact stage1.totalCollected at 50%
- [ ] Counter decreases smoothly in Stage 2
- [ ] Counter reaches exact stage2.finalSelected at 100%
- [ ] Counter NEVER goes backwards
- [ ] Large number formatting works (K, M notation)
- [ ] Thumbs up (👍) appears at 100%

---

### Round 5: Edge Cases & Backend Integration
**Focus**: Robustness, error handling, real-world scenarios

**Checklist**:
- [ ] Handles missing backend data gracefully
- [ ] Handles zero results
- [ ] Handles very large numbers (>100K)
- [ ] Handles very small ranges (e.g., 100 → 50)
- [ ] Progress never exceeds 100%
- [ ] Counter badge never clips off screen
- [ ] Transparency panel appears after completion
- [ ] No console errors or warnings

---

## Success Criteria

Each round must score 100% on its checklist to pass.

**Overall Pass**: All 5 rounds must pass with no critical issues.

---

## Test Execution Plan

1. Round 1: Start search, monitor console logs for backend data
2. Round 2: Capture screenshots at each color transition
3. Round 3: Record messages at each percentage milestone
4. Round 4: Monitor counter values in real-time
5. Round 5: Test edge cases with different queries

---

## Bug Reporting Template

```
BUG #X: [Title]
Severity: [Critical/High/Medium/Low]
Round: [1-5]
Issue: [Description]
Expected: [What should happen]
Actual: [What happened]
Fix: [Solution]
```

---

**Test Date**: 2025-11-14
**Tester**: AI Code Review
**Status**: READY TO EXECUTE

