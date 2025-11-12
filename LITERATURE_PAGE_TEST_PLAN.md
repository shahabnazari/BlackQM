# Literature Page Testing Plan - Phase 10.6 Validation

**Purpose:** Verify all 19 academic sources work end-to-end before proceeding to Phase 10.5/11
**Created:** January 2025
**Status:** Ready for Testing

---

## 🎯 TESTING OBJECTIVES

1. ✅ Verify all 19 sources appear in UI
2. ✅ Test search functionality with multiple sources
3. ✅ Validate paper metadata display
4. ✅ Test theme extraction with full-text papers
5. ✅ Verify error handling for API failures
6. ✅ Check UI responsiveness and loading states

---

## 📋 TEST CHECKLIST

### Part 1: UI Verification (10 minutes)

**Backend Status Check:**
- [ ] Run `cd backend && npm run build` - verify 0 TypeScript errors
- [ ] Run `cd backend && npm run start:dev` - verify server starts
- [ ] Check logs for all 19 services initialized

**Frontend Status Check:**
- [ ] Run `cd frontend && npm run dev` - verify frontend starts
- [ ] Navigate to `/discover/literature` page
- [ ] Verify AcademicResourcesPanel displays 19 database badges
- [ ] Count Free sources: Should show 11 badges
- [ ] Count Premium sources: Should show 8 badges

**Expected Sources in UI:**

**FREE TIER (11):**
1. ✓ PubMed (🏥)
2. ✓ PubMed Central (📖)
3. ✓ ArXiv (📐)
4. ✓ bioRxiv (🧬)
5. ✓ medRxiv (🏥)
6. ✓ ChemRxiv (⚗️)
7. ✓ Semantic Scholar (🎓)
8. ✓ Google Scholar (🔍)
9. ✓ SSRN (📊)
10. ✓ CrossRef (🔗)
11. ✓ ERIC (🎓)

**PREMIUM TIER (8):**
12. ✓ Web of Science (🌐)
13. ✓ Scopus (🔬)
14. ✓ IEEE Xplore (⚡)
15. ✓ SpringerLink (📚)
16. ✓ Nature (⭐)
17. ✓ Wiley Online Library (🔬)
18. ✓ SAGE Publications (📖)
19. ✓ Taylor & Francis (📚)

---

### Part 2: Search Functionality Tests (30 minutes)

#### Test 1: Single Source Search
- [ ] Select ONLY "Semantic Scholar"
- [ ] Search query: "machine learning"
- [ ] Verify results appear within 5 seconds
- [ ] Verify papers have: title, authors, year, abstract
- [ ] Verify citation counts display
- [ ] Verify quality scores display (if available)

#### Test 2: Multiple Free Sources
- [ ] Select: PubMed + ArXiv + Semantic Scholar
- [ ] Search query: "neural networks"
- [ ] Verify results from all 3 sources
- [ ] Verify source badges display correctly on each paper
- [ ] Verify no duplicate papers (same DOI/title)

#### Test 3: Preprint Sources
- [ ] Select: bioRxiv + medRxiv + ChemRxiv
- [ ] Search query: "covid-19"
- [ ] Verify preprints display with correct dates
- [ ] Verify PDF links are present (all preprints are open access)
- [ ] Click "View PDF" - verify opens in new tab

#### Test 4: Premium Sources (API Key Check)
- [ ] Select: Web of Science
- [ ] Search query: "climate change"
- [ ] **IF API key configured:** Verify results with citation counts and impact factors
- [ ] **IF API key NOT configured:** Verify graceful message: "API key required"
- [ ] Verify backend logs show appropriate warning (not error)

#### Test 5: Error Handling
- [ ] Select: All 19 sources
- [ ] Search query: "invalid query #@$%"
- [ ] Verify no crashes
- [ ] Verify error messages are user-friendly
- [ ] Verify sources without results return empty (not errors)

#### Test 6: Year Range Filtering
- [ ] Select: PubMed + CrossRef
- [ ] Search query: "diabetes"
- [ ] Set year range: 2020-2024
- [ ] Verify all results are within date range
- [ ] Verify year filter applies to all selected sources

---

### Part 3: Paper Management Tests (20 minutes)

#### Test 7: Save Papers
- [ ] Search for papers in Semantic Scholar
- [ ] Click "Save" on 3 different papers
- [ ] Verify toast notification: "Paper saved successfully"
- [ ] Verify saved papers appear in "My Library"
- [ ] Verify duplicate save shows: "Paper already saved"

#### Test 8: Paper Selection
- [ ] Search for papers
- [ ] Select 5 papers via checkboxes
- [ ] Verify "5 papers selected" count displays
- [ ] Verify bulk actions toolbar appears
- [ ] Verify "Select All" button works
- [ ] Verify "Deselect All" button works

#### Test 9: Full-Text Availability
- [ ] Search PubMed Central: "cancer treatment"
- [ ] Identify papers with "Full-Text Available" badge
- [ ] Verify PDF icon displays for available papers
- [ ] Verify word count displays (e.g., "5,234 words")
- [ ] Click "View Full-Text" - verify displays correctly

---

### Part 4: Theme Extraction Tests (30 minutes)

#### Test 10: Theme Extraction from Abstracts
- [ ] Search and select 10 papers from Semantic Scholar
- [ ] Click "Extract Themes from All Sources"
- [ ] Verify progress modal appears
- [ ] Verify themes extract within 30 seconds
- [ ] Verify themes have: label, description, keywords, confidence
- [ ] Verify source attribution (which papers contributed to theme)

#### Test 11: Theme Extraction from Full-Text
- [ ] Search PubMed Central: "machine learning healthcare"
- [ ] Select 5 papers with full-text available
- [ ] Click "Extract Themes"
- [ ] Verify extraction takes longer (more content)
- [ ] Verify themes are MORE DETAILED than abstract-only
- [ ] Verify word count metrics show full-text vs abstract distinction

#### Test 12: Multi-Source Theme Extraction
- [ ] Select papers from: ArXiv (3) + bioRxiv (3) + PMC (4) = 10 total
- [ ] Click "Extract Themes"
- [ ] Verify themes synthesize across all sources
- [ ] Verify provenance shows which sources contributed
- [ ] Verify theme quality scores reflect multi-source confidence

---

### Part 5: Advanced Features Tests (20 minutes)

#### Test 13: Cost Calculator
- [ ] Select 20 papers
- [ ] Verify cost calculator displays estimated API costs
- [ ] Verify cost breakdown by source
- [ ] Verify "Institution Access" toggle reduces costs to $0

#### Test 14: Export Citations
- [ ] Select 5 papers
- [ ] Click "Export BibTeX"
- [ ] Verify .bib file downloads
- [ ] Open in text editor - verify correct BibTeX format
- [ ] Verify all 5 papers present in export

#### Test 15: Incremental Extraction
- [ ] Select 5 papers, extract themes
- [ ] Add 5 MORE papers to selection
- [ ] Click "Extract Incrementally"
- [ ] Verify only NEW papers are processed
- [ ] Verify themes merge with existing corpus
- [ ] Verify cost savings message displays

---

### Part 6: Performance Tests (15 minutes)

#### Test 16: Large Search Performance
- [ ] Select: All 19 sources
- [ ] Search query: "artificial intelligence"
- [ ] Measure time to first results
- [ ] **Target:** < 10 seconds for first batch (20 papers)
- [ ] Verify progressive loading (results stream in)
- [ ] Verify no browser freezing

#### Test 17: Concurrent Searches
- [ ] Open 3 browser tabs
- [ ] Run different searches simultaneously:
  - Tab 1: "neural networks" (Semantic Scholar)
  - Tab 2: "cancer research" (PubMed)
  - Tab 3: "climate change" (CrossRef)
- [ ] Verify all complete successfully
- [ ] Verify no request conflicts or errors

#### Test 18: Memory Leak Check
- [ ] Perform 10 consecutive searches
- [ ] Check browser DevTools → Performance → Memory
- [ ] Verify memory usage doesn't continuously grow
- [ ] Verify garbage collection occurs between searches

---

### Part 7: Error Recovery Tests (15 minutes)

#### Test 19: Network Error Handling
- [ ] Search for papers
- [ ] While loading, turn off WiFi
- [ ] Verify graceful error message: "Network error, please check connection"
- [ ] Turn WiFi back on
- [ ] Click "Retry" - verify search resumes

#### Test 20: API Rate Limit Handling
- [ ] Select a premium source with low rate limit
- [ ] Run 5 rapid consecutive searches
- [ ] Verify rate limit message displays (if hit)
- [ ] Verify cached results used when available
- [ ] Verify QuotaMonitor prevents excessive calls

#### Test 21: Invalid API Key Handling
- [ ] Remove API key for Google Scholar (SERPAPI_KEY)
- [ ] Search Google Scholar
- [ ] Verify error message: "API key required for Google Scholar"
- [ ] Verify backend logs helpful message (not crash)
- [ ] Add API key back - verify search works

---

## 🔍 BACKEND API TESTS (15 minutes)

### Test 22: Direct API Calls

**Using curl or Postman:**

```bash
# Test 1: Search Semantic Scholar
curl -X POST http://localhost:4000/api/literature/search/public \
  -H "Content-Type: application/json" \
  -d '{
    "query": "machine learning",
    "sources": ["semantic_scholar"],
    "limit": 10
  }'

# Expected: 200 OK with array of papers

# Test 2: Search Multiple Sources
curl -X POST http://localhost:4000/api/literature/search/public \
  -H "Content-Type: application/json" \
  -d '{
    "query": "neural networks",
    "sources": ["semantic_scholar", "arxiv", "pubmed"],
    "yearFrom": 2020,
    "yearTo": 2024,
    "limit": 20
  }'

# Expected: 200 OK with papers from all 3 sources

# Test 3: Theme Extraction
curl -X POST http://localhost:4000/api/literature/themes/extract-academic \
  -H "Content-Type: application/json" \
  -d '{
    "sources": [
      {
        "type": "paper",
        "title": "Machine Learning in Healthcare",
        "content": "Abstract content here..."
      }
    ],
    "researchContext": "Healthcare AI applications",
    "maxThemes": 10
  }'

# Expected: 200 OK with extracted themes
```

---

## 📊 SUCCESS CRITERIA

**For literature page to be considered "working best":**

1. ✅ All 19 sources appear in UI (MANDATORY)
2. ✅ Search completes in <10s for first results (MANDATORY)
3. ✅ Zero TypeScript errors in backend/frontend (MANDATORY)
4. ✅ Theme extraction completes in <60s for 10 papers (MANDATORY)
5. ✅ No crashes during normal usage (MANDATORY)
6. ✅ Graceful error handling for API failures (MANDATORY)
7. ✓ Premium sources show "API key required" message when unconfigured (NICE TO HAVE)
8. ✓ Full-text extraction works for PMC papers (NICE TO HAVE)
9. ✓ Export functionality works for BibTeX (NICE TO HAVE)
10. ✓ UI is responsive on mobile/tablet (NICE TO HAVE)

**BLOCKING ISSUES** (must fix before Phase 10.5/11):
- Backend compilation errors
- Frontend crashes during search
- Theme extraction failures
- Data loss on save/load

**NON-BLOCKING ISSUES** (can fix later):
- Slow searches (>10s)
- Missing API key error messages
- UI polish issues
- Mobile responsiveness

---

## 🐛 ISSUE TRACKING

**Found Issues During Testing:**

| # | Issue | Severity | Status | Fix Time |
|---|-------|----------|--------|----------|
| 1 | [Example] Search crashes on empty query | HIGH | Fixed | 5 min |
| 2 | [Example] PubMed rate limit not handled | MEDIUM | Open | 30 min |
| 3 | [Example] Mobile UI overlaps | LOW | Deferred | 2 hours |

---

## 🚀 AFTER TESTING COMPLETE

**IF ALL TESTS PASS:**
- ✅ Mark Phase 10.6 as VERIFIED WORKING
- ✅ Proceed to Phase 10.5 (Interoperability Hub) OR Phase 11 (Archive System)
- ✅ Update Phase Tracker with verification date

**IF BLOCKING ISSUES FOUND:**
- ❌ DO NOT proceed to next phase
- ❌ Fix all MANDATORY criteria failures
- ❌ Re-run affected tests
- ❌ Mark Phase 10.6 as "Complete but needs fixes"

---

## 📝 TESTING LOG TEMPLATE

```markdown
## Literature Page Test Session

**Date:** [Date]
**Tester:** [Name]
**Environment:** [Local/Staging/Production]
**Browser:** [Chrome/Firefox/Safari]
**Duration:** [Time]

### Tests Completed:
- [ ] Part 1: UI Verification (10 min)
- [ ] Part 2: Search Functionality (30 min)
- [ ] Part 3: Paper Management (20 min)
- [ ] Part 4: Theme Extraction (30 min)
- [ ] Part 5: Advanced Features (20 min)
- [ ] Part 6: Performance (15 min)
- [ ] Part 7: Error Recovery (15 min)
- [ ] Part 8: Backend API (15 min)

### Results Summary:
- **Tests Passed:** X/22
- **Tests Failed:** X/22
- **Blocking Issues:** X
- **Non-Blocking Issues:** X

### Critical Issues Found:
1. [Issue description]
2. [Issue description]

### Recommendation:
- [ ] ✅ Ready for Phase 10.5/11
- [ ] ❌ Needs fixes before proceeding
```

---

**END OF TEST PLAN**
