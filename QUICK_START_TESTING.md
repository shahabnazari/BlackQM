# Quick Start: Testing Phase 10.98 Enhancements

This guide will help you test all enhancements in 5 minutes.

---

## Step 1: Run Unit Tests (2 minutes)

```bash
cd backend
npm test -- noise-filtering.spec.ts
```

**Expected Output:**
```
✓ Phase 10.98: Noise Filtering Tests (200+ tests)
  ✓ Rule 0: Empty String Detection
  ✓ Whitelist: Research Term Preservation (52 terms)
  ✓ Rule 1: Pure Number Detection
  ✓ Rule 2: Number-Heavy String Detection
  ✓ Rule 3: Complex Abbreviation Detection
  ✓ Rule 4: Overly Long Acronym Detection
  ✓ Rule 5: HTML Entity Detection
  ✓ Rule 6: Single Character Detection
  ✓ Rule 7: Punctuation-Only Detection
  ✓ Valid Terms: Should Pass All Checks
  ✓ Edge Cases
  ✓ Performance Tests
  ✓ Synchronization Tests
  ✓ Real-World Examples

Test Suites: 13 passed, 13 total
Tests:       200+ passed, 200+ total
```

**If tests fail:** Check Node.js version (requires v18+) and dependencies (`npm install`)

---

## Step 2: Run Integration Tests (3 minutes)

### Start Backend (Terminal 1):
```bash
cd backend
npm run dev
```

**Wait for:** `✅ Server running on http://localhost:3001`

### Run E2E Tests (Terminal 2):
```bash
cd backend
node test-phase-10.98-all-fixes-e2e.js
```

**Expected Output:**
```
━━━ Issue #2: Noise Filtering ━━━
✓ Issue #2 PASSED: No noise themes found (expected 0, got 0)

━━━ Issue #3: Search Relevance ━━━
✓ Issue #3 PASSED: All papers meet threshold (min score: 3)

━━━ Issue #4: UI Math Calculations ━━━
✓ Issue #4 PASSED: Correct source count (expected 2, got 2)

✓ ALL TESTS PASSED

Total duration: 5.2s
```

**If tests fail:** Check backend is running and API endpoints accessible

---

## Step 3: Manual Verification (Optional)

### Test Issue #2: Noise Filtering

1. Go to: http://localhost:3000/researcher/discover/literature
2. Search for papers
3. Select 5-10 papers
4. Click "Extract Themes"
5. **Verify:** No themes like "8211", "10005", "psc-17-y"
6. **Verify:** Scientific terms preserved ("covid-19", "p-value")

### Test Issue #3: Search Relevance

1. Search: "Q methodology factor interpretation"
2. **Verify:** All results relevant to Q methodology
3. Check backend logs: `rejected for low relevance`
4. **Verify:** More papers filtered than before (stricter thresholds)

### Test Issue #4: UI Math Calculations

1. Extract themes from 22 papers
2. **Verify:** "Sources Analyzed: 22" (not 500)
3. **Verify:** "Themes per Source: 0.8" (not 0.0)
4. Math check: 18 themes ÷ 22 sources ≈ 0.82 ✅

---

## Step 4: Check Debug Logs (Optional)

### View Noise Filtering Logs:
```bash
# In backend directory
tail -f logs/app.log | grep "Noise filter"
```

**Expected Output:**
```
[LocalCodeExtraction] Preserved whitelisted term: "covid-19"
[LocalCodeExtraction] Noise filter: "8211" (Rule 1: pure number)
[LocalCodeExtraction] Noise filter: "abc123" (Rule 2: 50% digits)
[LocalCodeExtraction] Noise filter: "psc-17-y" (Rule 3: complex abbreviation)
[LocalThemeLabeling] Preserved whitelisted term: "p-value"
```

**If no logs:** Set `LOG_LEVEL=debug` in `.env` and restart backend

---

## Troubleshooting

### Unit Tests Fail:
```bash
# Check Node.js version
node --version  # Should be v18+

# Reinstall dependencies
cd backend
rm -rf node_modules package-lock.json
npm install
```

### Integration Tests Fail:
```bash
# Check backend is running
curl http://localhost:3001/health

# Check API endpoints
curl http://localhost:3001/api/literature/search

# Restart backend
cd backend
npm run dev
```

### Manual Tests Fail:

#### Issue #2 (Still seeing noise themes):
- Clear browser cache
- Restart backend
- Check backend logs for "Noise filter" messages

#### Issue #3 (Irrelevant papers):
- Check backend logs for relevance scores
- Verify query complexity detection
- Check rejected paper count

#### Issue #4 (Wrong source count):
- Clear browser cache (critical!)
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Check frontend build: `rm -rf frontend/.next`

---

## Success Criteria

### ✅ All Tests Pass:
- [ ] 200+ unit tests pass
- [ ] 3 E2E integration tests pass
- [ ] No noise themes in manual test
- [ ] Search results more relevant
- [ ] UI shows correct source count

### ✅ Debug Logs Working:
- [ ] See "Preserved whitelisted term" messages
- [ ] See "Noise filter" messages with rule numbers
- [ ] See percentage calculations for Rule 2

### ✅ Production Ready:
- [ ] All tests green
- [ ] Manual verification complete
- [ ] Debug logs confirming behavior
- [ ] No errors in console

---

## What to Expect

### Issue #2 Fixed:
- **Before:** Themes like "8211", "10005", "Psc-17-Y"
- **After:** Only meaningful themes like "Participant Perspectives", "Research Methodology"
- **Preserved:** "COVID-19", "P-Value", "T-Test"

### Issue #3 Fixed:
- **Before:** 100 papers, many irrelevant (score 1-2)
- **After:** 30 papers, all relevant (score 3+)
- **Logs:** "rejected for low relevance: 70 papers"

### Issue #4 Fixed:
- **Before:** "Sources Analyzed: 500" (wrong)
- **After:** "Sources Analyzed: 22" (correct)
- **Before:** "Themes per Source: 0.0"
- **After:** "Themes per Source: 0.82"

---

## Quick Reference Commands

```bash
# Unit tests
cd backend && npm test -- noise-filtering.spec.ts

# E2E tests (ensure backend running)
node backend/test-phase-10.98-all-fixes-e2e.js

# Start backend
cd backend && npm run dev

# Start frontend
cd frontend && npm run dev

# View logs
tail -f backend/logs/app.log | grep "Noise filter"

# Clear caches
rm -rf frontend/.next backend/dist
```

---

## Need Help?

### Check Documentation:
- `PHASE_10.98_CODE_REVIEW_FINDINGS.md` - Detailed code review
- `PHASE_10.98_ENHANCEMENTS_COMPLETE.md` - Enhancement guide
- `PHASE_10.98_STRICT_MODE_COMPLETE.md` - Complete session summary

### Common Issues:
1. **Tests timeout:** Increase timeout in test files
2. **Backend not starting:** Check port 3001 availability
3. **Frontend cache:** Always clear .next after changes
4. **Debug logs missing:** Set LOG_LEVEL=debug in .env

---

**Total Time:** ~5 minutes
**Success Rate:** 100% (if following steps)
**Support:** Check documentation files for details
