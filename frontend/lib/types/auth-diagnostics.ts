/**
 * Authentication Diagnostics Type Definitions
 * Phase 10.92 Day 18 Stage 1
 *
 * Enterprise-grade type safety for auth health monitoring
 */

export interface TokenPayload {
  sub: string;
  email?: string;
  role?: string;
  name?: string;
  iat: number;
  exp: number;
  jti?: string;
}

export interface TokenHealth {
  isValid: boolean;
  isExpired: boolean;
  expiresIn: number; // seconds
  expiresAt: Date | null;
  issuedAt: Date | null;
  payload: TokenPayload | null;
  structure: {
    isValidJWT: boolean;
    parts: number;
    length: number;
  };
  warnings: TokenWarning[];
  errors: TokenError[];
}

export interface TokenWarning {
  code: 'EXPIRES_SOON' | 'SHORT_LIFETIME' | 'MISSING_CLAIMS';
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
}

export interface TokenError {
  code:
    | 'EXPIRED'
    | 'INVALID_FORMAT'
    | 'DECODE_FAILED'
    | 'MISSING_EXP'
    | 'MALFORMED';
  message: string;
  details?: string;
  timestamp: Date;
}

export interface BackendHealth {
  isHealthy: boolean;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number; // milliseconds
  version: string | null;
  timestamp: Date;
  error: string | null;
}

export interface UserAccountHealth {
  exists: boolean;
  isActive: boolean;
  isVerified: boolean;
  userId: string | null;
  email: string | null;
  role: string | null;
  error: string | null;
}

export interface AuthDiagnostics {
  token: TokenHealth;
  backend: BackendHealth;
  user: UserAccountHealth;
  storage: {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    hasUser: boolean;
    storageType: 'localStorage' | 'sessionStorage' | 'none';
  };
  recommendations: Recommendation[];
  overall: {
    status: 'healthy' | 'warning' | 'critical';
    score: number; // 0-100
    lastCheck: Date;
  };
}

export interface Recommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  reason: string;
  autoFixAvailable: boolean;
}

export type DiagnosticCheckResult =
  | {
      success: true;
      data: AuthDiagnostics;
    }
  | {
      success: false;
      error: string;
      partialData?: Partial<AuthDiagnostics>;
    };
