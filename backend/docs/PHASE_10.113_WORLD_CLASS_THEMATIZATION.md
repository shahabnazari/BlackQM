# Phase 10.113: World-Class Paper Extraction for Thematization

## Vision Statement
**"#1 Literature-to-Theme Pipeline in the World"**

Build the most advanced, scientifically rigorous system for extracting research papers optimized for Q-methodology thematization. This is not just literature search - it's **Thematization-First Paper Intelligence**.

---

## Executive Summary

### Current State Analysis
| Component | Current | Problem | Target |
|-----------|---------|---------|--------|
| Theme Extraction Paper Limit | 20 papers | Arbitrary, non-scientific limit | 50-300 configurable |
| AI Theme Analysis | GPT-4 single-pass | Limited context window | Hierarchical Multi-Pass |
| Paper Relevance for Themes | Generic quality score | Not optimized for thematization | Theme-Fit Score |
| User Control | None | One-size-fits-all | Tiered Selection UI |
| Cost Model | Fixed | Doesn't scale with value | Pay-per-paper tiered |

### Innovation Pillars
1. **Hierarchical Theme Extraction** - Multi-level analysis from 50-300 papers
2. **Theme-Fit Relevance Scoring** - Papers ranked by thematization potential
3. **Controversy Detection** - Automatic opposing viewpoint identification
4. **Configurable Depth** - User-selected paper counts with pricing tiers
5. **Provenance Tracking** - Full citation chain for every statement

---

## Architecture: Thematization Intelligence Pipeline (TIP)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PHASE 10.113 ARCHITECTURE                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────────┐    ┌──────────────────────────┐    │
│  │ User Query  │───▶│ AI Query        │───▶│ Theme-Optimized Search   │    │
│  │ + Paper     │    │ Refinement      │    │ (18 sources)             │    │
│  │ Tier Select │    │ Service         │    │                          │    │
│  └─────────────┘    └─────────────────┘    └──────────────────────────┘    │
│         │                                              │                    │
│         ▼                                              ▼                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                  THEME-FIT RELEVANCE SCORING                         │   │
│  │  ┌───────────────┐  ┌─────────────────┐  ┌────────────────────┐     │   │
│  │  │ BM25 Relevance│  │ Semantic Match  │  │ Theme-Fit Score    │     │   │
│  │  │ (30%)         │  │ (30%)           │  │ (40%) NEW!         │     │   │
│  │  └───────────────┘  └─────────────────┘  └────────────────────┘     │   │
│  │                                                                      │   │
│  │  Theme-Fit Factors:                                                  │   │
│  │  - Controversy potential (opposing viewpoint indicators)             │   │
│  │  - Statement generation potential (clear positions)                  │   │
│  │  - Multi-perspective coverage (balanced viewpoints)                  │   │
│  │  - Citation controversy index (polarized citing)                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                │                                            │
│                                ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │              HIERARCHICAL THEME EXTRACTION ENGINE                    │   │
│  │                                                                      │   │
│  │  Level 1: Meta-Theme Discovery (ALL papers)                         │   │
│  │  ├── Cluster papers by semantic similarity                          │   │
│  │  ├── Identify 5-8 meta-themes                                       │   │
│  │  └── Map paper → meta-theme relationships                           │   │
│  │                                                                      │   │
│  │  Level 2: Sub-Theme Extraction (per meta-theme)                     │   │
│  │  ├── Drill into each meta-theme cluster                             │   │
│  │  ├── Extract 3-5 sub-themes per meta-theme                          │   │
│  │  └── Identify key papers for each sub-theme                         │   │
│  │                                                                      │   │
│  │  Level 3: Controversy & Stance Analysis                              │   │
│  │  ├── Detect opposing viewpoints within sub-themes                   │   │
│  │  ├── Map citation patterns (who cites whom positively/negatively)   │   │
│  │  └── Score controversy strength (0-1)                               │   │
│  │                                                                      │   │
│  │  Level 4: Statement Generation Readiness                            │   │
│  │  ├── Extract key claims from papers                                 │   │
│  │  ├── Generate balanced Q-sort statement candidates                  │   │
│  │  └── Ensure perspective diversity                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                │                                            │
│                                ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    OUTPUT: THEMATIZATION PACKAGE                     │   │
│  │                                                                      │   │
│  │  {                                                                   │   │
│  │    "papers": Paper[] (50-300 based on tier),                        │   │
│  │    "metaThemes": MetaTheme[] (5-8),                                 │   │
│  │    "subThemes": SubTheme[] (15-40),                                 │   │
│  │    "controversies": Controversy[] (auto-detected),                  │   │
│  │    "statementCandidates": Statement[] (40-80),                      │   │
│  │    "provenance": ProvenanceChain (full traceability),               │   │
│  │    "qualityMetrics": ThematizationQuality                           │   │
│  │  }                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Week-by-Week Implementation Plan

### Week 1: Foundation & Paper Limit Fix
**Goal**: Remove 20-paper bottleneck, implement configurable paper counts

#### Day 1-2: Configurable Paper Count
- [ ] Create `ThematizationConfig` interface with paper count tiers
- [ ] Update `theme-extraction.service.ts` line 276 to use configurable limit
- [ ] Add `paperCount` parameter to `extractThemesWithAI()` method
- [ ] Implement validation for tier-based limits (50/100/150/200/250/300)

```typescript
// New interface
interface ThematizationTier {
  paperCount: 50 | 100 | 150 | 200 | 250 | 300;
  maxThemes: number;
  maxSubThemes: number;
  priceMultiplier: number;
}

const THEMATIZATION_TIERS: Record<number, ThematizationTier> = {
  50:  { paperCount: 50,  maxThemes: 5,  maxSubThemes: 15, priceMultiplier: 1.0 },
  100: { paperCount: 100, maxThemes: 7,  maxSubThemes: 25, priceMultiplier: 1.5 },
  150: { paperCount: 150, maxThemes: 10, maxSubThemes: 35, priceMultiplier: 2.0 },
  200: { paperCount: 200, maxThemes: 12, maxSubThemes: 40, priceMultiplier: 2.5 },
  250: { paperCount: 250, maxThemes: 14, maxSubThemes: 50, priceMultiplier: 3.0 },
  300: { paperCount: 300, maxThemes: 15, maxSubThemes: 60, priceMultiplier: 3.5 },
};
```

#### Day 3-4: Chunked Processing for Large Paper Sets
- [ ] Implement `ChunkedThemeExtractor` class
- [ ] Process papers in batches of 20-30 for AI (token limit safety)
- [ ] Merge and deduplicate themes from chunks
- [ ] Add progress tracking for long-running extractions

```typescript
// Chunked processing architecture
class ChunkedThemeExtractor {
  private readonly CHUNK_SIZE = 25; // Optimal for GPT-4 context

  async extractFromLargePaperSet(papers: Paper[], tier: ThematizationTier) {
    const chunks = this.chunkPapers(papers, this.CHUNK_SIZE);
    const chunkThemes: ExtractedTheme[][] = [];

    for (const chunk of chunks) {
      const themes = await this.extractFromChunk(chunk);
      chunkThemes.push(themes);
    }

    return this.mergeAndDeduplicateThemes(chunkThemes, tier);
  }
}
```

#### Day 5: Integration Testing
- [ ] Test with 50, 100, 200, 300 paper sets
- [ ] Verify theme quality doesn't degrade with more papers
- [ ] Performance benchmarks for each tier
- [ ] Memory usage monitoring

### Week 2: Theme-Fit Relevance Scoring ✅ COMPLETED (December 8, 2025)
**Goal**: New scoring algorithm optimized for thematization potential

#### Day 1-2: Theme-Fit Score Algorithm
- [x] Create `ThemeFitScoringService` ✅ (536 lines, theme-fit-scoring.service.ts)
- [x] Implement controversy potential detection ✅ (25+ regex patterns)
- [x] Add statement generation potential analysis ✅ (30+ regex patterns)
- [x] Calculate multi-perspective coverage score ✅ (25+ patterns)

```typescript
// ✅ IMPLEMENTED: theme-fit-scoring.service.ts
interface ThemeFitScore {
  readonly controversyPotential: number;   // 0-1: Does abstract contain opposing views?
  readonly statementClarity: number;       // 0-1: Clear positions that can become statements
  readonly perspectiveDiversity: number;   // 0-1: Multiple viewpoints represented
  readonly citationControversy: number;    // 0-1: Polarized citation patterns
  readonly overallThemeFit: number;        // Weighted combination
  readonly explanation: string;            // Debug explanation
}

// ✅ IMPLEMENTED: Scoring weights with configurable constants
const DEFAULT_WEIGHTS = {
  controversyPotential: 0.30,   // 30%
  statementClarity: 0.25,       // 25%
  perspectiveDiversity: 0.25,   // 25%
  citationControversy: 0.20,    // 20%
};

// ✅ IMPLEMENTED: Citation velocity boost for highly-debated papers
const CITATION_BOOST_CONFIG = {
  CITATION_COUNT_DIVISOR: 500,
  MAX_CITATION_BOOST: 0.2,
  VELOCITY_THRESHOLDS: [
    { minCitationsPerYear: 20, boost: 0.15 },
    { minCitationsPerYear: 10, boost: 0.10 },
    { minCitationsPerYear: 5, boost: 0.05 },
  ],
};
```

#### Day 3-4: Integration with Search Pipeline
- [x] Modify `search-pipeline.service.ts` to include Theme-Fit score ✅
- [x] Update combined score formula: 0.3×BM25 + 0.3×Semantic + 0.4×ThemeFit ✅
- [x] Add Theme-Fit score to paper response DTO ✅ (literature.dto.ts)
- [x] Create UI indicator for "Good for Thematization" ✅ (isGoodForThematization field)

#### Day 5: Testing & Calibration
- [x] Test Theme-Fit scoring with comprehensive unit tests ✅ (38 tests passing)
- [x] Calibrate weights based on academic literature patterns ✅
- [x] Add thematization tier labels for UI display ✅

### Week 3: Hierarchical Theme Extraction ✅ COMPLETED (December 8, 2025)
**Goal**: Multi-level theme discovery from meta-themes to sub-themes

#### Day 1-2: Meta-Theme Discovery (Level 1)
- [x] Implement semantic clustering using embeddings ✅ (using LocalEmbeddingService + KMeansClusteringService)
- [x] Create `MetaThemeDiscoveryService` ✅ (1000+ lines, meta-theme-discovery.service.ts)
- [x] Cluster papers into 5-8 meta-themes ✅ (adaptive k = sqrt(n/2), capped at 8)
- [x] Generate meta-theme labels ✅ (TF-based keyword extraction)

```typescript
// ✅ IMPLEMENTED: hierarchical-theme.types.ts
interface MetaTheme {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly paperIds: readonly string[];           // Paper IDs in this cluster
  readonly representativePaperIds: readonly string[]; // Key papers (closest to centroid)
  readonly centroidEmbedding: readonly number[];  // Cluster center
  readonly coherenceScore: number;                // How well papers fit together (0-1)
  readonly weight: number;                        // Relative importance (0-1)
  readonly keywords: readonly string[];           // Extracted keywords
  readonly avgThemeFitScore: number;              // Average Theme-Fit score
  readonly subThemes: readonly SubTheme[];        // Populated in Level 2
  readonly controversyLevel: number;              // 0-1
  readonly createdAt: Date;
}

// ✅ IMPLEMENTED: MetaThemeDiscoveryService
@Injectable()
class MetaThemeDiscoveryService {
  async extractHierarchicalThemes(
    papers: readonly HierarchicalPaperInput[],
    config?: Partial<HierarchicalExtractionConfig>,
    progressCallback?: HierarchicalProgressCallback,
    signal?: AbortSignal,
  ): Promise<HierarchicalExtractionResult> {
    // Stage 1: Generate embeddings (LocalEmbeddingService)
    // Stage 2: K-means++ clustering → 5-8 meta-themes
    // Stage 3: Label generation (TF-based)
    // Stage 4: Sub-theme extraction
    // Stage 5: Quality metrics calculation
  }
}
```

#### Day 3-4: Sub-Theme Extraction (Level 2)
- [x] Extract 3-5 sub-themes per meta-theme ✅ (subClusterMetaTheme method)
- [x] Identify key papers for each sub-theme ✅ (closest to centroid)
- [x] Map sub-theme relationships ✅ (parentMetaThemeId linking)

```typescript
// ✅ IMPLEMENTED: hierarchical-theme.types.ts
interface SubTheme {
  readonly id: string;
  readonly parentMetaThemeId: string;
  readonly label: string;
  readonly description: string;
  readonly paperIds: readonly string[];
  readonly keyPaperIds: readonly string[];  // Most representative papers
  readonly keywords: readonly string[];
  readonly weight: number;                  // Relative importance (0-1)
  readonly controversyLevel: number;        // 0-1
  readonly centroidEmbedding: readonly number[];
  readonly coherenceScore: number;
}
```

#### Day 5: Testing Hierarchical Extraction
- [x] Test with diverse research domains ✅ (30 unit tests)
- [x] Verify theme hierarchy makes sense ✅ (type guards, structure validation)
- [x] Ensure no papers are "orphaned" ✅ (orphanedPaperIds tracking)
- [x] Performance testing ✅ (handles 300 papers, <5s with mocks)

### Week 4: Controversy Detection & Stance Analysis
**Goal**: Automatic identification of opposing viewpoints

#### Day 1-2: Enhanced Controversy Detection (Level 3)
- [ ] Upgrade `detectControversialThemes()` method
- [ ] Implement citation pattern analysis
- [ ] Add AI-powered stance detection
- [ ] Create controversy strength scoring

```typescript
interface ControversyAnalysis {
  topic: string;
  viewpoints: Viewpoint[];
  strengthScore: number;        // 0-1
  citationPattern: 'polarized' | 'mixed' | 'emerging' | 'consensus';
  keyPapersPerViewpoint: Map<string, string[]>;
  suggestedStatements: string[];  // Pre-generated balanced statements
}

interface Viewpoint {
  label: string;
  description: string;
  supportingPapers: string[];
  keyAuthors: string[];
  keyArguments: string[];
}
```

#### Day 3-4: Citation Pattern Analysis
- [ ] Analyze who cites whom (via OpenAlex citations)
- [ ] Detect citation clusters (papers that cite each other)
- [ ] Identify "debate" papers (heavily cited by both sides)
- [ ] Score citation controversy index

#### Day 5: Integration & Testing
- [ ] Integrate controversy detection into pipeline
- [ ] Test with known controversial topics
- [ ] Validate viewpoint separation accuracy

### Week 5: Statement Generation Readiness
**Goal**: Pre-generate Q-sort statement candidates from themes

#### Day 1-2: Claim Extraction (Level 4)
- [ ] Extract key claims from paper abstracts
- [ ] Identify position statements
- [ ] Map claims to themes/sub-themes
- [ ] Score claim "sortability" for Q-method

```typescript
interface ExtractedClaim {
  id: string;
  sourceSubTheme: string;
  sourcePapers: string[];      // Papers containing this claim
  originalText: string;        // Exact quote from paper
  normalizedClaim: string;     // Cleaned up version
  perspective: 'supportive' | 'critical' | 'neutral';
  statementPotential: number;  // 0-1: How good for Q-sort
}
```

#### Day 3-4: Balanced Statement Generation
- [ ] Generate balanced Q-sort statements from claims
- [ ] Ensure perspective diversity (supportive, critical, neutral, balanced)
- [ ] Create statement deduplication logic
- [ ] Add provenance tracking for each statement

#### Day 5: Testing Statement Quality
- [ ] Review generated statements with Q-method experts
- [ ] Test statement diversity metrics
- [ ] Validate provenance accuracy

### Week 6: Tiered Pricing & UI
**Goal**: User-facing tier selection with pricing

#### Day 1-2: Backend Pricing Infrastructure
- [ ] Create `ThematizationPricingService`
- [ ] Implement tier-based cost calculation
- [ ] Add usage tracking per user
- [ ] Create billing integration hooks

```typescript
interface ThematizationPricing {
  baseCost: number;           // Base cost in credits
  perPaperCost: number;       // Cost per paper above minimum
  tierMultiplier: number;     // Tier-specific multiplier

  tiers: {
    50:  { credits: 10,  description: "Quick Analysis" },
    100: { credits: 18,  description: "Standard Analysis" },
    150: { credits: 28,  description: "Deep Analysis" },
    200: { credits: 40,  description: "Comprehensive Analysis" },
    250: { credits: 55,  description: "Expert Analysis" },
    300: { credits: 75,  description: "Full Research Analysis" },
  };
}
```

#### Day 3-4: Frontend Tier Selection UI
- [ ] Create tier selection component
- [ ] Show pricing for each tier
- [ ] Display estimated processing time
- [ ] Add preview of what each tier includes

#### Day 5: End-to-End Testing
- [ ] Test complete flow from search to thematization
- [ ] Verify pricing calculations
- [ ] Test edge cases (insufficient credits, etc.)

### Week 7: AI Query Optimization for Thematization
**Goal**: Tune existing AI services for thematization

#### Day 1-2: Thematization-Aware Query Expansion
- [ ] Modify `query-expansion.service.ts` for thematization mode
- [ ] Add "controversy expansion" - suggest opposing terms
- [ ] Include methodology-specific terms automatically
- [ ] Detect if query is too broad for quality thematization

```typescript
interface ThematizationQueryExpansion extends ExpandedQuery {
  controversyTerms: string[];       // Terms likely to surface debates
  methodologyTerms: string[];       // Research method terms
  thematizationWarnings: string[];  // e.g., "Query too broad"
  suggestedNarrowing: string[];     // More specific query suggestions
}
```

#### Day 3-4: Search Suggestions for Thematization
- [ ] Add thematization-specific suggestions
- [ ] Surface controversial topics
- [ ] Suggest methodology combinations
- [ ] Learn from successful thematizations

#### Day 5: Testing & Refinement
- [ ] Test query expansion improvements
- [ ] Validate suggestion relevance
- [ ] Performance testing

### Week 8: Integration, Testing & Polish
**Goal**: Complete integration and production readiness

#### Day 1-2: Full Integration Testing
- [ ] End-to-end testing of complete pipeline
- [ ] Test all tier combinations
- [ ] Load testing with concurrent users
- [ ] Memory leak detection

#### Day 3-4: Bug Fixes & Performance
- [ ] Fix any integration bugs
- [ ] Optimize slow paths
- [ ] Add monitoring and alerting
- [ ] Create admin dashboard for thematization metrics

#### Day 5: Documentation & Launch Prep
- [ ] API documentation
- [ ] User guide for thematization feature
- [ ] Internal runbook for operations
- [ ] Launch checklist completion

---

## Technical Specifications

### API Changes

#### New Endpoints

```typescript
// POST /api/thematization/extract
interface ThematizationRequest {
  paperIds: string[];
  tier: 50 | 100 | 150 | 200 | 250 | 300;
  options?: {
    includeControversies?: boolean;
    generateStatements?: boolean;
    maxThemes?: number;
  };
}

interface ThematizationResponse {
  metaThemes: MetaTheme[];
  subThemes: SubTheme[];
  controversies: ControversyAnalysis[];
  statementCandidates: StatementCandidate[];
  provenance: ProvenancePackage;
  pricing: {
    creditsUsed: number;
    tierApplied: number;
  };
  metrics: {
    processingTimeMs: number;
    papersAnalyzed: number;
    themesExtracted: number;
    controversiesDetected: number;
  };
}

// GET /api/thematization/pricing
interface PricingResponse {
  tiers: ThematizationTier[];
  userCredits: number;
  recommendations: string[];
}
```

### Database Changes

```sql
-- New tables for thematization tracking
CREATE TABLE thematization_jobs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  tier INT NOT NULL,
  paper_count INT NOT NULL,
  status VARCHAR(20) NOT NULL,
  credits_charged INT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  result_summary JSONB
);

CREATE TABLE thematization_results (
  id UUID PRIMARY KEY,
  job_id UUID REFERENCES thematization_jobs(id),
  meta_themes JSONB,
  sub_themes JSONB,
  controversies JSONB,
  statements JSONB,
  provenance JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Performance Targets

| Tier | Papers | Target Time | Max Memory |
|------|--------|-------------|------------|
| 50   | 50     | 30 seconds  | 256 MB     |
| 100  | 100    | 60 seconds  | 512 MB     |
| 150  | 150    | 90 seconds  | 768 MB     |
| 200  | 200    | 2 minutes   | 1 GB       |
| 250  | 250    | 3 minutes   | 1.25 GB    |
| 300  | 300    | 4 minutes   | 1.5 GB     |

---

## Quality Assurance Checklist

### Code Quality
- [ ] All new services have unit tests (>80% coverage)
- [ ] Integration tests for full pipeline
- [ ] TypeScript strict mode compliance
- [ ] No `any` types in public interfaces
- [ ] All error paths handled with proper logging

### Security
- [ ] Input validation on all endpoints
- [ ] Rate limiting per user per tier
- [ ] No PII in logs
- [ ] Secure handling of paper content

### Performance
- [ ] No memory leaks in long-running extractions
- [ ] Chunked processing prevents OOM
- [ ] Database queries optimized with indices
- [ ] Caching implemented where appropriate

### User Experience
- [ ] Clear progress indicators for long extractions
- [ ] Informative error messages
- [ ] Tier comparison UI is intuitive
- [ ] Pricing is transparent

---

## Potential Patent Claims (Review with Legal)

1. **Hierarchical Theme Extraction from Academic Literature**
   - Multi-level clustering with semantic embeddings
   - Automatic meta-theme to sub-theme relationship mapping

2. **Theme-Fit Relevance Scoring for Q-Methodology**
   - Novel scoring algorithm optimizing for thematization potential
   - Controversy potential as ranking factor

3. **Automatic Controversy Detection in Research Literature**
   - Citation pattern analysis for stance detection
   - AI-powered opposing viewpoint extraction

4. **Provenance-Tracked Statement Generation**
   - Full traceability from paper to statement
   - Citation chain preservation

---

## Risk Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| AI hallucination in themes | Medium | High | Human review option, confidence scores |
| Token limits exceeded | Medium | Medium | Chunked processing, fallback to TF-IDF |
| Cost overrun for users | Low | High | Clear pricing UI, confirmation before charge |
| Poor theme quality at scale | Medium | High | Quality metrics, tier-appropriate limits |
| Performance degradation | Medium | Medium | Monitoring, auto-scaling, timeouts |

---

## Success Metrics

### Launch Criteria (Week 8)
- [ ] All tiers functional in production
- [ ] <1% error rate in thematization
- [ ] Average user satisfaction >4.0/5.0
- [ ] Processing times within targets

### 30-Day Post-Launch
- [ ] >50 successful thematizations
- [ ] User retention with thematization >70%
- [ ] Average controversy detection accuracy >80%
- [ ] Statement quality rating >4.2/5.0

---

## Appendix: Competitor Comparison

| Feature | VQmethod | Elicit | Consensus | Semantic Scholar |
|---------|----------|--------|-----------|------------------|
| Papers for Thematization | 50-300 | 8-50 | N/A | N/A |
| Hierarchical Themes | Yes | No | No | No |
| Controversy Detection | Yes | No | No | No |
| Q-Method Statements | Yes | No | No | No |
| Provenance Tracking | Full | Partial | Basic | Basic |
| Tiered Pricing | Yes | No | No | Free |

**Our Advantage**: Purpose-built for Q-methodology thematization with the largest paper analysis capacity and automatic controversy detection.

---

*Phase 10.113 - Making VQmethod the #1 Literature-to-Theme Pipeline in the World*
