/**
 * PHASE 10.102 PHASE 4: REDIS MODULE
 * Netflix-Grade Distributed Caching Module
 */

import { Module, Global } from '@nestjs/common';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
