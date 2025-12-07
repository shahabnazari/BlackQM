# Knowledge Gap & Knowledge Map - Quick Summary

## What's Implemented

### Backend Services (100% Complete)
1. **Knowledge Graph Service** (`knowledge-graph.service.ts` - 1173 lines)
   - Bridge concept detection
   - Controversy detection  
   - Influence flow tracking
   - Missing link prediction
   - Emerging topic detection
   - Entity extraction from papers
   - Citation network building
   - Multi-format export (JSON, GraphML, Cypher)

2. **Predictive Gap Service** (`predictive-gap.service.ts` - 781 lines)
   - Research opportunity scoring (5-factor weighted model)
   - Funding probability prediction
   - Collaboration suggestion engine
   - Research timeline optimization (Q-methodology focused)
   - Impact prediction (5-year citations)
   - Trend forecasting

### Frontend Components (80% Complete)
1. **Knowledge Graph Visualization** - Full D3.js implementation
   - 6 node types, 6 edge types
   - Force, hierarchical, radial layouts
   - Zoom, search, filter, export

2. **Knowledge Map Visualization** - Full D3.js implementation
   - 6 node types, 5 link types
   - Theme extraction via clustering
   - Controversy detection
   - Interactive controls

3. **Knowledge Map Page** - Canvas-based full page
   - Backend integration complete
   - Advanced insights display
   - Predicted links visualization
   - Influence flow visualization
   - Export to JSON/PNG/GraphML/Cypher

### API Endpoints (100% Complete)
- `POST /api/literature/knowledge-graph/build`
- `GET /api/literature/knowledge-graph/view`
- `GET /api/literature/knowledge-graph/influence/:nodeId`
- `POST /api/literature/knowledge-graph/predict-links`
- `GET /api/literature/knowledge-graph/export`
- `POST /api/literature/predictive-gaps/score-opportunities`
- `POST /api/literature/predictive-gaps/funding-probability`
- `POST /api/literature/predictive-gaps/optimize-timeline`
- `POST /api/literature/predictive-gaps/predict-impact`
- `POST /api/literature/predictive-gaps/forecast-trends`

---

## What's Missing

### Critical Gaps
1. **Gaps Discovery Page** - SKELETON ONLY
   - No UI implementation
   - No gap visualization
   - No predictive scoring display

2. **Gap Analysis Components** - MISSING
   - ResearchOpportunitiesCard
   - FundingProbabilityCard
   - TimelineOptimizationCard
   - ImpactPredictionCard
   - TrendForecastCard
   - CollaborationSuggestionsCard

3. **Gap Visualizations** - MISSING
   - 5-factor opportunity score breakdown
   - Funding probability gauge
   - Timeline Gantt chart
   - Impact confidence interval
   - Trend forecast line chart

---

## Key File Locations

### Backend
- Services: `/backend/src/modules/literature/services/`
  - `knowledge-graph.service.ts`
  - `predictive-gap.service.ts`
- Controller: `/backend/src/modules/literature/literature.controller.ts`

### Frontend
- Components: `/frontend/components/`
  - `knowledge/KnowledgeGraphVisualization.tsx`
  - `literature/KnowledgeMapVisualization.tsx`
- Pages: `/frontend/app/(researcher)/discover/`
  - `knowledge-map/page.tsx` (100% implemented)
  - `gaps/page.tsx` (skeleton only)
- API Service: `/frontend/lib/services/literature-api.service.ts`

---

## Implementation Priority

### Phase 1: Complete Gaps Page (HIGHEST IMPACT)
```
Create: components/gaps/
├─ GapsList.tsx
├─ GapCard.tsx
├─ OpportunityScoreBreakdown.tsx (5-factor pie/bar chart)
├─ FundingProbabilityCard.tsx (gauge chart)
├─ TimelineCard.tsx (Gantt chart)
├─ ImpactPredictionCard.tsx (confidence interval)
├─ TrendForecastCard.tsx (line chart)
└─ CollaborationCard.tsx (network graph)

Update: app/(researcher)/discover/gaps/page.tsx
└─ Integrate components with backend API
```

### Phase 2: Enhanced Visualizations
- Add Recharts for charts
- Add React Flow for collaboration networks
- Add timeline/Gantt visualization

### Phase 3: Gap Integration
- Gap selection in study design
- Gap-to-statement mapping
- Gap impact analysis

---

## Performance Notes

### Limitations
- Max 500 nodes per graph query
- Max 50 missing link predictions
- Max 50 influence flows
- Serial entity extraction (one paper at a time)
- AI calls: 2-3 per gap (expensive)

### Optimizations Available
- Graph query caching
- Batch AI requests
- Embedding-based similarity
- Incremental updates
- Opportunity score caching

---

## AI Provider Configuration

Both services support FREE Groq (default) with OpenAI fallback:

```
GROQ_API_KEY=sk-... (FREE - Llama 3.3 70B)
OPENAI_API_KEY=sk-... (Paid - GPT-4, fallback only)
```

---

## Database Schema Required

Both services need:
- `knowledgeNode` table (25 columns)
- `knowledgeEdge` table (14 columns)

Full schema in main analysis report.

---

## Next Steps

1. Create gap analysis UI components
2. Connect gaps page to backend API
3. Implement gap visualizations
4. Add gap filtering/sorting
5. Create gap comparison interface
6. Integrate gaps with Q-methodology design flow

