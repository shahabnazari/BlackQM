import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private configService: ConfigService) {
    const databaseUrl = configService.get<string>(
      'DATABASE_URL',
      'file:./dev.db',
    );
    const isProduction = configService.get<string>('NODE_ENV') === 'production';

    // Configure connection pooling and optimization
    super({
      datasources: {
        db: {
          url: databaseUrl,
        },
      },
      log: isProduction ? ['error', 'warn'] : ['query', 'error', 'warn'],
      errorFormat: isProduction ? 'minimal' : 'pretty',
    });

    // Connection pool configuration for PostgreSQL
    if (
      databaseUrl.includes('postgresql://') ||
      databaseUrl.includes('postgres://')
    ) {
      // PostgreSQL connection pooling via connection string parameters
      // Example: postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=30
      this.logger.log('Using PostgreSQL with connection pooling');
    } else if (databaseUrl.includes('file:')) {
      // SQLite doesn't support connection pooling
      this.logger.warn('Using SQLite - connection pooling not available');
      this.logger.warn(
        'For production, please use PostgreSQL with connection pooling',
      );
    }
  }

  async onModuleInit() {
    // Configure connection pool settings
    await this.$connect();

    // Log connection details
    const dbUrl = this.configService.get<string>(
      'DATABASE_URL',
      'file:./dev.db',
    );
    if (dbUrl.includes('postgresql://') || dbUrl.includes('postgres://')) {
      this.logger.log('Database connected with connection pooling enabled');

      // Set pool configuration via raw query for PostgreSQL
      try {
        // These would be set in the connection string, but we can verify them
        const poolStatus = await this.$queryRaw`SELECT 
          current_setting('max_connections') as max_conn,
          count(*) as active_conn 
          FROM pg_stat_activity`;
        this.logger.log(
          `Connection pool status: ${JSON.stringify(poolStatus)}`,
        );
      } catch (error) {
        // SQLite will throw here, which is expected
        if (!dbUrl.includes('file:')) {
          this.logger.warn('Could not query connection pool status');
        }
      }
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Database connection pool closed');
  }

  // Helper method for health checks
  async isHealthy(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      this.logger.error('Database health check failed:', error);
      return false;
    }
  }

  // Helper method to get pool statistics (PostgreSQL only)
  async getPoolStats(): Promise<any> {
    const dbUrl = this.configService.get<string>(
      'DATABASE_URL',
      'file:./dev.db',
    );

    if (dbUrl.includes('postgresql://') || dbUrl.includes('postgres://')) {
      try {
        const stats = (await this.$queryRaw`
          SELECT 
            count(*) as total_connections,
            count(*) FILTER (WHERE state = 'active') as active_connections,
            count(*) FILTER (WHERE state = 'idle') as idle_connections,
            count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction,
            max(EXTRACT(EPOCH FROM (now() - query_start))) as longest_query_seconds
          FROM pg_stat_activity
          WHERE datname = current_database()
        `) as any[];
        return stats[0];
      } catch (error) {
        this.logger.error('Failed to get pool stats:', error);
        return null;
      }
    }

    return {
      message: 'Connection pooling statistics not available for SQLite',
      database_type: 'SQLite',
    };
  }
}





