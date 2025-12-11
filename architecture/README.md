# Architecture Documentation Index

**Last Updated**: December 9, 2025

This folder contains all architecture documentation for the BlackQ Method platform.

---

## Quick Navigation

### Backend Architecture

| Document | Description | Audience |
|----------|-------------|----------|
| [Backend Literature Search](./BACKEND_LITERATURE_SEARCH_ARCHITECTURE.md) | Complete search system architecture (BM25 + Semantic + ThemeFit, 15+ sources, query optimization) | Backend engineers, architects |

### Frontend Architecture

| Document | Description | Audience |
|----------|-------------|----------|
| [Literature Page Architecture](../LITERATURE_ARCHITECTURE_DIAGRAM.md) | React component hierarchy, state management, data flow | Frontend engineers |
| [Literature Module Architecture](../frontend/app/(researcher)/discover/literature/ARCHITECTURE.md) | Feature-level frontend architecture | Frontend engineers |

### System Architecture

| Document | Description | Audience |
|----------|-------------|----------|
| [Unified Hub Architecture](../Main%20Docs/UNIFIED_HUB_ARCHITECTURE.md) | Overall platform hub architecture | All engineers, architects |
| [Research Lifecycle Navigation](../Main%20Docs/RESEARCH_LIFECYCLE_NAVIGATION_ARCHITECTURE.md) | User journey architecture | Product, engineers |
| [Batch Operations Analysis](../BATCH_OPERATIONS_ARCHITECTURE_ANALYSIS.md) | Queue system, database operations | Backend engineers |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         BLACKQ METHOD PLATFORM                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        FRONTEND (Next.js)                            │   │
│  │                                                                       │   │
│  │  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐            │   │
│  │  │  Literature   │  │  Q-Method     │  │  Research     │            │   │
│  │  │  Discovery    │  │  Designer     │  │  Hub          │            │   │
│  │  └───────────────┘  └───────────────┘  └───────────────┘            │   │
│  │          │                  │                  │                     │   │
│  │          └──────────────────┼──────────────────┘                     │   │
│  │                             │                                        │   │
│  │                    ┌────────┴────────┐                               │   │
│  │                    │  Zustand Stores │                               │   │
│  │                    └────────┬────────┘                               │   │
│  └─────────────────────────────┼───────────────────────────────────────┘   │
│                                │                                            │
│                          REST API / WebSocket                               │
│                                │                                            │
│  ┌─────────────────────────────┼───────────────────────────────────────┐   │
│  │                        BACKEND (NestJS)                              │   │
│  │                             │                                        │   │
│  │  ┌──────────────────────────┴──────────────────────────┐            │   │
│  │  │               Literature Module                      │            │   │
│  │  │  ┌──────────────────────────────────────────────┐   │            │   │
│  │  │  │ Query Optimization → Source Router → Pipeline │   │            │   │
│  │  │  │ (A/B testable)      (15+ sources)   (Ranking) │   │            │   │
│  │  │  └──────────────────────────────────────────────┘   │            │   │
│  │  └─────────────────────────────────────────────────────┘            │   │
│  │                             │                                        │   │
│  │  ┌──────────────────────────┴──────────────────────────┐            │   │
│  │  │              Supporting Services                     │            │   │
│  │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐   │            │   │
│  │  │  │ Auth    │ │ Cache   │ │ Logging │ │ Metrics │   │            │   │
│  │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘   │            │   │
│  │  └─────────────────────────────────────────────────────┘            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                │                                            │
│                           ┌────┴────┐                                       │
│                           │ SQLite  │                                       │
│                           │ (Prisma)│                                       │
│                           └─────────┘                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Document Index by Topic

### Literature Search System
1. [Backend Architecture](./BACKEND_LITERATURE_SEARCH_ARCHITECTURE.md) - Complete backend implementation
2. [Frontend Architecture](../LITERATURE_ARCHITECTURE_DIAGRAM.md) - React components
3. [Phase 10.113 Week 9](../backend/docs/PHASE_10.113_WEEK_9_SCIENTIFIC_QUERY_OPTIMIZATION.md) - Query optimization

### Batch Operations
1. [Architecture Analysis](../BATCH_OPERATIONS_ARCHITECTURE_ANALYSIS.md) - Deep dive
2. [Quick Reference](../BATCH_OPERATIONS_QUICK_REFERENCE.md) - Implementation guide
3. [Analysis Index](../ARCHITECTURE_ANALYSIS_INDEX.md) - Navigation

### Research Platform
1. [Unified Hub](../Main%20Docs/UNIFIED_HUB_ARCHITECTURE.md) - Platform overview
2. [Research Lifecycle](../Main%20Docs/RESEARCH_LIFECYCLE_NAVIGATION_ARCHITECTURE.md) - User journeys

---

## Key System Components

### Backend Services (NestJS)

| Service | Responsibility |
|---------|----------------|
| `LiteratureService` | Main search orchestration |
| `ScientificQueryOptimizerService` | A/B testable query optimization |
| `SourceRouterService` | Multi-source aggregation (15+ sources) |
| `SearchPipelineService` | BM25 + Semantic + ThemeFit ranking |
| `LocalEmbeddingService` | BGE embedding generation |
| `ThematizationQueryService` | Theme extraction & analysis |

### Frontend Stores (Zustand)

| Store | Responsibility |
|-------|----------------|
| `useLiteratureSearchStore` | Search state & results |
| `usePaperManagementStore` | Saved papers |
| `useThemeExtractionStore` | Themes & analysis |
| `useAlternativeSourcesStore` | Non-academic sources |

---

## Architecture Principles

### 1. Netflix-Grade Reliability
- Graceful degradation when sources fail
- Parallel fetching with timeouts
- Circuit breakers on external APIs
- LRU caching at multiple layers

### 2. Scientific A/B Testing
- Configurable query expansion modes
- Metrics tracking for effectiveness
- Empirical optimization over assumptions

### 3. Separation of Concerns
- Frontend: UI + state management
- Backend: Business logic + data aggregation
- Services: Single responsibility
- Utils: Pure functions

### 4. Performance First
- P50 search latency: <2s
- P99 search latency: <8s
- Cache hit rate target: >60%

---

## Reading Guide

### For New Engineers
1. Start with [Unified Hub Architecture](../Main%20Docs/UNIFIED_HUB_ARCHITECTURE.md)
2. Read [Backend Literature Search](./BACKEND_LITERATURE_SEARCH_ARCHITECTURE.md)
3. Review [Frontend Architecture](../LITERATURE_ARCHITECTURE_DIAGRAM.md)

### For Backend Engineers
1. [Backend Literature Search](./BACKEND_LITERATURE_SEARCH_ARCHITECTURE.md) - Deep dive
2. [Batch Operations Analysis](../BATCH_OPERATIONS_ARCHITECTURE_ANALYSIS.md)
3. Source code in `backend/src/modules/literature/`

### For Frontend Engineers
1. [Literature Page Architecture](../LITERATURE_ARCHITECTURE_DIAGRAM.md)
2. [Frontend Module Architecture](../frontend/app/(researcher)/discover/literature/ARCHITECTURE.md)
3. Components in `frontend/app/(researcher)/discover/literature/`

### For Architects
1. All documents in order
2. Focus on integration points
3. Review performance targets

---

## Contributing

When adding new architecture documentation:

1. Place in this `architecture/` folder
2. Update this README index
3. Follow naming convention: `COMPONENT_ARCHITECTURE.md`
4. Include diagrams (ASCII art preferred for version control)
5. Add last updated date

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | Dec 9, 2025 | Added Phase 10.113 Week 9, created architecture folder |
| 1.0 | Nov 22, 2025 | Initial architecture documentation |

---

**Maintainers**: Architecture Team
