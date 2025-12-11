# Phase 10.113 Week 10: Netflix-Grade Search Experience

**Date**: December 9, 2025
**Status**: DESIGN COMPLETE - Ready for Implementation
**Goal**: Best-in-class search UX with real-time communication & progressive results

---

## Executive Summary

Transform literature search from a 180+ second black box into a **2-second initial response** with progressive enhancement, real-time status communication, and full transparency into the search intelligence.

### Performance Targets
| Metric | Current | Week 10 Target |
|--------|---------|----------------|
| Time to First Result | >180s | **<2s** |
| Time to Full Results | >180s | **<30s** (progressive) |
| User Engagement | Blank screen | **Real-time updates** |
| Query Intelligence Visibility | Hidden | **100% visible** |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    WEEK 10: PROGRESSIVE SEARCH ARCHITECTURE                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                         FRONTEND (Next.js)                           │    │
│  │                                                                       │    │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐      │    │
│  │  │  Search Input   │  │  Query Intel    │  │  Results Stream │      │    │
│  │  │  + Auto-suggest │  │  Panel (NEW)    │  │  + Live Updates │      │    │
│  │  └────────┬────────┘  └────────┬────────┘  └────────┬────────┘      │    │
│  │           │                    │                    │                │    │
│  │  ┌────────┴────────────────────┴────────────────────┴────────┐      │    │
│  │  │              Search Experience Store (Zustand)             │      │    │
│  │  │  • Query state    • Source status    • Results stream      │      │    │
│  │  │  • Intelligence   • Progress %       • Enrichment status   │      │    │
│  │  └────────────────────────────┬───────────────────────────────┘      │    │
│  │                               │                                       │    │
│  │                    ┌──────────┴──────────┐                           │    │
│  │                    │   WebSocket Client   │                           │    │
│  │                    │   (Real-time comms)  │                           │    │
│  │                    └──────────┬──────────┘                           │    │
│  └───────────────────────────────┼───────────────────────────────────────┘    │
│                                  │                                            │
│                           WebSocket Connection                                │
│                                  │                                            │
│  ┌───────────────────────────────┼───────────────────────────────────────┐    │
│  │                         BACKEND (NestJS)                               │    │
│  │                               │                                        │    │
│  │  ┌────────────────────────────┴────────────────────────────────────┐  │    │
│  │  │                  SearchStreamService (NEW)                       │  │    │
│  │  │  • Progressive results    • Real-time status    • Batched emit  │  │    │
│  │  └────────────────────────────┬────────────────────────────────────┘  │    │
│  │                               │                                        │    │
│  │  ┌──────────┬─────────────────┼─────────────────┬──────────────────┐  │    │
│  │  │          │                 │                 │                  │  │    │
│  │  ▼          ▼                 ▼                 ▼                  ▼  │    │
│  │ ┌────┐   ┌────┐           ┌────┐           ┌────┐            ┌────┐  │    │
│  │ │Fast│   │Fast│           │Med │           │Slow│            │Lazy│  │    │
│  │ │Src │   │Src │           │Src │           │Src │            │Enr │  │    │
│  │ │<2s │   │<2s │           │<5s │           │<15s│            │ich │  │    │
│  │ └────┘   └────┘           └────┘           └────┘            └────┘  │    │
│  │ OpenAlex  CrossRef       Semantic         PubMed            On-View  │    │
│  │ ERIC      arXiv          Scholar          PMC               Enrich   │    │
│  │                                                                        │    │
│  └────────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Part 1: Backend - Progressive Search Stream (3-4 hours)

#### 1.1 SearchStreamService
**File**: `backend/src/modules/literature/services/search-stream.service.ts`

```typescript
/**
 * Phase 10.113 Week 10: Progressive Search Stream Service
 *
 * Emits search results progressively via WebSocket as sources respond.
 * Achieves <2s Time to First Result by streaming fast sources immediately.
 */

interface SearchStreamConfig {
  // Source tiers by expected response time
  fastSources: ['openalex', 'crossref', 'eric', 'arxiv'];    // <2s
  mediumSources: ['semantic_scholar', 'springer'];            // <5s
  slowSources: ['pubmed', 'pmc', 'core'];                     // <15s

  // Emit batching
  minBatchSize: 5;           // Min papers per emit
  maxBatchWaitMs: 500;       // Max wait before emit

  // Progressive enrichment
  enrichOnView: true;        // Only enrich papers in viewport
  enrichBatchSize: 10;       // Papers to enrich per batch
}

// WebSocket Events Emitted
type SearchStreamEvents = {
  'search:started': { searchId: string; query: string; intelligence: QueryIntelligence };
  'search:source-started': { source: string; tier: string; estimatedTime: number };
  'search:source-complete': { source: string; count: number; timeMs: number };
  'search:papers': { papers: Paper[]; source: string; cumulative: number };
  'search:progress': { stage: string; percent: number; message: string };
  'search:enrichment': { paperId: string; citations: number; metrics: object };
  'search:complete': { total: number; timeMs: number; sources: SourceStats[] };
  'search:error': { source: string; error: string; recoverable: boolean };
};
```

#### 1.2 Lazy Enrichment Service
**File**: `backend/src/modules/literature/services/lazy-enrichment.service.ts`

```typescript
/**
 * On-Demand Enrichment - Only enriches papers when user views them
 *
 * KEY OPTIMIZATION: Don't enrich 2000+ papers upfront
 * Instead, enrich 10-20 papers at a time as user scrolls
 */

interface EnrichmentRequest {
  paperIds: string[];           // Papers currently in viewport
  priority: 'high' | 'normal'; // High = user clicked/hovered
}

// Enrichment happens in background, results streamed via WebSocket
```

#### 1.3 Query Intelligence Endpoint
**File**: `backend/src/modules/literature/literature.controller.ts`

```typescript
/**
 * NEW Endpoint: Analyze query before search
 * Returns intelligence data for UI display
 */
@Post('search/analyze')
@Public()
async analyzeQuery(@Body() dto: { query: string }): Promise<QueryIntelligence> {
  return {
    // Spell correction
    corrections: { original: 'qmethod', corrected: 'Q-methodology' },

    // Query quality
    quality: { score: 0.85, issues: [], suggestions: [] },

    // Methodology detection
    methodology: { detected: 'Q-methodology', confidence: 0.95 },

    // Controversy potential
    controversy: { score: 0.72, terms: ['debate', 'critique'] },

    // Broadness assessment
    broadness: { isTooBroad: false, score: 0.4 },

    // Estimated results
    estimate: { min: 50, max: 200, confidence: 0.8 },

    // Suggested refinements
    suggestions: [
      { query: 'Q-methodology healthcare', reason: 'More focused' },
      { query: 'Q-methodology vs survey', reason: 'Higher controversy' }
    ]
  };
}
```

---

### Part 2: Frontend - Interactive Search Experience (4-5 hours)

#### 2.1 Search Experience Store
**File**: `frontend/app/(researcher)/discover/literature/stores/search-experience.store.ts`

```typescript
/**
 * Zustand store for progressive search experience
 */
interface SearchExperienceState {
  // Query Intelligence (shown before/during search)
  intelligence: QueryIntelligence | null;
  showIntelligence: boolean;

  // Search Progress
  searchId: string | null;
  stage: 'idle' | 'analyzing' | 'searching' | 'enriching' | 'complete';
  progress: number;  // 0-100
  statusMessage: string;

  // Source Status (live updates)
  sources: Map<string, {
    status: 'pending' | 'searching' | 'complete' | 'error';
    papers: number;
    timeMs: number;
    tier: string;
  }>;

  // Progressive Results
  papers: Paper[];
  totalEstimate: number;

  // Enrichment Status
  enrichedPaperIds: Set<string>;
  enrichmentQueue: string[];

  // WebSocket connection
  wsConnected: boolean;
}
```

#### 2.2 Query Intelligence Panel Component
**File**: `frontend/app/(researcher)/discover/literature/components/QueryIntelligencePanel.tsx`

```tsx
/**
 * Shows real-time query analysis before and during search
 *
 * Features:
 * - Spell correction indicator with undo option
 * - Methodology detection badge
 * - Controversy meter (animated gauge)
 * - Query quality score with improvement tips
 * - Smart suggestions (clickable)
 */

export function QueryIntelligencePanel() {
  return (
    <motion.div className="query-intelligence-panel">
      {/* Spell Correction Banner */}
      {corrections && (
        <CorrectionBanner
          original={corrections.original}
          corrected={corrections.corrected}
          onUndo={() => useOriginalQuery()}
        />
      )}

      {/* Methodology Detection */}
      <MethodologyBadge
        methodology={intelligence.methodology}
        confidence={intelligence.methodology.confidence}
      />

      {/* Interactive Controversy Meter */}
      <ControversyMeter
        score={intelligence.controversy.score}
        terms={intelligence.controversy.terms}
      />

      {/* Query Quality Indicator */}
      <QualityIndicator
        score={intelligence.quality.score}
        suggestions={intelligence.quality.suggestions}
      />

      {/* Smart Suggestions */}
      <SuggestionChips
        suggestions={intelligence.suggestions}
        onSelect={(suggestion) => runSearch(suggestion.query)}
      />
    </motion.div>
  );
}
```

#### 2.3 Live Search Progress Component
**File**: `frontend/app/(researcher)/discover/literature/components/LiveSearchProgress.tsx`

```tsx
/**
 * Real-time search progress visualization
 *
 * Shows:
 * - Source-by-source status with icons and timing
 * - Animated progress bar with stage indicators
 * - Live paper count accumulator
 * - ETA based on source performance
 */

export function LiveSearchProgress() {
  return (
    <div className="live-search-progress">
      {/* Main Progress Bar */}
      <ProgressBar
        value={progress}
        stages={['Analyzing', 'Fast Sources', 'All Sources', 'Ranking']}
        currentStage={currentStage}
      />

      {/* Source Grid */}
      <div className="source-grid">
        {sources.map(source => (
          <SourceCard
            key={source.name}
            name={source.name}
            status={source.status}
            papers={source.papers}
            timeMs={source.timeMs}
            icon={sourceIcons[source.name]}
          />
        ))}
      </div>

      {/* Live Stats */}
      <div className="live-stats">
        <AnimatedCounter value={totalPapers} label="Papers Found" />
        <AnimatedCounter value={sourcesComplete} label="Sources Complete" />
        <ETADisplay estimatedMs={eta} />
      </div>
    </div>
  );
}
```

#### 2.4 Progressive Results List
**File**: `frontend/app/(researcher)/discover/literature/components/ProgressiveResultsList.tsx`

```tsx
/**
 * Results that stream in progressively
 *
 * Features:
 * - Papers appear with smooth animations as they arrive
 * - Source badge shows where each paper came from
 * - Lazy enrichment triggers when paper enters viewport
 * - Skeleton loading for pending enrichment data
 */

export function ProgressiveResultsList() {
  const { ref, inView } = useInView({ threshold: 0.1 });

  // Trigger enrichment for visible papers
  useEffect(() => {
    if (inView) {
      const visiblePaperIds = getVisiblePaperIds();
      requestEnrichment(visiblePaperIds);
    }
  }, [inView, papers]);

  return (
    <motion.div ref={ref} className="results-list">
      <AnimatePresence>
        {papers.map((paper, index) => (
          <motion.div
            key={paper.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <PaperCard
              paper={paper}
              enrichment={enrichments.get(paper.id)}
              source={paper.source}
              isEnriching={enrichmentQueue.includes(paper.id)}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
```

---

### Part 3: WebSocket Communication Layer (2-3 hours)

#### 3.1 Search WebSocket Gateway Enhancement
**File**: `backend/src/modules/literature/gateways/literature.gateway.ts`

```typescript
/**
 * Enhanced WebSocket Gateway for Progressive Search
 */
@WebSocketGateway({ namespace: '/literature' })
export class LiteratureGateway {

  @SubscribeMessage('search:start')
  async handleSearchStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { query: string; options: SearchOptions }
  ) {
    const searchId = generateSearchId();

    // Emit search started with intelligence
    const intelligence = await this.queryOptimizer.analyze(data.query);
    client.emit('search:started', { searchId, query: data.query, intelligence });

    // Start progressive search
    await this.searchStream.startProgressiveSearch(
      searchId,
      data.query,
      data.options,
      (event) => client.emit(event.type, event.data)  // Stream callback
    );
  }

  @SubscribeMessage('enrichment:request')
  async handleEnrichmentRequest(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { paperIds: string[] }
  ) {
    // Enrich requested papers and stream results
    await this.lazyEnrichment.enrichPapers(
      data.paperIds,
      (enrichment) => client.emit('search:enrichment', enrichment)
    );
  }
}
```

#### 3.2 Frontend WebSocket Hook
**File**: `frontend/app/(researcher)/discover/literature/hooks/useSearchWebSocket.ts`

```typescript
/**
 * WebSocket hook for progressive search
 */
export function useSearchWebSocket() {
  const socket = useSocket('/literature');
  const store = useSearchExperienceStore();

  useEffect(() => {
    if (!socket) return;

    // Handle all search events
    socket.on('search:started', (data) => {
      store.setSearchStarted(data.searchId, data.intelligence);
    });

    socket.on('search:source-started', (data) => {
      store.updateSourceStatus(data.source, 'searching', data.tier);
    });

    socket.on('search:papers', (data) => {
      store.appendPapers(data.papers, data.source);
    });

    socket.on('search:progress', (data) => {
      store.setProgress(data.percent, data.stage, data.message);
    });

    socket.on('search:enrichment', (data) => {
      store.updateEnrichment(data.paperId, data);
    });

    socket.on('search:complete', (data) => {
      store.setSearchComplete(data);
    });

    return () => {
      socket.off('search:started');
      // ... cleanup all listeners
    };
  }, [socket]);

  return {
    startSearch: (query: string, options: SearchOptions) => {
      socket?.emit('search:start', { query, options });
    },
    requestEnrichment: (paperIds: string[]) => {
      socket?.emit('enrichment:request', { paperIds });
    }
  };
}
```

---

### Part 4: UI Polish & Animations (2-3 hours)

#### 4.1 Animated Components

```tsx
// Controversy Meter - Animated gauge showing controversy potential
<ControversyMeter score={0.72}>
  <AnimatedArc from={0} to={score} color={getColor(score)} />
  <Label>72% Controversy Potential</Label>
  <Tooltip>Higher controversy = better for Q-methodology themes</Tooltip>
</ControversyMeter>

// Source Status Card - Live updating
<SourceCard status="searching">
  <PulsingDot color="blue" />
  <Icon name="semantic-scholar" />
  <Label>Semantic Scholar</Label>
  <AnimatedCounter value={papers} suffix=" papers" />
  <Timer running={isSearching} />
</SourceCard>

// Paper Entry Animation
<motion.div
  initial={{ opacity: 0, x: -20, height: 0 }}
  animate={{ opacity: 1, x: 0, height: 'auto' }}
  exit={{ opacity: 0, x: 20 }}
  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
>
  <PaperCard />
</motion.div>

// Quality Score Ring
<QualityRing score={85}>
  <CircularProgress value={85} max={100} />
  <CenterLabel>85</CenterLabel>
  <Badge>Excellent Query</Badge>
</QualityRing>
```

#### 4.2 Status Messages (User Communication)

```typescript
const STATUS_MESSAGES = {
  analyzing: [
    "Analyzing your query...",
    "Detecting research methodology...",
    "Checking spelling and terminology...",
    "Estimating result count..."
  ],
  searching_fast: [
    "Querying fast sources (OpenAlex, CrossRef)...",
    "First results arriving shortly...",
    "Checking preprint servers..."
  ],
  searching_slow: [
    "Querying comprehensive databases (PubMed, PMC)...",
    "Retrieving peer-reviewed articles...",
    "Almost there - final sources responding..."
  ],
  ranking: [
    "Applying BM25 + Semantic ranking...",
    "Calculating theme-fit scores...",
    "Sorting by relevance..."
  ],
  enriching: [
    "Loading citation counts...",
    "Fetching journal metrics...",
    "Adding field-weighted impact..."
  ]
};
```

---

## Implementation Timeline

| Day | Task | Hours | Deliverable |
|-----|------|-------|-------------|
| 1 | SearchStreamService + Lazy Enrichment | 4h | Progressive backend |
| 2 | Query Intelligence Endpoint + Tests | 3h | /search/analyze API |
| 3 | WebSocket Gateway Enhancement | 3h | Real-time events |
| 4 | Search Experience Store | 3h | Zustand state mgmt |
| 5 | Query Intelligence Panel UI | 4h | Interactive panel |
| 6 | Live Progress Component | 3h | Source status grid |
| 7 | Progressive Results List | 3h | Streaming results |
| 8 | Animations + Polish | 3h | Framer Motion |
| 9 | Integration Testing | 3h | E2E WebSocket tests |
| 10 | Performance Optimization | 2h | Final tuning |

**Total: ~31 hours (1.5 weeks)**

---

## Success Metrics

### Performance
- [ ] Time to First Result: <2 seconds
- [ ] Full search completion: <30 seconds
- [ ] Memory usage: <100MB for 1000 papers

### User Experience
- [ ] Real-time progress updates every 500ms
- [ ] Source status visibility: 100%
- [ ] Query intelligence displayed before search starts
- [ ] Smooth animations (60fps)

### Communication
- [ ] Users see value of query optimization
- [ ] Users understand multi-source aggregation
- [ ] Users can see enrichment happening
- [ ] Users can interact (cancel, refine, retry)

---

## Key Innovations

### 1. Progressive Search Pattern
Instead of waiting for ALL sources, we:
1. Emit fast sources immediately (<2s)
2. User sees results while slow sources complete
3. Results re-rank as more papers arrive

### 2. Lazy Enrichment Pattern
Instead of enriching ALL papers upfront, we:
1. Return papers with basic metadata immediately
2. Enrich only papers user is viewing
3. Pre-fetch enrichment for next viewport

### 3. Query Intelligence Transparency
Instead of hidden optimizations, we:
1. Show corrections with undo option
2. Display methodology detection
3. Visualize controversy potential
4. Suggest query refinements

### 4. Real-Time Source Visibility
Instead of black-box searching, we:
1. Show each source status live
2. Display timing per source
3. Show paper counts accumulating
4. Indicate source health/errors

---

## File Structure

```
backend/src/modules/literature/
├── services/
│   ├── search-stream.service.ts      (NEW - Progressive streaming)
│   ├── lazy-enrichment.service.ts    (NEW - On-demand enrichment)
│   └── ... existing services
├── gateways/
│   └── literature.gateway.ts         (ENHANCED - New events)
└── dto/
    └── search-stream.dto.ts          (NEW - Stream DTOs)

frontend/app/(researcher)/discover/literature/
├── stores/
│   └── search-experience.store.ts    (NEW - Progressive state)
├── hooks/
│   └── useSearchWebSocket.ts         (NEW - WebSocket hook)
├── components/
│   ├── QueryIntelligencePanel.tsx    (NEW - Query analysis UI)
│   ├── LiveSearchProgress.tsx        (NEW - Progress visualization)
│   ├── ProgressiveResultsList.tsx    (NEW - Streaming results)
│   ├── ControversyMeter.tsx          (NEW - Animated gauge)
│   ├── SourceStatusCard.tsx          (NEW - Source indicator)
│   └── ... existing components
└── animations/
    └── search-animations.ts          (NEW - Framer Motion)
```

---

## Dependencies

### Backend
- `@nestjs/websockets` (existing)
- `socket.io` (existing)
- `rxjs` (for streaming)

### Frontend
- `socket.io-client` (existing)
- `framer-motion` (animations)
- `react-intersection-observer` (lazy loading)
- `zustand` (existing)

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| WebSocket disconnect | Auto-reconnect with state recovery |
| Source timeout | Graceful degradation with partial results |
| Browser memory | Virtual scrolling for large result sets |
| Animation jank | GPU-accelerated transforms only |

---

**Document Version**: 1.0
**Created**: December 9, 2025
**Author**: Claude Code
**Next Steps**: Begin Part 1 implementation (SearchStreamService)
