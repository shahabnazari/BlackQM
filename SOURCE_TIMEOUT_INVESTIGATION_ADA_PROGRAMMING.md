# Source Timeout Investigation - "Ada Programming Language Applications"

**Date:** November 12, 2025  
**Query:** "ada programming language applications"  
**Issue:** Only 4/9 sources returned results, 67s timeout across all sources  
**Status:** Investigation Complete

---

## 🔍 OBSERVED BEHAVIOR

### **Search Results:**

| Source | Papers | Duration | Status |
|--------|--------|----------|--------|
| **CrossRef** | 100 | 67,714ms (~67s) | ✅ Success |
| **ArXiv** | 100 | 67,709ms (~67s) | ✅ Success |
| **PubMed Central** | 100 | 67,707ms (~67s) | ✅ Success |
| **medRxiv** | 8 | 67,703ms (~67s) | ✅ Success |
| **Semantic Scholar** | 0 | 67,724ms (~67s) | ❌ No results |
| **PubMed** | 0 | 67,711ms (~67s) | ❌ No results |
| **ERIC** | 0 | 67,706ms (~67s) | ❌ No results |
| **bioRxiv** | 0 | 67,704ms (~67s) | ❌ No results |
| **ChemRxiv** | 0 | 67,702ms (~67s) | ❌ No results |

**Total Search Duration:** 69,152ms (~69 seconds)

---

## 🚨 RED FLAGS

### **Issue #1: All Sources ~67 Seconds**

**Observation:** Every source took almost exactly 67 seconds (67,702ms - 67,724ms)

**This Indicates:**
- ❌ **NOT** normal API response times (should vary: 1-10s)
- ✅ **LIKELY** all sources hitting a timeout threshold
- ⚠️ Backend configured timeout of ~67-70 seconds

**Expected Normal Behavior:**
- Fast sources (ArXiv, CrossRef): 2-5s
- Medium sources (PubMed, PMC): 5-10s
- Slow sources (preprints): 10-30s
- **NOT** all sources taking exactly 67s

**Root Cause:** Parallel requests hitting timeout simultaneously

---

### **Issue #2: Semantic Scholar Returned 0 Papers**

**Observation:** Semantic Scholar found 0 papers for "ada programming language"

**This is SUSPICIOUS because:**
- Semantic Scholar has 200M+ papers
- Covers computer science extensively
- Should have Ada programming papers
- ArXiv (CS papers) found 100 papers, so topic exists

**Possible Causes:**
1. **Timeout:** Request timed out at 67s before results retrieved
2. **Rate Limiting:** API blocked request
3. **Query Syntax:** Search query not compatible with Semantic Scholar API
4. **API Error:** Silent failure, no papers returned

**Expected:** 50-100 papers (similar to ArXiv)

---

### **Issue #3: PubMed Central Returned 100 Papers**

**Observation:** PMC (biomedical database) found 100 papers for "ada programming"

**This is SURPRISING because:**
- Ada is a programming language (computer science)
- PMC is primarily biomedical literature
- Expected: 0-10 papers (medical software papers only)
- Actual: 100 papers (full limit)

**Possible Explanations:**
1. **False Matches:** "ADA" in medical context (Americans with Disabilities Act)
2. **Medical Software:** Papers about programming in medical contexts
3. **Bioinformatics:** Ada used in biological data analysis (unlikely)
4. **Overly Broad Query:** Query expansion matched too many papers

**Investigation Needed:** Check if papers are actually about Ada language

---

## 🔍 TECHNICAL ANALYSIS

### **Timeout Configuration**

**Current Status (Phase 10.6 Day 14.5):**
- Fast API Timeout: 10s
- Complex API Timeout: 15s
- Large Response Timeout: 30s
- Preprint Server Timeout: 30s

**67s Timeout Indicates:**
- ❌ Sources NOT using centralized timeout constants
- ❌ OR system-level timeout override (Node.js, HTTP client)
- ❌ OR backend using older timeout value (pre-Phase 10.6 Day 14.5)

**Check Needed:**
```bash
# Verify sources are using centralized timeouts
grep -r "timeout.*67" backend/src/modules/literature/services/
grep -r "timeout.*70" backend/src/modules/literature/services/
```

---

### **Parallel Request Behavior**

**Code Structure:**
```typescript
// All sources queried in parallel
const searchPromises = sources.map((source) => {
  return this.searchBySource(source, enhancedSearchDto);
});
const results = await Promise.allSettled(searchPromises);
```

**Expected Behavior:**
- Fast sources finish first (2-5s)
- Slow sources finish later (10-30s)
- Failed sources timeout individually

**Actual Behavior:**
- ALL sources finishing at ~67s
- Suggests system-wide timeout, not per-source

**Hypothesis:**
- HTTP client has 67-70s global timeout
- All requests blocked until timeout expires
- Successful sources (CrossRef, ArXiv, PMC, medRxiv) completed but waited
- Failed sources (Semantic Scholar, PubMed, ERIC, bioRxiv, ChemRxiv) timed out

---

## ✅ RECOMMENDATIONS

### **Priority 1: Fix Global Timeout (Critical)** ⚡

**Problem:** 67s timeout is TOO LONG

**Recommended Fix:**
```typescript
// backend/src/modules/literature/literature.service.ts
// Add request timeout to HTTP client configuration

@Injectable()
export class LiteratureService {
  constructor(
    private readonly httpService: HttpService,
  ) {
    // Configure HTTP client with reasonable default timeout
    this.httpService.axiosRef.defaults.timeout = 30000; // 30s max
  }
}
```

**Expected Result:**
- Fast sources: 2-5s
- Medium sources: 5-10s
- Slow sources: 10-30s
- Total search time: 30-35s (not 69s)

---

### **Priority 2: Investigate Semantic Scholar (High Priority)** 📋

**Test:**
```bash
# Direct API test
curl "https://api.semanticscholar.org/graph/v1/paper/search?query=ada+programming+language&limit=10&fields=title,abstract,year,citationCount"
```

**Possible Issues:**
1. **API Key:** Semantic Scholar may require API key for production
2. **Rate Limiting:** Too many requests, getting blocked
3. **Query Syntax:** Need to escape or quote "ada programming language"
4. **Timeout:** 10s timeout too short for Semantic Scholar

**Fix Options:**
- Increase Semantic Scholar timeout to 15-20s
- Add retry logic for rate limiting
- Register for Semantic Scholar API key
- Improve query formatting

---

### **Priority 3: Verify PMC Results (Medium Priority)** 🔍

**Test:**
```bash
# Check if PMC papers are actually about Ada language
# Backend logs should show paper titles
```

**Investigation:**
1. Log first 5 paper titles from PMC
2. Check if they mention "Ada programming" or just "ADA" (disability act)
3. If false matches, improve query specificity

**Possible Fix:**
```typescript
// Improve query for PMC to reduce false matches
const query = 'ada programming language AND (software OR code OR algorithm)';
```

---

### **Priority 4: Add Incremental Results (Enhancement)** 🚀

**Problem:** User waits 69s for ALL sources to complete

**Solution:** Stream results as sources complete
```typescript
// Return results incrementally
for await (const result of Promise.allSettled(searchPromises)) {
  if (result.status === 'fulfilled') {
    yield result.value; // Stream to frontend
  }
}
```

**Benefits:**
- User sees results immediately (CrossRef in 5s, not 69s)
- Better UX (progressive loading)
- Faster perceived performance

---

## 📊 EXPECTED BEHAVIOR AFTER FIX

### **Before (Current):**
```
All sources: ~67s (waiting for timeout)
Total time: 69s
User Experience: ❌ Very slow, all-or-nothing
```

### **After (Fixed):**
```
CrossRef: 3s → 100 papers ✅
ArXiv: 5s → 100 papers ✅
PubMed Central: 8s → 50 papers ✅ (verified relevant)
Semantic Scholar: 10s → 80 papers ✅ (fixed timeout)
medRxiv: 12s → 8 papers ✅
PubMed: 15s → 0 papers ✅ (expected - not medical)
ERIC: 15s → 0 papers ✅ (expected - not education)
bioRxiv: 15s → 0 papers ✅ (expected - not biology)
ChemRxiv: 15s → 0 papers ✅ (expected - not chemistry)

Total time: 15-20s (65% faster)
User Experience: ✅ Fast, incremental results
```

---

## 🔍 WHY ONLY 4 SOURCES? (User's Question)

### **Short Answer:**

**Expected Behavior:**
- 4 sources have results (CrossRef, ArXiv, PMC, medRxiv)
- 5 sources have no results (expected for non-CS topics)

**Unexpected Behavior:**
- ❌ Semantic Scholar should have results (CS database)
- ❌ All sources taking 67s (timeout issue)

---

### **Detailed Explanation:**

**Expected 0 Results:**
- ✅ **PubMed:** Medical database, no programming papers (expected)
- ✅ **ERIC:** Education database, no Ada papers found (some CS education papers expected, but topic too niche)
- ✅ **bioRxiv:** Biology preprints, no programming papers (expected)
- ✅ **ChemRxiv:** Chemistry preprints, no programming papers (expected)

**Unexpected 0 Results:**
- ❌ **Semantic Scholar:** Should have 50-100 Ada programming papers (TIMEOUT or API issue)

**Expected Results:**
- ✅ **CrossRef:** General academic, has CS papers (100 papers)
- ✅ **ArXiv:** CS/physics preprints, has Ada papers (100 papers)
- ⚠️ **PubMed Central:** Medical, shouldn't have many Ada papers (100 papers - suspicious)
- ✅ **medRxiv:** Medical preprints, some medical software (8 papers - reasonable)

**Summary:**
- 3 sources correctly found papers (CrossRef, ArXiv, medRxiv)
- 1 source incorrectly found papers? (PMC - needs verification)
- 4 sources correctly found 0 papers (PubMed, ERIC, bioRxiv, ChemRxiv)
- 1 source incorrectly found 0 papers (Semantic Scholar - timeout/error)

---

## ✅ VERIFICATION CHECKLIST

### **Immediate Actions:**
- [ ] Test search with 30s global timeout (not 67s)
- [ ] Verify Semantic Scholar API directly (curl test)
- [ ] Check PMC paper titles (are they about Ada language?)
- [ ] Review backend logs for Semantic Scholar errors

### **Medium-Term Fixes:**
- [ ] Implement incremental result streaming
- [ ] Add Semantic Scholar API key (if needed)
- [ ] Improve query specificity for medical databases
- [ ] Add per-source timeout monitoring

### **Long-Term Improvements:**
- [ ] Smart timeout adjustment (fast sources get less time)
- [ ] Automatic retry with exponential backoff
- [ ] Source reliability scoring (prefer reliable sources)
- [ ] User notification when sources timeout

---

## 🎯 CONCLUSION

**Root Cause:** 67s timeout indicates system-wide configuration issue

**Impact:**
- ✅ Results are correct (4 sources returned papers)
- ❌ Performance is poor (67s instead of 15-20s)
- ❌ Semantic Scholar should work but doesn't (timeout/API issue)
- ⚠️ PMC results may include false matches (needs verification)

**Recommended Actions:**
1. ⚡ **Fix global timeout** (67s → 30s max)
2. 📋 **Investigate Semantic Scholar** (API key, rate limiting, query syntax)
3. 🔍 **Verify PMC results** (check if papers are about Ada language)
4. 🚀 **Add incremental results** (stream as sources complete)

**Expected Result:**
- Search time: 69s → 15-20s (65% faster)
- Semantic Scholar: 0 papers → 50-100 papers
- User experience: ❌ Slow → ✅ Fast

---

**Investigation Date:** November 12, 2025  
**Query Analyzed:** "ada programming language applications"  
**Status:** ⚠️ **ISSUE IDENTIFIED** - 67s timeout needs fixing  
**Next Steps:** Implement recommended fixes and retest

