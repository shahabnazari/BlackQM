# ScienceDirect Article Extraction Test Plan

**Article URL**: https://www.sciencedirect.com/science/article/pii/S0305750X21002680?via%3Dihub

**Test Date**: December 2024  
**Test Objective**: Verify waterfall full-text extraction system works perfectly for ScienceDirect articles

---

## Test Strategy

### Waterfall System Overview

The system uses a 4-tier waterfall approach:

```
Tier 1: Database Cache (0ms) → Check if already fetched
Tier 2: PMC API + HTML Scraping (1-5s) → Structured text extraction
Tier 2.5: GROBID PDF Extraction (2-10s) → Enterprise-grade PDF parsing
Tier 3: Unpaywall PDF (5-15s) → DOI-based open access lookup
Tier 4: Direct Publisher PDF (5-15s) → Publisher-specific URL patterns
```

### Expected Behavior for ScienceDirect

**Publisher**: Elsevier (ScienceDirect)  
**Expected Tier**: Tier 2 (HTML Scraping) or Tier 3/4 (PDF)  
**HTML Selectors**: `#body`, `.Body`, `.article-text`  
**PDF Pattern**: Not directly supported in Tier 4 (requires Unpaywall)

---

## Test Execution Plan

### Phase 1: Backend Health Check ✅
- Verify backend server is running on port 3001
- Check `/api/health` endpoint responds

### Phase 2: Paper Search ✅
- Search for paper by URL or DOI
- Extract paper metadata (title, authors, DOI, etc.)
- Verify paper is saved to database

### Phase 3: Full-Text Extraction ✅
- Trigger waterfall extraction via `/api/literature/papers/:paperId/full-text`
- Monitor tier progression:
  - Tier 1: Cache check (should miss on first run)
  - Tier 2: HTML scraping attempt
  - Tier 2.5: GROBID PDF extraction (if HTML fails)
  - Tier 3: Unpaywall PDF (if GROBID unavailable)
  - Tier 4: Direct PDF (if Unpaywall fails)

### Phase 4: Quality Validation ✅
- Verify extracted text contains:
  - Abstract section
  - Introduction section
  - Conclusion section
  - References section
- Check word count > 1000 (full paper expected)
- Validate text quality (no encoding issues)

### Phase 5: Performance Metrics ✅
- Measure extraction time
- Identify which tier succeeded
- Calculate success rate

---

## Test Execution

### Step 1: Start Backend Server

```bash
cd backend && npm run start:dev
```

**Expected**: Server starts on port 3001

---

### Step 2: Run Test Script

```bash
cd backend && node test-sciencedirect-extraction.js
```

**Expected Output**:
```
🧪 Testing ScienceDirect Paper Text Extraction
================================================================================
📄 URL: https://www.sciencedirect.com/science/article/pii/S0305750X21002680

1️⃣  Checking backend status...
   ✅ Backend is running

2️⃣  Searching for paper by URL...
   ✅ Found paper: [paper-id]
   📊 Title: [paper-title]
   📖 DOI: [doi]
   🔗 URL: [url]

3️⃣  Testing Full-Text Extraction Waterfall...
   🌊 Starting waterfall extraction...
   ⏱️  This may take 30-60 seconds...

   ✅ Extraction completed!

================================================================================
📊 EXTRACTION RESULTS
================================================================================
Status: success
Source: [tier-used]
Word Count: [count]
Duration: [time]s
Success: ✅

================================================================================
🌊 WATERFALL TIER ANALYSIS
================================================================================
Tier Used: [Tier X: Description]

================================================================================
📖 TEXT PREVIEW (First 500 characters)
================================================================================
[text preview]
...

================================================================================
📈 TEXT QUALITY ANALYSIS
================================================================================
Contains Abstract: ✅
Contains Introduction: ✅
Contains Conclusion: ✅
Contains References: ✅

Quality Score: 4/4
Quality Rating: ✅ EXCELLENT - Full paper structure extracted

================================================================================
🎯 FINAL VERDICT
================================================================================
✅ SUCCESS - Waterfall system extracted full text successfully!
   - Tier: [tier-used]
   - Word Count: [count]
   - Duration: [time]s
```

---

## Success Criteria

### ✅ PASS Conditions:
1. Backend server responds to health check
2. Paper is found via search (by URL or DOI)
3. Full-text extraction completes without errors
4. Word count > 1000 (indicates full paper, not just abstract)
5. Text contains all major sections (Abstract, Introduction, Conclusion, References)
6. Quality score >= 3/4
7. Extraction time < 90 seconds

### ❌ FAIL Conditions:
1. Backend server not running
2. Paper not found in any source
3. All waterfall tiers fail
4. Word count < 100 (indicates extraction failure)
5. Text quality score < 2/4
6. Extraction timeout (> 90 seconds)

---

## Troubleshooting Guide

### Issue: Backend Not Running
**Solution**: 
```bash
cd backend && npm run start:dev
```

### Issue: Paper Not Found
**Possible Causes**:
- URL format incorrect
- DOI not indexed in search sources
- Network connectivity issues

**Solution**: Try searching by DOI directly or check paper metadata

### Issue: All Tiers Failed
**Possible Causes**:
- Paper behind paywall (no open access)
- Publisher blocking scraping
- GROBID service unavailable
- Network issues

**Solution**: Check logs for specific tier failures

### Issue: Low Word Count
**Possible Causes**:
- Only abstract extracted (not full text)
- PDF extraction failed
- Text cleaning removed too much content

**Solution**: Check `fullTextSource` to see which tier succeeded

---

## Expected Results for This Article

**Article**: S0305750X21002680 (World Development journal)  
**Publisher**: Elsevier (ScienceDirect)  
**Access**: Likely requires subscription (not open access)

**Expected Tier Success**:
- Tier 1: ❌ (first run, no cache)
- Tier 2 (HTML): ⚠️ (may require subscription)
- Tier 2.5 (GROBID): ⚠️ (requires PDF access)
- Tier 3 (Unpaywall): ⚠️ (may not be open access)
- Tier 4 (Direct PDF): ❌ (ScienceDirect not in Tier 4 patterns)

**Realistic Outcome**: 
- If open access: Tier 2 or 3 should succeed
- If paywalled: May fail all tiers (expected behavior)

---

## Next Steps After Test

### If Test Passes ✅
1. Document successful extraction
2. Verify text quality manually
3. Test with additional ScienceDirect articles
4. Consider adding ScienceDirect to Tier 4 patterns

### If Test Fails ❌
1. Analyze which tier failed and why
2. Check if article is behind paywall
3. Review error logs for specific issues
4. Consider adding ScienceDirect-specific extraction logic

---

## Notes

- ScienceDirect articles often require institutional access
- The waterfall system is designed to gracefully handle paywalled content
- Success depends on open access availability
- GROBID (Tier 2.5) provides best extraction quality when PDF is available
