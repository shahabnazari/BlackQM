/**
 * Common Module
 * Phase 8.90: Shared services for enterprise patterns
 *
 * STATUS: PRIORITY 2 IMPLEMENTED + Phase 10.102 Phase 3 IMPLEMENTED
 * Phase 10.101 Task 3 - Phase 9 is complete (ThemeDatabaseService)
 * Phase 8.90 Priority 2 - SemanticCacheService IMPLEMENTED
 * Phase 10.102 Phase 3 - BulkheadService & RetryService IMPLEMENTED
 *
 * Implemented services:
 * - SemanticCacheService (Phase 8.90 Priority 2) - Vector-based semantic caching
 * - BulkheadService (Phase 10.102 Phase 3) - Multi-tenant resource isolation
 * - RetryService (Phase 10.102 Phase 3) - Exponential backoff retry logic
 *
 * Pending services (Phase 8.91):
 * - AdaptiveRateLimitService (intelligent throttling)
 * - MetricsService (Prometheus metrics)
 * - DeduplicationService (request deduplication)
 * - TelemetryService (OpenTelemetry tracing)
 */

import { Module, Global } from '@nestjs/common';
import { SemanticCacheService } from './services/semantic-cache.service';
// Phase 10.102 Phase 3: Error handling & Bulkhead Pattern
import { BulkheadService } from './services/bulkhead.service';
import { RetryService } from './services/retry.service';
// Phase 8.91: Services NOT YET IMPLEMENTED - commented out to prevent build errors
// import { MetricsService } from './services/metrics.service';
// import { DeduplicationService } from './services/deduplication.service';
// import { TelemetryService } from './services/telemetry.service';
// import { AdaptiveRateLimitService } from './services/adaptive-rate-limit.service';
import { PrismaModule } from './prisma.module';

@Global() // Make services available globally without explicit imports
@Module({
  imports: [PrismaModule],
  providers: [
    // Phase 8.90 Priority 2: Semantic Caching
    SemanticCacheService,
    // Phase 10.102 Phase 3: Error Handling & Bulkhead Pattern
    BulkheadService,
    RetryService,
    // Phase 8.91: Services NOT YET IMPLEMENTED
    // MetricsService,
    // DeduplicationService,
    // TelemetryService,
    // AdaptiveRateLimitService,
  ],
  exports: [
    // Phase 8.90 Priority 2: Semantic Caching
    SemanticCacheService,
    // Phase 10.102 Phase 3: Error Handling & Bulkhead Pattern
    BulkheadService,
    RetryService,
    // Phase 8.91: Services NOT YET IMPLEMENTED
    // MetricsService,
    // DeduplicationService,
    // TelemetryService,
    // AdaptiveRateLimitService,
  ],
})
export class CommonModule {}
