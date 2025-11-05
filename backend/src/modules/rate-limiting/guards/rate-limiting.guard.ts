import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  RateLimitingService,
  RateLimitConfig,
} from '../services/rate-limiting.service';

export const RATE_LIMIT_KEY = 'rateLimit';

@Injectable()
export class RateLimitingGuard implements CanActivate {
  constructor(
    private rateLimitingService: RateLimitingService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const rateLimitConfig = this.reflector.get<RateLimitConfig>(
      RATE_LIMIT_KEY,
      context.getHandler(),
    );

    if (!rateLimitConfig) {
      return true; // No rate limiting configured
    }

    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    // Get identifier (IP address or user ID)
    const identifier = this.getIdentifier(request);
    const endpoint = this.getEndpoint(request);

    try {
      await this.rateLimitingService.checkRateLimit(
        identifier,
        endpoint,
        rateLimitConfig,
      );

      // Add rate limit headers
      this.addRateLimitHeaders(response, rateLimitConfig);

      return true;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Rate limiting error',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private getIdentifier(request: any): string {
    // Try to get user ID first, fallback to IP address
    if (request.user?.userId) {
      return `user:${request.user.userId}`;
    }

    // Get IP address from various sources
    return (
      request.ip ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      request.headers['x-forwarded-for']?.split(',')[0] ||
      'unknown'
    );
  }

  private getEndpoint(request: any): string {
    return `${request.method}:${request.route?.path || request.url}`;
  }

  private addRateLimitHeaders(response: any, config: RateLimitConfig) {
    const windowSeconds = Math.ceil(config.windowMs / 1000);

    response.setHeader('X-RateLimit-Limit', config.maxRequests);
    response.setHeader('X-RateLimit-Window', windowSeconds);
    response.setHeader('X-RateLimit-Remaining', config.maxRequests - 1); // Approximate
    response.setHeader('Retry-After', windowSeconds);
  }
}



