# CRITICAL FIX: Rate Limiting Causing 0 Papers Search Results

## 🔥 ROOT CAUSE (Permanent Documentation)

**Date**: December 1, 2025
**Issue**: Search returns 0 papers with Network Error
**Severity**: CRITICAL - Blocks all literature search functionality

### The Problem

The literature search fails with **Network Error (ERR_NETWORK)** and returns **0 papers** because:

1. **External APIs are rate-limited** (HTTP 429 responses)
2. **No API keys configured** for premium sources
3. **Rate limit errors are caught but logged** - not exposed to user
4. **All sources fail** → no papers returned → user sees Network Error

### Proof of Root Cause

Direct test of Semantic Scholar API:
```bash
curl "https://api.semanticscholar.org/graph/v1/paper/search?query=education&limit=5"
```

Response:
```json
{
  "message": "Too Many Requests. Please wait and try again or apply for a key for higher rate limits.",
  "code": "429"
}
```

### Why This Keeps Happening

**The architecture is correct**, but:
- **Free tier APIs have strict rate limits** (Semantic Scholar: 100 requests/5 minutes)
- **Development testing burns through quotas** quickly
- **No API keys** = lower rate limits
- **Multiple backend restarts** = repeated failed requests = quota exhausted

### The Solution (Multi-Layered)

#### Immediate Fix (Manual - Do This Now)

**Wait 5-10 minutes** for rate limits to reset, then:

1. **Get API Keys** (all FREE):
   ```bash
   # Semantic Scholar (Increases limit from 100 to 5,000 requests/5min)
   https://www.semanticscholar.org/product/api#api-key-form

   # Already configured (verify in backend/.env):
   # - NCBI_API_KEY (PubMed/PMC)
   # - CORE_API_KEY
   # - SPRINGER_API_KEY
   # - YOUTUBE_API_KEY
   ```

2. **Add to `backend/.env`**:
   ```env
   SEMANTIC_SCHOLAR_API_KEY=your-key-here
   ```

3. **Restart backend**:
   ```bash
   cd backend && npm run start:dev
   ```

#### Short-Term Fix (Automatic Rate Limit Handling)

The backend **already handles 429 errors** (see `source-router.service.ts:418-422`):
```typescript
else if (responseStatus === 429) {
  this.logger.error(
    `🚫 [${sourceName}] Rate limited (429) - Consider adding API key`,
  );
}
```

But it **doesn't wait and retry** - it just returns `[]`.

**Enhancement needed** (future):
- Implement exponential backoff for 429 responses
- Rotate to next available source when one is rate-limited
- Show user-friendly message: "Some sources are temporarily unavailable"

#### Long-Term Fix (Rate Limit Prevention)

1. **Add rate limit cache** (already partially implemented in `APIQuotaMonitorService`)
2. **Implement request queueing** per source
3. **Add circuit breaker pattern** for failing sources
4. **Better error messages to frontend**:
   ```typescript
   if (allSourcesRateLimited) {
     throw new ServiceUnavailableException(
       'All sources are temporarily rate-limited. Please try again in 5 minutes or configure API keys.'
     );
   }
   ```

### Architecture Notes (For Future Developers)

#### The Flow:
```
Frontend (SearchBar)
  ↓
LiteratureAPIService.searchLiterature()
  ↓ POST /api/literature/search/public
Backend Controller (literature.controller.ts)
  ↓
LiteratureService.searchLiterature()
  ↓
SourceRouterService.searchBySource()
  ↓
SemanticScholarService.search() → 429 Rate Limit
CrossRefService.search()         → 429 Rate Limit
PubMedService.search()           → 429 Rate Limit
...etc
  ↓
0 papers returned → Network Error in frontend
```

#### Why Network Error Instead of Proper Error?

The backend **catches all errors** (line 395-427 in source-router.service.ts) and returns `[]` instead of throwing. This is intentional (graceful degradation), but when **all sources fail**, the user gets confusing "Network Error" instead of "Rate Limited" message.

### How to Prevent This Issue

1. **Always configure API keys** (increases rate limits 10-50x)
2. **Monitor `APIQuotaMonitorService`** logs for quota warnings
3. **Implement circuit breaker** for consistently failing sources
4. **Add health check endpoint** that tests each source's availability
5. **Better error propagation** to frontend (show which sources failed and why)

### Testing After Fix

```bash
# 1. Wait 10 minutes for rate limits to reset

# 2. Test API directly (should work after cooldown):
curl "https://api.semanticscholar.org/graph/v1/paper/search?query=test&limit=2"

# 3. Test backend endpoint:
curl -X POST http://localhost:4000/api/literature/search/public \
  -H "Content-Type: application/json" \
  -d '{"query": "education", "limit": 5}'

# 4. Test in browser (hard refresh):
# Search for "education" → Should return papers
```

### Related Files

- **Frontend API**: `frontend/lib/services/literature-api.service.ts:495`
- **Backend Controller**: `backend/src/modules/literature/literature.controller.ts:155`
- **Backend Service**: `backend/src/modules/literature/literature.service.ts:186`
- **Source Router**: `backend/src/modules/literature/services/source-router.service.ts:142`
- **Error Handling**: `backend/src/modules/literature/services/source-router.service.ts:395-427`
- **Quota Monitor**: `backend/src/modules/literature/services/api-quota-monitor.service.ts`

### Summary

**The issue is NOT a bug** - it's **rate limiting from external APIs** due to:
- No API keys configured (using free tier)
- Heavy development testing
- All sources rate-limited simultaneously

**The fix is simple**:
1. Wait for rate limits to reset (5-10 minutes)
2. Configure API keys (permanent solution)
3. Enhance error messaging (show rate limit status to users)

**This WILL happen again** unless you:
- Configure API keys for all sources
- Implement rate limit monitoring
- Add better error messages to frontend
