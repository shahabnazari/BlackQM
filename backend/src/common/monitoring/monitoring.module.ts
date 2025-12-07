/**
 * PHASE 10.102 PHASE 6: MONITORING MODULE
 * Central module for all monitoring and observability services
 *
 * Provides:
 * - EnhancedMetricsService (Prometheus Golden Signals)
 * - StructuredLoggerService (JSON logging with correlation IDs)
 * - MetricsInterceptor (Automatic HTTP tracking)
 *
 * This module is imported globally to make monitoring services available
 * throughout the application without explicit imports in feature modules.
 */

import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EnhancedMetricsService } from './enhanced-metrics.service';
import { MetricsService } from './metrics.service';
import { StructuredLoggerService } from '../logger/structured-logger.service';
import { MetricsInterceptor } from '../interceptors/metrics.interceptor';
import { EnhancedMetricsController } from '../../controllers/enhanced-metrics.controller';
// Import existing services that monitoring depends on
import { PrismaService } from '../prisma.service';
import { CacheService } from '../cache.service';

/**
 * Global Monitoring Module
 * Registered once in AppModule, available everywhere
 */
@Global()
@Module({
  imports: [ConfigModule],
  controllers: [EnhancedMetricsController],
  providers: [
    EnhancedMetricsService,
    MetricsService,
    StructuredLoggerService,
    MetricsInterceptor,
    // Provide dependencies for EnhancedMetricsController
    PrismaService,
    CacheService,
  ],
  exports: [
    EnhancedMetricsService,
    MetricsService,
    StructuredLoggerService,
    MetricsInterceptor,
  ],
})
export class MonitoringModule {}
