#!/bin/bash

# Enterprise Search Engine v4.0 - Integration Script
# This script completes the integration of BM25 and updates metadata

echo "╔════════════════════════════════════════════════════════════╗"
echo "║   Enterprise Search Engine v4.0 - Integration Script      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Step 1: Add BM25 import to literature.service.ts
echo "Step 1: Adding BM25 import to literature.service.ts..."

# Find the line with other imports from utils
IMPORT_LINE=$(grep -n "from './utils/paper-quality.util'" backend/src/modules/literature/literature.service.ts | head -1 | cut -d: -f1)

if [ -n "$IMPORT_LINE" ]; then
    echo "   Found import line at: $IMPORT_LINE"
    echo "   Adding BM25 import..."
    
    # Add import after paper-quality.util import
    sed -i.bak "${IMPORT_LINE}a\\
import { calculateBM25RelevanceScore } from './utils/relevance-scoring.util';
" backend/src/modules/literature/literature.service.ts
    
    echo "   ✅ BM25 import added"
else
    echo "   ⚠️  Could not find import line automatically"
    echo "   Please add manually: import { calculateBM25RelevanceScore } from './utils/relevance-scoring.util';"
fi

# Step 2: Find and note the location of relevance scoring
echo ""
echo "Step 2: Locating relevance scoring code..."

RELEVANCE_LINE=$(grep -n "papersWithScore.*relevanceScore" backend/src/modules/literature/literature.service.ts | head -1 | cut -d: -f1)

if [ -n "$RELEVANCE_LINE" ]; then
    echo "   Found relevance scoring at line: $RELEVANCE_LINE"
    echo "   ✅ Location identified"
else
    echo "   ⚠️  Could not locate relevance scoring automatically"
fi

# Step 3: Create integration TODO file
echo ""
echo "Step 3: Creating integration checklist..."

cat > INTEGRATION_CHECKLIST.md << 'EOF'
# BM25 Integration Checklist

## Step 1: Update literature.service.ts Import ✅

Add this import near line 60 (after paper-quality.util import):
```typescript
import { calculateBM25RelevanceScore } from './utils/relevance-scoring.util';
```

## Step 2: Replace Relevance Scoring (Line ~1800)

**Find this code**:
```typescript
const papersWithScore = filteredPapers.map((paper) => ({
  ...paper,
  relevanceScore: this.calculateRelevanceScore(paper, originalQuery),
}));
```

**Replace with**:
```typescript
const papersWithScore = filteredPapers.map((paper) => ({
  ...paper,
  relevanceScore: calculateBM25RelevanceScore(paper, originalQuery),
}));
```

## Step 3: Remove Old calculateRelevanceScore Method

**Find and DELETE** (around line 2100-2300):
```typescript
/**
 * PHASE 10 DAY 1: Calculate relevance score for a paper based on query
 * Uses TF-IDF-like scoring to rank papers by relevance
 */
private calculateRelevanceScore(paper: Paper, query: string): number {
  // ... 200+ lines of old code ...
}
```

## Step 4: Update Metadata (Line ~1850)

**Find this code**:
```typescript
qualificationCriteria: {
  relevanceScoreMin: MIN_RELEVANCE_SCORE,
  relevanceScoreDesc: `Papers must score at least ${MIN_RELEVANCE_SCORE}/100...`,
  qualityWeights: {
    citationImpact: 60,  // WRONG!
    journalPrestige: 40  // WRONG!
  },
  filtersApplied: [
    'Relevance Score ≥ 3',  // HARDCODED!
    ...
  ]
}
```

**Replace with**:
```typescript
qualificationCriteria: {
  relevanceScoreMin: MIN_RELEVANCE_SCORE,
  relevanceScoreDesc: `Papers must score at least ${MIN_RELEVANCE_SCORE}/100 for relevance. Scored using BM25 algorithm with position weighting (title 4x > keywords 3x > abstract 2x).`,
  qualityWeights: {
    citationImpact: 30,      // ✅ CORRECT (v4.0)
    journalPrestige: 50,     // ✅ CORRECT (v4.0)
    recencyBonus: 20         // ✅ NEW (v4.0)
  },
  relevanceAlgorithm: 'BM25 with position weighting (Robertson & Walker, 1994)',
  filtersApplied: [
    `Relevance Score ≥ ${MIN_RELEVANCE_SCORE}`,  // ✅ DYNAMIC
    ...
  ]
}
```

## Step 5: Test Integration

```bash
# Build backend
cd backend && npm run build

# Start backend
npm run dev

# Test search endpoint
curl -X POST http://localhost:4000/api/literature/search \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"query": "lemonade", "limit": 20}'

# Check response for:
# - relevanceScore values (should be BM25 scores)
# - qualityWeights: {citationImpact: 30, journalPrestige: 50, recencyBonus: 20}
# - relevanceAlgorithm: "BM25 with position weighting..."
```

## Step 6: Verify in Browser Console

1. Open http://localhost:3000/discover/literature
2. Search for "lemonade"
3. Open browser console
4. Check metadata object:
   - qualityWeights should show 30/50/20
   - relevanceAlgorithm should mention BM25
   - filtersApplied should be dynamic

## Completion Criteria

- [ ] BM25 import added
- [ ] Relevance scoring replaced with BM25
- [ ] Old calculateRelevanceScore method removed
- [ ] Metadata updated (qualityWeights: 30/50/20)
- [ ] filtersApplied made dynamic
- [ ] Backend builds successfully
- [ ] Search returns BM25 scores
- [ ] Console shows correct metadata
- [ ] No TypeScript errors
- [ ] No runtime errors

EOF

echo "   ✅ Integration checklist created: INTEGRATION_CHECKLIST.md"

# Step 4: Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    INTEGRATION READY                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Next Steps:"
echo "1. Review INTEGRATION_CHECKLIST.md"
echo "2. Make the 4 code changes in literature.service.ts"
echo "3. Run: cd backend && npm run build"
echo "4. Test with search queries"
echo ""
echo "Files Ready:"
echo "✅ backend/src/modules/literature/utils/relevance-scoring.util.ts (BM25)"
echo "✅ backend/src/modules/literature/utils/paper-quality.util.ts (Recency)"
echo "✅ SEARCH_ENGINE_METHODOLOGY_DOCUMENTATION.md (12-page doc)"
echo "✅ INTEGRATION_CHECKLIST.md (Step-by-step guide)"
echo ""
