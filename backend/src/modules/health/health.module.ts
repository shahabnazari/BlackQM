import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { ConfigModule } from '@nestjs/config';
import { CacheService } from '../../common/cache.service';

@Module({
  imports: [ConfigModule],
  controllers: [HealthController],
  providers: [CacheService],
})
export class HealthModule {}
