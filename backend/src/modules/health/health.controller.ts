import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma.service';
import { CacheService } from '../../common/cache.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private prismaService: PrismaService,
    private cacheService: CacheService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Basic health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async checkHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
    };
  }

  @Get('database')
  @ApiOperation({ summary: 'Database health check with connection pool stats' })
  @ApiResponse({ status: 200, description: 'Database is healthy' })
  @ApiResponse({ status: 503, description: 'Database is unhealthy' })
  async checkDatabaseHealth() {
    const isHealthy = await this.prismaService.isHealthy();
    const poolStats = await this.prismaService.getPoolStats();

    const response = {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: {
        connected: isHealthy,
        type: process.env.DATABASE_URL?.includes('postgres')
          ? 'PostgreSQL'
          : 'SQLite',
        poolStats: poolStats,
      },
    };

    if (!isHealthy) {
      throw new Error('Database health check failed');
    }

    return response;
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed system health check' })
  @ApiResponse({ status: 200, description: 'All systems operational' })
  async checkDetailedHealth() {
    const dbHealthy = await this.prismaService.isHealthy();
    const poolStats = await this.prismaService.getPoolStats();
    const cacheStats = this.cacheService.getStats();

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024,
        unit: 'MB',
      },
      database: {
        status: dbHealthy ? 'connected' : 'disconnected',
        type: process.env.DATABASE_URL?.includes('postgres')
          ? 'PostgreSQL'
          : 'SQLite',
        connectionPool: poolStats,
      },
      cache: {
        status: 'operational',
        type: 'NodeCache (in-memory)',
        ...cacheStats,
      },
      services: {
        api: 'operational',
        database: dbHealthy ? 'operational' : 'degraded',
        cache: 'operational',
        fileUpload:
          process.env.ENABLE_VIRUS_SCANNING === 'false'
            ? 'limited'
            : 'operational',
        monitoring: process.env.SENTRY_DSN ? 'enabled' : 'disabled',
      },
    };
  }

  @Get('ready')
  @ApiOperation({
    summary: 'Readiness probe for Kubernetes/production deployments',
  })
  @ApiResponse({
    status: 200,
    description: 'Service is ready to accept traffic',
  })
  @ApiResponse({ status: 503, description: 'Service is not ready' })
  async checkReadiness() {
    const dbHealthy = await this.prismaService.isHealthy();

    if (!dbHealthy) {
      return {
        status: 'not_ready',
        reason: 'database_unavailable',
        timestamp: new Date().toISOString(),
      };
    }

    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: 'ok',
        cache: 'ok',
        api: 'ok',
      },
    };
  }

  @Get('live')
  @ApiOperation({
    summary: 'Liveness probe for Kubernetes/production deployments',
  })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async checkLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
