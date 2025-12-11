# Backend Literature Search Architecture

**Version**: 2.0 (Phase 10.113 Week 9)
**Date**: December 9, 2025
**Status**: Production-Ready (Netflix-Grade)

---

## Executive Summary

The Literature Search system is a **Netflix-grade academic search engine** that aggregates 15+ academic sources, applies intelligent ranking with semantic understanding, and supports scientific A/B testing of query optimization strategies.

### Key Features
- **Multi-source aggregation**: PubMed, Scopus, CrossRef, CORE, ArXiv, IEEE, Springer, Nature, and more
- **Semantic ranking**: BGE embeddings for conceptual similarity
- **BM25 + Semantic + ThemeFit**: Triple-layered ranking formula
- **Scientific query optimization**: A/B testable query expansion modes
- **Progressive loading**: Real-time results as sources respond

---

## System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          LITERATURE SEARCH SYSTEM                           │
│                         (Netflix-Grade Architecture)                        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        1. QUERY OPTIMIZATION LAYER                          │
│                    (Phase 10.113 Week 9 - Scientific)                       │
│                                                                             │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐        │
│  │  Query Validation │   │ Mode Selection   │   │ A/B Metrics      │        │
│  │  - Min 2 words    │   │ - none           │   │ - Papers found   │        │
│  │  - Min 6 chars    │   │ - local (default)│   │ - Semantic score │        │
│  │  - Quality score  │   │ - enhanced       │   │ - Quality score  │        │
│  │                   │   │ - ai (GPT-4)     │   │ - Processing ms  │        │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                         2. SOURCE ROUTING LAYER                             │
│                    (Intelligent Source Selection)                           │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     SourceRouterService                              │   │
│  │  - Query analysis → Source recommendation                            │   │
│  │  - Priority-based source selection                                   │   │
│  │  - Parallel fetching with timeouts                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐       │
│  │ PubMed   │ Scopus   │ CrossRef │ CORE     │ ArXiv    │ IEEE     │       │
│  │ (Free)   │ (API)    │ (Free)   │ (Free)   │ (Free)   │ (API)    │       │
│  ├──────────┼──────────┼──────────┼──────────┼──────────┼──────────┤       │
│  │ Springer │ Nature   │ Wiley    │ Sage     │ SSRN     │ ERIC     │       │
│  │ (API)    │ (API)    │ (API)    │ (API)    │ (Free)   │ (Free)   │       │
│  ├──────────┴──────────┴──────────┴──────────┴──────────┴──────────┤       │
│  │                    ScienceDirect, Web of Science                 │       │
│  └──────────────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        3. SEARCH PIPELINE LAYER                             │
│                    (BM25 + Semantic + ThemeFit)                             │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     SearchPipelineService                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                      │                                      │
│           ┌──────────────────────────┼──────────────────────────┐          │
│           ▼                          ▼                          ▼          │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐        │
│  │   BM25 Score     │   │  Semantic Score  │   │  ThemeFit Score  │        │
│  │  (Text Match)    │   │  (BGE Embeddings)│   │  (Topic Align)   │        │
│  │                  │   │                  │   │                  │        │
│  │  Weight: 0.3     │   │  Weight: 0.5     │   │  Weight: 0.2     │        │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘        │
│           │                          │                          │          │
│           └──────────────────────────┼──────────────────────────┘          │
│                                      ▼                                      │
│                        ┌──────────────────┐                                │
│                        │  Final Score =   │                                │
│                        │  0.3×BM25 +      │                                │
│                        │  0.5×Semantic +  │                                │
│                        │  0.2×ThemeFit    │                                │
│                        └──────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        4. QUALITY & ENRICHMENT                              │
│                                                                             │
│  ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐        │
│  │ Paper Quality    │   │ OpenAlex         │   │ Citation         │        │
│  │ Scoring          │   │ Enrichment       │   │ Enrichment       │        │
│  │ - h-index        │   │ - Concepts       │   │ - Reference data │        │
│  │ - Citations/year │   │ - Open Access    │   │ - CrossRef/      │        │
│  │ - Journal impact │   │ - Institutions   │   │   Semantic       │        │
│  └──────────────────┘   └──────────────────┘   └──────────────────┘        │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           5. RESULTS OUTPUT                                 │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Ranked papers with:                                                 │   │
│  │  - Composite score (BM25 + Semantic + ThemeFit)                      │   │
│  │  - Quality indicators                                                │   │
│  │  - Open access status                                                │   │
│  │  - Source attribution                                                │   │
│  │  - Metadata (DOI, authors, journal, year)                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Service Architecture

### Service Dependency Graph

```
LiteratureController
        │
        ├──► LiteratureService (orchestrator)
        │           │
        │           ├──► ScientificQueryOptimizerService (Week 9)
        │           │           └──► QueryExpansionService (optional AI)
        │           │
        │           ├──► SourceRouterService
        │           │           └──► [15+ source services]
        │           │
        │           ├──► SearchPipelineService
        │           │           ├──► LocalEmbeddingService (BGE)
        │           │           └──► ThemeExtractionService
        │           │
        │           ├──► PaperQualityUtil
        │           │
        │           └──► OpenAlexEnrichmentService
        │                       └──► UniversalCitationEnrichmentService
        │
        └──► ThematizationQueryService
                    └──► ThematizationMetricsService
```

### Service Responsibilities

| Service | File | Responsibility |
|---------|------|----------------|
| `LiteratureService` | `literature.service.ts` | Main orchestrator for search operations |
| `ScientificQueryOptimizerService` | `scientific-query-optimizer.service.ts` | Query validation & A/B testable optimization |
| `SourceRouterService` | `source-router.service.ts` | Source selection & parallel fetching |
| `SearchPipelineService` | `search-pipeline.service.ts` | BM25 + Semantic + ThemeFit ranking |
| `LocalEmbeddingService` | `local-embedding.service.ts` | BGE embedding generation |
| `ThemeExtractionService` | `theme-extraction.service.ts` | Topic/theme extraction |
| `PaperQualityUtil` | `paper-quality.util.ts` | Quality score calculation |
| `OpenAlexEnrichmentService` | `openalex-enrichment.service.ts` | Metadata enrichment |
| `ThematizationQueryService` | `thematization-query.service.ts` | Query analysis & thematization |

---

## Query Optimization (Phase 10.113 Week 9)

### The Scientific Question

> **Does AI query expansion help or bias academic search results?**

Instead of blindly adding AI expansion, we created a **configurable, A/B testable system** with metrics tracking to measure effectiveness empirically.

### Query Expansion Modes

| Mode | Description | Latency | Cost | Use Case |
|------|-------------|---------|------|----------|
| `none` | Original query only | 0ms | $0 | Baseline measurement |
| `local` | Spell-check + normalization | <1ms | $0 | **Default** (safe) |
| `enhanced` | Local + methodology terms | <5ms | $0 | Research-focused queries |
| `ai` | Full GPT-4 expansion | 500-2000ms | ~$0.02 | Experimental A/B testing |

### Minimum Query Requirements

```typescript
const MIN_QUERY_CHARACTERS = 6;      // Minimum total characters
const MIN_MEANINGFUL_WORDS = 2;       // Minimum non-stop words
const MIN_WORD_LENGTH = 3;            // Minimum length for "meaningful"
const MIN_LONGEST_WORD = 4;           // At least one substantive term
```

### Quality Score Calculation

```
Base Score: 100 points

Deductions:
  - Short query (<12 chars):     -30
  - Few meaningful words (<2):   -30
  - No substantial terms (<5):   -20

Bonuses:
  - Academic terms:              +5 each (max +20)
  - 4+ meaningful words:         +10

Threshold: Minimum 20 to proceed with search
```

### Why `local` Mode is Recommended

The semantic scoring in `SearchPipelineService` **already handles synonyms** at the RANKING stage:
- "heart attack" ≈ "myocardial infarction" (captured by BGE embeddings)
- No need for AI to pre-expand these

AI expansion adds:
- **Latency**: 500-2000ms per query
- **Cost**: ~$0.02 per query
- **Bias risk**: AI interpretation may skew results

---

## Search Pipeline Details

### BM25 Scoring

Best Match 25 - traditional text relevance scoring:

```typescript
// BM25 parameters
const k1 = 1.2;  // Term frequency saturation
const b = 0.75;  // Length normalization

// Score calculation
score = IDF × (tf × (k1 + 1)) / (tf + k1 × (1 - b + b × docLen/avgDocLen))
```

**Weight in final score**: 30%

### Semantic Scoring (BGE Embeddings)

Uses `BAAI/bge-small-en-v1.5` model for embedding generation:

```typescript
// Cosine similarity between query and document embeddings
semanticScore = cosineSimilarity(queryEmbedding, docEmbedding);
```

**Weight in final score**: 50% (primary ranking factor)

### ThemeFit Scoring

Topic alignment based on extracted themes:

```typescript
// Theme overlap calculation
themeFitScore = themeOverlap(extractedThemes, queryThemes) / totalThemes;
```

**Weight in final score**: 20%

### Combined Formula

```
FinalScore = 0.3 × BM25 + 0.5 × Semantic + 0.2 × ThemeFit
```

---

## Source Routing Architecture

### Source Categories

```
┌─────────────────────────────────────────────────────────────────┐
│                      FREE ACADEMIC SOURCES                       │
├─────────────────────────────────────────────────────────────────┤
│  PubMed     │ Biomedical literature (NIH)                       │
│  CrossRef   │ DOI registry (scholarly metadata)                 │
│  CORE       │ Open access aggregator                            │
│  ArXiv      │ Preprints (physics, math, CS, etc.)               │
│  SSRN       │ Social sciences preprints                         │
│  ERIC       │ Education research                                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      API-KEY SOURCES                             │
├─────────────────────────────────────────────────────────────────┤
│  Scopus          │ Elsevier's citation database                 │
│  IEEE Xplore     │ Engineering & technology                     │
│  Springer Nature │ Scientific publishing                        │
│  Wiley           │ Scientific publishing                        │
│  Sage            │ Social sciences                              │
│  ScienceDirect   │ Elsevier journals                            │
│  Web of Science  │ Citation index                               │
└─────────────────────────────────────────────────────────────────┘
```

### Source Selection Logic

```typescript
// SourceRouterService determines optimal sources based on:
1. Query domain (biomedical → PubMed, CS → ArXiv)
2. API key availability
3. Rate limit status
4. Historical response times
5. User preferences
```

### Parallel Fetching Strategy

```
Query: "machine learning healthcare"
        │
        ├──► PubMed (parallel) ────┐
        ├──► CrossRef (parallel) ──┤
        ├──► CORE (parallel) ──────┤
        ├──► ArXiv (parallel) ─────┼──► Aggregate & Deduplicate
        ├──► Scopus (parallel) ────┤
        └──► IEEE (parallel) ──────┘

Timeout: 30 seconds per source
Total timeout: 45 seconds (with graceful degradation)
```

---

## Performance Optimizations

### Netflix-Grade Features

| Feature | Description | Benefit |
|---------|-------------|---------|
| **Parallel Source Fetching** | All sources queried simultaneously | 3-5x faster |
| **Graceful Degradation** | Return partial results if sources timeout | Always responsive |
| **LRU Caching** | Cache embeddings, results | 100x faster repeated queries |
| **Cursor-Based Pagination** | Efficient large result sets | Low memory footprint |
| **Early Stopping** | Stop when sufficient results | Save compute |
| **Request Hedging** | Duplicate slow requests | P99 latency reduction |
| **Adaptive Timeouts** | Adjust based on source performance | Optimal wait times |

### Caching Strategy

```
┌─────────────────────────────────────────────────────────────────┐
│                       CACHE LAYERS                               │
├─────────────────────────────────────────────────────────────────┤
│  L1: Embedding Cache                                            │
│      - Key: query/document hash                                 │
│      - TTL: 24 hours                                            │
│      - Size: 10,000 entries (LRU)                               │
├─────────────────────────────────────────────────────────────────┤
│  L2: Search Results Cache                                       │
│      - Key: query + filters hash                                │
│      - TTL: 1 hour                                              │
│      - Size: 1,000 entries (LRU)                                │
├─────────────────────────────────────────────────────────────────┤
│  L3: Source Response Cache                                      │
│      - Key: source + query hash                                 │
│      - TTL: 15 minutes                                          │
│      - Size: 5,000 entries (LRU)                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## API Endpoints

### Search Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/literature/search` | POST | Main search endpoint |
| `/api/literature/query/validate` | POST | Validate query quality |
| `/api/literature/query/optimize` | POST | Optimize query with mode |
| `/api/literature/query/effectiveness` | GET | A/B test comparison |
| `/api/literature/query/stats` | GET | Optimizer statistics |

### Request/Response Examples

**Search Request:**
```json
POST /api/literature/search
{
  "query": "machine learning healthcare",
  "filters": {
    "yearRange": [2020, 2025],
    "openAccessOnly": true
  },
  "sources": ["pubmed", "crossref", "arxiv"],
  "limit": 100
}
```

**Query Validation:**
```json
POST /api/literature/query/validate
{
  "query": "ML"
}

Response:
{
  "isValid": false,
  "qualityScore": 15,
  "issues": [
    "Query is too short (2 characters, minimum 6)",
    "Need at least 2 meaningful words"
  ],
  "suggestions": [
    "Try: 'machine learning applications'",
    "Add methodology or time frame"
  ]
}
```

---

## Thematization Pipeline

### Flow

```
Selected Papers
       │
       ▼
┌──────────────────┐
│ Theme Extraction │ ──► Extract themes from abstracts/titles
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ Theme Clustering │ ──► Group similar themes
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ Theme Ranking    │ ──► Score by frequency, quality, relevance
└──────────────────┘
       │
       ▼
┌──────────────────┐
│ Gap Analysis     │ ──► Identify research gaps
└──────────────────┘
```

### Thematization Services

| Service | File | Responsibility |
|---------|------|----------------|
| `ThematizationQueryService` | `thematization-query.service.ts` | Query-based theme extraction |
| `ThematizationMetricsService` | `thematization-metrics.service.ts` | Performance metrics tracking |
| `ThematizationCacheService` | `thematization-cache.service.ts` | Theme caching |
| `ThematizationAdminService` | `thematization-admin.service.ts` | Admin operations |

---

## Module Structure

```
backend/src/modules/literature/
├── literature.module.ts           # Main module
├── literature.controller.ts       # API endpoints
├── literature.service.ts          # Main service
├── constants/
│   └── source-allocation.constants.ts
├── dto/
│   └── literature.dto.ts
├── services/
│   ├── scientific-query-optimizer.service.ts  # Week 9
│   ├── search-pipeline.service.ts             # BM25+Semantic+ThemeFit
│   ├── source-router.service.ts               # Source selection
│   ├── local-embedding.service.ts             # BGE embeddings
│   ├── theme-extraction.service.ts            # Theme extraction
│   ├── thematization-query.service.ts         # Query thematization
│   ├── openalex-enrichment.service.ts         # Metadata enrichment
│   ├── universal-citation-enrichment.service.ts
│   ├── arxiv.service.ts                       # ArXiv source
│   ├── pubmed.service.ts                      # PubMed source
│   └── ... (other source services)
├── utils/
│   └── paper-quality.util.ts                  # Quality scoring
└── types/
    └── partial-results.types.ts
```

---

## Configuration

### Environment Variables

```bash
# API Keys (optional - enhances source coverage)
SCOPUS_API_KEY=xxx
IEEE_API_KEY=xxx
SPRINGER_API_KEY=xxx
CROSSREF_API_KEY=xxx

# Search Configuration
SEARCH_TIMEOUT_MS=45000
PARALLEL_SOURCES_LIMIT=8
MAX_RESULTS_PER_SOURCE=200

# Query Optimization
DEFAULT_QUERY_MODE=local
ENABLE_AI_EXPANSION=false

# Caching
EMBEDDING_CACHE_SIZE=10000
SEARCH_CACHE_TTL_SECONDS=3600
```

---

## Monitoring & Observability

### Key Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| `search.latency.p50` | Median search time | <2s |
| `search.latency.p99` | 99th percentile | <8s |
| `source.success_rate` | Per-source success | >95% |
| `cache.hit_rate` | Embedding cache hits | >60% |
| `query.quality_score` | Average query quality | >50 |

### Health Checks

```typescript
// Implemented in PerformanceMonitorService
- Source availability checks
- Cache health
- Embedding model status
- Database connectivity
```

---

## Security Considerations

- **Input Sanitization**: All queries sanitized before source requests
- **Rate Limiting**: Per-user, per-endpoint limits
- **API Key Protection**: Keys stored in environment, never logged
- **Query Length Limits**: Maximum 500 characters
- **Result Filtering**: No sensitive data in responses

---

## Future Roadmap

### Phase 10.114 (Planned)
- [ ] Full-text search integration
- [ ] User search history analytics
- [ ] Personalized source recommendations
- [ ] Collaborative filtering for paper suggestions

### Long-term
- [ ] Real-time search updates via WebSocket
- [ ] Custom user embedding models
- [ ] Citation network visualization
- [ ] Cross-language search support

---

## References

- [Phase 10.113 Week 9 Documentation](../backend/docs/PHASE_10.113_WEEK_9_SCIENTIFIC_QUERY_OPTIMIZATION.md)
- [Frontend Architecture](./FRONTEND_LITERATURE_ARCHITECTURE.md)
- [Batch Operations Architecture](./BATCH_OPERATIONS_ARCHITECTURE.md)

---

**Last Updated**: December 9, 2025
**Maintainers**: Phase 10.113 Team
