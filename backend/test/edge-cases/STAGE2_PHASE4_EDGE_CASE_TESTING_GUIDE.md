# Stage 2 Phase 4: Edge Case Testing Guide
## Phase 10 Day 5.7 - Enterprise-Grade Boundary Validation

**Purpose:** Validate system behavior under extreme, unusual, and boundary conditions
**Duration:** 2-3 hours
**Priority:** HIGH - Prevents production failures
**Success Criteria:** 100% graceful degradation (no crashes, clear error messages)

---

## Testing Philosophy

Edge case testing identifies how the system behaves when pushed beyond normal operating parameters. Unlike functional testing which validates "happy path" scenarios, edge case testing validates:

- **Boundary Conditions:** Minimum/maximum data limits
- **Failure Modes:** Network errors, API failures, timeouts
- **Concurrent Operations:** Multiple simultaneous operations
- **Data Quality Issues:** Missing fields, malformed data, unexpected formats

**Golden Rule:** The system should NEVER crash. It should degrade gracefully with clear user feedback.

---

## Part 1: Data Extremes Testing (45 minutes)

### Test 1.1: Paper with 100+ Authors

**Scenario:** Academic papers from large collaborations (CERN, genome projects)

**Setup:**
1. Search for: "ATLAS Collaboration Higgs boson"
2. Select paper with 100+ authors (common in particle physics)
3. Verify author display

**Expected Behavior:**
- ✅ **Success:** Author list truncated to "First 3 authors et al." with expand option
- ✅ **Success:** Tooltip or modal shows full author list on click
- ✅ **Success:** Author metadata saved correctly in database
- ❌ **Failure:** UI breaks, horizontal scroll, page layout destroyed

**Validation:**
```bash
# Check database integrity
psql -d vqmethod_db -c "SELECT title, array_length(authors, 1) as author_count FROM papers WHERE array_length(authors, 1) > 50 ORDER BY author_count DESC LIMIT 5;"

# Expected: Authors array properly stored, no truncation
```

**Rating Scale:**
- 3 = Perfect: Truncated display + expand option + no UI issues
- 2 = Good: Shows all authors but with scrollbar (acceptable)
- 1 = Poor: Layout breaks, overlapping text, horizontal scroll
- 0 = Fail: Crash, database error, cannot proceed

**Result:**
- [ ] Rating: ___
- [ ] Screenshot attached
- [ ] Notes: ___________________________

---

### Test 1.2: Paper with No Abstract

**Scenario:** Book chapters, conference papers, or incomplete metadata

**Setup:**
1. Search for papers from Crossref: "economics methodology"
2. Look for papers with missing abstracts (common in older publications)
3. Select paper and attempt theme extraction

**Expected Behavior:**
- ✅ **Success:** System detects missing abstract
- ✅ **Success:** UI shows "Abstract not available" message
- ✅ **Success:** Theme extraction skips paper with warning: "Paper X skipped (no abstract)"
- ✅ **Success:** Extraction continues with remaining papers
- ❌ **Failure:** Crash, empty themes, no warning

**API Test:**
```bash
# Test extraction with papers missing abstracts
curl -X POST http://localhost:4000/api/literature/themes/unified-extract \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sources": [
      {
        "type": "paper",
        "id": "test-no-abstract",
        "title": "Some Economics Paper",
        "content": ""
      }
    ],
    "options": {
      "researchContext": "economics",
      "minConfidence": 0.5
    }
  }'

# Expected: 400 Bad Request OR partial success with warning
```

**Rating Scale:**
- 3 = Perfect: Detection + warning message + graceful skip
- 2 = Good: Extraction proceeds but generates low-quality themes
- 1 = Poor: No warning but doesn't crash
- 0 = Fail: Crash, 500 error, UI freeze

**Result:**
- [ ] Rating: ___
- [ ] Error logs: ___________________________

---

### Test 1.3: Search with 10K Results (Pagination Stress Test)

**Scenario:** Broad queries returning massive result sets

**Setup:**
1. Search for: "machine learning"
2. Select multiple sources: arXiv + Crossref + PubMed
3. System may return 10K+ total results across sources

**Expected Behavior:**
- ✅ **Success:** Results load in batches (pagination or infinite scroll)
- ✅ **Success:** Performance remains smooth (<3s per page load)
- ✅ **Success:** Selection state persists across pages
- ✅ **Success:** "Select All" limited to current page or prompts confirmation
- ❌ **Failure:** Browser tab freezes, memory leak, infinite loading

**Performance Metrics:**
```bash
# Monitor memory usage during large search
# Open Chrome DevTools → Performance tab
# Record while loading 10K results

# Success criteria:
# - Heap size < 500MB
# - No memory leaks (sawtooth pattern acceptable)
# - Frame rate ≥30fps during scroll
```

**Rating Scale:**
- 3 = Perfect: Smooth pagination + fast loads + no memory issues
- 2 = Good: Slight slowdown after 5K results but still usable
- 1 = Poor: Laggy scrolling, high memory (>1GB), but doesn't crash
- 0 = Fail: Browser freeze, tab crash, out of memory

**Result:**
- [ ] Rating: ___
- [ ] Memory snapshot: ___________________________
- [ ] Performance profile: ___________________________

---

### Test 1.4: Extraction with 1 Paper (Minimum Edge Case)

**Scenario:** User selects only 1 paper for theme extraction

**Setup:**
1. Search for any topic
2. Select exactly 1 paper
3. Extract themes

**Expected Behavior:**
- ✅ **Success:** Extraction completes successfully
- ✅ **Success:** Returns 3-8 themes (reasonable for single paper)
- ✅ **Success:** All themes linked to source paper in provenance
- ❌ **Failure:** Error "Need at least 2 papers", empty themes, provenance missing

**API Test:**
```bash
curl -X POST http://localhost:4000/api/literature/themes/unified-extract \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sources": [
      {
        "type": "paper",
        "id": "single-paper-test",
        "title": "Climate Change Impacts",
        "content": "Climate change poses significant challenges to agricultural systems..."
      }
    ],
    "options": {
      "researchContext": "agriculture",
      "minConfidence": 0.5
    }
  }'

# Expected: 200 OK with themes array (3-8 themes)
```

**Rating Scale:**
- 3 = Perfect: Works flawlessly, appropriate theme count
- 2 = Good: Works but generates too few (<3) or too many (>10) themes
- 1 = Poor: Works but themes are generic/low quality
- 0 = Fail: Error, crash, or refuses to process

**Result:**
- [ ] Rating: ___
- [ ] Theme count: ___
- [ ] Theme quality: ___________________________

---

### Test 1.5: Extraction with 100 Papers (Maximum Edge Case)

**Scenario:** Systematic literature review with large corpus

**Setup:**
1. Search for broad topic
2. Select 100 papers (if UI allows)
3. Attempt extraction

**Expected Behavior:**
- ✅ **Success:** System warns "This may take 20-40 minutes"
- ✅ **Success:** Option offered: "Extract from top 25 most-cited papers instead"
- ✅ **Success:** If proceeding, extraction completes without crash
- ✅ **Success:** Progress bar updates incrementally (1%, 2%, 3%...)
- ❌ **Failure:** No warning, browser tab freezes, backend timeout

**Note:** This test validates the batch processing endpoint created in Day 5.5

**API Test:**
```bash
# Test batch extraction with 100 papers (simulated)
# Use stub data to avoid 100x OpenAI API calls

curl -X POST http://localhost:4000/api/literature/themes/unified-extract-batch \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d @test-data/100-papers-payload.json

# Monitor:
# - Request timeout (should be >600s for 100 papers)
# - Memory usage (should stay <1GB)
# - Progress events (should emit 100 times)
```

**Rating Scale:**
- 3 = Perfect: Warning + sampling option + completes successfully
- 2 = Good: Warning shown but no sampling option (processes all 100)
- 1 = Poor: No warning but completes eventually
- 0 = Fail: Timeout, crash, out of memory

**Result:**
- [ ] Rating: ___
- [ ] Processing time: ___
- [ ] Issues encountered: ___________________________

---

### Test 1.6: Video-Only Extraction (Zero Papers Edge Case)

**Scenario:** User wants themes from videos only (no papers)

**Setup:**
1. Navigate to theme extraction
2. Add 3 YouTube videos (skip paper search)
3. Extract themes

**Expected Behavior:**
- ✅ **Success:** Extraction proceeds normally
- ✅ **Success:** Themes specific to video content (not generic)
- ✅ **Success:** Provenance links to video sources correctly
- ❌ **Failure:** Error "Must add papers first", crash, provenance missing

**Manual Test:**
1. Go to http://localhost:3000/discover/literature
2. Click "Add Video Source" (if available)
3. Enter YouTube URLs:
   - https://www.youtube.com/watch?v=aircAruvnKk (Neural Networks)
   - https://www.youtube.com/watch?v=IHZwWFHWa-w (Gradient Descent)
4. Extract themes

**Rating Scale:**
- 3 = Perfect: Works seamlessly with video-only sources
- 2 = Good: Works but video metadata not captured
- 1 = Poor: Requires at least 1 paper to be added
- 0 = Fail: Error, crash, or UI doesn't support video-only

**Result:**
- [ ] Rating: ___
- [ ] Video support status: ___________________________

---

## Part 2: Network Chaos Testing (45 minutes)

### Test 2.1: Network Disconnect During Search

**Scenario:** User loses internet connection mid-search

**Setup:**
1. Start a search for "quantum computing"
2. **Immediately after clicking search**, disconnect network:
   - macOS: Turn off Wi-Fi
   - Chrome DevTools: Open Network tab → Throttling → Offline
3. Observe behavior

**Expected Behavior:**
- ✅ **Success:** Toast notification: "Network error. Please check your connection."
- ✅ **Success:** Search button re-enabled for retry
- ✅ **Success:** No crash, no infinite loading spinner
- ❌ **Failure:** Silent failure, infinite spinner, crash, or unhelpful error

**Test Script:**
```bash
# Automated test using Chrome DevTools Protocol
# File: backend/test/edge-cases/network-chaos.spec.ts

it('should handle network disconnect during search', async () => {
  // Start search
  const searchPromise = page.click('button[type="submit"]');

  // Disconnect network after 500ms
  setTimeout(() => {
    page.setOfflineMode(true);
  }, 500);

  // Wait for error handling
  await page.waitForSelector('.toast-error', { timeout: 5000 });

  const errorText = await page.$eval('.toast-error', el => el.textContent);
  expect(errorText).toContain('Network error');
});
```

**Rating Scale:**
- 3 = Perfect: Clear error message + retry option + graceful recovery
- 2 = Good: Error message shown but generic
- 1 = Poor: Silent failure, user must refresh page
- 0 = Fail: Crash, infinite loading, or unhelpful error

**Result:**
- [ ] Rating: ___
- [ ] Error message: ___________________________
- [ ] Recovery method: ___________________________

---

### Test 2.2: Network Disconnect During Theme Extraction

**Scenario:** Connection lost during long-running extraction

**Setup:**
1. Select 5 papers for extraction
2. Click "Extract Themes"
3. After 5 seconds, disconnect network
4. Observe progress and recovery

**Expected Behavior:**
- ✅ **Success:** Current paper completes (or fails gracefully)
- ✅ **Success:** Error shown: "Extraction interrupted. Partial results available."
- ✅ **Success:** Themes from completed papers are displayed
- ✅ **Success:** Option to "Retry remaining papers" when connection restored
- ❌ **Failure:** All results lost, crash, no retry option

**Test Script:**
```bash
# Manual test checklist
1. Start extraction of 5 papers
2. Watch progress bar reach ~40%
3. Disconnect network (Wi-Fi off or DevTools offline)
4. Wait 30 seconds
5. Check if partial results saved
6. Reconnect network
7. Check if retry option appears
```

**Rating Scale:**
- 3 = Perfect: Partial results saved + retry option + no data loss
- 2 = Good: Partial results saved but no retry (must start over)
- 1 = Poor: All progress lost but doesn't crash
- 0 = Fail: Crash, infinite loading, or corrupted data

**Result:**
- [ ] Rating: ___
- [ ] Partial results preserved: Yes / No
- [ ] Retry functionality: Yes / No

---

### Test 2.3: OpenAI API Rate Limit (429 Error)

**Scenario:** Hitting OpenAI rate limits during extraction

**Setup:**
1. Rapidly trigger multiple extractions (or wait until natural rate limit hit)
2. OpenAI returns 429 Too Many Requests

**Expected Behavior:**
- ✅ **Success:** System detects 429 error
- ✅ **Success:** Automatic retry with exponential backoff
- ✅ **Success:** User sees: "Rate limit reached. Retrying in 10s..."
- ✅ **Success:** Extraction completes after retry
- ❌ **Failure:** Extraction fails permanently, no retry, crash

**Code Review:**
```typescript
// File: backend/src/modules/literature/services/unified-theme-extraction.service.ts
// Look for retry logic:

try {
  const response = await this.openai.chat.completions.create({...});
} catch (error) {
  if (error.status === 429) {
    // Should implement exponential backoff retry
    // Check if this exists
  }
}
```

**Rating Scale:**
- 3 = Perfect: Automatic retry + exponential backoff + user notification
- 2 = Good: Automatic retry but no user notification
- 1 = Poor: No retry, user sees error and must manually retry
- 0 = Fail: Crash or permanent failure

**Result:**
- [ ] Rating: ___
- [ ] Retry mechanism exists: Yes / No
- [ ] User notification: Yes / No

---

### Test 2.4: API Timeout (Extraction Takes >2 Minutes)

**Scenario:** Long-running extraction exceeds request timeout

**Setup:**
1. Select 10+ papers for extraction
2. If using free OpenAI tier, this may trigger timeout
3. Observe behavior after 2 minutes

**Expected Behavior:**
- ✅ **Success:** Request timeout set to ≥600s (10 minutes) for extraction endpoints
- ✅ **Success:** If timeout occurs, partial results returned
- ✅ **Success:** User can retry failed papers individually
- ❌ **Failure:** 504 Gateway Timeout, all progress lost

**Configuration Check:**
```typescript
// File: frontend/lib/api/client.ts
// Check timeout settings:

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 120000, // This should be 600000 (10 minutes) for extraction endpoints
});

// OR check per-request override:
export const extractThemes = (data) => {
  return apiClient.post('/literature/themes/unified-extract', data, {
    timeout: 600000, // 10 minutes
  });
};
```

**Rating Scale:**
- 3 = Perfect: High timeout + partial results + retry option
- 2 = Good: High timeout but no partial results
- 1 = Poor: Default timeout (2 min) but extraction usually completes
- 0 = Fail: Timeout errors frequent, no retry

**Result:**
- [ ] Rating: ___
- [ ] Current timeout setting: ___
- [ ] Recommended change: ___________________________

---

## Part 3: Concurrent Operations Testing (30 minutes)

### Test 3.1: Two Simultaneous Theme Extractions

**Scenario:** User opens two browser tabs and starts extraction in both

**Setup:**
1. Open http://localhost:3000/discover/literature in two tabs
2. In Tab 1: Select 5 papers, click "Extract Themes"
3. In Tab 2: Select 5 different papers, click "Extract Themes"
4. Observe both extractions

**Expected Behavior:**
- ✅ **Success:** Both extractions proceed independently
- ✅ **Success:** Progress bars update correctly in each tab
- ✅ **Success:** Results display correctly in each tab (no cross-contamination)
- ✅ **Success:** Backend handles concurrent requests (rate limiting respected)
- ❌ **Failure:** One tab fails, results mixed up, session conflict

**Backend Verification:**
```bash
# Check backend logs for concurrency control
# File: backend/src/modules/literature/services/unified-theme-extraction.service.ts

# Should see p-limit throttling to 2 concurrent GPT-4 calls:
# [Theme Extraction] Processing batch 1 of 1 (5 sources)...
# [Theme Extraction] Concurrency limit: 2 concurrent requests
```

**Rating Scale:**
- 3 = Perfect: Both complete independently, correct rate limiting
- 2 = Good: Both complete but slower than expected (over-throttling)
- 1 = Poor: One extraction blocks the other (serialized instead of parallel)
- 0 = Fail: One fails, results mixed, or crash

**Result:**
- [ ] Rating: ___
- [ ] Completion time tab 1: ___
- [ ] Completion time tab 2: ___
- [ ] Issues: ___________________________

---

### Test 3.2: Browser Tab Closure During Extraction

**Scenario:** User closes browser tab mid-extraction

**Setup:**
1. Start extraction of 10 papers
2. After progress reaches 30%, close browser tab
3. Reopen application and check extraction status

**Expected Behavior:**
- ✅ **Success:** Backend continues processing (doesn't abort)
- ✅ **Success:** User can view partial results in library/history
- ✅ **Success:** No corrupted data in database
- ❌ **Failure:** Extraction aborted, orphaned records, database locked

**Database Check:**
```sql
-- Check for incomplete extraction records
SELECT id, status, created_at
FROM theme_extractions
WHERE status = 'in_progress'
  AND created_at < NOW() - INTERVAL '10 minutes'
ORDER BY created_at DESC;

-- Should be empty (or have cleanup mechanism)
```

**Rating Scale:**
- 3 = Perfect: Background processing + partial results saved
- 2 = Good: Extraction aborted gracefully (no corruption)
- 1 = Poor: Extraction aborted, some data lost
- 0 = Fail: Database corruption, orphaned records

**Result:**
- [ ] Rating: ___
- [ ] Background processing: Yes / No
- [ ] Partial results: Yes / No

---

### Test 3.3: Session Timeout During Long Extraction

**Scenario:** JWT token expires during 20-minute extraction

**Setup:**
1. Set JWT expiration to 5 minutes (for testing)
2. Start extraction of 25 papers (will take >5 minutes)
3. Observe behavior after token expires

**Expected Behavior:**
- ✅ **Success:** Token refresh mechanism refreshes JWT automatically
- ✅ **Success:** Extraction continues without interruption
- ✅ **Success:** If token refresh fails, user sees: "Session expired. Please log in."
- ✅ **Success:** Partial results saved before logout
- ❌ **Failure:** Extraction fails silently, results lost, crash

**Token Configuration:**
```typescript
// File: backend/src/modules/auth/auth.service.ts
// Check JWT expiration:

const payload = { sub: user.id, email: user.email };
return {
  accessToken: this.jwtService.sign(payload, {
    expiresIn: '1h', // Should be 1h or longer
  }),
};

// File: frontend/lib/api/client.ts
// Check for token refresh interceptor:

apiClient.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      // Should attempt token refresh here
    }
    return Promise.reject(error);
  }
);
```

**Rating Scale:**
- 3 = Perfect: Automatic token refresh + no interruption
- 2 = Good: Token expires but extraction continues (uses background job)
- 1 = Poor: Token expires, extraction fails, but partial results saved
- 0 = Fail: All progress lost on token expiration

**Result:**
- [ ] Rating: ___
- [ ] Token refresh mechanism: Yes / No
- [ ] JWT expiration time: ___

---

## Part 4: Malformed Data Testing (30 minutes)

### Test 4.1: Paper with Invalid DOI Format

**Scenario:** DOI field contains garbage data

**Setup:**
1. Use API to create paper with invalid DOI:

```bash
curl -X POST http://localhost:4000/api/papers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Paper",
    "authors": ["John Doe"],
    "year": 2024,
    "doi": "NOT_A_VALID_DOI_123",
    "abstract": "Sample abstract"
  }'
```

**Expected Behavior:**
- ✅ **Success:** Paper saved, DOI validation warning logged
- ✅ **Success:** UI displays DOI as plain text (no link)
- ✅ **Success:** No crash during rendering
- ❌ **Failure:** Crash, UI breaks, cannot display paper

**Rating Scale:**
- 3 = Perfect: Graceful handling + validation warning
- 2 = Good: Accepts invalid DOI but displays correctly
- 1 = Poor: Accepts invalid DOI, UI shows broken link
- 0 = Fail: Crash or refuses to save

**Result:**
- [ ] Rating: ___

---

### Test 4.2: Paper with Extremely Long Title (1000+ characters)

**Scenario:** Title field exceeds expected length

**Setup:**
```bash
curl -X POST http://localhost:4000/api/papers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"$(python3 -c 'print("A" * 1000)')\",
    \"authors\": [\"Test Author\"],
    \"year\": 2024,
    \"abstract\": \"Sample abstract\"
  }"
```

**Expected Behavior:**
- ✅ **Success:** Title truncated to 500 chars with "..." in UI
- ✅ **Success:** Full title stored in database
- ✅ **Success:** Tooltip or expand option shows full title
- ❌ **Failure:** Layout breaks, horizontal scroll, crash

**Rating Scale:**
- 3 = Perfect: Truncation + expand option + DB stores full
- 2 = Good: Truncation but no expand option
- 1 = Poor: No truncation, layout breaks slightly
- 0 = Fail: Crash, database constraint error

**Result:**
- [ ] Rating: ___

---

### Test 4.3: Search Query with Special Characters

**Scenario:** User enters SQL injection attempt or special chars

**Setup:**
1. Search for: `'; DROP TABLE papers;--`
2. Search for: `<script>alert('XSS')</script>`
3. Search for: `量子计算机 机器学习` (Chinese characters)

**Expected Behavior:**
- ✅ **Success:** All queries handled safely (no SQL injection)
- ✅ **Success:** Special characters properly escaped
- ✅ **Success:** Unicode characters work correctly
- ❌ **Failure:** SQL error, XSS vulnerability, crash

**Rating Scale:**
- 3 = Perfect: All queries safe + Unicode support
- 2 = Good: SQL injection prevented but Unicode fails
- 1 = Poor: Queries work but not properly sanitized
- 0 = Fail: SQL injection possible, crash, or XSS

**Result:**
- [ ] Rating: ___

---

## Test Results Summary

### Part 1: Data Extremes (6 tests)
- [ ] Test 1.1 (100+ authors): Rating ___
- [ ] Test 1.2 (No abstract): Rating ___
- [ ] Test 1.3 (10K results): Rating ___
- [ ] Test 1.4 (1 paper): Rating ___
- [ ] Test 1.5 (100 papers): Rating ___
- [ ] Test 1.6 (Video-only): Rating ___

**Part 1 Average:** ___ / 3.0

### Part 2: Network Chaos (4 tests)
- [ ] Test 2.1 (Disconnect during search): Rating ___
- [ ] Test 2.2 (Disconnect during extraction): Rating ___
- [ ] Test 2.3 (API rate limit): Rating ___
- [ ] Test 2.4 (API timeout): Rating ___

**Part 2 Average:** ___ / 3.0

### Part 3: Concurrent Operations (3 tests)
- [ ] Test 3.1 (Simultaneous extractions): Rating ___
- [ ] Test 3.2 (Tab closure): Rating ___
- [ ] Test 3.3 (Session timeout): Rating ___

**Part 3 Average:** ___ / 3.0

### Part 4: Malformed Data (3 tests)
- [ ] Test 4.1 (Invalid DOI): Rating ___
- [ ] Test 4.2 (Long title): Rating ___
- [ ] Test 4.3 (Special chars): Rating ___

**Part 4 Average:** ___ / 3.0

---

## Overall Edge Case Testing Score

**Total Tests:** 16
**Tests Passed (Rating ≥2):** ___ / 16
**Pass Rate:** ____%
**Average Rating:** ___ / 3.0

### Success Criteria:
- ✅ **Pass:** ≥90% pass rate (14/16 tests with rating ≥2)
- ⚠️ **Partial:** 75-89% pass rate (12-13 tests pass)
- ❌ **Fail:** <75% pass rate (needs rework)

### Critical Issues Found:
1. ___________________________
2. ___________________________
3. ___________________________

### Recommendations:
1. ___________________________
2. ___________________________
3. ___________________________

---

## Next Steps

After completing edge case testing:
1. Document all critical issues in GitHub Issues
2. Prioritize fixes (P0 = crashes, P1 = poor UX, P2 = minor)
3. Proceed to Stage 3: Cross-Cutting Concerns (Performance, Security, Accessibility)

**Stage 2 Phase 4 Status:** [ ] Complete [ ] Needs Rework

---

**Testing Guide Version:** 1.0
**Last Updated:** October 29, 2025
**Owner:** Phase 10 Day 5.7 Stage 2 Phase 4
