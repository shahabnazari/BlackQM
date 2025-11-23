/**
 * Frontend Error Codes - Phase 10.943
 *
 * Standardized error codes for frontend error tracking and monitoring.
 * These codes map to backend error codes where applicable.
 *
 * Format: FE{NUMBER} for frontend-specific errors
 * Backend errors preserve their original codes (LIT, THEME, AUTH, etc.)
 */

export const FrontendErrorCodes = {
  // API/Network Errors (FE001-FE019)
  FE001: { code: 'FE001', message: 'API request failed', severity: 'error', recoverable: true },
  FE002: { code: 'FE002', message: 'Network error', severity: 'error', recoverable: true },
  FE003: { code: 'FE003', message: 'Request timeout', severity: 'warn', recoverable: true },
  FE004: { code: 'FE004', message: 'Invalid response format', severity: 'error', recoverable: false },
  FE005: { code: 'FE005', message: 'Rate limited', severity: 'warn', recoverable: true },

  // WebSocket Errors (FE020-FE039)
  FE020: { code: 'FE020', message: 'WebSocket connection failed', severity: 'error', recoverable: true },
  FE021: { code: 'FE021', message: 'WebSocket disconnected', severity: 'warn', recoverable: true },
  FE022: { code: 'FE022', message: 'WebSocket message failed', severity: 'error', recoverable: true },
  FE023: { code: 'FE023', message: 'WebSocket timeout', severity: 'warn', recoverable: true },

  // State/Store Errors (FE040-FE059)
  FE040: { code: 'FE040', message: 'State persistence failed', severity: 'warn', recoverable: true },
  FE041: { code: 'FE041', message: 'State hydration failed', severity: 'error', recoverable: false },
  FE042: { code: 'FE042', message: 'Store initialization failed', severity: 'error', recoverable: false },
  FE043: { code: 'FE043', message: 'Invalid state transition', severity: 'warn', recoverable: true },

  // Component/Render Errors (FE060-FE079)
  FE060: { code: 'FE060', message: 'Component render error', severity: 'error', recoverable: false },
  FE061: { code: 'FE061', message: 'Error boundary triggered', severity: 'error', recoverable: true },
  FE062: { code: 'FE062', message: 'Hook execution error', severity: 'error', recoverable: false },
  FE063: { code: 'FE063', message: 'Effect cleanup error', severity: 'warn', recoverable: true },

  // Validation Errors (FE080-FE099)
  FE080: { code: 'FE080', message: 'Form validation failed', severity: 'warn', recoverable: true },
  FE081: { code: 'FE081', message: 'Required field missing', severity: 'warn', recoverable: true },
  FE082: { code: 'FE082', message: 'Invalid input format', severity: 'warn', recoverable: true },

  // Literature/Search Errors (FE100-FE119)
  FE100: { code: 'FE100', message: 'Search failed', severity: 'error', recoverable: true },
  FE101: { code: 'FE101', message: 'Paper fetch failed', severity: 'warn', recoverable: true },
  FE102: { code: 'FE102', message: 'Paper save failed', severity: 'error', recoverable: true },
  FE103: { code: 'FE103', message: 'Filter application failed', severity: 'warn', recoverable: true },

  // Theme Extraction Errors (FE120-FE139)
  FE120: { code: 'FE120', message: 'Theme extraction failed', severity: 'error', recoverable: true },
  FE121: { code: 'FE121', message: 'Theme extraction timeout', severity: 'warn', recoverable: true },
  FE122: { code: 'FE122', message: 'Theme progress update failed', severity: 'warn', recoverable: true },
  FE123: { code: 'FE123', message: 'Paper selection failed', severity: 'warn', recoverable: true },

  // Authentication Errors (FE140-FE159)
  FE140: { code: 'FE140', message: 'Authentication failed', severity: 'error', recoverable: true },
  FE141: { code: 'FE141', message: 'Token refresh failed', severity: 'error', recoverable: true },
  FE142: { code: 'FE142', message: 'Session expired', severity: 'warn', recoverable: true },
  FE143: { code: 'FE143', message: 'Unauthorized action', severity: 'warn', recoverable: true },
} as const;

export type FrontendErrorCode = keyof typeof FrontendErrorCodes;

/**
 * Error context for structured error logging
 */
export interface ErrorContext {
  code: FrontendErrorCode | string;
  message?: string;
  correlationId?: string;
  component?: string;
  operation?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Get error details by code
 */
export function getErrorDetails(code: FrontendErrorCode): {
  code: string;
  message: string;
  severity: string;
  recoverable: boolean;
} {
  return FrontendErrorCodes[code];
}

/**
 * Check if error is recoverable
 */
export function isRecoverableError(code: FrontendErrorCode | string): boolean {
  if (code in FrontendErrorCodes) {
    return FrontendErrorCodes[code as FrontendErrorCode].recoverable;
  }
  // Default to recoverable for unknown codes
  return true;
}

/**
 * Create standardized error for throwing
 */
export function createError(
  code: FrontendErrorCode,
  additionalMessage?: string,
  metadata?: Record<string, unknown>,
): Error {
  const details = FrontendErrorCodes[code];
  const message = additionalMessage
    ? `[${details.code}] ${details.message}: ${additionalMessage}`
    : `[${details.code}] ${details.message}`;

  const error = new Error(message);
  (error as any).code = details.code;
  (error as any).severity = details.severity;
  (error as any).recoverable = details.recoverable;
  (error as any).metadata = metadata;

  return error;
}

/**
 * Map backend error code to frontend error code
 * Returns the backend code if no mapping exists (backend codes are more specific)
 */
export function mapBackendErrorCode(backendCode: string): string {
  const mapping: Record<string, FrontendErrorCode> = {
    LIT001: 'FE100',
    LIT002: 'FE003',
    LIT003: 'FE005',
    THEME001: 'FE120',
    THEME005: 'FE121',
    WS001: 'FE020',
    WS002: 'FE022',
    AUTH001: 'FE140',
    AUTH002: 'FE142',
  };

  return mapping[backendCode] || backendCode;
}

/**
 * Extract error code from error object or message
 */
export function extractErrorCode(error: unknown): string | null {
  if (!error) return null;

  // Check for code property
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;

    if (typeof errorObj['code'] === 'string') {
      return errorObj['code'];
    }

    if (typeof errorObj['errorCode'] === 'string') {
      return errorObj['errorCode'];
    }
  }

  // Extract from message
  if (error instanceof Error) {
    const match = error.message.match(/\[([A-Z]+\d+)\]/);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}
