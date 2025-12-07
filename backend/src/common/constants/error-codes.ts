/**
 * Standardized Error Codes - Phase 10.943
 *
 * Enterprise-grade error code system for consistent error tracking,
 * monitoring, and debugging across the entire application.
 *
 * Format: {DOMAIN}{NUMBER}
 * - LIT: Literature/Search module
 * - THEME: Theme extraction
 * - WS: WebSocket
 * - AUTH: Authentication
 * - VAL: Validation
 * - DB: Database
 * - EXT: External services
 * - SYS: System/Internal
 */

export const ErrorCodes = {
  // Literature/Search Module (LIT001-LIT099)
  LIT001: { code: 'LIT001', message: 'Search failed - general error', severity: 'error' },
  LIT002: { code: 'LIT002', message: 'Source timeout', severity: 'warn' },
  LIT003: { code: 'LIT003', message: 'Rate limited by source', severity: 'warn' },
  LIT004: { code: 'LIT004', message: 'Invalid search query', severity: 'error' },
  LIT005: { code: 'LIT005', message: 'No results found', severity: 'info' },
  LIT006: { code: 'LIT006', message: 'Source unavailable', severity: 'warn' },
  LIT007: { code: 'LIT007', message: 'Paper fetch failed', severity: 'error' },
  LIT008: { code: 'LIT008', message: 'PDF download failed', severity: 'warn' },
  LIT009: { code: 'LIT009', message: 'Full-text extraction failed', severity: 'warn' },
  LIT010: { code: 'LIT010', message: 'Deduplication error', severity: 'error' },

  // Theme Extraction Module (THEME001-THEME099)
  THEME001: { code: 'THEME001', message: 'Theme extraction failed', severity: 'error' },
  THEME002: { code: 'THEME002', message: 'Full-text unavailable for extraction', severity: 'warn' },
  THEME003: { code: 'THEME003', message: 'AI service error', severity: 'error' },
  THEME004: { code: 'THEME004', message: 'Theme merging failed', severity: 'error' },
  THEME005: { code: 'THEME005', message: 'Stage timeout', severity: 'warn' },
  THEME006: { code: 'THEME006', message: 'Invalid paper content', severity: 'warn' },
  THEME007: { code: 'THEME007', message: 'Cache error', severity: 'warn' },
  THEME008: { code: 'THEME008', message: 'Zero themes extracted', severity: 'warn' },

  // WebSocket Module (WS001-WS099)
  WS001: { code: 'WS001', message: 'WebSocket connection failed', severity: 'error' },
  WS002: { code: 'WS002', message: 'WebSocket message failed', severity: 'error' },
  WS003: { code: 'WS003', message: 'WebSocket room join failed', severity: 'warn' },
  WS004: { code: 'WS004', message: 'WebSocket authentication failed', severity: 'error' },
  WS005: { code: 'WS005', message: 'WebSocket timeout', severity: 'warn' },

  // Authentication Module (AUTH001-AUTH099)
  AUTH001: { code: 'AUTH001', message: 'Unauthorized access', severity: 'warn' },
  AUTH002: { code: 'AUTH002', message: 'Token expired', severity: 'info' },
  AUTH003: { code: 'AUTH003', message: 'Invalid credentials', severity: 'warn' },
  AUTH004: { code: 'AUTH004', message: 'Insufficient permissions', severity: 'warn' },
  AUTH005: { code: 'AUTH005', message: 'Two-factor authentication required', severity: 'info' },

  // Validation Module (VAL001-VAL099)
  VAL001: { code: 'VAL001', message: 'Validation failed', severity: 'warn' },
  VAL002: { code: 'VAL002', message: 'Required field missing', severity: 'warn' },
  VAL003: { code: 'VAL003', message: 'Invalid format', severity: 'warn' },
  VAL004: { code: 'VAL004', message: 'Value out of range', severity: 'warn' },

  // Database Module (DB001-DB099)
  DB001: { code: 'DB001', message: 'Database connection failed', severity: 'error' },
  DB002: { code: 'DB002', message: 'Query execution failed', severity: 'error' },
  DB003: { code: 'DB003', message: 'Record not found', severity: 'info' },
  DB004: { code: 'DB004', message: 'Duplicate entry', severity: 'warn' },
  DB005: { code: 'DB005', message: 'Transaction failed', severity: 'error' },

  // External Services (EXT001-EXT099)
  EXT001: { code: 'EXT001', message: 'External API unavailable', severity: 'warn' },
  EXT002: { code: 'EXT002', message: 'External API rate limited', severity: 'warn' },
  EXT003: { code: 'EXT003', message: 'External API authentication failed', severity: 'error' },
  EXT004: { code: 'EXT004', message: 'External API response invalid', severity: 'error' },
  EXT005: { code: 'EXT005', message: 'External API timeout', severity: 'warn' },

  // System/Internal (SYS001-SYS099)
  SYS001: { code: 'SYS001', message: 'Internal server error', severity: 'error' },
  SYS002: { code: 'SYS002', message: 'Service unavailable', severity: 'error' },
  SYS003: { code: 'SYS003', message: 'Resource exhausted', severity: 'error' },
  SYS004: { code: 'SYS004', message: 'Configuration error', severity: 'error' },
  SYS005: { code: 'SYS005', message: 'Unexpected error', severity: 'error' },
} as const;

export type ErrorCode = keyof typeof ErrorCodes;

export interface ErrorContext {
  code: ErrorCode;
  correlationId?: string;
  userId?: string;
  studyId?: string;
  source?: string;
  operation?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get error details by code
 */
export function getErrorDetails(code: ErrorCode): {
  code: string;
  message: string;
  severity: string;
} {
  return ErrorCodes[code];
}

/**
 * Create standardized error response
 */
export function createErrorResponse(
  code: ErrorCode,
  correlationId: string,
  path: string,
  additionalMessage?: string,
): {
  statusCode: number;
  errorCode: string;
  message: string;
  correlationId: string;
  timestamp: string;
  path: string;
} {
  const details = ErrorCodes[code];
  const statusCode = mapErrorCodeToHttpStatus(code);

  return {
    statusCode,
    errorCode: details.code,
    message: additionalMessage ? `${details.message}: ${additionalMessage}` : details.message,
    correlationId,
    timestamp: new Date().toISOString(),
    path,
  };
}

/**
 * Map error codes to HTTP status codes
 */
export function mapErrorCodeToHttpStatus(code: ErrorCode): number {
  const prefix = code.substring(0, code.length - 3);

  // Authentication errors
  if (code === 'AUTH001' || code === 'AUTH002') return 401;
  if (code === 'AUTH004') return 403;

  // Validation errors
  if (prefix === 'VAL' || code === 'LIT004') return 400;

  // Not found
  if (code === 'DB003' || code === 'LIT005') return 404;

  // Rate limiting
  if (code === 'LIT003' || code === 'EXT002') return 429;

  // Timeout
  if (code === 'LIT002' || code === 'EXT005' || code === 'THEME005') return 504;

  // Service unavailable
  if (code === 'SYS002' || code === 'EXT001' || code === 'LIT006') return 503;

  // Unprocessable entity
  if (code === 'THEME002' || code === 'THEME006') return 422;

  // Default to 500 for errors
  return 500;
}
