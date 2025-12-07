# CORE Retry Logic Implementation - Phase 10.8

## Problem Statement

CORE API's Elasticsearch cluster frequently returns HTTP 500 errors when shards are overloaded with `es_rejected_execution_exception`. This is an infrastructure issue on CORE's side, not a problem with our code or API usage.

### Evidence
```
"es_rejected_execution_exception"
"rejected execution... pool size = 30, active threads = 30,
 queued tasks = 74, completed tasks = 436M+"
```

### Observed Behavior
- First search ("evaluation of painting styles" @ 10:58 PM): ✅ 307 papers
- Second search ("guitar education" @ 11:03 PM): ❌ HTTP 500
- Pattern: Unpredictable failures based on CORE's server capacity

## Solution: Retry Logic with Exponential Backoff

### Implementation Details

**File Modified**: `backend/src/modules/literature/services/core.service.ts`

**Strategy**:
- Max 3 attempts (initial + 2 retries)
- Exponential backoff delays: 1s, 2s between retries
- Only retry HTTP 500 errors (Elasticsearch infrastructure failures)
- Don't retry 401 (authentication), 429 (rate limit), or other errors

### Code Changes

#### New Method: `searchWithRetry()`
```typescript
private async searchWithRetry(
  query: string,
  options?: CoreSearchOptions,
  attempt: number = 1,
): Promise<Paper[]> {
  const MAX_ATTEMPTS = 3;
  const RETRY_DELAYS = [1000, 2000]; // 1s, 2s

  try {
    // Execute search...
    // Parse results...

    if (attempt > 1) {
      this.logger.log(`[CORE] ✅ Retry succeeded on attempt ${attempt}`);
    }

    return papers;
  } catch (error: any) {
    const status = error.response?.status;

    // Only retry HTTP 500
    if (status === 500 && attempt < MAX_ATTEMPTS) {
      const delay = RETRY_DELAYS[attempt - 1];
      this.logger.warn(
        `[CORE] ⚠️  HTTP 500 (Elasticsearch overload) - Retry ${attempt}/${MAX_ATTEMPTS - 1} in ${delay}ms`
      );

      await new Promise(resolve => setTimeout(resolve, delay));
      return this.searchWithRetry(query, options, attempt + 1);
    }

    // Log terminal errors
    if (status === 500) {
      this.logger.error(
        `[CORE] ❌ HTTP 500 failed after ${attempt} attempts - Elasticsearch cluster overloaded`
      );
    }

    return [];
  }
}
```

#### Modified Method: `search()`
```typescript
async search(query: string, options?: CoreSearchOptions): Promise<Paper[]> {
  if (!this.apiKey) {
    this.logger.warn('[CORE] Search skipped - no API key configured');
    return [];
  }

  this.logger.log(`[CORE] Searching: "${query}"`);

  // Use retry logic for all searches
  return this.searchWithRetry(query, options);
}
```

### Expected Log Output

#### Successful First Attempt
```
[CoreService] [CORE] Searching: "test query"
[CoreService] [CORE] Returned 150 papers
```

#### Failed First Attempt, Successful Retry
```
[CoreService] [CORE] Searching: "test query"
[CoreService] ⚠️  HTTP 500 (Elasticsearch overload) - Retry 1/2 in 1000ms
[CoreService] ✅ Retry succeeded on attempt 2 - returned 150 papers
```

#### All Attempts Failed
```
[CoreService] [CORE] Searching: "test query"
[CoreService] ⚠️  HTTP 500 (Elasticsearch overload) - Retry 1/2 in 1000ms
[CoreService] ⚠️  HTTP 500 (Elasticsearch overload) - Retry 2/2 in 2000ms
[CoreService] ❌ HTTP 500 failed after 3 attempts - Elasticsearch cluster overloaded
```

## Benefits

1. **Improved Reliability**: Automatic retry increases success rate without user intervention
2. **Transparent**: Clear logging shows when retries occur and their outcomes
3. **Smart**: Only retries infrastructure errors (HTTP 500), not auth or rate limit errors
4. **Non-blocking**: Uses async delays, doesn't block other sources
5. **Conservative**: Max 3 total seconds of retry delay (1s + 2s) per search

## Testing Strategy

### Test Scenarios
1. **Normal operation**: Search should work without retries when CORE is healthy
2. **Single failure**: First attempt fails HTTP 500, second succeeds
3. **Multiple failures**: All 3 attempts fail, returns empty array gracefully
4. **Other errors**: 401/429 errors should not trigger retries

### How to Test
1. Run a search that includes CORE as a source
2. Watch backend logs for retry messages
3. Check if CORE papers are returned even during infrastructure issues

### Monitoring
Backend logs will show:
- `⚠️  HTTP 500 (Elasticsearch overload) - Retry X/2` for retry attempts
- `✅ Retry succeeded on attempt X` for successful retries
- `❌ HTTP 500 failed after X attempts` for complete failures

## Deployment Status

- ✅ Code implemented in `backend/src/modules/literature/services/core.service.ts`
- ✅ Backend restarted successfully at 11:10:30 PM (PID 10045)
- ✅ CORE service initialized with API key
- ⏳ Ready for testing with live searches

## Next Steps

1. Test with real searches from frontend
2. Monitor logs during peak CORE server load times
3. Consider adjusting retry delays based on observed recovery times
4. Optionally add retry metrics to monitoring dashboard

## Related Issues

- Springer: Still rate limited (HTTP 403) - requires separate handling
- ERIC: DNS error (api.eric.ed.gov doesn't exist) - requires endpoint research
- Semantic Scholar: Also showing HTTP 500 - consider similar retry logic

## References

- CORE API Documentation: https://api.core.ac.uk/docs/v3
- Elasticsearch Rejection Errors: https://www.elastic.co/guide/en/elasticsearch/reference/current/circuit-breaker.html
- Implementation File: `backend/src/modules/literature/services/core.service.ts:151-265`
