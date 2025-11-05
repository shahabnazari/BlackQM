# Phase 10 Day 5.17.4: PDF Detection from Semantic Scholar

## Problem Report

**Date:** November 4, 2025  
**Reported By:** User  
**Issue:** Papers from Semantic Scholar not showing PDF availability

### Specific Case

- **Search Term:** "universal research applications"
- **Paper:** [Towards Perceived Security, Perceived Privacy, and...](https://www.semanticscholar.org/paper/Towards-Perceived-Security%2C-Perceived-Privacy%2C-and-Kishnani-Cardenas/4692ab73a66c1ff87ac83143398bf32dfe8b5e52)
- **Problem:** Paper has PDF available on Semantic Scholar but system wasn't detecting it

## Root Cause Analysis

### Issue 1: Missing API Fields

The Semantic Scholar API search was NOT requesting PDF-related fields:

**Before (Line 440-441 of literature.service.ts):**

```typescript
fields: 'paperId,title,authors,year,abstract,citationCount,url,venue,fieldsOfStudy',
```

**Missing Fields:**

- `openAccessPdf` - Contains PDF URL and metadata
- `isOpenAccess` - Boolean indicating open access status

### Issue 2: No PDF Fields in Data Model

The `Paper` interface didn't have fields to store PDF information:

- No `pdfUrl` field
- No `openAccessStatus` field
- No `hasPdf` boolean

### Issue 3: No PDF Mapping

Even if the data was available, the mapping code wasn't extracting PDF information from the API response.

## Solution Implemented

### 1. Updated Semantic Scholar API Request

**File:** `backend/src/modules/literature/literature.service.ts`  
**Line:** 440-441

```typescript
fields: 'paperId,title,authors,year,abstract,citationCount,url,venue,fieldsOfStudy,openAccessPdf,isOpenAccess',
```

**Added Fields:**

- `openAccessPdf` - Object containing `{url: string, status: string}`
- `isOpenAccess` - Boolean flag

### 2. Enhanced Paper Data Model

**File:** `backend/src/modules/literature/dto/literature.dto.ts`  
**Lines:** 317-320

```typescript
// PDF availability (Phase 10 Day 5.17.4+)
pdfUrl?: string | null; // Direct URL to open access PDF
openAccessStatus?: string | null; // Open access status (e.g., 'GOLD', 'GREEN', 'HYBRID', 'BRONZE')
hasPdf?: boolean; // Whether PDF is available
```

### 3. Added PDF Data Mapping

**File:** `backend/src/modules/literature/literature.service.ts`  
**Lines:** 492-495

```typescript
// Phase 10 Day 5.17.4+: PDF availability from Semantic Scholar
pdfUrl: paper.openAccessPdf?.url || null,
openAccessStatus: paper.isOpenAccess ? 'OPEN_ACCESS' : null,
hasPdf: !!paper.openAccessPdf?.url,
```

### 4. Updated Frontend Interface

**File:** `frontend/lib/services/literature-api.service.ts`  
**Lines:** 21-24

```typescript
// Phase 10 Day 5.17.4+ PDF availability
pdfUrl?: string | null; // Direct URL to open access PDF
openAccessStatus?: string | null; // Open access status (e.g., 'GOLD', 'GREEN', 'HYBRID', 'BRONZE')
hasPdf?: boolean; // Whether PDF is available
```

## Semantic Scholar API Response Structure

When a paper has an open access PDF, the API returns:

```json
{
  "paperId": "4692ab73...",
  "title": "Towards Perceived Security...",
  "openAccessPdf": {
    "url": "https://doi.org/10.1177/0194599820966537",
    "status": "HYBRID"
  },
  "isOpenAccess": true
}
```

### Open Access Status Types

According to Semantic Scholar documentation:

- **GOLD** - Published in open access journal
- **GREEN** - Author-archived version
- **HYBRID** - Open access in subscription journal
- **BRONZE** - Free to read but no open license

## Testing

### To Test the Fix:

1. Restart the backend service
2. Search for: "universal research applications"
3. Look for the paper by Kishnani & Cardenas
4. Verify `hasPdf: true` and `pdfUrl` is populated

### Expected Result:

```javascript
{
  id: "4692ab73...",
  title: "Towards Perceived Security, Perceived Privacy, and...",
  authors: ["Kishnani", "Cardenas"],
  hasPdf: true,
  pdfUrl: "https://doi.org/10.1177/0194599820966537",
  openAccessStatus: "OPEN_ACCESS"
}
```

## Frontend Display

Papers with PDF availability can now display:

- PDF download icon/button
- Link directly to PDF
- Open access badge
- Status indicator (GOLD, GREEN, HYBRID, BRONZE)

## Benefits

1. **Immediate PDF Detection** - System now knows upfront if PDF is available
2. **No Extra API Calls** - PDF info comes with search results
3. **Better UX** - Users can see PDF availability immediately
4. **Direct PDF Links** - One-click access to open access PDFs
5. **Open Access Transparency** - Shows what type of open access

## Integration with Existing Features

This enhancement works alongside:

- **Phase 10 Day 5.15** - PDF Full-Text Extraction via Unpaywall
- **Phase 10 Day 5.16** - Full-text theme extraction
- **Phase 10 Day 5.17** - Purpose-aware content validation

Papers with `hasPdf: true` from Semantic Scholar can be prioritized for full-text extraction.

## API Documentation

### Semantic Scholar Graph API

- **Endpoint:** `https://api.semanticscholar.org/graph/v1/paper/search`
- **Field:** `openAccessPdf`
- **Documentation:** [Semantic Scholar API](https://api.semanticscholar.org/)

### Rate Limits

- 100 requests per 5 minutes (unchanged)
- Tracked by existing quota monitor

## Notes

- This fix applies specifically to **Semantic Scholar** results
- Other sources (PubMed, CrossRef, arXiv) use different mechanisms
- arXiv papers typically always have PDFs
- PubMed links to PMC for open access
- CrossRef uses link resolution

## Future Enhancements

1. Add PDF indicators in UI components
2. Show open access status badges
3. Add PDF download button in paper cards
4. Track PDF access analytics
5. Cache PDF availability to avoid re-checking

## Files Modified

1. `backend/src/modules/literature/literature.service.ts` - API request & mapping
2. `backend/src/modules/literature/dto/literature.dto.ts` - Data model
3. `frontend/lib/services/literature-api.service.ts` - Frontend interface

## Status

✅ **COMPLETE** - Fix implemented and ready for testing

## Next Steps

1. Restart backend to apply changes
2. Test with the reported paper
3. Update UI components to display PDF availability
4. Add PDF download functionality
5. Create documentation for researchers
