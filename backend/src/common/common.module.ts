/**
 * Common Module
 * Phase 8.90: Shared services for enterprise patterns
 *
 * Provides:
 * - BulkheadService (resource isolation)
 * - AdaptiveRateLimitService (intelligent throttling)
 * - MetricsService (Prometheus metrics)
 * - DeduplicationService (request deduplication)
 * - TelemetryService (OpenTelemetry tracing)
 *
 * Note: SemanticCacheService is in LiteratureModule (needs EmbeddingOrchestratorService)
 */

import { Module, Global } from '@nestjs/common';
import { MetricsService } from './services/metrics.service';
import { DeduplicationService } from './services/deduplication.service';
import { TelemetryService } from './services/telemetry.service';
import { BulkheadService } from './services/bulkhead.service';
import { AdaptiveRateLimitService } from './services/adaptive-rate-limit.service';
import { PrismaModule } from './prisma.module';

@Global() // Make services available globally without explicit imports
@Module({
  imports: [PrismaModule],
  providers: [
    MetricsService,
    DeduplicationService,
    TelemetryService,
    BulkheadService,
    AdaptiveRateLimitService,
  ],
  exports: [
    MetricsService,
    DeduplicationService,
    TelemetryService,
    BulkheadService,
    AdaptiveRateLimitService,
  ],
})
export class CommonModule {}
