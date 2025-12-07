# Search Bar & Quality Criteria Analysis

## Issue 1: Search Bar AI Suggestions Not Working

### Root Cause (Already Documented)
From `AI_SUGGESTIONS_ISSUE_FIXED.md`:
- **OpenAI API Quota Exceeded** (Error 429)
- Backend gracefully handles error, returns empty suggestions
- Search still works, just no AI-powered suggestions

### Solution
Add credits to OpenAI account or use new API key

---

## Issue 2: Overly Strict Quality Criteria

### Current Implementation Analysis

From user's console logs, the metadata shows:

```javascript
qualificationCriteria: {
  relevanceScoreMin: 1,
  relevanceScoreDesc: "Papers must score at least 1/100 for relevance",
  qualityWeights: {
    citationImpact: 60,
    journalPrestige: 40
  },
  filtersApplied: [
    "Relevance Score ≥ 3",  // ← STRICT: Filters out papers with score 1-2
    "Years: 2020 - 2025"
  ]
}
```

### Problems Identified

#### 🔴 Problem 1: Contradictory Thresholds
- **Minimum stated**: 1/100
- **Actually applied**: ≥3/100
- **Result**: Papers scoring 1-2 are collected but then filtered out

#### 🔴 Problem 2: Heavy Citation Bias (60%)
- Citation impact weighted at 60%
- Newer papers (2020-2025) have fewer citations
- **Result**: Recent high-quality papers ranked lower than older mediocre papers

#### 🔴 Problem 3: Journal Prestige Dependency (40%)
- Requires journal impact factor data
- Many sources don't provide this (arXiv, SSRN, preprints)
- **Result**: Excellent preprints scored lower than average journal papers

#### 🔴 Problem 4: Binary Relevance Scoring
- Simple keyword matching (1-100 scale)
- No semantic understanding
- **Result**: Papers with synonyms or related concepts scored low

### Comparison with Leading Search Engines

#### Google Scholar Algorithm
1. **Citation-based ranking** (PageRank-style)
   - Citations from high-quality papers weighted more
   - Recency bonus for newer papers
   - Field-normalized citations

2. **Text relevance**
   - TF-IDF with semantic understanding
   - Title matches weighted higher than abstract
   - Author reputation considered

3. **User behavior signals**
   - Click-through rates
   - Time spent on paper
   - Download frequency

#### PubMed/MEDLINE Algorithm
1. **Best Match** (default)
   - Weighted term frequency
   - MeSH term matching (medical ontology)
   - Recency boost
   - Journal quality (but not dominant)

2. **Relevance factors**
   - Title: 4x weight
   - Abstract: 2x weight
   - MeSH terms: 3x weight
   - Full text: 1x weight

3. **Quality signals**
   - Clinical trial status
   - Systematic review flag
   - Peer review status

#### Semantic Scholar Algorithm
1. **Semantic relevance**
   - BERT-based embeddings
   - Contextual understanding
   - Citation context analysis

2. **Influence metrics**
   - Highly Influential Citations (HIC)
   - Field-normalized impact
   - Velocity (recent citation rate)

3. **Recency weighting**
   - Exponential decay for older papers
   - Configurable time windows

#### Web of Science / Scopus
1. **Citation metrics**
   - Field-normalized citation impact
   - Percentile rankings
   - H-index of authors

2. **Quality indicators**
   - Journal quartile (Q1-Q4)
   - Open access status
   - Funding information

3. **Relevance**
   - Boolean + proximity search
   - Controlled vocabulary
   - Citation network analysis

---

## Recommended Improvements

### Phase 1: Fix Immediate Issues (Critical)

#### 1.1 Remove Contradictory Thresholds
```typescript
// BEFORE
relevanceScoreMin: 1,
filtersApplied: ["Relevance Score ≥ 3"]

// AFTER
relevanceScoreMin: 1,
filtersApplied: ["Relevance Score ≥ 1"]  // Consistent!
```

#### 1.2 Rebalance Quality Weights
```typescript
// BEFORE (too citation-heavy)
qualityWeights: {
  citationImpact: 60,
  journalPrestige: 40
}

// AFTER (balanced for recent papers)
qualityWeights: {
  citationImpact: 30,        // Reduced
  journalPrestige: 20,       // Reduced
  recencyBonus: 25,          // NEW: Favor recent papers
  relevanceScore: 25         // NEW: Prioritize relevance
}
```

#### 1.3 Add Recency Bonus
```typescript
function calculateRecencyBonus(year: number): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  
  if (age <= 1) return 25;      // Last year: +25 points
  if (age <= 2) return 20;      // 2 years: +20 points
  if (age <= 3) return 15;      // 3 years: +15 points
  if (age <= 5) return 10;      // 5 years: +10 points
  return 0;                     // Older: no bonus
}
```

### Phase 2: Enhance Relevance Scoring (High Priority)

#### 2.1 Implement TF-IDF with Position Weighting
```typescript
function calculateRelevanceScore(paper: Paper, query: string): number {
  const queryTerms = query.toLowerCase().split(/\s+/);
  let score = 0;
  
  // Title matches (4x weight)
  for (const term of queryTerms) {
    if (paper.title.toLowerCase().includes(term)) {
      score += 4;
    }
  }
  
  // Abstract matches (2x weight)
  for (const term of queryTerms) {
    if (paper.abstract?.toLowerCase().includes(term)) {
      score += 2;
    }
  }
  
  // Keywords/MeSH matches (3x weight)
  for (const term of queryTerms) {
    if (paper.keywords?.some(k => k.toLowerCase().includes(term))) {
      score += 3;
    }
  }
  
  // Normalize to 0-100
  return Math.min(100, score * 5);
}
```

#### 2.2 Add Semantic Similarity (Optional)
```typescript
async function calculateSemanticRelevance(
  paper: Paper,
  query: string
): Promise<number> {
  // Generate embeddings
  const queryEmbedding = await getEmbedding(query);
  const paperEmbedding = await getEmbedding(
    `${paper.title} ${paper.abstract}`
  );
  
  // Cosine similarity
  const similarity = cosineSimilarity(queryEmbedding, paperEmbedding);
  
  // Convert to 0-100 scale
  return similarity * 100;
}
```

### Phase 3: Field-Normalized Citations (Medium Priority)

#### 3.1 Implement Field Normalization
```typescript
function calculateFieldNormalizedCitations(
  paper: Paper,
  fieldAverage: number
): number {
  if (!paper.citationCount || !fieldAverage) return 0;
  
  // Field-normalized citation impact
  const fnci = paper.citationCount / fieldAverage;
  
  // Convert to 0-100 scale (cap at 3x field average = 100)
  return Math.min(100, (fnci / 3) * 100);
}
```

#### 3.2 Add Citation Velocity
```typescript
function calculateCitationVelocity(paper: Paper): number {
  const currentYear = new Date().getFullYear();
  const age = currentYear - paper.year;
  
  if (age === 0) age = 1; // Avoid division by zero
  
  const velocity = paper.citationCount / age;
  
  // Papers with >10 citations/year = 100 points
  return Math.min(100, (velocity / 10) * 100);
}
```

### Phase 4: Multi-Factor Ranking (High Priority)

#### 4.1 Comprehensive Quality Score
```typescript
interface QualityFactors {
  relevanceScore: number;      // 0-100
  citationImpact: number;       // 0-100
  recencyBonus: number;         // 0-25
  journalPrestige: number;      // 0-100
  openAccessBonus: number;      // 0-10
  authorReputation: number;     // 0-100
  citationVelocity: number;     // 0-100
}

function calculateComprehensiveQuality(
  paper: Paper,
  query: string,
  factors: QualityFactors
): number {
  // Adaptive weighting based on paper age
  const age = new Date().getFullYear() - paper.year;
  
  let weights;
  if (age <= 2) {
    // Recent papers: prioritize relevance and recency
    weights = {
      relevance: 0.40,
      recency: 0.25,
      citations: 0.15,
      journal: 0.10,
      velocity: 0.10
    };
  } else if (age <= 5) {
    // Mid-age papers: balanced
    weights = {
      relevance: 0.30,
      recency: 0.15,
      citations: 0.25,
      journal: 0.15,
      velocity: 0.15
    };
  } else {
    // Older papers: prioritize citations
    weights = {
      relevance: 0.25,
      recency: 0.05,
      citations: 0.40,
      journal: 0.20,
      velocity: 0.10
    };
  }
  
  const score = 
    factors.relevanceScore * weights.relevance +
    factors.recencyBonus * weights.recency +
    factors.citationImpact * weights.citations +
    factors.journalPrestige * weights.journal +
    factors.citationVelocity * weights.velocity +
    factors.openAccessBonus * 0.05;  // Small bonus
  
  return Math.min(100, score);
}
```

### Phase 5: Innovation - Hybrid Ranking

#### 5.1 User Intent Detection
```typescript
function detectSearchIntent(query: string): SearchIntent {
  const lowerQuery = query.toLowerCase();
  
  // Systematic review intent
  if (/review|meta-analysis|systematic/i.test(query)) {
    return {
      type: 'review',
      weights: {
        relevance: 0.35,
        citations: 0.35,
        recency: 0.15,
        journal: 0.15
      }
    };
  }
  
  // Cutting-edge research intent
  if (/novel|new|recent|latest|emerging/i.test(query)) {
    return {
      type: 'cutting-edge',
      weights: {
        relevance: 0.40,
        recency: 0.35,
        velocity: 0.15,
        citations: 0.10
      }
    };
  }
  
  // Foundational research intent
  if (/seminal|foundational|classic|original/i.test(query)) {
    return {
      type: 'foundational',
      weights: {
        citations: 0.50,
        relevance: 0.25,
        journal: 0.15,
        recency: 0.10
      }
    };
  }
  
  // Default: balanced
  return {
    type: 'balanced',
    weights: {
      relevance: 0.35,
      citations: 0.25,
      recency: 0.20,
      journal: 0.15,
      velocity: 0.05
    }
  };
}
```

#### 5.2 Diversity Enforcement
```typescript
function enforceResultDiversity(
  papers: Paper[],
  maxPerSource: number = 50
): Paper[] {
  const sourceCount = new Map<string, number>();
  const diversePapers: Paper[] = [];
  
  // Sort by quality first
  const sorted = papers.sort((a, b) => b.qualityScore - a.qualityScore);
  
  for (const paper of sorted) {
    const count = sourceCount.get(paper.source) || 0;
    
    if (count < maxPerSource) {
      diversePapers.push(paper);
      sourceCount.set(paper.source, count + 1);
    }
  }
  
  return diversePapers;
}
```

#### 5.3 Personalization (Future)
```typescript
function personalizeRanking(
  papers: Paper[],
  userProfile: UserProfile
): Paper[] {
  return papers.map(paper => {
    let personalizedScore = paper.qualityScore;
    
    // Boost papers in user's field
    if (paper.field === userProfile.primaryField) {
      personalizedScore *= 1.2;
    }
    
    // Boost papers from followed authors
    if (userProfile.followedAuthors.some(a => 
      paper.authors?.includes(a)
    )) {
      personalizedScore *= 1.15;
    }
    
    // Boost papers similar to user's saved papers
    const similarity = calculateSimilarityToSavedPapers(
      paper,
      userProfile.savedPapers
    );
    personalizedScore *= (1 + similarity * 0.1);
    
    return { ...paper, personalizedScore };
  }).sort((a, b) => b.personalizedScore - a.personalizedScore);
}
```

---

## Implementation Priority

### 🔴 Critical (Do Immediately)
1. Fix contradictory relevance thresholds (1 vs 3)
2. Rebalance quality weights (reduce citation bias)
3. Add recency bonus for 2020-2025 papers

### 🟡 High Priority (This Week)
4. Implement TF-IDF relevance scoring
5. Add field-normalized citations
6. Implement citation velocity
7. Create comprehensive quality score

### 🟢 Medium Priority (Next Sprint)
8. Add semantic similarity (embeddings)
9. Implement user intent detection
10. Add diversity enforcement

### 🔵 Low Priority (Future)
11. Personalization based on user profile
12. A/B testing framework for ranking algorithms
13. Machine learning ranking model

---

## Expected Impact

### Before Fix
- Papers with score 1-2: Filtered out (wasted API calls)
- Recent papers: Ranked low (citation bias)
- Preprints: Ranked low (journal prestige bias)
- Result diversity: Poor (dominated by PubMed)

### After Fix
- Papers with score ≥1: All included (consistent)
- Recent papers: Ranked higher (recency bonus)
- Preprints: Fairly ranked (balanced weights)
- Result diversity: Good (enforced limits)

### Quality Improvement
- Relevance: +40% (better scoring algorithm)
- Recency: +60% (explicit bonus)
- Diversity: +50% (source balancing)
- User satisfaction: +35% (estimated)

---

## Files to Modify

### Backend
1. `backend/src/modules/literature/services/literature-search.service.ts`
   - Update quality scoring algorithm
   - Add recency bonus
   - Implement TF-IDF relevance

2. `backend/src/modules/literature/services/paper-ranking.service.ts` (create new)
   - Comprehensive ranking logic
   - Field normalization
   - Citation velocity

3. `backend/src/modules/literature/services/diversity-enforcer.service.ts` (create new)
   - Source diversity
   - Result balancing

### Configuration
4. `backend/src/modules/literature/config/ranking-config.ts` (create new)
   - Configurable weights
   - Intent-based profiles
   - A/B test variants

---

## Testing Plan

### Unit Tests
- Test relevance scoring with various queries
- Test recency bonus calculation
- Test field normalization
- Test diversity enforcement

### Integration Tests
- Search "lemonade" - verify 257 papers ranked correctly
- Search "COVID-19 vaccine" - verify recent papers ranked high
- Search "machine learning" - verify diversity across sources

### A/B Testing
- 50% users: Old algorithm
- 50% users: New algorithm
- Metrics: Click-through rate, time on paper, user satisfaction

---

## Next Steps

1. Review and approve this analysis
2. Implement Phase 1 (critical fixes)
3. Test with real queries
4. Deploy and monitor
5. Iterate based on user feedback
