import { SetMetadata } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';

export interface RateLimitOptions {
  ttl: number; // Time window in seconds
  limit: number; // Number of requests allowed in the time window
}

// File upload specific rate limits
export const FileUploadRateLimit = () =>
  Throttle({ default: { ttl: 60000, limit: 5 } }); // 5 uploads per minute

// Authentication rate limits
export const AuthRateLimit = () =>
  Throttle({ default: { ttl: 60000, limit: 10 } }); // 10 attempts per minute

// General API rate limits
export const ApiRateLimit = () =>
  Throttle({ default: { ttl: 60000, limit: 60 } }); // 60 requests per minute

// Custom rate limit
export const CustomRateLimit = (ttl: number, limit: number) =>
  Throttle({ default: { ttl: ttl * 1000, limit } });
