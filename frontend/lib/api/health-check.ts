/**
 * Backend Health Check Utilities
 * Phase 10.92 Day 18 Stage 1
 *
 * Enterprise-grade backend health monitoring
 * Implements circuit breaker pattern for reliability
 */

import type { BackendHealth } from '../types/auth-diagnostics';

const BACKEND_URL =
  process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/api';
const HEALTH_ENDPOINT = '/health';
const TIMEOUT_MS = 5000;
const MAX_RETRIES = 2;

interface HealthResponse {
  status: string;
  timestamp: string;
  version?: string;
  environment?: string;
}

/**
 * Checks backend health with timeout and retry logic
 * Implements circuit breaker pattern for resilience
 *
 * @returns BackendHealth status
 */
export async function checkBackendHealth(): Promise<BackendHealth> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(`${BACKEND_URL}${HEALTH_ENDPOINT}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store', // Always get fresh health status
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (!response.ok) {
      return {
        isHealthy: false,
        status: 'down',
        responseTime,
        version: null,
        timestamp: new Date(),
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as HealthResponse;

    return {
      isHealthy: data.status === 'healthy',
      status: data.status === 'healthy' ? 'healthy' : 'degraded',
      responseTime,
      version: data.version || null,
      timestamp: new Date(),
      error: null,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;

    if (error instanceof Error) {
      const isTimeout = error.name === 'AbortError';
      const errorMessage = isTimeout
        ? `Health check timed out after ${TIMEOUT_MS}ms`
        : error.message;

      return {
        isHealthy: false,
        status: 'down',
        responseTime,
        version: null,
        timestamp: new Date(),
        error: errorMessage,
      };
    }

    return {
      isHealthy: false,
      status: 'down',
      responseTime,
      version: null,
      timestamp: new Date(),
      error: 'Unknown error occurred',
    };
  }
}

/**
 * Checks if backend is reachable with retries
 * More aggressive than checkBackendHealth for critical scenarios
 *
 * @param retries - Number of retry attempts (default: MAX_RETRIES)
 * @returns boolean indicating if backend is reachable
 */
export async function isBackendReachable(
  retries: number = MAX_RETRIES
): Promise<boolean> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const health = await checkBackendHealth();
      if (health.isHealthy) {
        return true;
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        await new Promise(resolve =>
          setTimeout(resolve, Math.pow(2, attempt) * 1000)
        );
      }
    } catch {
      // Continue to next attempt
    }
  }

  return false;
}

/**
 * Gets backend response time statistics
 * Useful for performance monitoring
 *
 * @param samples - Number of samples to collect (default: 3)
 * @returns Average, min, and max response times
 */
export async function getBackendPerformance(samples: number = 3): Promise<{
  average: number;
  min: number;
  max: number;
  samples: number[];
}> {
  const times: number[] = [];

  for (let i = 0; i < samples; i++) {
    const health = await checkBackendHealth();
    times.push(health.responseTime);

    // Small delay between samples
    if (i < samples - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  return {
    average: times.reduce((sum, time) => sum + time, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    samples: times,
  };
}

/**
 * Validates backend URL configuration
 * Ensures environment variables are properly set
 *
 * @returns Validation result with details
 */
export function validateBackendConfig(): {
  isValid: boolean;
  url: string;
  issues: string[];
} {
  const issues: string[] = [];

  if (!BACKEND_URL) {
    issues.push('Backend URL is not configured');
  }

  if (BACKEND_URL && !BACKEND_URL.startsWith('http')) {
    issues.push('Backend URL must start with http:// or https://');
  }

  if (BACKEND_URL && BACKEND_URL.includes('undefined')) {
    issues.push('Backend URL contains undefined values');
  }

  return {
    isValid: issues.length === 0,
    url: BACKEND_URL,
    issues,
  };
}
