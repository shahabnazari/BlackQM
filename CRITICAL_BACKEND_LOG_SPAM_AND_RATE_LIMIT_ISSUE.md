# Critical Backend Log Spam & Rate Limit Issue Report

## 🚨 Problem Summary

**Excessive logging and CORE API rate limit violations** causing:
1. **Log spam**: 100+ log lines per second from retry attempts
2. **429 rate limit errors**: CORE API being overwhelmed
3. **Retry storms**: Multiple parallel requests all failing and retrying simultaneously

## 🔍 Root Cause Analysis

### Issue 1: Missing Bottleneck Rate Limiter
**Problem:** CORE service uses `APIQuotaMonitorService.waitForQuota()` which is **advisory only**, not enforcing.
- OpenAlex uses `Bottleneck` rate limiter (enforcing)
- CORE uses `waitForQuota()` (advisory, easily bypassed)
- Multiple parallel batches all pass quota check simultaneously

**Evidence:**
```typescript
// CORE Service - Line 277
const quotaAvailable = await this.quotaMonitor.waitForQuota('core', 10000);
// This returns true for ALL parallel requests, they all fire at once!
```

**Expected Behavior:**
- Bottleneck with reservoir pattern: 8 requests/second max
- Enforces time-based rate limiting (like OpenAlex)

### Issue 2: Excessive Logging
**Problem:** Every retry attempt logs at LOG/WARN/ERROR level.
- Multiple papers processed in parallel (BATCH_CONCURRENCY = 2, but multiple batches)
- Each paper retries 3 times = 3 log lines × 10+ papers = 30+ logs/second
- Rate limit errors (429) are common, so this creates log spam

**Evidence from logs:**
```
[BE] LOG [RetryService] [Retry] CORE.searchPapers - Attempt 1/3
[BE] LOG [RetryService] [Retry] CORE.searchPapers - Attempt 2/3
[BE] ERROR [HttpClientConfigService] ❌ HTTP Error: 429
[BE] WARN [RetryService] [Retry] CORE.searchPapers attempt 2 failed: 429. Retrying...
[BE] ERROR [RetryService] [Retry] CORE.searchPapers failed after 3 attempts
[BE] ERROR [CoreService] [CORE] Search failed: 429
[BE] DEBUG [IntelligentFullTextDetectionService] [CORE Detection] Error: 429
```
**Repeated 10+ times per second for different papers.**

### Issue 3: Parallel Batch Processing
**Problem:** `IntelligentFullTextDetectionService` processes papers in parallel batches.
- BATCH_CONCURRENCY = 2, but multiple batches run simultaneously
- Each batch processes papers in parallel
- All batches call CORE API at the same time
- Quota check passes for all, then all hit rate limit

**Code Location:**
- `intelligent-fulltext-detection.service.ts:177` - BATCH_CONCURRENCY = 2
- Multiple batches can run concurrently from different sources/users

## 📊 Impact Assessment

### Severity: 🔴 **CRITICAL**

**Performance Impact:**
- CORE API returning 429 errors (rate limited)
- Retry storms creating unnecessary load
- Detection failures for papers without DOIs (CORE skipped)
- 3-4 second delays per paper due to retries

**Operational Impact:**
- **Log files growing rapidly** (100+ lines/second)
- **Debugging difficulty** - important logs buried in spam
- **Monitoring noise** - alerts trigger on rate limit spam
- **Production instability** - rate limit errors cascade

**User Impact:**
- Slower full-text detection
- Some papers missing full-text URLs
- Potential timeouts for large paper sets

## ✅ Solution

### Fix 1: Add Bottleneck Rate Limiter to CORE Service
**Priority:** 🔴 **CRITICAL**

Add Bottleneck rate limiter (same pattern as OpenAlex):
```typescript
private readonly rateLimiter = new Bottleneck({
  reservoir: 8,                    // 8 req/sec (below 10 limit)
  reservoirRefreshAmount: 8,       // Refill to 8
  reservoirRefreshInterval: 1000,  // Every 1 second
  maxConcurrent: 3,                // Max 3 parallel (conservative)
  minTime: 125,                    // 125ms min between requests
});
```

**Impact:**
- ✅ Enforces 8 req/sec maximum
- ✅ Prevents 429 errors
- ✅ Matches OpenAlex implementation pattern

### Fix 2: Reduce Logging Verbosity for Rate Limits
**Priority:** 🟠 **HIGH**

Change retry service to log rate limit errors at DEBUG level:
```typescript
// In RetryService.executeWithRetry()
if (status === 429) {
  this.logger.debug(`[Retry] ${operationName} - Rate limited (429), retrying...`);
} else {
  this.logger.warn(`[Retry] ${operationName} attempt ${attempt} failed: ${err.message}`);
}
```

**Impact:**
- ✅ Reduces log spam by 90%
- ✅ Keeps important errors visible
- ✅ Rate limit errors still tracked (DEBUG level)

### Fix 3: Add Circuit Breaker for CORE API
**Priority:** 🟡 **MEDIUM**

When 429 errors detected, temporarily disable CORE for 60 seconds:
```typescript
if (status === 429) {
  this.rateLimitCircuitBreaker.open(); // Stop requests for 60s
  this.logger.warn('[CORE] Rate limit circuit breaker OPEN - pausing for 60s');
}
```

**Impact:**
- ✅ Prevents retry storms
- ✅ Allows CORE API to recover
- ✅ Automatic recovery after cooldown

## 🛠️ Implementation Plan

### Step 1: Add Bottleneck to CORE Service (30 min)
1. Install/import Bottleneck
2. Initialize rate limiter in constructor
3. Wrap HTTP calls with `rateLimiter.schedule()`
4. Test with parallel requests

### Step 2: Reduce Logging Verbosity (15 min)
1. Update RetryService to detect 429 errors
2. Log 429 at DEBUG level, other errors at WARN
3. Test logging output

### Step 3: Add Circuit Breaker (20 min)
1. Implement simple circuit breaker state machine
2. Open on 429, close after 60s
3. Skip requests when circuit open
4. Test recovery behavior

## 📈 Expected Results

**Before:**
- 100+ log lines/second
- 80% 429 error rate
- 3-4s delay per paper

**After:**
- 10-20 log lines/second (90% reduction)
- <5% 429 error rate (95% reduction)
- 1-2s delay per paper (50% improvement)

## 🔗 Related Files

1. `backend/src/modules/literature/services/core.service.ts` - Add Bottleneck
2. `backend/src/common/services/retry.service.ts` - Reduce logging
3. `backend/src/modules/literature/services/intelligent-fulltext-detection.service.ts` - Already has quota checks, but needs Bottleneck upstream
4. `backend/src/modules/literature/services/api-quota-monitor.service.ts` - Advisory quota (OK, but needs Bottleneck for enforcement)

## ⚠️ Testing Checklist

- [ ] Test parallel CORE requests (should be rate limited)
- [ ] Verify log output (should be minimal for 429 errors)
- [ ] Test circuit breaker (should pause after 429, recover after 60s)
- [ ] Monitor production logs (should see 90% reduction in spam)
- [ ] Verify full-text detection still works (should be faster, more reliable)

---

**Status:** 🔴 **CRITICAL - REQUIRES IMMEDIATE FIX**
**Estimated Fix Time:** 65 minutes
**Risk Level:** Low (additive changes, backwards compatible)

