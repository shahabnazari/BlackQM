# HTTP 404 Polling Error - Root Cause & Fix

**Date**: November 16, 2025
**Phase**: 10.92 Day 1 Continuation
**Status**: ✅ FIXED

---

## Problem Summary

After fixing the HTTP 400 validation error (UUID v4 vs CUID mismatch), a new issue emerged:

- ✅ Papers saved successfully to database
- ✅ Full-text extraction jobs queued successfully
- ❌ **Status polling failed with HTTP 404 errors**
- ❌ Theme extraction aborted: "No sources with content"

### Error Logs

```
✅ Saved: "Paper Title" (DB ID: cmi2n24cl00079kt7xu9k82xo)
✅ [Full-Text Fetch] Job triggered for cmi2n24cl00079kt7xu9k82xo
🔄 [Full-Text Fetch] Polling attempt 1/10 for cmi2n24cl00079kt7xu9k82xo...
❌ Failed to get paper cmi2n24cl00079kt7xu9k82xo: Request failed with status code 404
⚠️ [Full-Text Fetch] Polling error 1/3: Request failed with status code 404
```

---

## Root Cause Analysis

### Investigation Steps

1. **Verified paper save logic**: Papers ARE being saved correctly with proper `userId` field ✅
2. **Checked backend endpoint**: Found `verifyPaperOwnership()` requires authentication ✅
3. **Examined frontend polling logic**: Frontend calls `GET /literature/library/${paperId}` ✅
4. **Checked backend routes**: **ENDPOINT MISSING** ❌

### The Issue

The frontend polling code called:
```typescript
// frontend/lib/services/literature-api.service.ts:1702
const response = await this.api.get<{ paper: Paper }>(
  `/literature/library/${paperId}`
);
```

But the backend only had these routes:
```typescript
// backend/src/modules/literature/literature.controller.ts

@Get('library')              // ✅ Get ALL papers for user
@Delete('library/:paperId')  // ✅ Delete specific paper
// ❌ Missing: @Get('library/:paperId')  <-- NO ENDPOINT TO GET SINGLE PAPER
```

**Result**: Frontend polling for paper status returned 404 because the endpoint didn't exist.

---

## Solution Implemented

### Added Missing Endpoint

**File**: `backend/src/modules/literature/literature.controller.ts`

**Location**: After `@Get('library')` (line 283), before `@Delete('library/:paperId')`

```typescript
@Get('library/:paperId')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiOperation({ summary: 'Get a single paper from library by ID' })
@ApiResponse({
  status: 200,
  description: 'Paper returned',
  schema: {
    type: 'object',
    properties: {
      paper: {
        type: 'object',
        description: 'Paper details including full-text status'
      }
    }
  }
})
@ApiResponse({
  status: 404,
  description: 'Paper not found or access denied'
})
async getPaperById(
  @Param('paperId') paperId: string,
  @CurrentUser() user: any,
) {
  const paper = await this.literatureService.verifyPaperOwnership(
    paperId,
    user.userId,
  );
  return { paper };
}
```

### Key Features

1. **JWT Authentication Required**: `@UseGuards(JwtAuthGuard)` - ensures only authenticated users can access
2. **User Ownership Validation**: Uses `verifyPaperOwnership()` which filters by BOTH `paperId` AND `userId`
3. **Security**: Users can only access their own papers
4. **Type Safety**: Returns `{ paper: Paper }` matching frontend expectations
5. **Full-Text Status**: Returns `fullTextStatus`, `hasFullText`, and all paper metadata

---

## Verification

### Backend Startup Logs

```
[RouterExplorer] Mapped {/api/literature/library/:paperId, GET} route ✅
[RouterExplorer] Mapped {/api/literature/library/:paperId, DELETE} route ✅
[NestApplication] Nest application successfully started ✅
```

### Expected Behavior

Now when frontend polls for paper status:

1. **Request**: `GET /api/literature/library/{paperId}` with JWT token
2. **Backend**:
   - ✅ Validates JWT authentication
   - ✅ Queries database: `WHERE id = paperId AND userId = user.userId`
   - ✅ Returns paper with `fullTextStatus` field
3. **Frontend**:
   - ✅ Receives paper data (not 404)
   - ✅ Checks `fullTextStatus` for completion
   - ✅ Continues polling or proceeds to theme extraction

---

## Testing Instructions

### 1. Search for Papers

```
Query: "herpetology education"
Sources: Select multiple sources
```

### 2. Monitor Console Logs

Expected flow:
```
✅ Saved: "Paper Title" (DB ID: cmi2n24cl...)
✅ [Full-Text Fetch] Job triggered for cmi2n24cl...
🔄 [Full-Text Fetch] Polling attempt 1/10 for cmi2n24cl...
✅ [Full-Text Fetch] Paper retrieved successfully       <-- NEW! Was 404 before
   ⏳ Status: fetching - continuing to poll...
🔄 [Full-Text Fetch] Polling attempt 2/10...
✅ [Full-Text Fetch] Status changed to success
   • Has full-text: YES
   • Word count: 8543 words
```

### 3. Verify Theme Extraction

After polling completes:
- Papers should have `hasFullText: true`
- Theme extraction should proceed
- No more "No sources with content - aborting" errors

---

## Related Files

### Backend
- **Modified**: `backend/src/modules/literature/literature.controller.ts` (added endpoint)
- **Used**: `backend/src/modules/literature/literature.service.ts` (verifyPaperOwnership method)

### Frontend
- **Calls Endpoint**: `frontend/lib/services/literature-api.service.ts:1702` (getPaperById)
- **Polling Logic**: `frontend/lib/services/literature-api.service.ts:1612` (pollFullTextStatus)

---

## Impact

### Before Fix
- ❌ HTTP 404 on every polling attempt
- ❌ Papers marked as "No abstract or full-text available"
- ❌ Theme extraction aborted: "No sources with content"
- ❌ User unable to extract themes from ANY papers

### After Fix
- ✅ Polling returns paper data successfully
- ✅ Full-text status updates tracked correctly
- ✅ Papers show full-text when available
- ✅ Theme extraction can proceed normally

---

## Lessons Learned

1. **Frontend-Backend Contract**: Always verify endpoints exist before calling them
2. **API Design**: CRUD operations should be complete (Create, Read, Update, Delete)
3. **Error Investigation**: 404 errors can mean "route doesn't exist" not just "resource not found"
4. **Testing**: E2E tests would have caught this missing endpoint early

---

## Next Steps

1. ✅ Backend recompiled with new endpoint
2. ✅ Endpoint registered and available
3. ⏳ **User should test**: Search → Save → Poll → Extract themes
4. ⏳ **Verify**: Papers fetch full-text successfully
5. ⏳ **Verify**: Theme extraction completes without "No sources" error

---

## Status: READY FOR TESTING

The fix is deployed and ready for testing. Please perform a full search → theme extraction workflow to verify the complete pipeline works end-to-end.
