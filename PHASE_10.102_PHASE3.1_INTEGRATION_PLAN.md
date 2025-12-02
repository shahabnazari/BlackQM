# Phase 10.102 Phase 3.1: Service Integration Plan

**Status**: 🚀 READY TO IMPLEMENT
**Date**: December 2, 2025
**Timeline**: 2-3 hours
**Dependencies**: Phase 3 ✅ (Core infrastructure complete)

---

## 🎯 MISSION

Integrate BulkheadService, RetryService, and custom exceptions into the existing codebase for full error handling and multi-tenant isolation.

---

## 📋 INTEGRATION TASKS

### Task 1: Integrate BulkheadService with LiteratureService ✅ Ready

**Current State**:
- ✅ LiteratureService already accepts `userId: string` parameter (line 192)
- ✅ BulkheadService registered in CommonModule (@Global)
- ⚠️ Not yet injected in constructor
- ⚠️ Search calls not wrapped in bulkhead

**Changes Needed**:

1. **Add BulkheadService to constructor** (literature.service.ts:150-155)
```typescript
// Phase 10.102 Phase 3.1: Error Handling & Multi-Tenant Isolation
private readonly bulkhead: BulkheadService,
```

2. **Wrap search operations in bulkhead** (literature.service.ts:~250)
```typescript
// Current (no bulkhead):
const { allPapers, metadata } = await this.searchPipeline.executeProgressiveSearch(/* ... */);

// After (with bulkhead):
const { allPapers, metadata } = await this.bulkhead.executeSearch(userId, async () => {
  return this.searchPipeline.executeProgressiveSearch(/* ... */);
});
```

3. **Wrap theme extraction in bulkhead** (if exists)
```typescript
// Find theme extraction method and wrap:
const result = await this.bulkhead.executeExtraction(userId, async () => {
  return this.extractThemes(/* ... */);
});
```

**Expected Impact**:
- ✅ Multi-tenant isolation (one user can't block others)
- ✅ Per-user limits (3 searches, 1 extraction)
- ✅ Circuit breaker protection
- ✅ Queue overflow handling

---

### Task 2: Integrate RetryService with API Calls ✅ Ready

**Target Services**:
1. `backend/src/modules/literature/services/semantic-scholar.service.ts`
2. `backend/src/modules/literature/services/pubmed.service.ts`
3. `backend/src/modules/literature/services/springer.service.ts`
4. `backend/src/modules/literature/services/openalex-enrichment.service.ts`
5. `backend/src/modules/literature/services/eric.service.ts`

**Pattern for Each Service**:

1. **Inject RetryService**:
```typescript
constructor(
  // ... existing dependencies
  private readonly retry: RetryService,
) {}
```

2. **Wrap API calls in retry**:
```typescript
// Before:
const response = await firstValueFrom(
  this.httpService.get(url, { headers, timeout: 15000 })
);

// After:
const response = await this.retry.executeWithRetry(
  async () => firstValueFrom(
    this.httpService.get(url, { headers, timeout: 15000 })
  ),
  `SemanticScholar.searchPapers`
);
```

**Expected Impact**:
- ✅ Automatic retry on transient failures (network, timeout, rate limit)
- ✅ Exponential backoff (1s, 2s, 4s...)
- ✅ Jitter prevents thundering herd
- ✅ Better reliability

---

### Task 3: Use Custom Exceptions in Controllers ✅ Ready

**Target Controller**:
- `backend/src/modules/literature/literature.controller.ts`

**Changes**:

1. **Import custom exceptions**:
```typescript
import {
  LiteratureSearchException,
  SourceAllocationException,
} from '../../common/exceptions';
```

2. **Replace generic errors**:
```typescript
// Before:
if (!query || query.trim().length === 0) {
  throw new Error('Query is required');
}

// After:
if (!query || query.trim().length === 0) {
  throw LiteratureSearchException.emptyQuery();
}
```

3. **Validation examples**:
```typescript
// Empty query
if (!searchDto.query?.trim()) {
  throw LiteratureSearchException.emptyQuery();
}

// Invalid sources
const invalidSources = searchDto.sources?.filter(s => !isValidSource(s));
if (invalidSources?.length) {
  throw LiteratureSearchException.invalidSources(invalidSources);
}

// Rate limit (if applicable)
if (this.isRateLimited(userId)) {
  throw LiteratureSearchException.rateLimitExceeded(30);
}
```

**Expected Impact**:
- ✅ User-friendly error messages
- ✅ Actionable guidance
- ✅ Error codes for debugging
- ✅ Retry guidance built-in

---

### Task 4: Fix Strict Mode Violations ⚠️ CRITICAL

**Issues Found in Audit**:
1. `literature.service.ts:206` - `metadata?: Record<string, any>;`
2. `literature.service.ts:215` - `cachedFullResults as { ... metadata: any }`

**Fixes**:

1. **Define proper metadata interface**:
```typescript
// Create in dto/literature.dto.ts
export interface SearchMetadata {
  stage1?: Record<string, unknown>;
  stage2?: Record<string, unknown>;
  searchPhases?: Record<string, unknown>;
  allocationStrategy?: Record<string, unknown>;
  diversityMetrics?: Record<string, unknown>;
  qualificationCriteria?: Record<string, unknown>;
  biasMetrics?: Record<string, unknown>;
  displayed?: number;
  fromCache?: boolean;
  [key: string]: unknown; // For extensibility
}
```

2. **Replace `any` with `SearchMetadata`**:
```typescript
// Before:
metadata?: Record<string, any>;

// After:
metadata?: SearchMetadata;
```

**Expected Impact**:
- ✅ 100% TypeScript strict mode compliance
- ✅ Better IDE autocomplete
- ✅ Type safety for metadata

---

## 🔄 IMPLEMENTATION ORDER

### Step 1: Fix Strict Mode Violations (30 min)
- [ ] Define SearchMetadata interface
- [ ] Replace all `any` types in literature.service.ts
- [ ] Verify TypeScript compilation (0 errors)

### Step 2: Integrate BulkheadService (45 min)
- [ ] Add BulkheadService to LiteratureService constructor
- [ ] Wrap searchLiterature in bulkhead.executeSearch()
- [ ] Test multi-user concurrency
- [ ] Verify circuit breaker works

### Step 3: Integrate RetryService (60 min)
- [ ] Add RetryService to 5 API services
- [ ] Wrap all HTTP calls in retry.executeWithRetry()
- [ ] Test with simulated network failures
- [ ] Verify exponential backoff works

### Step 4: Use Custom Exceptions (30 min)
- [ ] Import exceptions in literature.controller.ts
- [ ] Replace generic errors with custom exceptions
- [ ] Test error responses (user-friendly messages)
- [ ] Verify error codes in responses

### Step 5: Integration Testing (30 min)
- [ ] Test full search flow with bulkhead
- [ ] Test API retries with transient failures
- [ ] Test custom exception responses
- [ ] Test multi-user scenarios

### Step 6: Documentation & Commit (15 min)
- [ ] Update service documentation
- [ ] Create integration summary document
- [ ] Git commit with detailed message
- [ ] Tag release: phase-10.102-enhanced-3.1-complete

---

## ✅ SUCCESS CRITERIA

### BulkheadService Integration
- [ ] LiteratureService uses bulkhead for searches
- [ ] Per-user limits enforced (3 concurrent searches)
- [ ] Circuit breaker activates after 5 failures
- [ ] One user can't block others (verified via load test)

### RetryService Integration
- [ ] All API services use retry
- [ ] Exponential backoff works (1s, 2s, 4s...)
- [ ] Transient errors auto-retry
- [ ] Non-retryable errors fail immediately

### Custom Exceptions
- [ ] User-friendly error messages
- [ ] Actionable guidance in all errors
- [ ] Error codes present
- [ ] HTTP status codes correct

### Strict Mode
- [ ] 0 `any` types in modified files
- [ ] TypeScript compilation passes
- [ ] All interfaces fully typed

---

## 📊 VERIFICATION CHECKLIST

### Backend Verification
```bash
# Test bulkhead (multi-user)
curl -X POST http://localhost:4000/api/literature/search/public \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user-1" \
  -d '{"query": "education", "limit": 10}' &

curl -X POST http://localhost:4000/api/literature/search/public \
  -H "Content-Type: application/json" \
  -H "X-User-ID: user-2" \
  -d '{"query": "science", "limit": 10}' &

# Both should complete without blocking each other
```

```bash
# Test custom exceptions
curl -X POST http://localhost:4000/api/literature/search/public \
  -H "Content-Type: application/json" \
  -d '{"query": "", "limit": 10}'

# Should return:
# {
#   "message": "Please provide a search query",
#   "userMessage": "Please provide a search query",
#   "errorCode": "EMPTY_QUERY",
#   "suggestedAction": "Enter keywords or phrases related to your research topic...",
#   "retryable": false
# }
```

### TypeScript Verification
```bash
cd backend && npm run build
# Should show: 0 errors ✅
```

---

## 📚 FILES TO MODIFY

### Core Service (1 file)
1. `backend/src/modules/literature/literature.service.ts`
   - Add BulkheadService to constructor
   - Wrap search in bulkhead
   - Fix `any` types

### API Services (5 files)
1. `backend/src/modules/literature/services/semantic-scholar.service.ts`
2. `backend/src/modules/literature/services/pubmed.service.ts`
3. `backend/src/modules/literature/services/springer.service.ts`
4. `backend/src/modules/literature/services/openalex-enrichment.service.ts`
5. `backend/src/modules/literature/services/eric.service.ts`

### Controller (1 file)
1. `backend/src/modules/literature/literature.controller.ts`
   - Import custom exceptions
   - Replace generic errors

### DTOs (1 file)
1. `backend/src/modules/literature/dto/literature.dto.ts`
   - Add SearchMetadata interface

**Total Files**: 8 modifications

---

## 🎯 EXPECTED OUTCOMES

### Before Phase 3.1
- ❌ No multi-tenant isolation
- ❌ No automatic retry on failures
- ❌ Generic error messages
- ❌ `any` types in code

### After Phase 3.1
- ✅ Multi-tenant isolation active
- ✅ Automatic retry with exponential backoff
- ✅ User-friendly error messages
- ✅ 100% TypeScript strict mode compliance
- ✅ Circuit breaker protection
- ✅ Per-user concurrency limits

---

## 🚀 STARTING PHASE 3.1

**Current Status**: Implementation plan complete
**Next Step**: Fix strict mode violations in literature.service.ts

---

**Last Updated**: December 2, 2025
**Next Update**: After Phase 3.1 completion
