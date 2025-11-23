# Batch Operations Architecture - Quick Reference

## Component Status Matrix

| Component | Status | File Location | Key Finding |
|-----------|--------|---------------|------------|
| **Database** | ✓ Supported | `backend/prisma/schema.prisma` (L5-7) | SQLite with single-writer = bottleneck |
| **Transactions** | ✓ Implemented | 4 files using `$transaction()` | Works but SQLite still serializes |
| **Queue** | ✗ Memory-only | `pdf-queue.service.ts` (L30-37) | No persistence, single-server only |
| **Logging** | ✓ Production-ready | `logger.service.ts` (L20-26) | Winston + AsyncLocalStorage = good |
| **Correlation IDs** | ✓ Implemented | `correlation-id.middleware.ts` (L31-35) | UUID v4, works across async |
| **WebSocket** | ✓ Ready | `theme-extraction.gateway.ts` (L71-80) | Socket.io rooms by userId |
| **Rate Limiting** | ✓ Dual system | `app.module.ts` (L42-58) | Per-endpoint, per-user identification |
| **Feature Flags** | ✗ Missing | N/A | 0 files found = need to add |

---

## Database Details

### Current SQLite Provider
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### Batch-Related Existing Models
- **Paper** (L795-863): Has `fullTextStatus` field for tracking
- **ProcessedLiterature** (L896-915): Caching table, good pattern for batch reuse
- **RateLimit** (L378-389): Per-identifier, per-endpoint, per-window tracking

### Transaction Support
```typescript
// 4 files currently use Prisma transactions:
await this.prisma.$transaction([...]) // Batch operations
```

---

## Queue System Breakdown

### Current Implementation (PDF Queue Service)

**Memory Structure:**
```typescript
private readonly jobs = new Map<string, PDFJob>();    // Job storage
private readonly queue: string[] = [];                  // FIFO queue
private processing = false;                            // Lock
```

**Job Lifecycle:**
1. `addJob()` (L49-142) - Creates job, updates DB status, emits event
2. `processQueue()` (L189-217) - Main processing loop
3. `processJob()` (L222-334) - Handles single job with retries
4. `cleanup()` (L369-387) - Manual cleanup after 7 days

**Events Emitted:**
- `pdf.job.queued` (L134)
- `pdf.job.processing` (L236)
- `pdf.job.progress` (L246)
- `pdf.job.completed` (L267)
- `pdf.job.retry` (L286)
- `pdf.job.failed` (L309)

**Built-in Features:**
- Retry logic: 3 attempts with exponential backoff (2s, 4s, 8s) - L277
- Rate limiting: 10 PDFs/minute - L36, L204
- Progress tracking: 0-100% - L226

**Critical Gap:**
- Job state only in memory = lost on restart
- Single process = can't scale horizontally
- No dependency management

---

## Logging System

### Winston Configuration (Lines 29-118)
```typescript
// Transports:
// 1. Development: Console + daily rotating files
// 2. Error logs: error-%DATE%.log (14-day retention)
// 3. Application logs: application-%DATE%.log (14-day retention)
// 4. Security logs: security-%DATE%.log (30-day retention)
```

### Correlation ID System
```typescript
// AsyncLocalStorage provides context propagation
getCorrelationId()  // Get current correlation ID from context
getRequestContext() // Get full context (correlationId, userId, startTime)
runAsyncWithCorrelation() // Run function with new correlation context
```

### Logging Methods Available
```typescript
logger.log()             // Info level
logger.error()           // With stack trace
logger.warn()            // Warning level
logger.debug()           // Development
logger.verbose()         // Extra detail
logger.logRequest()      // HTTP request context
logger.logResponse()     // HTTP response with timing
logger.logSecurity()     // Security event with severity
logger.logPerformance()  // Operation timing
logger.logEvent()        // Business event
logger.logAudit()        // Audit trail
logger.logError()        // Error with context
logger.logExternalCall() // 3rd party service calls
logger.logCache()        // Cache hit/miss
logger.logWebSocket()    // WebSocket events
```

---

## WebSocket Gateway

### ThemeExtractionGateway (Socket.io)
```typescript
// Namespace: /theme-extraction
// Connection: User rooms (socketId -> userId)
// Main methods:
// - emitProgress(progress)       // Send progress to user
// - emitError(userId, error)     // Send error message
// - emitStandardizedError(...)   // With error codes
// - emitThemeError(...)          // Theme-specific errors
// - emitComplete(userId, count)  // Batch completion
```

### Progress Message Format
```typescript
interface ExtractionProgress {
  userId: string;                    // Target user
  stage: string;                     // Current stage
  percentage: number;                // 0-100
  message: string;                   // Human-readable
  details?: ExtractionProgressDetails;
}

interface ExtractionProgressDetails {
  liveStats?: {
    sourcesAnalyzed: number;
    currentOperation: string;
    currentArticle: number;
    totalArticles: number;
    totalWordsRead: number;
    // ... more fields
  }
}
```

---

## Rate Limiting System

### Two-Layer System

#### Layer 1: Global Throttler (NestJS)
```typescript
// app.module.ts L42-58
ThrottlerModule.forRoot([
  {name: 'default', ttl: 60s, limit: 100},
  {name: 'auth', ttl: 15m, limit: 5},
  {name: 'upload', ttl: 1h, limit: 10},
])
```

#### Layer 2: Custom Guards
- RateLimitingGuard (rate-limiting.guard.ts L17-90)
- Per-endpoint configuration
- Database-backed state (RateLimit model)

### Rate Limit Decorator
```typescript
export const CustomRateLimit = (ttl: number, limit: number) =>
  Throttle({ default: { ttl: ttl * 1000, limit } });

// Usage:
// @CustomRateLimit(60, 20)  // 20 requests per 60 seconds
```

### Predefined Configurations
```typescript
GENERAL:          60s, 100 requests
AUTH:             15m, 5 requests
FILE_UPLOAD:      1h, 10 requests
PARTICIPANT_SESSION: 5m, 1 request
EXPORT:           1h, 20 requests
SURVEY_CREATION:  24h, 50 requests
REALTIME:         60s, 30 requests
SEARCH:           60s, 200 requests
```

### Identifier Logic
```typescript
// Per-User (if authenticated):
identifier = `user:${request.user.userId}`

// Per-IP (fallback):
identifier = request.ip || request.headers['x-forwarded-for']
```

### Rate Limit Response Headers
```
X-RateLimit-Limit:     Maximum requests allowed
X-RateLimit-Window:    Time window in seconds
X-RateLimit-Remaining: Requests remaining (approximate)
Retry-After:           Seconds to wait before retry
```

---

## Missing Components

### Feature Flags
**Status:** Not implemented

**What's needed:**
```prisma
model FeatureFlag {
  id        String   @id @default(cuid())
  name      String   @unique        // "BATCH_OPERATIONS_V1"
  enabled   Boolean  @default(false)
  rollout   Int      @default(0)    // 0-100% gradual rollout
  whitelist Json?                   // Specific user IDs
  blacklist Json?                   // Excluded user IDs
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

**Benefits:**
- A/B testing capability
- Gradual rollout (0-100%)
- Per-user enable/disable
- Emergency off-switch

---

## Critical Bottleneck: SQLite Single Writer

### The Problem
```
Request 1: WRITE (locks db)
Request 2: WAIT... (queued)
Request 3: WAIT... (queued)
Request 4: WAIT... (queued)

All batch operations serialize at the database level
```

### Impact on Batch Operations
- Batch of 1000 items = 1000 sequential writes (even with transactions)
- Transaction overhead per chunk
- Locks block other operations

### Solution
**Chunk batches: 100-500 items per chunk**
```typescript
// Instead of:
for (100 items) { update item in db }  // Locks for duration

// Do:
for (20 chunks of 5 items) {
  await transaction([5 updates])
  await sleep(100ms)  // Release lock between chunks
}
```

---

## File Structure Reference

```
backend/
├── prisma/
│   └── schema.prisma                  [Database schema]
│       ├── L5-7: SQLite provider
│       ├── L378-389: RateLimit model
│       └── L795-863: Paper model
├── src/
│   ├── app.module.ts                  [Global config]
│   │   └── L42-58: Rate limit setup
│   ├── common/
│   │   ├── logger/
│   │   │   ├── logger.service.ts      [Winston config]
│   │   │   └── logger.module.ts       [Export]
│   │   └── middleware/
│   │       └── correlation-id.middleware.ts [Correlation IDs]
│   └── modules/
│       ├── literature/
│       │   ├── services/
│       │   │   └── pdf-queue.service.ts    [Queue implementation]
│       │   └── gateways/
│       │       └── theme-extraction.gateway.ts [WebSocket]
│       └── rate-limiting/
│           ├── decorators/
│           │   └── rate-limit.decorator.ts
│           ├── guards/
│           │   └── rate-limiting.guard.ts
│           └── services/
│               └── rate-limiting.service.ts
└── package.json
    ├── @nestjs/event-emitter: v3.0.1    [Events]
    ├── @nestjs/websockets: v11.1.6      [WebSocket]
    ├── @nestjs/throttler: v6.4.0        [Rate limiting]
    ├── @prisma/client: v6.15.0          [ORM]
    ├── socket.io: v4.8.1                [WebSocket transport]
    └── winston: v3.17.0                 [Logging]
```

---

## Dependencies Already Available

### For Batch Operations (No additional packages needed!)
- **@nestjs/event-emitter** (v3.0.1) - Event emission
- **@nestjs/websockets** (v11.1.6) - Real-time updates
- **@nestjs/throttler** (v6.4.0) - Rate limiting
- **@prisma/client** (v6.15.0) - Database + transactions
- **socket.io** (v4.8.1) - WebSocket transport
- **winston** (v3.17.0) - Logging

### Additional Optional (for future scaling)
- **bullmq** - Job queue (migrate to later if needed)
- **redis** - Cache + queue backend (future scaling)

---

## Implementation Checklist

### Phase 1: Database Foundations
- [ ] Create BatchOperation model
- [ ] Create BatchJobItem model  
- [ ] Create BatchItemResult model (for tracking outcomes)
- [ ] Run Prisma migration
- [ ] Add indexes for performance

### Phase 2: Batch Service
- [ ] Create batch.service.ts
- [ ] Implement createBatch()
- [ ] Implement processBatch() with chunking
- [ ] Implement getBatchStatus()
- [ ] Connect to correlation IDs
- [ ] Add proper logging

### Phase 3: Rate Limiting
- [ ] Add BATCH_OPERATIONS rate limit config
- [ ] Add BATCH_ITEM_PROCESSING rate limit config
- [ ] Create dedicated endpoints
- [ ] Add batch-specific decorators

### Phase 4: Real-time Updates
- [ ] Create batch progress events
- [ ] Wire to WebSocket gateway
- [ ] Test user isolation

### Phase 5: Feature Flags
- [ ] Create FeatureFlag model
- [ ] Create FeatureFlag service
- [ ] Add feature flag guard decorator
- [ ] Gate batch endpoints

### Phase 6: Testing
- [ ] Unit tests for batch service
- [ ] Integration tests for database
- [ ] WebSocket connection tests
- [ ] Rate limit tests
- [ ] Load testing (batch size limits)

---

## Key Code Snippets for Reference

### Accessing Correlation ID in Service
```typescript
import { getCorrelationId, getRequestContext } from '@common/middleware/correlation-id.middleware';

export class BatchService {
  async processBatch(items: any[]) {
    const correlationId = getCorrelationId() || randomUUID();
    // All logs in this context will have correlationId
    this.logger.log('Processing batch', { correlationId, itemCount: items.length });
  }
}
```

### Emitting Progress via WebSocket
```typescript
import { ThemeExtractionGateway } from '@modules/literature/gateways/theme-extraction.gateway';

export class BatchService {
  constructor(private gateway: ThemeExtractionGateway) {}
  
  async processBatch(userId: string, items: any[]) {
    for (let i = 0; i < items.length; i++) {
      this.gateway.emitProgress({
        userId,
        stage: 'batch-processing',
        percentage: (i / items.length) * 100,
        message: `Processing batch item ${i + 1} of ${items.length}`,
        details: {
          liveStats: {
            currentOperation: `Processing ${items[i].id}`,
            sourcesAnalyzed: i,
          }
        }
      });
      await this.processItem(items[i]);
    }
  }
}
```

### Chunked Database Updates (SQLite optimization)
```typescript
async processBatchWithChunking(items: any[], chunkSize = 100) {
  for (let i = 0; i < items.length; i += chunkSize) {
    const chunk = items.slice(i, i + chunkSize);
    
    // Single transaction for chunk
    await this.prisma.$transaction(
      chunk.map(item => 
        this.prisma.paper.update({
          where: { id: item.paperId },
          data: { status: 'processed' }
        })
      )
    );
    
    // Release lock between chunks
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Emit progress
    this.gateway.emitProgress({...});
  }
}
```

---

## Performance Expectations

### Batch Processing Throughput (SQLite)
- Small batches (< 100 items): ~100ms per transaction
- Medium batches (100-500 items): ~500-1000ms per chunk
- Large batches (> 500 items): Risk of 30s+ transaction locks

### Rate Limiting Impact
- Each request checked against RateLimit table
- Window cleanup: automatic (old entries deleted)
- Expected overhead: <5ms per request

### Logging Impact
- Winston async writes: minimal overhead
- Daily rotation: automatic
- File I/O: happens in background

### WebSocket Broadcasting
- Per-user emission: fast
- Expected latency: 50-100ms from server emit to client receive
- Connection overhead: managed by Socket.io

---

## Migration Path to Production

### Step 1: Development (Current Phase)
- Add batch tables to Prisma
- Implement batch service
- Test with small batches (10-50 items)

### Step 2: Feature Testing
- Deploy with feature flag OFF
- Test with 5% of users (gradual rollout)
- Monitor: CPU, memory, database locks

### Step 3: Rollout
- Increase rollout: 25% -> 50% -> 100%
- Set rate limits: 10 batches/hour per user
- Monitor error rates

### Step 4: Optimization
- If bottleneck observed: reduce chunk size
- If memory grows: implement job cleanup
- If cross-server needed: plan BullMQ migration

### Step 5: Scale (Future)
- Switch to PostgreSQL (if horizontal scaling needed)
- Introduce BullMQ for job distribution
- Add Redis for caching

