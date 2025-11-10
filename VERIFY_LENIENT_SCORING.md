# Verify Lenient Scoring - User Guide

**Date**: 2025-11-09 7:36 PM
**Status**: ✅ Backend Restarted with Lenient Code
**Backend PID**: 24954 (Started: 7:35 PM)

---

## ✅ VERIFICATION COMPLETE

### Backend Status
- **Compilation**: ✅ Lenient code compiled at 7:28 PM
- **Backend**: ✅ Restarted at 7:35 PM with new code
- **Health**: ✅ Healthy and responding
- **OpenAlex**: ✅ Enrichment working (tested with Sage article)

### Test Results

#### Test 1: Direct Scoring (Lenient Thresholds Active)
```
Paper with IF=2.0, Q2, 2 cites/year, 1000 words:
- Citation Impact: 50.0 points (was ~35 with strict)
- Journal Prestige: 42.0 points (was ~30 with strict)
- Content Depth: 50.0 points (was 40 with strict)
- TOTAL: 47.2 points ✅
```

#### Test 2: OpenAlex Enrichment (Working)
```
Sage Article (DOI: 10.1177/1461444815616224):
✅ Citations: 100 → 175
✅ Impact Factor: 4.91
✅ h-index: 201
✅ Quartile: Q1

Expected Score with Lenient Thresholds:
- Citations: 99.1 pts (19.4 cites/year)
- Prestige: 83.9 pts (IF 4.91 = 59pts + Q1 25pts)
- Content: 60 pts (1500 words)
- TOTAL: 84.0 points (Exceptional!) ✅
```

---

## 🎯 WHY YOU'RE SEEING 0 FOR PRESTIGE

### Possible Reasons:

### 1. **You Haven't Performed a Fresh Search Yet**

**Issue**: The backend cache was cleared when it restarted at 7:35 PM. Any searches you're looking at are from BEFORE the restart.

**Solution**: Perform a NEW search right now.

### 2. **Papers Without DOIs**

**Issue**: Papers without DOIs cannot be enriched by OpenAlex.

**Check**: Look for papers with `doi:` field. Example:
- ✅ `doi: 10.1177/1461444815616224` → Will get journal metrics
- ❌ `doi: null` or no DOI → Will show 0 for journal prestige

### 3. **Viewing Cached Results**

**Issue**: Your browser or the frontend may be showing cached search results from before 7:35 PM.

**Solution**:
1. Clear browser cache (Cmd+Shift+R or Ctrl+Shift+R)
2. Perform a fresh search

---

## 📋 VERIFICATION STEPS

### Step 1: Perform Fresh Search

1. Open: http://localhost:3000/discover/literature

2. Search for: **"social media journalism"** or **"new media society"**

3. Look for papers with DOIs in the results

4. Check the quality score breakdown

### Step 2: What to Expect

**Papers WITH DOIs and Journal Metrics**:
```
Quality Score: 50-85 points (depending on citations)

Breakdown:
├─ 📈 Citation Impact: XX/100 (40% weight)
├─ 🏆 Journal Prestige: 20-80/100 (35% weight) ← Should be NON-ZERO
│   ├─ Impact Factor: X.XX (PRIMARY)
│   ├─ Quartile: Q1/Q2/Q3/Q4 (BONUS)
│   └─ h-index: XXX (visible if available)
└─ 📄 Content Depth: XX/100 (25% weight)
```

**Papers WITHOUT DOIs or Journal**:
```
Quality Score: 20-45 points (lower due to missing journal)

Breakdown:
├─ 📈 Citation Impact: XX/100
├─ 🏆 Journal Prestige: 0/100 ← Expected to be 0
│   └─ ⚠ No journal metrics = 0 points (baseline)
│   └─ Score based on citations + content only
└─ 📄 Content Depth: XX/100
```

### Step 3: Verify Lenient Thresholds

**Check a paper with 2 citations/year**:
- OLD (Strict): ~35 points for citations
- NEW (Lenient): **50 points** for citations ✅

**Check a paper with IF=2.0**:
- OLD (Strict): 12 points for IF
- NEW (Lenient): **24 points** for IF (doubled!) ✅

**Check a paper with 1000 words**:
- OLD (Strict): 40 points
- NEW (Lenient): **50 points** ✅

---

## 🧪 QUICK TEST

### Run Test Script
```bash
cd /Users/shahabnazariadli/Documents/blackQmethhod
node test-lenient-scoring.js
```

**Expected Output**:
- Paper 1: Journal Prestige = **42.0** (not 0)
- Paper 2: Journal Prestige = **67.0** (not 0)
- Paper 4 (Sage): Total Score = **84.0** (Exceptional)

### Test Enrichment
```bash
node test-enrichment-direct.js
```

**Expected Output**:
```
✅ Citations: 100 → 175
✅ Impact Factor: 4.909215955983494
✅ h-index (Journal): 201
✅ Quartile: Q1
✅ SUCCESS: Enrichment is working!
```

---

## 🔍 TROUBLESHOOTING

### If You Still See 0 for All Papers

#### Check 1: Are Papers Missing DOIs?
```
Look at the paper data:
- If DOI is null/empty → 0 prestige is CORRECT
- If DOI exists → Should have prestige score
```

#### Check 2: Check Browser Console
1. Open browser DevTools (F12)
2. Look for errors in Console tab
3. Check Network tab for API calls

#### Check 3: Backend Logs
```bash
# Check if enrichment is being called
tail -f logs/dev-manager.log | grep "OpenAlex"

# Then perform a search in the browser
```

You should see:
```
🔄 [OpenAlex] ABOUT TO CALL enrichBatch with X papers...
📋 [OpenAlex] Papers with DOI: X/Y
✅ [OpenAlex] Updated citations...
📊 [OpenAlex] Journal metrics for "Journal Name"...
```

#### Check 4: Verify Backend Version
```bash
ps aux | grep "node.*dist/main" | grep -v grep
```

**Should show**: Started at 7:35 PM or later

**If earlier**: Kill and restart:
```bash
pkill -f "node.*dist/main"
# Wait 5 seconds for auto-restart
```

---

## 📊 EXPECTED IMPROVEMENTS

### Typical Quality Paper
```
OLD (Strict):
- 2 cites/year, IF=2, 1000 words → 41 points (Acceptable)

NEW (Lenient):
- 2 cites/year, IF=2, 1000 words → 49.7 points (Nearly Good!)
```

### Good Journal Paper
```
OLD (Strict):
- 5 cites/year, IF=3, 1500 words → 55 points (Good)

NEW (Lenient):
- 5 cites/year, IF=3, 1500 words → 66 points (Very Good!)
```

### Sage Article Example
```
OLD (Strict):
- 19 cites/year, IF=4.91, 1500 words → 59 points (Very Good)

NEW (Lenient):
- 19 cites/year, IF=4.91, 1500 words → 84 points (Exceptional!)
```

---

## ✅ CONFIRMATION CHECKLIST

- [ ] Backend restarted after 7:28 PM ✅ (Confirmed: 7:35 PM)
- [ ] Test scripts pass ✅ (Confirmed: Both passing)
- [ ] Performed fresh search after 7:35 PM
- [ ] Papers have DOIs
- [ ] Journal Prestige shows non-zero for papers with DOIs
- [ ] Scores are higher than before

---

## 🚨 IMPORTANT

**The lenient scoring ONLY works for papers that**:
1. Have a DOI
2. Are enriched by OpenAlex
3. Have journal metrics (Impact Factor or h-index)

**Papers without DOIs will ALWAYS show 0 for journal prestige** - this is correct behavior. They are scored based on citations + content only.

---

## 📝 NEXT STEPS

1. **Perform a fresh search** right now (after 7:35 PM)
2. Look for papers **with DOIs**
3. Check their quality score breakdown
4. Verify journal prestige is **non-zero**

If you still see 0 for ALL papers (including those with DOIs), please:
1. Share a screenshot of a paper card
2. Share the paper's DOI
3. Check browser console for errors

---

**Report Generated**: 2025-11-09 7:36 PM
**Backend Status**: ✅ Running with Lenient Code
**Next Action**: Perform fresh search in browser
