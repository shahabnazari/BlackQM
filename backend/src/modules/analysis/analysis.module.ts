import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QMethodValidatorService } from './qmethod-validator.service';
import { QAnalysisService } from './services/q-analysis.service';
import { FactorExtractionService } from './services/factor-extraction.service';
import { RotationEngineService } from './services/rotation-engine.service';
import { StatisticalOutputService } from './services/statistical-output.service';
import { PQMethodCompatibilityService } from './services/pqmethod-compatibility.service';
import { CacheService } from './services/cache.service';
import { AnalysisLoggerService } from './services/analysis-logger.service';
import { StatisticsService } from './services/statistics.service';
import { AnalysisController } from './controllers/analysis.controller';
import { AnalysisGateway } from './gateways/analysis.gateway';
import { PrismaService } from '../../common/prisma.service';

/**
 * Q-Analytics Engine Module
 * Enterprise-grade implementation of Q-methodology analysis
 * Provides PQMethod-compatible statistical analysis with modern architecture
 *
 * Features:
 * - Multiple factor extraction methods (Centroid, PCA, ML)
 * - Advanced rotation algorithms (Varimax, Quartimax, Promax, Oblimin)
 * - Real-time interactive rotation with preview
 * - PQMethod file format compatibility (≥0.99 correlation)
 * - Bootstrap analysis for confidence intervals
 * - Redis caching for performance optimization
 * - Comprehensive logging and monitoring
 * - WebSocket support for real-time updates
 * - Enterprise-grade error handling and recovery
 */
@Module({
  imports: [ConfigModule],
  controllers: [AnalysisController],
  providers: [
    // Core Analysis Services
    QMethodValidatorService,
    QAnalysisService,
    FactorExtractionService,
    RotationEngineService,
    StatisticalOutputService,
    StatisticsService,
    PQMethodCompatibilityService,

    // Real-time WebSocket Gateway
    AnalysisGateway,

    // Enterprise Features
    CacheService,
    AnalysisLoggerService,

    // Database
    PrismaService,
  ],
  exports: [
    QAnalysisService,
    QMethodValidatorService,
    FactorExtractionService,
    RotationEngineService,
    StatisticalOutputService,
    StatisticsService,
    PQMethodCompatibilityService,
    CacheService,
    AnalysisLoggerService,
  ],
})
export class AnalysisModule {}
