# Phase 10.101 Task 3 - Backend Services Refactoring Plan

**Date**: November 29, 2024
**Status**: 🔴 CRITICAL REFACTORING REQUIRED
**Target**: unified-theme-extraction.service.ts (6,181 lines)

---

## Executive Summary

### Current State - CRITICAL ISSUES

**File**: `backend/src/modules/literature/services/unified-theme-extraction.service.ts`
- **Lines**: 6,181 (612% over 1,000-line limit)
- **Methods**: 100+
- **Interfaces**: 23+ (should be in separate types file)
- **Classes**: 1 main service + 1 error class
- **Complexity**: EXTREME

### Violations of Enterprise Principles

❌ **Single Responsibility Principle (SRP)**: Service handles 8+ distinct responsibilities
❌ **File Size Limit**: 6x the maximum acceptable size (1,000 lines)
❌ **Separation of Concerns**: Types, business logic, infrastructure all mixed
❌ **Testability**: Impossible to unit test without mocking 50+ dependencies
❌ **Maintainability**: High cognitive load, difficult to onboard new developers
❌ **Code Review**: Cannot review in single session, high bug risk

---

## Analysis of Responsibilities

### Current Monolith Breakdown

Based on method analysis, the service currently handles:

1. **Embedding Operations** (~20 methods, ~500 lines)
   - `generateEmbedding()`
   - `getEmbeddingDimensions()`
   - `getEmbeddingModelName()`
   - Embedding normalization and batch processing

2. **Progress Tracking & WebSocket** (~15 methods, ~400 lines)
   - `emitProgress()`
   - `emitFailedPaperProgress()`
   - `create4PartProgressMessage()`
   - `setGateway()`
   - Transparent progress messaging

3. **Data Fetching & Content** (~15 methods, ~600 lines)
   - `fetchSourceContent()`
   - `fetchPapers()`
   - `fetchMultimedia()`
   - Database queries for sources

4. **Theme Deduplication** (~20 methods, ~800 lines)
   - `deduplicateThemes()`
   - `calculateKeywordOverlap()`
   - `mergeThemesFromSources()`
   - Similarity calculations

5. **Batch Processing** (~15 methods, ~700 lines)
   - `extractThemesInBatches()`
   - Parallel processing logic
   - Rate limiting coordination

6. **Provenance & Analytics** (~10 methods, ~500 lines)
   - `getThemeProvenanceReport()`
   - `getThemeProvenance()`
   - `compareStudyThemes()`
   - Statistical analysis

7. **API Rate Limiting** (~5 methods, ~200 lines)
   - `executeWithRateLimitRetry()`
   - `parseGroqRateLimitError()`
   - `getChatClientAndModel()`
   - Error handling

8. **Database Mapping** (~10 methods, ~400 lines)
   - `mapToUnifiedTheme()`
   - `getThemesBySources()`
   - Prisma operations

9. **Type Definitions** (23+ interfaces, ~1000 lines)
   - Should be in separate `types/` directory
   - Currently inline in service

10. **Main Orchestration** (~10 methods, ~600 lines)
    - `extractThemesFromSource()`
    - `extractFromMultipleSources()`
    - High-level coordination

---

## Refactoring Strategy

### Phase 1: Extract Type Definitions (1 hour)

**Target**: Move 23+ interfaces to dedicated types file

**New File**: `backend/src/modules/literature/types/unified-theme-extraction.types.ts`

**Types to Extract**:
```typescript
export interface UnifiedTheme
export interface ThemeSource
export interface ThemeProvenance
export interface DeduplicatableTheme
export interface SourceContent
export interface ExtractionOptions
export interface PurposeConfig
export interface TransparentProgressMessage
export interface AcademicExtractionOptions
export type AcademicProgressCallback
export interface AcademicExtractionResult
export interface ValidationResult
export interface EnhancedMethodologyReport
export interface MethodologyReport
export interface SaturationData
export interface ValidationMetrics
export interface ExtractionMetadata
export interface InitialCode
export interface CandidateTheme
export interface EmbeddingWithNorm
export interface CandidateThemesResult
export class RateLimitError
```

**Result**: Reduce main file by ~1,000 lines

---

### Phase 2: Extract Embedding Module (2 hours)

**New File**: `backend/src/modules/literature/services/embedding/embedding-orchestrator.service.ts`

**Responsibilities**:
- Embedding generation (local + OpenAI fallback)
- Dimension management
- Model selection
- Batch embedding operations
- Caching (may need separate cache service)

**Methods to Extract**:
```typescript
- generateEmbedding()
- getEmbeddingDimensions()
- getEmbeddingModelName()
- batchGenerateEmbeddings()
- normalizeEmbedding()
- computeCosineSimilarity()
```

**Dependencies**:
- `LocalEmbeddingService`
- `OpenAI` client
- `ConfigService`

**Result**: Reduce main file by ~500 lines

---

### Phase 3: Extract Progress Tracking Module (1.5 hours)

**New File**: `backend/src/modules/literature/services/progress/theme-extraction-progress.service.ts`

**Responsibilities**:
- WebSocket gateway management
- Progress message construction (4-part transparent messaging)
- Progress emission to clients
- Stage tracking (7 stages: Braun & Clarke methodology)

**Methods to Extract**:
```typescript
- setGateway()
- emitProgress()
- emitFailedPaperProgress()
- create4PartProgressMessage()
- calculateStageFromPercentage()
- formatProgressStats()
```

**Dependencies**:
- `IThemeExtractionGateway`
- Logger

**Result**: Reduce main file by ~400 lines

---

### Phase 4: Extract Data Fetching Module (2 hours)

**New File**: `backend/src/modules/literature/services/content/source-content-fetcher.service.ts`

**Responsibilities**:
- Fetch content from database
- Coordinate multiple source types
- Transform DB models to service DTOs
- Handle missing content gracefully

**Methods to Extract**:
```typescript
- fetchSourceContent()
- fetchPapers()
- fetchMultimedia()
- fetchSocialMedia()
- validateSourceContent()
- enrichContentMetadata()
```

**Dependencies**:
- `PrismaService`
- Logger

**Result**: Reduce main file by ~600 lines

---

### Phase 5: Extract Deduplication Module (2.5 hours)

**New File**: `backend/src/modules/literature/services/deduplication/theme-deduplication.service.ts`

**Responsibilities**:
- Theme similarity calculation
- Keyword overlap analysis
- Semantic similarity (embeddings)
- Theme merging logic
- Conflict resolution

**Methods to Extract**:
```typescript
- deduplicateThemes()
- calculateKeywordOverlap()
- calculateKeywordOverlapFast()
- calculateSemanticSimilarity()
- mergeThemesFromSources()
- resolveMergeConflicts()
```

**Dependencies**:
- Embedding service
- Logger

**Result**: Reduce main file by ~800 lines

---

### Phase 6: Extract Batch Processing Module (2 hours)

**New File**: `backend/src/modules/literature/services/batch/batch-extraction-orchestrator.service.ts`

**Responsibilities**:
- Batch size optimization
- Parallel processing coordination
- Rate limit awareness
- Progress tracking for batches
- Error recovery

**Methods to Extract**:
```typescript
- extractThemesInBatches()
- calculateOptimalBatchSize()
- processBatchWithRateLimit()
- coordinateParallelBatches()
- handleBatchFailure()
```

**Dependencies**:
- Progress service
- Rate limit handler
- `p-limit`

**Result**: Reduce main file by ~700 lines

---

### Phase 7: Extract Provenance Module (1.5 hours)

**New File**: `backend/src/modules/literature/services/provenance/theme-provenance.service.ts`

**Responsibilities**:
- Generate provenance reports
- Calculate statistical influence
- Compare themes across studies
- Track citation chains

**Methods to Extract**:
```typescript
- getThemeProvenanceReport()
- getThemeProvenance()
- compareStudyThemes()
- calculateSourceInfluence()
- buildCitationChain()
```

**Dependencies**:
- `PrismaService`
- Logger

**Result**: Reduce main file by ~500 lines

---

### Phase 8: Extract Rate Limiting Module (1 hour)

**New File**: `backend/src/modules/literature/services/rate-limit/api-rate-limiter.service.ts`

**Responsibilities**:
- Retry with exponential backoff
- Parse provider-specific rate limit errors
- Model selection based on availability
- Request queueing

**Methods to Extract**:
```typescript
- executeWithRateLimitRetry()
- parseGroqRateLimitError()
- getChatClientAndModel()
- calculateBackoffDelay()
- queueRequest()
```

**Dependencies**:
- `OpenAI` clients (OpenAI, Groq)
- Logger

**Result**: Reduce main file by ~200 lines

---

### Phase 9: Extract Database Mapping Module (1 hour)

**New File**: `backend/src/modules/literature/services/mappers/theme-mapper.service.ts`

**Responsibilities**:
- Map Prisma models to service DTOs
- Handle null/undefined fields
- Ensure type safety
- Optimize query projections

**Methods to Extract**:
```typescript
- mapToUnifiedTheme()
- mapThemeSource()
- mapProvenance()
- mapPrismaToDTO()
```

**Dependencies**:
- Prisma types
- Service types

**Result**: Reduce main file by ~400 lines

---

### Phase 10: Refactor Main Service to Orchestrator (2 hours)

**Final File**: `unified-theme-extraction.service.ts` (~500-600 lines)

**Responsibilities**:
- Coordinate all sub-services
- Implement high-level extraction workflows
- Handle service composition
- Provide facade for external callers

**Remaining Methods**:
```typescript
- extractThemesFromSource() - orchestrates all modules
- extractFromMultipleSources() - multi-source coordination
- onModuleInit() - dependency initialization
- Purpose-specific delegations to pipeline services
```

**Dependencies**:
- All newly extracted services (injected via constructor)
- Purpose-specific pipeline services (existing)

**Result**: Main file reduced from 6,181 to ~600 lines (90% reduction)

---

## Directory Structure (After Refactoring)

```
backend/src/modules/literature/
├── services/
│   ├── unified-theme-extraction.service.ts       (~600 lines - orchestrator)
│   │
│   ├── embedding/
│   │   └── embedding-orchestrator.service.ts     (~400 lines)
│   │
│   ├── progress/
│   │   └── theme-extraction-progress.service.ts  (~300 lines)
│   │
│   ├── content/
│   │   └── source-content-fetcher.service.ts     (~500 lines)
│   │
│   ├── deduplication/
│   │   └── theme-deduplication.service.ts        (~700 lines)
│   │
│   ├── batch/
│   │   └── batch-extraction-orchestrator.service.ts  (~600 lines)
│   │
│   ├── provenance/
│   │   └── theme-provenance.service.ts           (~400 lines)
│   │
│   ├── rate-limit/
│   │   └── api-rate-limiter.service.ts           (~200 lines)
│   │
│   └── mappers/
│       └── theme-mapper.service.ts               (~300 lines)
│
└── types/
    └── unified-theme-extraction.types.ts         (~800 lines)
```

---

## Implementation Timeline

| Phase | Task | Hours | Lines Reduced | Cumulative |
|-------|------|-------|---------------|------------|
| 1 | Extract types | 1.0 | 1,000 | 5,181 → 5,181 (types separate) |
| 2 | Embedding module | 2.0 | 500 | 5,181 → 4,681 |
| 3 | Progress module | 1.5 | 400 | 4,681 → 4,281 |
| 4 | Content fetching | 2.0 | 600 | 4,281 → 3,681 |
| 5 | Deduplication | 2.5 | 800 | 3,681 → 2,881 |
| 6 | Batch processing | 2.0 | 700 | 2,881 → 2,181 |
| 7 | Provenance | 1.5 | 500 | 2,181 → 1,681 |
| 8 | Rate limiting | 1.0 | 200 | 1,681 → 1,481 |
| 9 | DB mapping | 1.0 | 400 | 1,481 → 1,081 |
| 10 | Final orchestrator | 2.0 | 481 | 1,081 → 600 |
| **TOTAL** | **All phases** | **16.5** | **5,581** | **6,181 → 600** |

---

## Success Criteria

### Code Quality
- ✅ All service files < 1,000 lines (target: < 500 lines)
- ✅ Single Responsibility Principle enforced
- ✅ Clear module boundaries
- ✅ High cohesion, low coupling

### Type Safety
- ✅ TypeScript strict mode (no `any` types)
- ✅ All interfaces in dedicated types file
- ✅ Proper dependency injection with types

### Testability
- ✅ Each module independently testable
- ✅ Mock-friendly interfaces
- ✅ Dependency injection throughout

### Integration
- ✅ End-to-end tests pass
- ✅ No breaking changes to public API
- ✅ All existing callers work unchanged

### Documentation
- ✅ JSDoc for all public methods
- ✅ Architecture diagrams updated
- ✅ Migration guide for future changes

---

## Risk Mitigation

### Risk 1: Breaking Changes
**Mitigation**: Keep public API unchanged; only internal refactoring

### Risk 2: Performance Regression
**Mitigation**: Benchmark before/after; no extra network calls

### Risk 3: Integration Issues
**Mitigation**: Test after each phase; keep git commits atomic

### Risk 4: Time Overrun
**Mitigation**: Phases are independent; can pause between phases

---

## Next Steps

1. ✅ Create this refactoring plan (COMPLETE)
2. ⏳ Get approval/review (if needed)
3. ⏳ Create feature branch: `refactor/theme-extraction-modularization`
4. ⏳ Execute Phase 1: Extract types
5. ⏳ Execute remaining phases in order
6. ⏳ Final integration testing
7. ⏳ Code review and merge

---

**Document Status**: DRAFT - Ready for Implementation
**Created**: November 29, 2024
**Updated**: November 29, 2024
