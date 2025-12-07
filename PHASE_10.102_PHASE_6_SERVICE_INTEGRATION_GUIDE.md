# PHASE 10.102 PHASE 6: SERVICE INTEGRATION GUIDE
## How to Add Monitoring to Your Services

**Status**: ✅ COMPLETE INTEGRATION GUIDE
**Date**: December 2, 2025
**Audience**: Backend Developers

---

## 📋 OVERVIEW

This guide shows you EXACTLY how to integrate Phase 6 monitoring into your existing services. Follow these patterns to add:
- ✅ Prometheus metrics (latency, errors, success rate)
- ✅ Structured logging with correlation IDs
- ✅ Performance tracking
- ✅ Business metrics

---

## 🎯 QUICK REFERENCE

### What's Already Done (Zero Code Required)

✅ **HTTP requests automatically tracked** - MetricsInterceptor is active
✅ **Correlation IDs automatically added** - CorrelationIdMiddleware is active
✅ **Metrics endpoints live** - `/metrics`, `/metrics/health`, etc.
✅ **Services available globally** - Inject anywhere

### What You Need to Do

❌ **Add metrics to service methods** - Record business operations
❌ **Add structured logging** - Replace console.log
❌ **Track custom metrics** - Domain-specific measurements

---

## 🔧 PATTERN 1: LITERATURE SEARCH SERVICE

### Step 1: Inject Monitoring Services

**File**: `backend/src/modules/literature/literature.service.ts`

**Add to constructor**:
```typescript
import { Injectable, Logger } from '@nestjs/common';
import { EnhancedMetricsService } from '../../common/monitoring/enhanced-metrics.service';
import { StructuredLoggerService } from '../../common/logger/structured-logger.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LiteratureService {
  private readonly logger: StructuredLoggerService;

  constructor(
    // ... existing dependencies
    private readonly metrics: EnhancedMetricsService,
    structuredLoggerService: StructuredLoggerService,
    private readonly configService: ConfigService,
  ) {
    this.logger = structuredLoggerService.child('LiteratureService');
  }
}
```

### Step 2: Add Metrics to Search Method

**Method**: `searchLiterature()`

**Find this code**:
```typescript
async searchLiterature(searchDto: SearchLiteratureDto, userId: string) {
  // ... existing search logic
}
```

**Wrap with metrics**:
```typescript
async searchLiterature(searchDto: SearchLiteratureDto, userId: string) {
  const startTime = Date.now();
  const cacheHit = false; // Track if cache was used

  try {
    this.logger.info('Literature search initiated', {
      query: searchDto.query,
      sources: searchDto.sources,
      userId,
    });

    // ... existing search logic ...
    const results = await this.performSearch(searchDto, userId);

    // SUCCESS: Record metrics
    const duration = (Date.now() - startTime) / 1000;

    this.metrics.recordLiteratureSearch(
      'MULTI_SOURCE', // or specific source
      duration,
      true, // success
      cacheHit,
    );

    this.logger.info('Literature search completed successfully', {
      query: searchDto.query,
      papersFound: results.papers.length,
      duration,
    });

    return results;

  } catch (error) {
    // FAILURE: Record error metrics
    const duration = (Date.now() - startTime) / 1000;

    this.metrics.recordLiteratureSearch(
      'MULTI_SOURCE',
      duration,
      false, // failed
    );

    this.logger.error('Literature search failed', error as Error, {
      query: searchDto.query,
      userId,
      duration,
    });

    throw error;
  }
}
```

### Step 3: Add Source-Specific Metrics

**For each source API call**:
```typescript
async searchSemanticScholar(query: string) {
  const startTime = Date.now();

  try {
    const results = await this.httpService.get(url).toPromise();
    const duration = (Date.now() - startTime) / 1000;

    // Record successful API call
    this.metrics.recordLiteratureSearch(
      'SEMANTIC_SCHOLAR',
      duration,
      true,
    );

    // Update source availability
    this.metrics.updateSourceAvailability('SEMANTIC_SCHOLAR', 1.0);

    return results.data;

  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;

    // Record failed API call
    this.metrics.recordLiteratureSearch(
      'SEMANTIC_SCHOLAR',
      duration,
      false,
    );

    // Update source availability (degraded)
    this.metrics.updateSourceAvailability('SEMANTIC_SCHOLAR', 0.0);

    throw error;
  }
}
```

---

## 🔧 PATTERN 2: THEME EXTRACTION SERVICE

### Step 1: Inject Monitoring Services

**File**: `backend/src/modules/literature/services/unified-theme-extraction.service.ts`

```typescript
import { EnhancedMetricsService } from '../../../common/monitoring/enhanced-metrics.service';
import { StructuredLoggerService } from '../../../common/logger/structured-logger.service';

@Injectable()
export class UnifiedThemeExtractionService {
  private readonly logger: StructuredLoggerService;

  constructor(
    // ... existing dependencies
    private readonly metrics: EnhancedMetricsService,
    structuredLoggerService: StructuredLoggerService,
  ) {
    this.logger = structuredLoggerService.child('UnifiedThemeExtractionService');
  }
}
```

### Step 2: Add Metrics to Extraction Method

**Method**: `extractThemes()`

```typescript
async extractThemes(
  paperIds: string[],
  extractionMode: string,
  purpose: string
): Promise<Theme[]> {
  const startTime = Date.now();
  const paperCount = paperIds.length;

  try {
    this.logger.info('Theme extraction started', {
      paperCount,
      extractionMode,
      purpose,
    });

    // ... existing extraction logic ...
    const themes = await this.performExtraction(paperIds, extractionMode);

    // SUCCESS: Record metrics
    const duration = (Date.now() - startTime) / 1000;

    this.metrics.recordThemeExtraction(
      paperCount,
      extractionMode,
      duration,
      true, // success
    );

    // Record theme quality if available
    if (themes.length > 0) {
      const avgQuality = themes.reduce((sum, t) => sum + t.confidence, 0) / themes.length;
      this.metrics.recordThemeQuality(extractionMode, avgQuality);
    }

    this.logger.info('Theme extraction completed', {
      paperCount,
      themesExtracted: themes.length,
      duration,
    });

    return themes;

  } catch (error) {
    // FAILURE: Record error metrics
    const duration = (Date.now() - startTime) / 1000;

    this.metrics.recordThemeExtraction(
      paperCount,
      extractionMode,
      duration,
      false, // failed
    );

    this.metrics.recordThemeExtractionError(
      error.name || 'UnknownError',
      'extraction', // stage
    );

    this.logger.error('Theme extraction failed', error as Error, {
      paperCount,
      extractionMode,
      duration,
    });

    throw error;
  }
}
```

### Step 3: Track AI API Costs

**For each AI API call**:
```typescript
async callOpenAI(prompt: string): Promise<string> {
  const startTime = Date.now();
  const model = 'gpt-4';

  try {
    const response = await openai.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
    });

    const duration = (Date.now() - startTime) / 1000;

    // Calculate cost (example: $0.03 per 1K tokens for GPT-4)
    const tokens = response.usage.total_tokens;
    const cost = (tokens / 1000) * 0.03;

    // Record metrics
    this.metrics.recordAIApiCall(
      'openai',
      'chat_completion',
      model,
      duration,
      true, // success
      cost, // track spending!
    );

    return response.choices[0].message.content;

  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;

    this.metrics.recordAIApiCall(
      'openai',
      'chat_completion',
      model,
      duration,
      false, // failed
    );

    throw error;
  }
}
```

---

## 🔧 PATTERN 3: DATABASE OPERATIONS

### Track Query Performance

```typescript
async savePaper(paper: Paper): Promise<void> {
  const startTime = Date.now();

  try {
    await this.prisma.paper.create({ data: paper });

    const duration = (Date.now() - startTime) / 1000;

    this.metrics.recordDbQuery(
      'create',
      'paper',
      duration,
    );

  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;

    this.metrics.recordDbQuery(
      'create',
      'paper',
      duration,
      error, // Pass error to track failures
    );

    throw error;
  }
}
```

---

## 🔧 PATTERN 4: CACHE OPERATIONS

### Track Cache Hit/Miss

```typescript
async getCachedData(key: string): Promise<Data | null> {
  const startTime = Date.now();

  try {
    const cached = await this.cache.get(key);
    const duration = (Date.now() - startTime) / 1000;

    this.metrics.recordCacheOperation(
      'get',
      'redis',
      duration,
    );

    if (cached) {
      this.logger.logCacheOperation('hit', key, duration * 1000);
      return cached;
    } else {
      this.logger.logCacheOperation('miss', key, duration * 1000);
      return null;
    }

  } catch (error) {
    const duration = (Date.now() - startTime) / 1000;

    this.metrics.recordCacheOperation(
      'get',
      'redis',
      duration,
      error,
    );

    throw error;
  }
}

// Update cache hit rate periodically
updateCacheHitRate() {
  const hits = this.cache.getStats().hits;
  const misses = this.cache.getStats().misses;
  const total = hits + misses;
  const hitRate = total > 0 ? hits / total : 0;

  this.metrics.updateCacheHitRate('redis', hitRate);
}
```

---

## 🔧 PATTERN 5: BUSINESS METRICS

### Track Business KPIs

```typescript
// After successful search
async onSearchComplete(results: Paper[]) {
  // Track average papers per search
  this.metrics.updateAvgPapersPerSearch(results.length);

  // Track search success rate
  const successRate = this.calculateSuccessRate();
  this.metrics.updateSearchSuccessRate(successRate);

  // Log business event
  this.logger.logBusinessEvent('search_completed', {
    papersFound: results.length,
    sources: results.map(p => p.source),
  });
}
```

---

## 🔧 PATTERN 6: WEBSOCKET CONNECTIONS

### Track Real-Time Connections

```typescript
@WebSocketGateway()
export class LiteratureGateway {
  constructor(private readonly metrics: EnhancedMetricsService) {}

  @SubscribeMessage('join')
  handleConnection(client: Socket) {
    this.metrics.incrementWebSocketConnection('connect');

    this.logger.info('Client connected', {
      clientId: client.id,
    });
  }

  @SubscribeMessage('disconnect')
  handleDisconnect(client: Socket) {
    this.metrics.incrementWebSocketConnection('disconnect');

    this.logger.info('Client disconnected', {
      clientId: client.id,
    });
  }
}
```

---

## 📊 AVAILABLE METRICS METHODS

### Latency Metrics

```typescript
metrics.recordHttpRequest(method, route, statusCode, durationSeconds)
metrics.recordLiteratureSearch(source, durationSeconds, success, cacheHit)
metrics.recordThemeExtraction(paperCount, mode, durationSeconds, success)
metrics.recordDbQuery(operation, table, durationSeconds, error?)
metrics.recordAIApiCall(provider, operation, model, durationSeconds, success, cost?)
metrics.recordCacheOperation(operation, cacheType, durationSeconds, error?)
```

### Traffic Metrics

```typescript
metrics.incrementWebSocketConnection(eventType) // 'connect' | 'disconnect' | 'error'
```

### Error Metrics

```typescript
metrics.recordValidationError(field, errorType)
metrics.recordThemeExtractionError(errorType, stage)
```

### Saturation Metrics

```typescript
metrics.setQueueSize(queueName, size)
metrics.setActiveConcurrentSearches(count)
metrics.setDbConnectionPool(active, idle, waiting)
```

### Business Metrics

```typescript
metrics.updateCacheHitRate(cacheType, hitRate)
metrics.updateSourceAvailability(source, availability)
metrics.recordThemeQuality(extractionMode, score)
metrics.updateSearchSuccessRate(rate)
metrics.updateAvgPapersPerSearch(avg)
```

### SLO Metrics

```typescript
metrics.updateSLO(availability, latencyP95, errorRate)
```

---

## 📖 AVAILABLE LOGGING METHODS

### Basic Logging

```typescript
logger.debug(message, metadata?)
logger.info(message, metadata?)
logger.warn(message, metadata?)
logger.error(message, error?, metadata?)
logger.critical(message, error?, metadata?) // Triggers alerts
```

### Performance Logging

```typescript
const timingId = logger.startTiming('operation-name')
// ... do work ...
logger.endTiming(timingId, metadata?) // Logs duration automatically

// Or use automatic timing:
const result = await logger.logOperation(
  'operation-name',
  async () => {
    return await doWork();
  },
  metadata?
)
```

### Structured Event Logging

```typescript
logger.logHttpRequest(method, url, statusCode, duration, metadata?)
logger.logDbQuery(operation, table, duration, rowsAffected?, error?)
logger.logApiCall(provider, endpoint, duration, success, metadata?)
logger.logCacheOperation(operation, key, duration?)
logger.logBusinessEvent(eventType, eventData)
logger.logSecurityEvent(eventType, severity, metadata?)
```

---

## ✅ INTEGRATION CHECKLIST

For each service you integrate:

### Before Integration
- [ ] Service has clear method boundaries
- [ ] Understand success/failure paths
- [ ] Know what to measure (latency, count, errors)

### During Integration
- [ ] Inject EnhancedMetricsService
- [ ] Inject StructuredLoggerService
- [ ] Create child logger with service name
- [ ] Wrap critical methods with try/catch
- [ ] Record metrics on success
- [ ] Record error metrics on failure
- [ ] Add structured logging
- [ ] Track business KPIs if applicable

### After Integration
- [ ] Test with real operations
- [ ] Verify metrics appear in `/metrics`
- [ ] Check Grafana dashboard shows data
- [ ] Verify correlation IDs in logs
- [ ] Test error scenarios
- [ ] Update service tests

---

## 🚀 QUICK START EXAMPLE

**Minimal integration** (30 seconds):

```typescript
@Injectable()
export class MyService {
  private readonly logger: StructuredLoggerService;

  constructor(
    private readonly metrics: EnhancedMetricsService,
    structuredLoggerService: StructuredLoggerService,
  ) {
    this.logger = structuredLoggerService.child('MyService');
  }

  async doSomething() {
    return this.logger.logOperation('do-something', async () => {
      // Your existing code here
      return await this.performWork();
    });
    // Automatically logs timing, catches errors, records metrics
  }
}
```

---

## 🐛 TROUBLESHOOTING

### "Cannot inject EnhancedMetricsService"

**Cause**: MonitoringModule not imported

**Fix**: Already done! It's global. Just inject it.

### "Correlation IDs not appearing"

**Cause**: Not using StructuredLoggerService

**Fix**: Replace `console.log` with `this.logger.info()`

### "Metrics not showing in Grafana"

**Cause**: Need to generate traffic

**Fix**: Make some API calls, wait 10-30 seconds

### "TypeScript errors after adding imports"

**Cause**: Circular dependency

**Fix**: Use `forwardRef` or restructure dependencies

---

## 📈 EXPECTED OUTCOMES

After integrating monitoring:

### You'll See
- ✅ Real-time latency graphs
- ✅ Success/failure rates
- ✅ Source availability trends
- ✅ Cache hit rates
- ✅ Cost tracking (AI APIs)
- ✅ Structured logs with correlation IDs

### You'll Know
- 🎯 Which operations are slow
- 🎯 Which sources are failing
- 🎯 When to scale up
- 🎯 What errors are occurring
- 🎯 How much you're spending

### You'll Get
- 🚨 Automatic alerts for issues
- 📊 Business insights
- 🔍 Easy debugging with correlation IDs
- 📈 Performance trends over time

---

## 🎓 BEST PRACTICES

1. **Always use try/catch**: Record both success and failure
2. **Track duration**: Use `Date.now()` at start, calculate at end
3. **Use child loggers**: `structuredLoggerService.child('MyService')`
4. **Log the "why"**: Include context in metadata
5. **Don't log sensitive data**: No passwords, tokens, PII
6. **Track business metrics**: Not just technical metrics
7. **Use correlation IDs**: They're automatic, just use structured logger
8. **Test your metrics**: Generate traffic, verify in Grafana

---

**Integration Status**: ✅ READY TO INTEGRATE
**Estimated Time per Service**: 30 minutes - 2 hours
**Required Reading**: This guide
**Support**: See audit report for troubleshooting

---

*Last Updated: December 2, 2025*
*Next Step: Integrate your first service!*
