/**
 * Token Validation Utilities
 * Phase 10.92 Day 18 Stage 1
 *
 * Enterprise-grade JWT token validation and health checking
 * Following security best practices and RFC 7519 (JWT spec)
 */

import type {
  TokenHealth,
  TokenPayload,
  TokenWarning,
  TokenError,
} from '../types/auth-diagnostics';

const EXPIRATION_WARNING_THRESHOLD = 300; // 5 minutes in seconds
const MINIMUM_TOKEN_LENGTH = 100;
const EXPECTED_JWT_PARTS = 3;

/**
 * Validates and analyzes JWT token health
 * Pure function with no side effects
 *
 * @param token - JWT token string to validate
 * @returns TokenHealth object with comprehensive diagnostics
 */
export function validateToken(token: string | null): TokenHealth {
  const warnings: TokenWarning[] = [];
  const errors: TokenError[] = [];

  // Early return for missing token
  if (!token) {
    errors.push({
      code: 'MISSING_EXP',
      message: 'No token provided',
      timestamp: new Date(),
    });

    return {
      isValid: false,
      isExpired: true,
      expiresIn: 0,
      expiresAt: null,
      issuedAt: null,
      payload: null,
      structure: {
        isValidJWT: false,
        parts: 0,
        length: 0,
      },
      warnings,
      errors,
    };
  }

  // Validate JWT structure
  const parts = token.split('.');
  const structure = {
    isValidJWT: parts.length === EXPECTED_JWT_PARTS,
    parts: parts.length,
    length: token.length,
  };

  if (!structure.isValidJWT) {
    errors.push({
      code: 'INVALID_FORMAT',
      message: `Invalid JWT structure: expected ${EXPECTED_JWT_PARTS} parts, got ${parts.length}`,
      details: `Token parts: ${parts.length}`,
      timestamp: new Date(),
    });
  }

  if (token.length < MINIMUM_TOKEN_LENGTH) {
    warnings.push({
      code: 'SHORT_LIFETIME',
      message: `Token length (${token.length}) is shorter than expected (${MINIMUM_TOKEN_LENGTH})`,
      severity: 'high',
      timestamp: new Date(),
    });
  }

  // Decode payload
  let payload: TokenPayload | null = null;
  let expiresAt: Date | null = null;
  let issuedAt: Date | null = null;

  try {
    if (parts.length >= 2) {
      const payloadBase64 = parts[1];
      if (!payloadBase64) {
        throw new Error('Payload part is empty');
      }

      const decodedPayload = atob(payloadBase64);
      payload = JSON.parse(decodedPayload) as TokenPayload;

      // Validate required claims
      if (!payload.sub) {
        warnings.push({
          code: 'MISSING_CLAIMS',
          message: 'Token missing subject (sub) claim',
          severity: 'medium',
          timestamp: new Date(),
        });
      }

      if (!payload.exp) {
        errors.push({
          code: 'MISSING_EXP',
          message: 'Token missing expiration (exp) claim',
          timestamp: new Date(),
        });
      }

      // Parse timestamps
      if (payload.exp) {
        expiresAt = new Date(payload.exp * 1000);
      }
      if (payload.iat) {
        issuedAt = new Date(payload.iat * 1000);
      }
    }
  } catch (error) {
    errors.push({
      code: 'DECODE_FAILED',
      message: 'Failed to decode token payload',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    });
  }

  // Calculate expiration
  const now = Math.floor(Date.now() / 1000);
  const expiresIn = payload?.exp ? payload.exp - now : 0;
  const isExpired = expiresIn <= 0;

  if (isExpired && payload?.exp) {
    errors.push({
      code: 'EXPIRED',
      message: `Token expired ${Math.abs(expiresIn)} seconds ago`,
      details: `Expiration: ${expiresAt?.toISOString()}`,
      timestamp: new Date(),
    });
  }

  // Check for expiration warning
  if (
    !isExpired &&
    expiresIn > 0 &&
    expiresIn < EXPIRATION_WARNING_THRESHOLD &&
    payload?.exp
  ) {
    warnings.push({
      code: 'EXPIRES_SOON',
      message: `Token expires in ${expiresIn} seconds`,
      severity: expiresIn < 60 ? 'high' : 'medium',
      timestamp: new Date(),
    });
  }

  // Check token lifetime
  if (payload?.iat && payload?.exp) {
    const lifetimeSeconds = payload.exp - payload.iat;
    const lifetimeHours = lifetimeSeconds / 3600;

    if (lifetimeHours < 1) {
      warnings.push({
        code: 'SHORT_LIFETIME',
        message: `Token has short lifetime: ${lifetimeHours.toFixed(2)} hours`,
        severity: 'low',
        timestamp: new Date(),
      });
    }
  }

  const isValid =
    structure.isValidJWT &&
    !isExpired &&
    errors.length === 0 &&
    payload !== null;

  return {
    isValid,
    isExpired,
    expiresIn,
    expiresAt,
    issuedAt,
    payload,
    structure,
    warnings,
    errors,
  };
}

/**
 * Extracts token from various storage locations
 * Follows security best practices for token retrieval
 *
 * @returns Token string or null if not found
 */
export function getStoredToken(): {
  token: string | null;
  source: 'localStorage' | 'sessionStorage' | 'none';
} {
  if (typeof window === 'undefined') {
    return { token: null, source: 'none' };
  }

  // Check localStorage first
  const localToken = localStorage.getItem('access_token');
  if (localToken) {
    return { token: localToken, source: 'localStorage' };
  }

  // Check sessionStorage as fallback
  const sessionToken = sessionStorage.getItem('access_token');
  if (sessionToken) {
    return { token: sessionToken, source: 'sessionStorage' };
  }

  return { token: null, source: 'none' };
}

/**
 * Formats expiration time in human-readable format
 *
 * @param seconds - Seconds until expiration
 * @returns Human-readable string
 */
export function formatExpirationTime(seconds: number): string {
  if (seconds <= 0) {
    return `Expired ${Math.abs(seconds)} seconds ago`;
  }

  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days !== 1 ? 's' : ''} ${hours % 24} hour${hours % 24 !== 1 ? 's' : ''}`;
  }

  if (hours > 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''} ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
  }

  if (minutes > 0) {
    return `${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds % 60} second${seconds % 60 !== 1 ? 's' : ''}`;
  }

  return `${seconds} second${seconds !== 1 ? 's' : ''}`;
}

/**
 * Calculates token health score (0-100)
 * Based on validity, expiration, and warnings
 *
 * @param health - TokenHealth object
 * @returns Score from 0 (critical) to 100 (perfect)
 */
export function calculateTokenScore(health: TokenHealth): number {
  let score = 100;

  // Critical issues
  if (!health.isValid) score -= 100;
  if (health.isExpired) score -= 100;

  // Errors
  score -= health.errors.length * 25;

  // Warnings
  health.warnings.forEach(warning => {
    if (warning.severity === 'high') score -= 15;
    if (warning.severity === 'medium') score -= 10;
    if (warning.severity === 'low') score -= 5;
  });

  // Expiration proximity
  if (health.expiresIn > 0 && health.expiresIn < 300) {
    score -= 10; // Expires in less than 5 minutes
  }

  return Math.max(0, Math.min(100, score));
}
