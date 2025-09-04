import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get('THROTTLE_TTL', 60000), // 60 seconds
          limit: config.get('THROTTLE_LIMIT', 10), // 10 requests per TTL
        },
      ],
    }),
  ],
  exports: [ThrottlerModule],
})
export class RateLimitingModule {}