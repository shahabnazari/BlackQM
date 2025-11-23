/**
 * Authentication Diagnostics Hook
 * Phase 10.92 Day 18 Stage 1
 *
 * Enterprise-grade React hook for comprehensive auth health monitoring
 * Follows React Hooks best practices with proper dependency arrays
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type {
  AuthDiagnostics,
  TokenHealth,
  BackendHealth,
  UserAccountHealth,
  Recommendation,
} from '../types/auth-diagnostics';
import {
  validateToken,
  getStoredToken,
  calculateTokenScore,
} from '../auth/token-validator';
import { checkBackendHealth } from '../api/health-check';

interface UseAuthDiagnosticsOptions {
  /**
   * Enable automatic periodic health checks
   * @default false
   */
  autoRefresh?: boolean;

  /**
   * Refresh interval in milliseconds
   * @default 30000 (30 seconds)
   */
  refreshInterval?: number;

  /**
   * Enable detailed logging (development only)
   * @default false
   */
  enableLogging?: boolean;

  /**
   * Run diagnostics on mount
   * @default true
   */
  runOnMount?: boolean;
}

interface UseAuthDiagnosticsReturn {
  /** Current diagnostics data */
  diagnostics: AuthDiagnostics | null;

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: string | null;

  /** Manually trigger diagnostics check */
  runDiagnostics: () => Promise<void>;

  /** Clear current diagnostics */
  clearDiagnostics: () => void;

  /** Refresh specific component */
  refreshToken: () => Promise<void>;
  refreshBackend: () => Promise<void>;
  refreshUser: () => Promise<void>;

  /** Last check timestamp */
  lastCheck: Date | null;
}

/**
 * Custom hook for comprehensive auth diagnostics
 *
 * @example
 * ```tsx
 * const { diagnostics, runDiagnostics, isLoading } = useAuthDiagnostics({
 *   autoRefresh: true,
 *   refreshInterval: 30000,
 * });
 * ```
 */
export function useAuthDiagnostics(
  options: UseAuthDiagnosticsOptions = {}
): UseAuthDiagnosticsReturn {
  const {
    autoRefresh = false,
    refreshInterval = 30000,
    enableLogging = false,
    runOnMount = true,
  } = options;

  const [diagnostics, setDiagnostics] = useState<AuthDiagnostics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  // Use ref to prevent infinite loops in useEffect
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  /**
   * Logs diagnostic information (development only)
   */
  const log = useCallback(
    (message: string, data?: unknown) => {
      if (enableLogging && process.env.NODE_ENV !== 'production') {
        console.log(`[AuthDiagnostics] ${message}`, data || '');
      }
    },
    [enableLogging]
  );

  /**
   * Checks token health
   */
  const checkTokenHealth = useCallback((): TokenHealth => {
    const { token, source } = getStoredToken();
    const health = validateToken(token);

    log('Token health checked', {
      source,
      isValid: health.isValid,
      expiresIn: health.expiresIn,
    });

    return health;
  }, [log]);

  /**
   * Checks backend health
   */
  const checkBackendHealthStatus = useCallback(async (): Promise<BackendHealth> => {
    try {
      const health = await checkBackendHealth();
      log('Backend health checked', {
        status: health.status,
        responseTime: health.responseTime,
      });
      return health;
    } catch (error) {
      log('Backend health check failed', error);
      throw error;
    }
  }, [log]);

  /**
   * Checks user account health from localStorage
   */
  const checkUserHealth = useCallback((): UserAccountHealth => {
    if (typeof window === 'undefined') {
      return {
        exists: false,
        isActive: false,
        isVerified: false,
        userId: null,
        email: null,
        role: null,
        error: 'Window not available (SSR)',
      };
    }

    try {
      const userStr = localStorage.getItem('user');
      if (!userStr) {
        return {
          exists: false,
          isActive: false,
          isVerified: false,
          userId: null,
          email: null,
          role: null,
          error: null,
        };
      }

      const user = JSON.parse(userStr) as {
        id?: string;
        email?: string;
        role?: string;
        isActive?: boolean;
        emailVerified?: boolean;
      };

      return {
        exists: true,
        isActive: user.isActive ?? false,
        isVerified: user.emailVerified ?? false,
        userId: user.id || null,
        email: user.email || null,
        role: user.role || null,
        error: null,
      };
    } catch (error) {
      return {
        exists: false,
        isActive: false,
        isVerified: false,
        userId: null,
        email: null,
        role: null,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, []);

  /**
   * Generates recommendations based on diagnostics
   */
  const generateRecommendations = useCallback(
    (
      tokenHealth: TokenHealth,
      backendHealth: BackendHealth,
      userHealth: UserAccountHealth
    ): Recommendation[] => {
      const recommendations: Recommendation[] = [];

      // Critical: Expired token
      if (tokenHealth.isExpired) {
        recommendations.push({
          priority: 'critical',
          action: 'Log in again to get a fresh token',
          reason: 'Your authentication token has expired',
          autoFixAvailable: false,
        });
      }

      // Critical: Backend down
      if (!backendHealth.isHealthy) {
        recommendations.push({
          priority: 'critical',
          action: 'Check backend server status',
          reason: `Backend is ${backendHealth.status}: ${backendHealth.error}`,
          autoFixAvailable: false,
        });
      }

      // High: Token expires soon
      if (
        !tokenHealth.isExpired &&
        tokenHealth.expiresIn > 0 &&
        tokenHealth.expiresIn < 300
      ) {
        recommendations.push({
          priority: 'high',
          action: 'Token will refresh automatically',
          reason: `Token expires in ${tokenHealth.expiresIn} seconds`,
          autoFixAvailable: true,
        });
      }

      // High: User inactive
      if (userHealth.exists && !userHealth.isActive) {
        recommendations.push({
          priority: 'high',
          action: 'Contact administrator to activate account',
          reason: 'User account is inactive',
          autoFixAvailable: false,
        });
      }

      // Medium: Slow backend
      if (backendHealth.isHealthy && backendHealth.responseTime > 1000) {
        recommendations.push({
          priority: 'medium',
          action: 'Monitor backend performance',
          reason: `Backend response time is high (${backendHealth.responseTime}ms)`,
          autoFixAvailable: false,
        });
      }

      // Low: Missing user data
      if (!userHealth.exists && tokenHealth.isValid) {
        recommendations.push({
          priority: 'low',
          action: 'Refresh page to reload user data',
          reason: 'User data not found in localStorage',
          autoFixAvailable: false,
        });
      }

      return recommendations;
    },
    []
  );

  /**
   * Main diagnostics function
   */
  const runDiagnostics = useCallback(async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      log('Running diagnostics...');

      // Check token health (synchronous)
      const tokenHealth = checkTokenHealth();

      // Check backend health (async)
      const backendHealth = await checkBackendHealthStatus();

      // Check user health (synchronous)
      const userHealth = checkUserHealth();

      // Check storage
      const { source } = getStoredToken();
      const storage = {
        hasAccessToken: !!localStorage.getItem('access_token'),
        hasRefreshToken: !!localStorage.getItem('refresh_token'),
        hasUser: !!localStorage.getItem('user'),
        storageType: source,
      };

      // Generate recommendations
      const recommendations = generateRecommendations(
        tokenHealth,
        backendHealth,
        userHealth
      );

      // Calculate overall status
      const tokenScore = calculateTokenScore(tokenHealth);
      const backendScore = backendHealth.isHealthy ? 100 : 0;
      const userScore = userHealth.isActive && userHealth.isVerified ? 100 : 50;

      const overallScore = Math.round(
        (tokenScore * 0.5 + backendScore * 0.3 + userScore * 0.2)
      );

      let overallStatus: 'healthy' | 'warning' | 'critical';
      if (overallScore >= 80) overallStatus = 'healthy';
      else if (overallScore >= 50) overallStatus = 'warning';
      else overallStatus = 'critical';

      const result: AuthDiagnostics = {
        token: tokenHealth,
        backend: backendHealth,
        user: userHealth,
        storage,
        recommendations,
        overall: {
          status: overallStatus,
          score: overallScore,
          lastCheck: new Date(),
        },
      };

      if (isMountedRef.current) {
        setDiagnostics(result);
        setLastCheck(new Date());
      }

      log('Diagnostics complete', {
        status: overallStatus,
        score: overallScore,
      });
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Diagnostics check failed';

      if (isMountedRef.current) {
        setError(errorMessage);
      }

      log('Diagnostics failed', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [
    isLoading,
    checkTokenHealth,
    checkBackendHealthStatus,
    checkUserHealth,
    generateRecommendations,
    log,
  ]);

  /**
   * Refresh only token diagnostics
   */
  const refreshToken = useCallback(async () => {
    if (!diagnostics) return;

    const tokenHealth = checkTokenHealth();
    setDiagnostics(prev =>
      prev ? { ...prev, token: tokenHealth } : null
    );
  }, [diagnostics, checkTokenHealth]);

  /**
   * Refresh only backend diagnostics
   */
  const refreshBackend = useCallback(async () => {
    if (!diagnostics) return;

    try {
      const backendHealth = await checkBackendHealthStatus();
      setDiagnostics(prev =>
        prev ? { ...prev, backend: backendHealth } : null
      );
    } catch (err) {
      log('Backend refresh failed', err);
    }
  }, [diagnostics, checkBackendHealthStatus, log]);

  /**
   * Refresh only user diagnostics
   */
  const refreshUser = useCallback(async () => {
    if (!diagnostics) return;

    const userHealth = checkUserHealth();
    setDiagnostics(prev =>
      prev ? { ...prev, user: userHealth } : null
    );
  }, [diagnostics, checkUserHealth]);

  /**
   * Clear diagnostics
   */
  const clearDiagnostics = useCallback(() => {
    setDiagnostics(null);
    setError(null);
    setLastCheck(null);
    log('Diagnostics cleared');
  }, [log]);

  // Run diagnostics on mount
  useEffect(() => {
    if (runOnMount) {
      runDiagnostics();
    }

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Set up auto-refresh
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        runDiagnostics();
      }, refreshInterval);

      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
    // Return undefined for consistency (all code paths must return)
    return undefined;
  }, [autoRefresh, refreshInterval, runDiagnostics]);

  return {
    diagnostics,
    isLoading,
    error,
    runDiagnostics,
    clearDiagnostics,
    refreshToken,
    refreshBackend,
    refreshUser,
    lastCheck,
  };
}
