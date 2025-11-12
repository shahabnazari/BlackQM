# Paper Aggregation Strategy Analysis
## Phase 10.6 Day 14.5: How 200 Papers Are Selected From Multiple Sources

**Date:** November 11, 2025
**Status:** 📊 CURRENT BEHAVIOR ANALYZED + IMPROVEMENT PROPOSED

---

## 🎯 YOUR QUESTION

> "I do not know how you handle like if one source has all 200 papers, what happens? Do we like choose like 30 papers from each source and if one results in less than 30 we use another source more to reach 200 highest quality papers?"

**Great question!** Let me explain the current behavior and propose improvements.

---

## 📋 CURRENT BEHAVIOR (How It Works Now)

### Step-by-Step Process

**1. Parallel Source Fetching**
```typescript
const API_FETCH_LIMIT = 100; // Fetch 100 papers from EACH source

// For 9 free sources:
sources = ['pubmed', 'pmc', 'arxiv', 'semantic_scholar', ...]

// Each source fetches in parallel:
PubMed        → 100 papers
PMC           → 100 papers
ArXiv         → 100 papers
Semantic Scholar → 100 papers
... (9 sources total)

// Maximum possible: 9 × 100 = 900 papers
```

**2. Combine All Papers**
```typescript
const papers: Paper[] = [];
for (let i = 0; i < results.length; i++) {
  if (result.status === 'fulfilled' && result.value) {
    papers.push(...result.value);  // ← Just append ALL papers
  }
}
// Result: One big array with potentially 900 papers
```

**3. Deduplication**
```typescript
// Remove duplicates by DOI or title
const uniquePapers = this.deduplicatePapers(papers);
// Example: 900 papers → 650 unique papers (some overlap between sources)
```

**4. Enrich with OpenAlex**
```typescript
// Add citation counts, journal metrics, impact factors
const enrichedPapers = await this.openAlexEnrichment.enrichBatch(uniquePapers);
```

**5. Calculate Quality Scores**
```typescript
// Score each paper based on:
// - Citation count
// - Publication year (recency)
// - Journal impact factor
// - Word count
// - Venue reputation
const papersWithQuality = enrichedPapers.map(paper => ({
  ...paper,
  qualityScore: calculateQualityScore(paper)
}));
```

**6. Relevance Filtering**
```typescript
const MIN_RELEVANCE_SCORE = 3;
const relevantPapers = papersWithScore.filter(paper =>
  paper.relevanceScore >= MIN_RELEVANCE_SCORE
);
// Example: 650 papers → 500 papers (filter out low relevance)
```

**7. Sort by Relevance (or Quality)**
```typescript
// Sort ALL papers by relevance score
sortedPapers = relevantPapers.sort((a, b) =>
  b.relevanceScore - a.relevanceScore
);
// Now papers are ordered by best match
```

**8. Pagination**
```typescript
const page = 1;
const limit = 20; // Frontend requests 20 at a time
const paginatedPapers = sortedPapers.slice(0, 20);

// Frontend makes 10 requests to get 200 papers:
// Page 1: papers 0-19
// Page 2: papers 20-39
// ...
// Page 10: papers 180-199
```

---

## 🚨 PROBLEM: No Source Balancing

### Issue

**If Semantic Scholar returns 100 highly relevant papers:**
- Semantic Scholar papers get scores: 95, 94, 93, 92, ...
- PubMed papers get scores: 85, 84, 83, ...
- ArXiv papers get scores: 75, 74, 73, ...

**After sorting:**
```
Top 200 papers:
- Position 1-100: ALL from Semantic Scholar
- Position 101-150: ALL from PubMed
- Position 151-200: Mix of other sources
```

**Result:** User gets 100+ papers from one source!

### Real Example

**Query:** "machine learning"
**Sources:** 9 sources selected

**Possible outcome:**
```
Semantic Scholar:  100 papers (scores: 90-95)
PubMed:            100 papers (scores: 70-85)
ArXiv:              80 papers (scores: 75-90)
PMC:                50 papers (scores: 65-80)
CrossRef:           20 papers (scores: 60-75)
bioRxiv:             0 papers (out of domain)
ChemRxiv:            0 papers (out of domain)
SSRN:                0 papers (out of domain)
ERIC:                0 papers (out of domain)

Total: 350 papers
After dedup: 280 unique papers

Top 200 papers shown to user:
- 100 from Semantic Scholar (positions 1-100)
- 60 from ArXiv (positions 101-160)
- 40 from PubMed (positions 161-200)
```

**Problem:** No diversity! User doesn't see papers from PMC, CrossRef, etc.

---

## ✅ PROPOSED SOLUTION: Balanced Source Selection

### Strategy 1: Proportional Allocation (RECOMMENDED)

**Concept:** Allocate papers proportionally based on source results, with minimum guarantees.

```typescript
// Target: 200 papers total
// Sources that returned results: 5 (Semantic Scholar, PubMed, ArXiv, PMC, CrossRef)

// Step 1: Calculate proportional allocation
Semantic Scholar: 100 papers → 100/350 = 28.6% → 57 papers
PubMed:          100 papers → 100/350 = 28.6% → 57 papers
ArXiv:            80 papers →  80/350 = 22.9% → 46 papers
PMC:              50 papers →  50/350 = 14.3% → 29 papers
CrossRef:         20 papers →  20/350 =  5.7% → 11 papers
                                        Total: 200 papers

// Step 2: Select top papers from each source
Semantic Scholar: Top 57 by quality score
PubMed:          Top 57 by quality score
ArXiv:            Top 46 by quality score
PMC:              Top 29 by quality score
CrossRef:         Top 11 by quality score

// Step 3: Combine and sort by overall quality
// Now user sees diverse results from all 5 sources!
```

**Advantages:**
- ✅ Source diversity guaranteed
- ✅ Sources with more results get more allocation
- ✅ Still quality-focused (top papers from each source)
- ✅ No single source dominates

### Strategy 2: Equal Minimum Allocation

**Concept:** Give each source a minimum allocation, then fill remaining slots by quality.

```typescript
// Target: 200 papers
// Sources: 5 returned results

// Step 1: Minimum allocation (20 papers per source)
Semantic Scholar: 20 papers (guaranteed)
PubMed:          20 papers (guaranteed)
ArXiv:            20 papers (guaranteed)
PMC:              20 papers (guaranteed)
CrossRef:         20 papers (guaranteed)
                 100 papers allocated

// Step 2: Fill remaining 100 slots by quality score
// Take top 100 papers by score from remaining pool

// Result: At least 20 from each source, but high-quality sources can get more
```

**Advantages:**
- ✅ Every source guaranteed representation
- ✅ Quality still matters for remaining slots
- ✅ Fair to domain-specific sources

### Strategy 3: Tiered Allocation

**Concept:** Prioritize by source tier, then quality within tier.

```typescript
// Tier 1 (Premium/Comprehensive): Semantic Scholar, PubMed
// - Allocate 60 papers each = 120 papers

// Tier 2 (Specialized): ArXiv, PMC, bioRxiv
// - Allocate 20 papers each = 60 papers

// Tier 3 (Niche): CrossRef, SSRN, ERIC
// - Allocate 10 papers each = 20 papers

// Total: 200 papers with guaranteed tier representation
```

**Advantages:**
- ✅ Reflects source quality/coverage
- ✅ Premium sources get more allocation
- ✅ Specialized sources still represented

---

## 🔧 IMPLEMENTATION PLAN

### Phase 1: Add Source Balancing Service

**New Service:** `source-balancing.service.ts`

```typescript
interface SourceAllocation {
  sourceId: string;
  allocation: number;  // How many papers to take
  papers: Paper[];     // Available papers from this source
}

class SourceBalancingService {
  /**
   * Allocate papers across sources proportionally
   */
  balanceProportional(
    sourceResults: Map<string, Paper[]>,
    targetCount: number
  ): Paper[] {
    // Calculate proportional allocation
    const totalPapers = Array.from(sourceResults.values())
      .reduce((sum, papers) => sum + papers.length, 0);

    const allocations: SourceAllocation[] = [];

    for (const [sourceId, papers] of sourceResults.entries()) {
      const proportion = papers.length / totalPapers;
      const allocation = Math.round(proportion * targetCount);

      allocations.push({
        sourceId,
        allocation: Math.min(allocation, papers.length),
        papers: papers.sort((a, b) => b.qualityScore - a.qualityScore)
      });
    }

    // Select top papers from each source
    const selectedPapers: Paper[] = [];
    for (const { allocation, papers } of allocations) {
      selectedPapers.push(...papers.slice(0, allocation));
    }

    // Sort final selection by quality
    return selectedPapers.sort((a, b) => b.qualityScore - a.qualityScore);
  }

  /**
   * Allocate with minimum guarantee per source
   */
  balanceWithMinimum(
    sourceResults: Map<string, Paper[]>,
    targetCount: number,
    minPerSource: number = 20
  ): Paper[] {
    const numSources = sourceResults.size;
    const guaranteedSlots = numSources * minPerSource;
    const remainingSlots = targetCount - guaranteedSlots;

    // Step 1: Allocate minimum to each source
    const selectedPapers: Paper[] = [];
    const remainingPapers: Paper[] = [];

    for (const [sourceId, papers] of sourceResults.entries()) {
      const sorted = papers.sort((a, b) => b.qualityScore - a.qualityScore);

      // Take top minPerSource papers
      selectedPapers.push(...sorted.slice(0, minPerSource));

      // Save rest for quality-based allocation
      remainingPapers.push(...sorted.slice(minPerSource));
    }

    // Step 2: Fill remaining slots by quality
    const topQuality = remainingPapers
      .sort((a, b) => b.qualityScore - a.qualityScore)
      .slice(0, remainingSlots);

    selectedPapers.push(...topQuality);

    return selectedPapers.sort((a, b) => b.qualityScore - a.qualityScore);
  }
}
```

### Phase 2: Integrate into Literature Service

**Modify:** `literature.service.ts`

```typescript
async searchLiterature(searchDto: SearchLiteratureDto, userId: string) {
  // ... existing code ...

  // After getting papers from all sources:
  const sourceResultsMap = new Map<string, Paper[]>();

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const source = sources[i];
    if (result.status === 'fulfilled' && result.value) {
      sourceResultsMap.set(source, result.value);
    }
  }

  // Deduplicate within each source first
  for (const [source, papers] of sourceResultsMap.entries()) {
    sourceResultsMap.set(source, this.deduplicatePapers(papers));
  }

  // Apply source balancing strategy
  const balancedPapers = this.sourceBalancing.balanceProportional(
    sourceResultsMap,
    200  // Target paper count
  );

  // Continue with enrichment and scoring...
  const enrichedPapers = await this.openAlexEnrichment.enrichBatch(balancedPapers);
  // ...
}
```

### Phase 3: Add Configuration

**User Settings:**
```typescript
interface SearchPreferences {
  sourceDiversityMode: 'balanced' | 'quality-first' | 'proportional';
  minPapersPerSource?: number;
  preferredSources?: string[];  // User can prioritize certain sources
}
```

---

## 📊 COMPARISON: Current vs Proposed

### Example Query: "machine learning"

**CURRENT (No Balancing):**
```
Top 200 papers:
├── Semantic Scholar: 100 papers (50%)
├── ArXiv:            60 papers (30%)
├── PubMed:           40 papers (20%)
├── PMC:               0 papers
├── CrossRef:          0 papers
└── Others:            0 papers

Source Diversity: 3/9 sources (33%)
```

**PROPOSED (Proportional Balancing):**
```
Top 200 papers:
├── Semantic Scholar:  57 papers (28.5%)
├── PubMed:            57 papers (28.5%)
├── ArXiv:             46 papers (23%)
├── PMC:               29 papers (14.5%)
├── CrossRef:          11 papers (5.5%)
└── Others:             0 papers (no results)

Source Diversity: 5/9 sources (55%)
```

**PROPOSED (Minimum Guarantee):**
```
Top 200 papers:
├── Semantic Scholar:  50 papers (25%) [20 guaranteed + 30 by quality]
├── PubMed:            45 papers (22.5%) [20 guaranteed + 25 by quality]
├── ArXiv:             40 papers (20%) [20 guaranteed + 20 by quality]
├── PMC:               35 papers (17.5%) [20 guaranteed + 15 by quality]
├── CrossRef:          30 papers (15%) [20 guaranteed + 10 by quality]
└── Others:             0 papers (no results)

Source Diversity: 5/9 sources (55%)
Every source guaranteed: ✅
```

---

## 🧪 TESTING PLAN

### Test 1: Single Dominant Source
**Setup:** Semantic Scholar returns 100, others return 5 each
**Expected:** Semantic Scholar gets ~50-60% allocation, not 90%

### Test 2: Equal Results
**Setup:** All 9 sources return 50 papers each
**Expected:** Each gets ~22 papers (200 ÷ 9)

### Test 3: Mixed Results
**Setup:** 3 sources return 100, 3 return 20, 3 return 0
**Expected:** Proportional distribution across 6 active sources

### Test 4: Quality vs Diversity
**Setup:** Semantic Scholar has higher quality scores
**Expected:** Gets more allocation, but not dominant

---

## ✅ RECOMMENDED IMPLEMENTATION

**Phase 10.6 Day 15 (Next Session):**

1. **Create `SourceBalancingService`** (new file)
2. **Add proportional balancing** as default strategy
3. **Add user preference settings** for balancing mode
4. **Add UI indicator** showing source distribution
5. **Add tests** for all balancing strategies

**Benefits:**
- ✅ Source diversity improved
- ✅ Users see papers from multiple sources
- ✅ No single source dominates
- ✅ Quality still prioritized within each source
- ✅ Configurable for different research needs

---

## 📝 DECISION NEEDED

**Which strategy do you prefer?**

**Option 1: Proportional (Recommended)**
- Fair based on source results
- Natural diversity
- High-quality sources get more naturally

**Option 2: Minimum Guarantee**
- Every source guaranteed representation
- Fixed minimum (e.g., 20 papers)
- Remaining slots by quality

**Option 3: Current (No Balancing)**
- Pure quality-first
- Risk of single-source dominance
- Fastest to compute

**Let me know which approach you'd like and I'll implement it!**

---

**Status:** 📊 Analysis Complete - Awaiting Decision
**Next:** Implement chosen balancing strategy
**Impact:** Improved source diversity and user experience
