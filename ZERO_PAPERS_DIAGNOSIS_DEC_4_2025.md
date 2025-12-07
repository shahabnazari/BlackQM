# Zero Papers Bug - Netflix-Grade Root Cause Analysis
**Date**: December 4, 2025
**Session**: Continued from Session  7
**Status**: 🔍 DIAGNOSING - Backend hanging on all search requests

---

## Symptoms

**Frontend logs show**:
- All 25 progressive loading batches failing
- Each batch fails in 3-15ms (too fast for real search)
- Error: "Literature search failed"
- Warning: "No metadata returned from batch"
- Result: 0 papers
- Progressive search completes with 0 papers

**Timeline**:
```
02:18:22.100 - Batch 1/25 starting
02:18:22.126 - Batch 1/25 FAILED (26ms)
02:18:22.127 - Batch 2/25 starting
02:18:22.143 - Batch 2/25 FAILED (16ms)
...all 25 batches fail in 3-20ms each
02:18:22.373 - Progressive search complete (0 papers)
```

---

## Root Cause Analysis

### Step 1: Initial Hypothesis - Validation Error

**Test**: Send search request with extra properties
```bash
curl -X POST http://localhost:4000/api/literature/search/public \
  -H "Content-Type: application/json" \
  -d '{
    "query": "symbolic interactionism",
    "maxResults": 20,
    "includeAbstracts": true
  }'
```

**Result**: HTTP 400 - Validation error
```json
{
  "statusCode": 400,
  "errorCode": "VAL001",
  "message": "property maxResults should not exist, property includeAbstracts should not exist",
  "validationErrors": [
    "property maxResults should not exist",
    "property includeAbstracts should not exist"
  ]
}
```

**Analysis**:
- Backend has strict validation (`forbidNonWhitelisted: true`)
- SearchLiteratureDto only accepts: query, sources, yearFrom, yearTo, field, limit, page, etc.
- Properties `maxResults` and `includeAbstracts` are NOT in the DTO
- Frontend `SearchLiteratureParams` interface matches DTO (uses `limit`, not `maxResults`)

**Conclusion**: This was a red herring. The frontend interface is correct.

---

### Step 2: Test Backend with CORRECT Parameters

**Test**: Send search with only allowed properties
```bash
curl -X POST http://localhost:4000/api/literature/search/public \
  -H "Content-Type: application/json" \
  -d '{
    "query": "symbolic interactionism",
    "limit": 20,
    "page": 1
  }'
```

**Result**: Request HANGS for 10+ seconds, then times out
```
curl: (28) Operation timed out after 10003 milliseconds with 0 bytes received
```

**Analysis**:
- Backend accepts the request (no validation error)
- Request hangs/freezes
- No response after 10 seconds
- This is the REAL problem!

---

### Step 3: Backend Process Analysis

**Found**:
- Backend PID 52565 running on port 4000
- Process using 21.1% CPU (should be idle)
- Backend is stuck or in an infinite loop

**Health check works**:
```bash
curl http://localhost:4000/api/health
# Returns: {"status":"healthy",...}
```

**Search endpoint hangs**:
```bash
curl http://localhost:4000/api/literature/search/public -d '{"query":"test","limit":20}'
# Hangs forever, never responds
```

---

## ACTUAL ROOT CAUSE

**The backend search endpoint is hanging/frozen when processing search requests.**

**Evidence**:
1. ✅ Health endpoint works (backend is alive)
2. ❌ Search endpoint hangs (stuck in search logic)
3. ❌ Frontend gets timeout after 10ms (fast-fail from axios)
4. ❌ All 25 batches fail instantly (never reach backend)

**Possible causes**:
1. **Deadlock**: Search service waiting for something that never completes
2. **Infinite loop**: Bug in search logic causing endless loop
3. **Resource exhaustion**: Running out of memory/connections
4. **External API timeout**: Waiting for external API that doesn't respond

---

## Fix Applied

### Step 1: Restart Backend Clean

Killed all backend processes and started fresh:
```bash
kill -9 52565
cd backend && npm run start:dev
```

### Step 2: Backend Startup Logs

Backend starting successfully:
- ✅ Bulkhead initialized: "Search: 30 per-user, 100 global"
- ✅ All services loading
- ⏳ Loading SciBERT model (takes ~30 seconds)
- ⏳ Waiting for full startup...

---

## Next Steps

1. ⏳ Wait for backend to fully start (SciBERT loading)
2. ⏳ Test search endpoint again
3. ⏳ Monitor backend logs during search
4. ⏳ Identify what causes the hang
5. ⏳ Apply permanent fix

---

## Technical Details

### SearchLiteratureDto (Backend)
**Location**: `backend/src/modules/literature/dto/literature.dto.ts:61-176`

**Allowed properties**:
- query: string (required)
- sources?: LiteratureSource[]
- yearFrom?: number
- yearTo?: number
- field?: string
- limit?: number (NOT maxResults!)
- page?: number
- includeCitations?: boolean
- sortBy?: string
- minWordCount?: number
- minAbstractLength?: number
- sortByEnhanced?: string

### SearchLiteratureParams (Frontend)
**Location**: `frontend/lib/services/literature-api.service.ts:96-117`

**Properties**: Matches backend DTO exactly ✅

### Bulkhead Configuration
**Location**: `backend/src/common/services/bulkhead.service.ts:86-92`

**Current config** (after fixes from earlier session):
```typescript
private readonly searchConfig: BulkheadConfig = {
  perUserConcurrency: 30,     // ✅ Supports 25 batches
  globalConcurrency: 100,     // ✅ Supports multiple users
  timeout: 300000,            // ✅ 5 minutes
  retryLimit: 2,
};
```

---

## Status: IN PROGRESS

Backend is restarting. Will test search endpoint once fully started.

**Expected next error**: If this doesn't fix it, need to debug the search logic itself to find the hang.
