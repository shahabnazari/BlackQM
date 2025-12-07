# Phase 10.943: Enterprise-Grade Unified Logging System

## Executive Summary

**Date:** November 22, 2025
**Status:** IMPLEMENTATION PLAN
**Scope:** Literature Review Feature - Complete Logging Overhaul
**Priority:** CRITICAL - Production Readiness

---

## Current State Analysis

### Critical Findings

| Area | Issue | Severity | Impact |
|------|-------|----------|--------|
| **Frontend** | 606+ console.* calls across 42+ files | CRITICAL | Production logs cluttered, no structured tracking |
| **Frontend** | Only 5 files use centralized logger | CRITICAL | Enterprise logger exists but severely underutilized |
| **Backend** | No global exception filter | HIGH | Errors not standardized, inconsistent responses |
| **Backend** | 209 catch blocks with varying patterns | HIGH | No unified error handling |
| **API** | No correlation ID tracking | HIGH | Cannot trace requests across services |
| **WebSocket** | Errors never reach clients | HIGH | Users see frozen UI on errors |
| **Integration** | No frontend-to-backend log shipping | MEDIUM | Client errors invisible to monitoring |
| **Metrics** | Prometheus exists but underutilized | MEDIUM | No real-time error dashboards |

### Current Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CURRENT STATE (FRAGMENTED)                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Frontend                          Backend                              │
│  ┌──────────────────┐             ┌──────────────────┐                 │
│  │ 606+ console.*   │             │ NestJS Logger    │                 │
│  │ scattered calls  │             │ (string-based)   │                 │
│  │       │          │             │       │          │                 │
│  │       ▼          │             │       ▼          │                 │
│  │ Browser Console  │             │ Winston Files    │                 │
│  │ (lost on close)  │             │ (logs/*.log)     │                 │
│  └──────────────────┘             └──────────────────┘                 │
│                                                                         │
│  Problems:                                                              │
│  - No correlation IDs                                                   │
│  - Frontend logs not shipped to backend                                 │
│  - No structured error format                                           │
│  - WebSocket errors silent                                              │
│  - 209 inconsistent catch blocks                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    TARGET STATE (UNIFIED)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Frontend                          Backend                              │
│  ┌──────────────────┐             ┌──────────────────────────────────┐ │
│  │ EnterpriseLogger │             │     Global Exception Filter      │ │
│  │ (centralized)    │             │              │                   │ │
│  │       │          │             │              ▼                   │ │
│  │       ▼          │───HTTP───►  │    Correlation ID Middleware    │ │
│  │ POST /api/logs   │             │              │                   │ │
│  └──────────────────┘             │              ▼                   │ │
│                                   │    Unified Logger Service        │ │
│  ┌──────────────────┐             │     (structured JSON)           │ │
│  │ Error Boundaries │             │              │                   │ │
│  │ - Literature     │             │    ┌────────┼────────┐          │ │
│  │ - ThemeExtract   │             │    ▼        ▼        ▼          │ │
│  │ - WebSocket      │             │ Winston  Sentry  Prometheus     │ │
│  └──────────────────┘             └──────────────────────────────────┘ │
│                                                                         │
│  Features:                                                              │
│  ✓ Request correlation IDs (trace any request)                         │
│  ✓ Structured JSON logs (machine parseable)                            │
│  ✓ Client error shipping (frontend → backend)                          │
│  ✓ WebSocket error emission (users notified)                           │
│  ✓ Global exception standardization                                    │
│  ✓ Performance metrics integration                                     │
│  ✓ Sentry integration for crash reporting                              │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Day 1: Core Infrastructure

#### 1.1 Backend: Global Exception Filter
**File:** `backend/src/common/filters/http-exception.filter.ts`

```typescript
// Catches ALL exceptions, logs with context, returns standardized response
{
  statusCode: number;
  message: string;
  errorCode: string;
  correlationId: string;
  timestamp: string;
  path: string;
}
```

#### 1.2 Backend: Correlation ID Middleware
**File:** `backend/src/common/middleware/correlation-id.middleware.ts`

- Generates UUID for each request
- Attaches to request object
- Propagates through all service calls
- Includes in response headers

#### 1.3 Backend: WebSocket Error Emission
**Files:**
- `backend/src/modules/literature/literature.gateway.ts`
- `backend/src/modules/literature/gateways/theme-extraction.gateway.ts`

- Add `emitError()` calls to all catch blocks
- Standardize error events: `{ event: 'error', code: string, message: string, correlationId: string }`

#### 1.4 Backend: Logs API Endpoint
**File:** `backend/src/modules/logs/logs.controller.ts`

```
POST /api/logs - Receive frontend logs
GET /api/logs/analytics - Dashboard data
GET /api/logs/search - Query logs by correlationId, userId, timeRange
```

---

### Day 2: Frontend Migration

#### 2.1 Replace Console Calls with Logger
**Priority Files (highest console.* usage):**

| File | Console Calls | Priority |
|------|--------------|----------|
| `useThemeExtractionHandlers.ts` | 112 | P0 |
| `useProgressiveSearch.ts` | 87 | P0 |
| `useThemeExtractionWorkflow.old.ts` | 94 | P0 (deprecate) |
| `literature-api.service.ts` | 56+ | P0 |
| `useWaitForFullText.ts` | 28 | P1 |
| `useStatePersistence.ts` | 16 | P1 |
| `PaperActions.tsx` | 13 | P1 |
| Remaining 35+ files | ~200 | P2 |

#### 2.2 Enable Backend Log Shipping
**File:** `frontend/lib/utils/logger.ts`

- Implement `/api/logs` endpoint calls
- Batch logs (every 5 seconds)
- Include correlationId from response headers

#### 2.3 Error Boundary Integration
**File:** `frontend/app/(researcher)/discover/literature/page.tsx`

- Wrap with `LiteratureErrorBoundary`
- Wrap theme extraction with `ThemeErrorBoundary`
- Log boundary catches to backend

---

### Day 3: Service-Level Logging Enhancement

#### 3.1 Literature Service Structured Logging
**File:** `backend/src/modules/literature/literature.service.ts`

Convert all 229+ log calls to structured format:
```typescript
this.logger.info('Search started', {
  correlationId,
  query,
  sources: sources.length,
  userId,
});
```

#### 3.2 Theme Extraction Logging
**File:** `backend/src/modules/literature/services/unified-theme-extraction.service.ts`

- Add stage-level logging (6 stages)
- Error logging with full context
- WebSocket progress with correlationId

#### 3.3 Source Services Logging
**Files:** All 20+ source services in `backend/src/modules/literature/services/`

Standard template:
```typescript
this.logger.info(`[${SOURCE_NAME}] Request`, {
  correlationId,
  query,
  timeout: TIMEOUT_MS,
});

this.logger.error(`[${SOURCE_NAME}] Failed`, {
  correlationId,
  error: error.message,
  status: error.response?.status,
  duration,
});
```

---

### Day 4: Integration Tests

#### 4.1 Exception Filter Tests
**File:** `backend/src/common/filters/__tests__/http-exception.filter.spec.ts`

```typescript
describe('HttpExceptionFilter', () => {
  it('should return standardized error response');
  it('should include correlationId in response');
  it('should log error with full context');
  it('should handle unknown exceptions');
  it('should sanitize sensitive data');
});
```

#### 4.2 Correlation ID Tests
**File:** `backend/src/common/middleware/__tests__/correlation-id.middleware.spec.ts`

```typescript
describe('CorrelationIdMiddleware', () => {
  it('should generate UUID for new requests');
  it('should preserve existing correlationId from header');
  it('should attach to request object');
  it('should add to response headers');
});
```

#### 4.3 Frontend Logger Tests
**File:** `frontend/lib/utils/__tests__/logger.test.ts`

```typescript
describe('EnterpriseLogger', () => {
  it('should mask sensitive data');
  it('should batch logs correctly');
  it('should ship logs to backend');
  it('should handle backend unavailability gracefully');
  it('should track performance metrics');
});
```

#### 4.4 E2E Log Flow Test
**File:** `frontend/e2e/logging-flow.spec.ts`

```typescript
describe('Logging Flow', () => {
  it('should trace request from frontend to backend via correlationId');
  it('should capture errors in literature search');
  it('should emit WebSocket errors to client');
  it('should log theme extraction stages');
});
```

---

### Day 5: Monitoring & Dashboard

#### 5.1 Prometheus Metrics Enhancement
**File:** `backend/src/common/monitoring/metrics.service.ts`

Add metrics:
- `literature_search_errors_total{source, error_type}`
- `theme_extraction_errors_total{stage, error_type}`
- `api_errors_total{endpoint, status_code}`
- `websocket_errors_total{event, error_type}`
- `frontend_errors_total{component, error_type}`

#### 5.2 Error Analytics API
**File:** `backend/src/modules/logs/logs.service.ts`

```typescript
interface ErrorAnalytics {
  totalErrors: number;
  errorsByType: Record<string, number>;
  errorsByEndpoint: Record<string, number>;
  errorsBySource: Record<string, number>;
  errorTimeline: TimeSeriesData[];
  topErrors: { message: string; count: number; lastOccurred: Date }[];
}
```

#### 5.3 Sentry Integration
**File:** `backend/src/modules/literature/literature.service.ts`

```typescript
import * as Sentry from '@sentry/node';

catch (error) {
  Sentry.captureException(error, {
    tags: { source, correlationId },
    extra: { query, userId },
  });
  throw error;
}
```

---

## Error Code Standardization

### Backend Error Codes

| Code | Description | HTTP Status |
|------|-------------|-------------|
| `LIT001` | Search failed - general | 500 |
| `LIT002` | Source timeout | 504 |
| `LIT003` | Rate limited | 429 |
| `LIT004` | Invalid query | 400 |
| `LIT005` | No results found | 404 |
| `THEME001` | Theme extraction failed | 500 |
| `THEME002` | Full-text unavailable | 422 |
| `THEME003` | AI service error | 503 |
| `WS001` | WebSocket connection failed | - |
| `WS002` | WebSocket message failed | - |
| `AUTH001` | Unauthorized | 401 |
| `AUTH002` | Token expired | 401 |

### Frontend Error Codes

| Code | Description | Component |
|------|-------------|-----------|
| `FE001` | API request failed | literature-api.service |
| `FE002` | WebSocket disconnected | useThemeExtractionWebSocket |
| `FE003` | State persistence failed | useStatePersistence |
| `FE004` | Component render error | Error boundaries |
| `FE005` | Validation error | Forms |

---

## File Changes Summary

### New Files (12)

| File | Purpose |
|------|---------|
| `backend/src/common/filters/http-exception.filter.ts` | Global exception handler |
| `backend/src/common/filters/ws-exception.filter.ts` | WebSocket exception handler |
| `backend/src/common/middleware/correlation-id.middleware.ts` | Request tracing |
| `backend/src/common/middleware/request-logger.middleware.ts` | HTTP request logging |
| `backend/src/modules/logs/logs.module.ts` | Logging module |
| `backend/src/modules/logs/logs.controller.ts` | Logs API |
| `backend/src/modules/logs/logs.service.ts` | Log storage & analytics |
| `backend/src/common/filters/__tests__/http-exception.filter.spec.ts` | Unit tests |
| `backend/src/common/middleware/__tests__/correlation-id.middleware.spec.ts` | Unit tests |
| `frontend/lib/utils/__tests__/logger.test.ts` | Frontend logger tests |
| `frontend/e2e/logging-flow.spec.ts` | E2E logging tests |
| `frontend/lib/types/error-codes.ts` | Standardized error codes |

### Modified Files (Priority)

| File | Changes |
|------|---------|
| `backend/src/main.ts` | Add global filter, middleware |
| `backend/src/app.module.ts` | Import LogsModule |
| `backend/src/modules/literature/literature.gateway.ts` | Add error emission |
| `backend/src/modules/literature/literature.service.ts` | Structured logging |
| `backend/src/modules/literature/services/unified-theme-extraction.service.ts` | Error emission |
| `frontend/lib/utils/logger.ts` | Enable backend shipping |
| `frontend/lib/services/literature-api.service.ts` | Replace console.* |
| `frontend/lib/hooks/useProgressiveSearch.ts` | Replace console.* (87) |
| `frontend/lib/hooks/useThemeExtractionHandlers.ts` | Replace console.* (112) |
| `frontend/app/(researcher)/discover/literature/page.tsx` | Add error boundaries |

---

## Success Criteria

### Must Have (P0)

- [ ] All frontend console.* calls replaced with logger.* (606+ calls)
- [ ] Global exception filter capturing all backend errors
- [ ] Correlation IDs in all request/response cycles
- [ ] WebSocket errors emitted to clients
- [ ] Frontend logs shipping to backend
- [ ] All 209 catch blocks logging with context

### Should Have (P1)

- [ ] Error code standardization
- [ ] Integration tests passing (>90% coverage for new code)
- [ ] Sentry integration active
- [ ] Error analytics API functional
- [ ] Performance metrics enhanced

### Nice to Have (P2)

- [ ] Grafana dashboard for error monitoring
- [ ] Automated alerting on error spikes
- [ ] Log retention policy implemented
- [ ] PII detection and redaction

---

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Console migration breaks existing debugging | Medium | Low | Keep console in dev mode |
| Log volume overwhelms storage | Low | Medium | Implement log rotation, sampling |
| Performance impact from logging | Low | Low | Async logging, batching |
| Breaking changes in error responses | Medium | High | Gradual rollout, client updates |

---

## Rollback Plan

If issues arise:

1. **Frontend**: Revert `logger.ts` changes to disable backend shipping
2. **Backend**: Remove global exception filter from `main.ts`
3. **WebSocket**: Revert gateway changes to previous silent behavior

All changes are additive - no destructive changes to existing functionality.

---

## Timeline

| Day | Focus | Hours | Deliverables |
|-----|-------|-------|--------------|
| Day 1 | Core Infrastructure | 6-8 | Exception filter, correlation middleware, logs API |
| Day 2 | Frontend Migration | 6-8 | Replace 606+ console calls, enable log shipping |
| Day 3 | Service Enhancement | 6-8 | Structured logging in all literature services |
| Day 4 | Testing | 4-6 | Unit tests, integration tests, E2E tests |
| Day 5 | Monitoring | 4-6 | Prometheus metrics, error analytics, Sentry |

**Total Estimated Effort:** 26-36 hours

---

## Appendix: Console Call Locations

### Top 10 Files by Console Usage

1. `useThemeExtractionHandlers.ts` - 112 calls
2. `useProgressiveSearch.ts` - 87 calls
3. `useThemeExtractionWorkflow.old.ts` - 94 calls (DEPRECATE)
4. `literature-api.service.ts` - 56+ calls
5. `useWaitForFullText.ts` - 28 calls
6. `useStatePersistence.ts` - 16 calls
7. `PaperActions.tsx` - 13 calls
8. `useEnhancedThemeIntegration.ts` - 13 calls
9. `ThemeExtractionContainer.tsx` - 7 calls
10. `PurposeSelectionWizard.tsx` - 7 calls

### Backend Catch Block Distribution

| Service | Catch Blocks |
|---------|--------------|
| literature.service.ts | 48 |
| literature-cache.service.ts | 13 |
| pdf-parsing.service.ts | 10 |
| unified-theme-extraction.service.ts | 9 |
| pubmed.service.ts | 8 |
| Other services (40+) | ~121 |

---

**Document Version:** 1.0
**Last Updated:** November 22, 2025
**Author:** Claude Code Assistant
**Phase:** 10.943
