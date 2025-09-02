import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
}

@Injectable()
export class RateLimitingService {
  constructor(private prisma: PrismaService) {}

  async checkRateLimit(
    identifier: string,
    endpoint: string,
    config: RateLimitConfig,
  ): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    // Clean up old entries
    await this.prisma.rateLimit.deleteMany({
      where: {
        windowStart: {
          lt: windowStart,
        },
      },
    });

    // Find or create current window entry
    const existingEntry = await this.prisma.rateLimit.findUnique({
      where: {
        identifier_endpoint_windowStart: {
          identifier,
          endpoint,
          windowStart,
        },
      },
    });

    if (existingEntry) {
      if (existingEntry.count >= config.maxRequests) {
        throw new HttpException(
          config.message || 'Too many requests',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Increment counter
      await this.prisma.rateLimit.update({
        where: { id: existingEntry.id },
        data: { count: existingEntry.count + 1 },
      });
    } else {
      // Create new entry
      await this.prisma.rateLimit.create({
        data: {
          identifier,
          endpoint,
          count: 1,
          windowStart,
        },
      });
    }
  }

  // Predefined rate limit configurations
  static readonly CONFIGS = {
    // General API endpoints
    GENERAL: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 100,
      message: 'Too many requests. Please try again later.',
    },
    
    // Authentication endpoints
    AUTH: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 5,
      message: 'Too many authentication attempts. Please try again in 15 minutes.',
    },
    
    // File upload endpoints
    FILE_UPLOAD: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 10,
      message: 'File upload limit exceeded. Please try again in an hour.',
    },
    
    // Participant session creation
    PARTICIPANT_SESSION: {
      windowMs: 5 * 60 * 1000, // 5 minutes
      maxRequests: 1,
      message: 'Session creation rate limited. Please wait 5 minutes.',
    },
    
    // Data export endpoints
    EXPORT: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 20,
      message: 'Export limit exceeded. Please try again in an hour.',
    },
    
    // Survey creation
    SURVEY_CREATION: {
      windowMs: 24 * 60 * 60 * 1000, // 24 hours
      maxRequests: 50,
      message: 'Survey creation limit exceeded. Please try again tomorrow.',
    },
    
    // Real-time features (chat, presence)
    REALTIME: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 30,
      message: 'Real-time feature rate limited. Please slow down.',
    },
    
    // Password reset
    PASSWORD_RESET: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 3,
      message: 'Password reset limit exceeded. Please try again in an hour.',
    },
    
    // Email sending
    EMAIL_SENDING: {
      windowMs: 60 * 60 * 1000, // 1 hour
      maxRequests: 100,
      message: 'Email sending limit exceeded. Please try again in an hour.',
    },
    
    // Search and query endpoints
    SEARCH: {
      windowMs: 60 * 1000, // 1 minute
      maxRequests: 200,
      message: 'Search rate limited. Please slow down your queries.',
    },
  };
}
