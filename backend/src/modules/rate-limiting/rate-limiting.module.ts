import { Module } from '@nestjs/common';
import { RateLimitingService } from './services/rate-limiting.service';
import { RateLimitingGuard } from './guards/rate-limiting.guard';
import { PrismaService } from '../../common/prisma.service';

@Module({
  providers: [RateLimitingService, RateLimitingGuard, PrismaService],
  exports: [RateLimitingService, RateLimitingGuard],
})
export class RateLimitingModule {}
