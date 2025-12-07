# CRITICAL BUG: No Literature Search Results

## 🐛 Problem Description

When user searches for literature, the search starts but no results appear. The logs show:

```
logger.ts:341 2025-11-26T01:15:33.947Z INFO [ProgressiveSearch] Starting progressive search
logger.ts:338 2025-11-26T01:15:33.947Z DEBUG [ProgressiveSearch] Batch starting
logger.ts:341 2025-11-26T01:15:33.948Z INFO [LiteratureAPIService] Sending search request
```

Then nothing - no results, no errors, no further logs.

## 🔍 Root Cause Analysis

### Issue #1: Backend Not Responding
The API call to `/literature/search/public` is being made but:
- No response is logged
- No error is caught
- Search appears to hang indefinitely

**Possible Causes:**
1. Backend server not running
2. Backend endpoint `/literature/search/public` doesn't exist or is broken
3. Request timeout (180s) not being hit
4. Silent failure in backend processing

### Issue #2: Missing Error Handling in Frontend
Looking at `useProgressiveSearch.ts` line 598-650:

```typescript
const batchResult = await executeBatch(config);
const batchPapers = batchResult.papers;
```

If `executeBatch` returns `undefined` or throws an error that's caught internally, the code continues silently without papers.

### Issue #3: DEV_AUTH_BYPASS May Be Failing
The logs show:
```
logger.ts:341 2025-11-26T01:15:33.961Z INFO [LiteratureAPIService] DEV_AUTH_BYPASS enabled - skipping token validation
```

But the backend might not be recognizing the `X-Dev-Auth-Bypass` header.

## 🔧 Diagnostic Steps

### Step 1: Check if Backend is Running

```bash
# Check if backend is running on port 4000
curl http://localhost:4000/api/health

# If not running, start it:
cd backend
npm run start:dev
```

### Step 2: Test Search Endpoint Directly

```bash
# Test the public search endpoint
curl -X POST http://localhost:4000/api/literature/search/public \
  -H "Content-Type: application/json" \
  -H "X-Dev-Auth-Bypass: true" \
  -d '{
    "query": "machine learning",
    "sources": ["semantic_scholar"],
    "limit": 20,
    "page": 1
  }'
```

**Expected Response:**
```json
{
  "papers": [...],
  "total": 100,
  "page": 1,
  "metadata": {...}
}
```

**If you get 404:** Endpoint doesn't exist - backend needs to implement it
**If you get 500:** Backend error - check backend logs
**If you get timeout:** Backend is processing but too slow
**If you get nothing:** Backend not running

### Step 3: Check Backend Logs

```bash
# In backend directory
tail -f logs/app.log

# Or if using PM2
pm2 logs backend
```

Look for:
- Incoming POST request to `/literature/search/public`
- Any errors during search processing
- Database connection issues
- API key issues (Semantic Scholar, etc.)

### Step 4: Check Browser Network Tab

1. Open DevTools → Network tab
2. Filter by "Fetch/XHR"
3. Trigger a search
4. Look for request to `/literature/search/public`
5. Check:
   - Request status (pending/200/404/500)
   - Request headers (Authorization, X-Dev-Auth-Bypass)
   - Response body (if any)
   - Time taken

## 🛠️ Fixes

### Fix #1: Add Better Error Logging to Frontend

**File:** `frontend/lib/hooks/useProgressiveSearch.ts`

Add detailed logging in `executeBatch`:

```typescript
const executeBatch = useCallback(
  async (config: BatchConfig): Promise<{ papers: Paper[]; metadata: any }> => {
    // Check if cancelled
    if (isCancelledRef.current) {
      logger.info('Batch cancelled', 'ProgressiveSearch', { batchNumber: config.batchNumber });
      return { papers: [], metadata: null };
    }

    try {
      const page = config.batchNumber;
      
      const searchParams: SearchLiteratureParams = {
        query,
        sources: academicDatabases,
        ...(appliedFilters.yearFrom && { yearFrom: appliedFilters.yearFrom }),
        ...(appliedFilters.yearTo && { yearTo: appliedFilters.yearTo }),
        ...(appliedFilters.minCitations !== undefined && {
          minCitations: appliedFilters.minCitations,
        }),
        ...(appliedFilters.publicationType !== 'all' && {
          publicationType: appliedFilters.publicationType,
        }),
        ...(appliedFilters.author &&
          appliedFilters.author.trim().length > 0 && {
            author: appliedFilters.author.trim(),
            authorSearchMode: appliedFilters.authorSearchMode,
          }),
        sortByEnhanced: 'quality_score' as const,
        page,
        limit: config.limit,
        includeCitations: true,
      };

      // ✅ ADD: Log request details
      logger.info('Executing batch API call', 'ProgressiveSearch', {
        batchNumber: config.batchNumber,
        endpoint: '/literature/search/public',
        params: {
          query: searchParams.query,
          sources: searchParams.sources,
          page: searchParams.page,
          limit: searchParams.limit,
        },
      });

      // ✅ ADD: Timeout wrapper
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Batch timeout after 30s')), 30000);
      });

      const resultPromise = literatureAPI.searchLiterature(searchParams);

      const result = await Promise.race([resultPromise, timeoutPromise]) as any;

      // ✅ ADD: Validate result structure
      if (!result) {
        logger.error('Batch API returned null/undefined', 'ProgressiveSearch', {
          batchNumber: config.batchNumber,
        });
        return { papers: [], metadata: null };
      }

      if (!result.papers || !Array.isArray(result.papers)) {
        logger.error('Batch API returned invalid structure', 'ProgressiveSearch', {
          batchNumber: config.batchNumber,
          resultKeys: Object.keys(result),
          papersType: typeof result.papers,
        });
        return { papers: [], metadata: null };
      }

      logger.info('Batch API response received', 'ProgressiveSearch', {
        batchNumber: config.batchNumber,
        papersCount: result.papers.length,
        hasMetadata: !!result.metadata,
        responseTime: '< 30s',
      });

      return {
        papers: result.papers || [],
        metadata: result.metadata || null,
      };
    } catch (error: any) {
      // ✅ ENHANCED: Better error logging
      logger.error('Batch failed with error', 'ProgressiveSearch', {
        batchNumber: config.batchNumber,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack?.split('\n').slice(0, 3).join('\n'),
        isTimeout: error.message?.includes('timeout'),
        isNetworkError: error.message?.includes('Network'),
        responseStatus: error.response?.status,
        responseData: error.response?.data,
      });

      // Return empty result instead of throwing to allow other batches to continue
      return {
        papers: [],
        metadata: null,
      };
    }
  },
  [query, appliedFilters, academicDatabases]
);
```

### Fix #2: Add Fallback Mock Data for Development

**File:** `frontend/lib/services/literature-api.service.ts`

Add fallback in `searchLiterature` method:

```typescript
async searchLiterature(params: SearchLiteratureParams): Promise<{
  papers: Paper[];
  total: number;
  page: number;
  metadata?: any;
}> {
  try {
    logger.info('Sending search request', 'LiteratureAPIService', {
      query: params.query,
      sources: params.sources,
      sourcesCount: params.sources?.length,
      endpoint: '/literature/search/public',
    });

    const response = await this.api.post('/literature/search/public', params);
    const actualData = response.data || response;

    const result = {
      papers: actualData.papers || [],
      total: actualData.total || 0,
      page: actualData.page || params.page || 1,
      metadata: actualData.metadata || null,
    };

    logger.info('Search completed successfully', 'LiteratureAPIService', {
      papersCount: result.papers.length,
      total: result.total,
      hasMetadata: !!result.metadata,
    });

    return result;
  } catch (error: any) {
    logger.error('Literature search failed', 'LiteratureAPIService', {
      error,
      status: error.response?.status,
      message: error.response?.data?.message,
      endpoint: '/literature/search/public',
      query: params.query,
    });

    // ✅ ADD: Development fallback with mock data
    if (process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true') {
      logger.warn('Using mock data for development', 'LiteratureAPIService');
      
      return {
        papers: [
          {
            id: 'mock-1',
            title: 'Machine Learning in Healthcare: A Comprehensive Review',
            authors: ['John Doe', 'Jane Smith'],
            year: 2023,
            abstract: 'This paper reviews the application of machine learning techniques in healthcare...',
            source: 'semantic_scholar',
            citationCount: 150,
            qualityScore: 85,
          },
          {
            id: 'mock-2',
            title: 'Deep Learning for Medical Image Analysis',
            authors: ['Alice Johnson'],
            year: 2024,
            abstract: 'We present a novel deep learning approach for analyzing medical images...',
            source: 'semantic_scholar',
            citationCount: 75,
            qualityScore: 78,
          },
        ] as Paper[],
        total: 2,
        page: 1,
        metadata: {
          totalCollected: 2,
          uniqueAfterDedup: 2,
          searchDuration: 1000,
        },
      };
    }

    // Better error handling
    if (error.response?.status === 401) {
      logger.warn('Authentication required - check DEV_AUTH_BYPASS', 'LiteratureAPIService');
    }

    if (error.response?.status === 404) {
      logger.error('Endpoint not found - backend may not have /literature/search/public', 'LiteratureAPIService');
      throw new Error('Search endpoint not found - backend may not be properly configured');
    }

    if (error.code === 'ECONNREFUSED') {
      logger.error('Backend not running - cannot connect to API', 'LiteratureAPIService');
      throw new Error('Backend server is not running. Please start the backend with: cd backend && npm run start:dev');
    }

    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }

    throw error;
  }
}
```

### Fix #3: Add User-Friendly Error Messages

**File:** `frontend/lib/hooks/useProgressiveSearch.ts`

Update error handling in `executeProgressiveSearch`:

```typescript
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown search error';

  logger.error('Search failed', 'ProgressiveSearch', { error, errorMessage });

  // Clean up animation on error
  if (progressIntervalRef.current) {
    clearInterval(progressIntervalRef.current);
    progressIntervalRef.current = null;
  }

  // Update state to show error
  updateProgressiveLoading({
    status: 'error',
    errorMessage,
  });

  // ✅ ADD: User-friendly error messages
  if (errorMessage.includes('Backend server is not running')) {
    toast.error('Backend server is not running. Please start it and try again.', {
      duration: 10000,
      action: {
        label: 'How to fix',
        onClick: () => {
          alert('Run: cd backend && npm run start:dev');
        },
      },
    });
  } else if (errorMessage.includes('endpoint not found')) {
    toast.error('Search endpoint not configured. Please check backend setup.', {
      duration: 8000,
    });
  } else if (errorMessage.includes('timeout')) {
    toast.error('Search timed out. The backend may be overloaded. Try again with fewer sources.', {
      duration: 6000,
    });
  } else {
    toast.error(`Search failed: ${errorMessage}`, {
      duration: 5000,
    });
  }

  // Keep papers that were loaded before error
  if (allPapers.length > 0) {
    toast.info(`${allPapers.length} papers were loaded before the error occurred`, {
      duration: 4000,
    });
  }
}
```

## 📋 Implementation Checklist

- [ ] **Check Backend Status**
  - [ ] Verify backend is running on port 4000
  - [ ] Test `/api/health` endpoint
  - [ ] Check backend logs for errors

- [ ] **Test Search Endpoint**
  - [ ] Use curl to test `/literature/search/public`
  - [ ] Verify response structure
  - [ ] Check for authentication issues

- [ ] **Apply Frontend Fixes**
  - [ ] Add enhanced logging to `executeBatch`
  - [ ] Add timeout wrapper
  - [ ] Add result validation
  - [ ] Add mock data fallback

- [ ] **Apply API Service Fixes**
  - [ ] Add better error logging
  - [ ] Add development fallback
  - [ ] Add connection error handling

- [ ] **Apply Progress Hook Fixes**
  - [ ] Add user-friendly error messages
  - [ ] Add actionable error toasts

- [ ] **Test End-to-End**
  - [ ] Test with backend running
  - [ ] Test with backend stopped
  - [ ] Test with slow backend
  - [ ] Test with invalid query

## 🎯 Expected Outcomes

### After Fixes:
✅ Clear error messages when backend is not running  
✅ Detailed logs showing exactly where search fails  
✅ Mock data fallback for development  
✅ Timeout handling prevents infinite waiting  
✅ User knows how to fix the issue  

### Error Messages:
- "Backend server is not running. Please start it and try again."
- "Search endpoint not configured. Please check backend setup."
- "Search timed out. The backend may be overloaded."

## 🚀 Quick Fix for Immediate Testing

If you just want to test the UI without backend:

1. Add to `.env.local`:
```
NEXT_PUBLIC_USE_MOCK_DATA=true
```

2. Restart frontend:
```bash
npm run dev
```

3. Search should now return mock data

## 📝 Notes

**Most Likely Cause:** Backend is not running or `/literature/search/public` endpoint doesn't exist.

**Quick Check:**
```bash
# Is backend running?
curl http://localhost:4000/api/health

# Does search endpoint exist?
curl -X POST http://localhost:4000/api/literature/search/public \
  -H "Content-Type: application/json" \
  -d '{"query":"test","sources":["semantic_scholar"],"limit":1}'
```

If both fail → Start backend  
If health works but search fails → Backend needs endpoint implementation  
If both work → Frontend issue (apply fixes above)

---

**Status:** 🔴 CRITICAL - BLOCKING SEARCH FUNCTIONALITY  
**Priority:** P0  
**Estimated Fix Time:** 30 minutes (if backend running) / 2 hours (if backend needs implementation)
