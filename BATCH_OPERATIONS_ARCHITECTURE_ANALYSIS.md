# Architecture Analysis: Batch Operations Implementation

## Executive Summary
Analysis of the codebase architecture reveals several critical considerations for implementing batch operations. The system uses SQLite with Prisma ORM, an in-memory event-based queue system, Winston logging with correlation IDs, WebSocket-based real-time updates, and per-endpoint rate limiting.

---

## 1. DATABASE ARCHITECTURE

### Database Type: SQLite
**File:** `/Users/shahabnazariadli/Documents/blackQmethhod/backend/prisma/schema.prisma` (Line 5-7)

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### Key Issues for Batch Operations:

1. **SQLite Limitations (Critical)**
   - Single-threaded writer (cannot handle concurrent batch inserts from multiple jobs)
   - IMMEDIATE/DEFERRED transactions only - no advanced isolation levels
   - Statement limit per transaction: ~32K operations in a single transaction
   - Write queue becomes a bottleneck at scale

2. **Transaction Support (Line 1-7 of statement.service.ts)**
   - Prisma `$transaction()` IS implemented in codebase (4 files using it)
   - Supports both sequential and parallel transactions
   - Uses Prisma's default SERIALIZABLE isolation (SQLite feature)
   - **Problem:** SQLite serializes all writes anyway, so parallel transactions = worse performance

3. **Large Batch Recommendations**
   - Break batches into chunks of 100-500 items max per transaction
   - Use sequential batching (one transaction after another) rather than parallel
   - Consider timeout issues (SQLite locks during transaction = blocking behavior)

### Schema Observations:
- **No explicit batch tables:** Must create `BatchOperation` table to track batch jobs
- **Paper model supports queuing:** Has `fullTextStatus` field (Line 830: `fullTextStatus?: string`)
- **Good indexing strategy:** Papers table properly indexed by userId, doi, collectionId
- **Related entities:** ProcessedLiterature table (Line 896) shows caching pattern for batch reuse

---

## 2. QUEUE SYSTEM ARCHITECTURE

### Queue Implementation: In-Memory EventEmitter + Custom Implementation
**File:** `/Users/shahabnazariadli/Documents/blackQmethhod/backend/src/modules/literature/services/pdf-queue.service.ts`

### Architecture Details:

```typescript
// Line 30-37: Simple in-memory queue
@Injectable()
export class PDFQueueService {
  private readonly jobs = new Map<string, PDFJob>();  // Job storage
  private readonly queue: string[] = [];                // Job queue (FIFO)
  private processing = false;                           // Single-threaded processing
  private readonly MAX_RETRIES = 3;
  private readonly RATE_LIMIT_PER_MINUTE = 10;
  private readonly requestTimes: number[] = [];
}
```

### Not BullMQ or Redis - Key Characteristics:

1. **Single-Process Queue**
   - In-memory Map stores all jobs
   - Simple array for FIFO queue order
   - Lost on server restart
   - All state maintained in process memory

2. **Event Emission Pattern**
   ```typescript
   // Line 134: Events emitted via EventEmitter2
   this.eventEmitter.emit('pdf.job.queued', { jobId, paperId, progress: 0 });
   this.eventEmitter.emit('pdf.job.processing', { ... });
   this.eventEmitter.emit('pdf.job.progress', { ... });
   this.eventEmitter.emit('pdf.job.completed', { ... });
   this.eventEmitter.emit('pdf.job.retry', { ... });
   this.eventEmitter.emit('pdf.job.failed', { ... });
   ```

3. **Processing Model**
   - Sequential processing (one job at a time)
   - Line 189-217: `processQueue()` pulls from queue, processes, then continues
   - Built-in retry logic with exponential backoff (2s, 4s, 8s - Line 277)
   - Rate limiting built-in (10 PDFs/minute - Line 36, 204)

4. **Status Tracking (Database)**
   ```typescript
   // Line 121-125: Updates Paper.fullTextStatus immediately
   await this.prisma.paper.update({
     where: { id: paperId },
     data: { fullTextStatus: 'fetching' },
   });
   ```

### Issues for Batch Operations:

1. **Loss of State on Restart** - No persistence
2. **Single Server Only** - Can't scale across multiple instances
3. **Memory Growth** - Old jobs stored in Map forever (cleanup is manual - Line 369)
4. **No Job Dependencies** - Can't express "run B after A completes"
5. **No Dead Letter Queue** - Failed jobs not stored for inspection

### Recommendations:
- For batch operations, extend schema with `BatchJob` table (Prisma)
- Persist job state to DB before emitting events
- Use database as single source of truth, not memory
- Consider migration to BullMQ if cross-server scaling needed later

---

## 3. LOGGING SYSTEM

### Logger Implementation: Winston with Correlation IDs
**File:** `/Users/shahabnazariadli/Documents/blackQmethhod/backend/src/common/logger/logger.service.ts`

### Architecture:

```typescript
// Line 20-26: Global logger with Winston
@Injectable()
export class LoggerService implements NestLoggerService {
  private logger!: winston.Logger;
  private readonly isDevelopment: boolean;
  
  // Line 33-37: Structured JSON logging
  const jsonFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  );
```

### Transport Configuration (Line 54-102):
1. **Development:** Console + File (rotating daily)
2. **Production:** JSON file + rotating error logs
3. **Daily rotation:** Auto-archived after 14 days
4. **Security logs:** Separate transport with 30-day retention

### Correlation ID System
**File:** `/Users/shahabnazariadli/Documents/blackQmethhod/backend/src/common/middleware/correlation-id.middleware.ts`

```typescript
// Line 31-35: AsyncLocalStorage for context propagation
export const correlationStorage = new AsyncLocalStorage<{
  correlationId: string;
  userId?: string;
  startTime: number;
}>();

// Line 41-44: Get correlation ID from async context
export function getCorrelationId(): string | undefined {
  const store = correlationStorage.getStore();
  return store?.correlationId;
}
```

### Key Features:

1. **UUID v4 per request** (Line 67)
2. **AsyncLocalStorage propagation** (Line 80-89) - works across async boundaries
3. **X-Correlation-ID header** in responses (Line 74)
4. **Multiple log levels:**
   - `log()` / `info()` - general info
   - `error()` - errors with stack trace
   - `warn()` - warnings
   - `debug()` - development info
   - `verbose()` - additional detail
   - Special methods: `logRequest()`, `logResponse()`, `logSecurity()`, `logPerformance()`, etc.

### For Batch Operations:

1. **Correlation Chain**
   ```typescript
   // Parent batch job gets: batch-123-uuid
   // Each child job inherits: batch-123-uuid (can append sub-IDs)
   // Makes tracing entire batch operation easy in logs
   ```

2. **Already supports async contexts** - no changes needed for async batch processing

3. **Log output example:**
   ```json
   {
     "timestamp": "2025-11-22 10:30:45",
     "level": "info",
     "message": "Batch job started",
     "type": "business_event",
     "correlationId": "550e8400-e29b-41d4-a716-446655440000",
     "userId": "user-123",
     "batchJobId": "batch-789"
   }
   ```

---

## 4. WEBSOCKET GATEWAY

### ThemeExtractionGateway Implementation
**File:** `/Users/shahabnazariadli/Documents/blackQmethhod/backend/src/modules/literature/gateways/theme-extraction.gateway.ts`

### Architecture:

```typescript
// Line 71-77: WebSocket server configuration
@WebSocketGateway({
  namespace: '/theme-extraction',
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
})
export class ThemeExtractionGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;  // Socket.io Server instance
  
  private userRooms = new Map<string, string>(); // socketId -> userId
}
```

### Key Methods:

1. **Progress Emission** (Line 139-157)
   ```typescript
   emitProgress(progress: ExtractionProgress) {
     this.server.to(progress.userId).emit('extraction-progress', progress);
     // Emits to specific user's room
   }
   ```

2. **Room-based Broadcasting**
   ```typescript
   // Line 108: Users join their own room by userId
   client.join(userId);
   
   // Line 140: Send to specific room
   this.server.to(progress.userId).emit('extraction-progress', progress);
   ```

3. **Error Handling** (Line 176-213)
   - `emitStandardizedError()` - structured error codes
   - `emitThemeError()` - theme-specific errors
   - Uses ErrorCodes enum for consistency

### Message Types (Line 22-69):
```typescript
interface ExtractionProgress {
  userId: string;
  stage: string; // 'familiarization' | 'coding' | 'generation' | etc.
  percentage: number;
  message: string;
  details?: ExtractionProgressDetails; // Live stats
}

interface ExtractionProgressDetails {
  stageName?: string;
  stageNumber?: number;
  totalStages?: number;
  percentage?: number;
  liveStats?: ExtractionProgressLiveStats; // Current operation data
}
```

### For Batch Operations:

1. **Supports batch progress tracking:**
   - Emit progress per job (or aggregate batch progress)
   - Users see real-time updates as batch processes

2. **Example batch flow:**
   ```typescript
   // Start batch
   gateway.emitProgress({
     userId: 'user-123',
     stage: 'batch-processing',
     percentage: 0,
     message: 'Starting batch of 50 items',
     details: { liveStats: { currentOperation: 'Item 1 of 50' } }
   });
   
   // Periodic updates
   gateway.emitProgress({
     userId: 'user-123',
     stage: 'batch-processing',
     percentage: 20,
     message: 'Processing batch items...',
     details: { liveStats: { currentOperation: 'Item 10 of 50' } }
   });
   ```

3. **Connection management:** Rooms automatically cleaned up on disconnect (Line 91-98)

---

## 5. RATE LIMITING SYSTEM

### Dual Rate Limiting Implementation

#### A. Throttler Module (Global - Line 42-58 of app.module.ts)
```typescript
ThrottlerModule.forRoot([
  {
    name: 'default',
    ttl: 60000,  // 1 minute
    limit: 100,  // 100 requests per minute
  },
  {
    name: 'auth',
    ttl: 900000,  // 15 minutes
    limit: 5,     // 5 attempts per 15 minutes
  },
  {
    name: 'upload',
    ttl: 3600000, // 1 hour
    limit: 10,    // 10 uploads per hour
  },
]),
```

#### B. Custom Rate Limiting System
**File:** `/Users/shahabnazariadli/Documents/blackQmethhod/backend/src/modules/rate-limiting/services/rate-limiting.service.ts`

### Rate Limit Decorator (rate-limit.decorator.ts Line 1-22)

```typescript
// Per-Endpoint Configuration
export const FileUploadRateLimit = () =>
  Throttle({ default: { ttl: 60000, limit: 5 } }); // 5 uploads/min

export const CustomRateLimit = (ttl: number, limit: number) =>
  Throttle({ default: { ttl: ttl * 1000, limit } });

// Usage on controller:
// @CustomRateLimit(60, 20)  // 20 requests per 60 seconds
// someEndpoint() { ... }
```

### RateLimitingService (Line 10-140)

```typescript
// Line 14-66: Check rate limit
async checkRateLimit(
  identifier: string,      // user:userId or IP address
  endpoint: string,        // method:path
  config: RateLimitConfig,
): Promise<void>

// Predefined configs for different endpoints:
static readonly CONFIGS = {
  GENERAL: { windowMs: 60*1000, maxRequests: 100 },
  AUTH: { windowMs: 15*60*1000, maxRequests: 5 },
  FILE_UPLOAD: { windowMs: 60*60*1000, maxRequests: 10 },
  PARTICIPANT_SESSION: { windowMs: 5*60*1000, maxRequests: 1 },
  EXPORT: { windowMs: 60*60*1000, maxRequests: 20 },
  SURVEY_CREATION: { windowMs: 24*60*60*1000, maxRequests: 50 },
  REALTIME: { windowMs: 60*1000, maxRequests: 30 },
  SEARCH: { windowMs: 60*1000, maxRequests: 200 },
};
```

### RateLimitingGuard (guards/rate-limiting.guard.ts Line 17-90)

```typescript
// Line 23-59: Check rate limit for each request
async canActivate(context: ExecutionContext): Promise<boolean> {
  const rateLimitConfig = this.reflector.get<RateLimitConfig>(
    RATE_LIMIT_KEY,
    context.getHandler(),
  );
  
  const identifier = this.getIdentifier(request); // user ID or IP
  const endpoint = this.getEndpoint(request);    // method:path
  
  await this.rateLimitingService.checkRateLimit(
    identifier,
    endpoint,
    rateLimitConfig,
  );
}

// Line 62-75: Identifier resolution (per-USER or per-IP)
private getIdentifier(request: any): string {
  if (request.user?.userId) {
    return `user:${request.user.userId}`; // Per-user rate limit
  }
  return request.ip || request.headers['x-forwarded-for']; // Per-IP fallback
}
```

### Database Backing (RateLimit Model in schema.prisma Line 378-389)

```prisma
model RateLimit {
  id          String   @id @default(cuid())
  identifier  String   // user ID or IP
  endpoint    String   // method:path
  count       Int      // Request count in window
  windowStart DateTime // When window started
  createdAt   DateTime @default(now())

  @@unique([identifier, endpoint, windowStart]) // Composite key for windowing
  @@index([identifier])
  @@index([endpoint])
}
```

### Key Characteristics for Batch Operations:

1. **PER-ENDPOINT** rate limits (not per-item)
   - `/api/batch/start` can be rate-limited separately from individual items
   - Example: 10 batch operations per hour, but 1000 items within each batch

2. **PER-USER** identification
   - Rate limit tied to authenticated user, not IP
   - Different users can batch independently
   - Line 64-65: `user:${request.user.userId}` format

3. **Time Window Bucketing**
   ```typescript
   // Unique window per identifier+endpoint+startTime
   // Cleans up old windows automatically (Line 23-29)
   const windowStart = new Date(now.getTime() - config.windowMs);
   await this.prisma.rateLimit.deleteMany({
     where: { windowStart: { lt: windowStart } }
   });
   ```

4. **Headers Included**
   ```typescript
   // Line 82-89: Clients see rate limit info
   response.setHeader('X-RateLimit-Limit', config.maxRequests);
   response.setHeader('X-RateLimit-Window', windowSeconds);
   response.setHeader('X-RateLimit-Remaining', approx);
   response.setHeader('Retry-After', windowSeconds);
   ```

---

## 6. FEATURE FLAGS

### Current Status: NO FEATURE FLAG SYSTEM
**Search Result:** 0 files matching `feature|flag|FF_|FEATURE_`

### Implications:

1. **Cannot A/B test** batch features with specific users
2. **Cannot gradually roll out** batch operations
3. **Must deploy to all users** or none

### Recommended Implementation Pattern:

```typescript
// Option 1: Database-backed feature flags
model FeatureFlag {
  id        String   @id @default(cuid())
  name      String   @unique  // "BATCH_OPERATIONS_V2"
  enabled   Boolean  @default(false)
  rollout   Int      @default(0) // 0-100 for gradual rollout
  whitelist Json?    // ["user-123", "user-456"]
  blacklist Json?    // Exclude specific users
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

// Usage in controller:
// if (await this.featureFlagService.isEnabled('BATCH_OPERATIONS_V2', userId)) {
//   return this.batchService.processBatch(request);
// } else {
//   return this.legacyService.processOne(request);
// }
```

---

## CRITICAL ISSUES SUMMARY FOR BATCH OPERATIONS

### 1. SQLite Write Bottleneck (CRITICAL)
- **Issue:** SQLite has single writer, batch operations will queue
- **Impact:** Large batches (1000+ items) will lock database
- **Mitigation:** Chunk into 100-500 item batches, add delays between chunks

### 2. In-Memory Queue Data Loss (HIGH)
- **Issue:** Job state lost on server restart
- **Impact:** Mid-batch crashes lose all progress
- **Mitigation:** Persist `BatchJob` and `BatchJobItem` entities to database

### 3. No Cross-Server Coordination (HIGH)
- **Issue:** Queue is per-process, cannot scale horizontally
- **Impact:** Multiple servers process same batch independently
- **Mitigation:** Use database for job distribution, consider BullMQ later

### 4. No Feature Flags (MEDIUM)
- **Issue:** Cannot control batch rollout
- **Impact:** Must deploy all-or-nothing
- **Mitigation:** Implement feature flag table and service

### 5. Rate Limiting is Per-Endpoint (LOW)
- **Issue:** Cannot have different limits for batch endpoints
- **Impact:** `/api/batch/start` shares limits with other endpoints
- **Mitigation:** Create dedicated rate limit configuration for batch endpoints

---

## RECOMMENDATIONS FOR BATCH OPERATIONS

### Schema Extensions (Prisma migrations needed):

```prisma
model BatchOperation {
  id              String   @id @default(cuid())
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  
  status          String   @default("pending") // pending|processing|completed|failed
  itemCount       Int      // Total items in batch
  processedCount  Int      @default(0)
  failedCount     Int      @default(0)
  
  config          Json     // Batch-specific config
  metadata        Json?    // User-defined metadata
  
  correlationId   String   // For request tracing
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  items           BatchJobItem[]
  
  @@index([userId])
  @@index([status])
  @@index([createdAt])
  @@map("batch_operations")
}

model BatchJobItem {
  id              String   @id @default(cuid())
  batchId         String
  batch           BatchOperation @relation(fields: [batchId], references: [id], onDelete: Cascade)
  
  paperId         String?  // Reference to Paper if applicable
  
  status          String   @default("queued") // queued|processing|success|failed
  error           String?
  attempts        Int      @default(0)
  
  progress        Int      @default(0) // 0-100
  
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([batchId])
  @@index([status])
  @@index([createdAt])
  @@map("batch_job_items")
}

model FeatureFlag {
  id        String   @id @default(cuid())
  name      String   @unique
  enabled   Boolean  @default(false)
  rollout   Int      @default(0) // 0-100
  whitelist Json?    // User IDs to enable for
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@map("feature_flags")
}
```

### Rate Limit Configuration:

```typescript
// In RateLimitingService.CONFIGS
BATCH_OPERATIONS: {
  windowMs: 60 * 60 * 1000,  // 1 hour
  maxRequests: 10,            // 10 batch jobs per hour
  message: 'Batch operation limit exceeded. Please wait.',
},

BATCH_ITEM_PROCESSING: {
  windowMs: 60 * 1000,        // 1 minute
  maxRequests: 500,           // 500 items per minute
  message: 'Item processing rate limit exceeded.',
}
```

### Logging Pattern:

```typescript
// Parent correlation ID for entire batch
const batchCorrelationId = randomUUID();

await runAsyncWithCorrelation(batchCorrelationId, userId, async () => {
  this.logger.log('Batch started', { batchId, itemCount, correlationId: batchCorrelationId });
  
  for (const item of items) {
    this.logger.log('Processing batch item', { 
      batchId, 
      itemId: item.id, 
      correlationId: batchCorrelationId 
    });
  }
  
  this.logger.log('Batch completed', { batchId, processed, failed, correlationId: batchCorrelationId });
});
```

### WebSocket Progress Tracking:

```typescript
// Per-batch progress
const batchProgress: ExtractionProgress = {
  userId,
  stage: 'batch-processing',
  percentage: (processedCount / totalCount) * 100,
  message: `Processing batch: ${processedCount}/${totalCount}`,
  details: {
    liveStats: {
      currentOperation: `Item ${currentIndex} of ${totalCount}`,
      sourcesAnalyzed: processedCount,
      themesIdentified: themesExtracted,
    }
  }
};

this.gateway.emitProgress(batchProgress);
```

---

## File Structure Reference

```
backend/src/
├── common/
│   ├── logger/
│   │   ├── logger.service.ts          [Winston setup]
│   │   └── logger.module.ts           [Global export]
│   ├── middleware/
│   │   └── correlation-id.middleware.ts [UUID + AsyncLocalStorage]
│   └── prisma.service.ts              [Database connection]
├── modules/
│   ├── literature/
│   │   ├── services/
│   │   │   └── pdf-queue.service.ts   [In-memory queue]
│   │   └── gateways/
│   │       └── theme-extraction.gateway.ts [WebSocket gateway]
│   └── rate-limiting/
│       ├── decorators/
│       │   └── rate-limit.decorator.ts [Decorator + configs]
│       ├── guards/
│       │   └── rate-limiting.guard.ts  [Guard implementation]
│       └── services/
│           └── rate-limiting.service.ts [Service logic]
└── app.module.ts                      [Global configuration]

prisma/
└── schema.prisma                      [SQLite schema]
```

