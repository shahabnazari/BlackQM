# Manual Integration Guide - Enterprise Search Engine v4.0

## Overview

This guide provides **exact code changes** needed to integrate BM25 relevance scoring and update metadata in `literature.service.ts`.

---

## Change 1: Add BM25 Import

**Location**: Near top of file (around line 50-60), after other utility imports

**Add this line**:
```typescript
import { calculateBM25RelevanceScore } from './utils/relevance-scoring.util';
```

**Context** (look for imports like this):
```typescript
import { calculateQualityScore } from './utils/paper-quality.util';
import { PDFQueueService } from './services/pdf-queue.service';
// ADD HERE:
import { calculateBM25RelevanceScore } from './utils/relevance-scoring.util';
```

---

## Change 2: Replace Relevance Scoring Call

**Location**: Search for `papersWithScore` or `relevanceScore:` in the file

**Find this pattern**:
```typescript
const papersWithScore = filteredPapers.map((paper) => ({
  ...paper,
  relevanceScore: this.calculateRelevanceScore(paper, originalQuery),
  // OR
  relevanceScore: this.calculateRelevanceScore(paper, query),
}));
```

**Replace with**:
```typescript
const papersWithScore = filteredPapers.map((paper) => ({
  ...paper,
  relevanceScore: calculateBM25RelevanceScore(paper, originalQuery),
  // OR
  relevanceScore: calculateBM25RelevanceScore(paper, query),
}));
```

**Key Changes**:
- Remove `this.` (BM25 is a standalone function, not a class method)
- Change `calculateRelevanceScore` → `calculateBM25RelevanceScore`

---

## Change 3: Remove Old calculateRelevanceScore Method

**Location**: Search for `private calculateRelevanceScore` or `PHASE 10 DAY 1`

**Find and DELETE this entire method** (~200-300 lines):
```typescript
/**
 * PHASE 10 DAY 1: Calculate relevance score for a paper based on query
 * Uses TF-IDF-like scoring to rank papers by relevance
 * 
 * Scoring breakdown:
 * - Title matches: High weight (15 points per term)
 * - Abstract matches: Medium weight (2 points per term)
 * - Keyword matches: Medium weight (5 points per term)
 * - Author matches: Low weight (3 points per term)
 * - Venue matches: Low weight (2 points per term)
 * 
 * @param paper - Paper to score
 * @param query - Search query
 * @returns Relevance score (0-100+)
 */
private calculateRelevanceScore(paper: Paper, query: string): number {
  if (!query || query.trim().length === 0) return 0;

  const queryLower = query.toLowerCase();
  const queryTerms = queryLower
    .split(/\s+/)
    .filter((term) => term.length > 2); // Ignore very short terms

  if (queryTerms.length === 0) return 0;

  let score = 0;

  // ... 200+ more lines ...
  
  return Math.round(score);
}
```

**Why Delete**: BM25 is now in a separate utility file, this old method is obsolete.

---

## Change 4: Update Metadata Object

**Location**: Search for `qualificationCriteria` or `qualityWeights`

**Find this code**:
```typescript
qualificationCriteria: {
  relevanceScoreMin: MIN_RELEVANCE_SCORE,
  relevanceScoreDesc: `Papers must score at least ${MIN_RELEVANCE_SCORE}/100 for relevance to search query. Score based on keyword matches in title and abstract.`,
  qualityWeights: {
    citationImpact: 60,
    journalPrestige: 40
  },
  filtersApplied: [
    'Relevance Score ≥ 3',
    `Years: ${filters.yearStart || 'any'} - ${filters.yearEnd || 'any'}`,
    // ... more filters
  ]
}
```

**Replace with**:
```typescript
qualificationCriteria: {
  relevanceScoreMin: MIN_RELEVANCE_SCORE,
  relevanceScoreDesc: `Papers must score at least ${MIN_RELEVANCE_SCORE}/100 for relevance. Scored using BM25 algorithm (Robertson & Walker, 1994) with position weighting: title matches 4x > keywords 3x > abstract 2x. Phrase matching receives additional bonuses.`,
  qualityWeights: {
    citationImpact: 30,      // v4.0: Reduced from 60% to reduce citation bias
    journalPrestige: 50,     // v4.0: Increased from 40% for stronger quality signal
    recencyBonus: 20         // v4.0: Re-enabled with exponential decay (half-life: 4.6 years)
  },
  relevanceAlgorithm: 'BM25 with position weighting (Robertson & Walker, 1994)',
  qualityScoringVersion: 'v4.0',
  filtersApplied: [
    `Relevance Score ≥ ${MIN_RELEVANCE_SCORE}`,  // Dynamic (was hardcoded)
    `Years: ${filters.yearStart || 'any'} - ${filters.yearEnd || 'any'}`,
    // ... more filters
  ]
}
```

**Key Changes**:
- `relevanceScoreDesc`: Updated to mention BM25 algorithm
- `qualityWeights`: Changed to 30/50/20 (was 60/40/0)
- Added `relevanceAlgorithm` field
- Added `qualityScoringVersion` field
- Made `filtersApplied[0]` dynamic (uses variable instead of hardcoded "3")

---

## Verification Steps

### Step 1: TypeScript Compilation
```bash
cd backend
npm run build
```

**Expected**: No TypeScript errors

**If errors occur**:
- Check import statement is correct
- Verify BM25 function signature matches usage
- Ensure old calculateRelevanceScore method is fully removed

### Step 2: Start Backend
```bash
npm run dev
```

**Expected**: Server starts on port 4000

### Step 3: Test Search Endpoint
```bash
curl -X POST http://localhost:4000/api/literature/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "query": "lemonade",
    "limit": 20,
    "sources": ["pubmed", "pmc", "arxiv"]
  }'
```

**Expected Response**:
```json
{
  "papers": [
    {
      "id": "...",
      "title": "...",
      "relevanceScore": 85.3,  // BM25 score
      "qualityScore": 67.2,
      // ...
    }
  ],
  "metadata": {
    "qualificationCriteria": {
      "qualityWeights": {
        "citationImpact": 30,
        "journalPrestige": 50,
        "recencyBonus": 20
      },
      "relevanceAlgorithm": "BM25 with position weighting (Robertson & Walker, 1994)",
      "filtersApplied": [
        "Relevance Score ≥ 1",  // Dynamic!
        // ...
      ]
    }
  }
}
```

### Step 4: Browser Console Test
1. Open http://localhost:3000/discover/literature
2. Search for "lemonade"
3. Open browser DevTools console
4. Look for metadata log

**Expected Console Output**:
```javascript
qualificationCriteria: {
  qualityWeights: {
    citationImpact: 30,      // ✅ Correct
    journalPrestige: 50,     // ✅ Correct
    recencyBonus: 20         // ✅ New!
  },
  relevanceAlgorithm: "BM25 with position weighting...",
  filtersApplied: [
    "Relevance Score ≥ 1",   // ✅ Dynamic
    // ...
  ]
}
```

---

## Troubleshooting

### Error: "Cannot find module './utils/relevance-scoring.util'"

**Solution**: Verify file exists at:
```
backend/src/modules/literature/utils/relevance-scoring.util.ts
```

If missing, the file should have been created in Phase 2. Check `PHASE_2_COMPLETE_SUMMARY.md`.

### Error: "calculateBM25RelevanceScore is not a function"

**Solution**: Check import statement:
```typescript
import { calculateBM25RelevanceScore } from './utils/relevance-scoring.util';
```

Verify function is exported in `relevance-scoring.util.ts`:
```typescript
export function calculateBM25RelevanceScore(...) { ... }
```

### Error: "Property 'calculateRelevanceScore' does not exist"

**Solution**: You forgot to remove `this.` from the function call. Change:
```typescript
relevanceScore: this.calculateRelevanceScore(paper, query)
```
To:
```typescript
relevanceScore: calculateBM25RelevanceScore(paper, query)
```

### Metadata still shows old weights (60/40)

**Solution**: 
1. Clear browser cache
2. Restart backend server
3. Verify Change 4 was applied correctly
4. Check you're looking at the right metadata object (search for `qualificationCriteria`)

---

## Success Criteria

✅ **All 4 changes applied**
✅ **TypeScript compiles with no errors**
✅ **Backend starts successfully**
✅ **Search returns BM25 relevance scores**
✅ **Metadata shows 30/50/20 weights**
✅ **Metadata shows BM25 algorithm**
✅ **filtersApplied is dynamic**
✅ **No runtime errors in console**

---

## Next Steps After Integration

1. **Test with Multiple Queries**:
   - "lemonade" (broad query)
   - "COVID-19 vaccine" (recency test)
   - "Q-methodology" (phrase matching test)

2. **Verify Relevance Scores**:
   - Papers with query in title should score 80-100
   - Papers with query in abstract should score 40-80
   - Papers with partial matches should score 20-40

3. **Verify Quality Scores**:
   - Recent papers (2024) should get +20 recency bonus
   - Check quality score breakdown in response

4. **Frontend UI** (Optional):
   - Add "How It Works" info icon
   - Create methodology modal
   - Add PDF download button

5. **Documentation** (Optional):
   - Convert markdown to PDF
   - Add to public folder
   - Link from frontend

---

## Files Reference

**Core Files**:
- `backend/src/modules/literature/literature.service.ts` (MODIFY - 4 changes)
- `backend/src/modules/literature/utils/relevance-scoring.util.ts` (EXISTS - BM25)
- `backend/src/modules/literature/utils/paper-quality.util.ts` (EXISTS - Recency)

**Documentation**:
- `SEARCH_ENGINE_METHODOLOGY_DOCUMENTATION.md` (12-page doc)
- `ENTERPRISE_SEARCH_ENGINE_V4_FINAL.md` (Final summary)
- `MANUAL_INTEGRATION_GUIDE.md` (THIS FILE)

**Testing**:
- `test-search-quality-fixes.js` (Unit tests)
- `INTEGRATION_CHECKLIST.md` (Checklist)

---

## Support

If you encounter issues:
1. Check `INTEGRATION_CHECKLIST.md` for step-by-step guide
2. Review `ENTERPRISE_SEARCH_ENGINE_V4_FINAL.md` for context
3. Verify all files from Phase 2 are present
4. Check TypeScript compilation errors carefully
5. Test with curl before testing in browser

**Last Updated**: November 20, 2024
**Version**: v4.0
**Status**: Ready for Integration
