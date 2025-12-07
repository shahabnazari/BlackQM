/**
 * Authentication Diagnostic Panel Component
 * Phase 10.92 Day 18 Stage 1 - STRICT AUDIT CORRECTED
 *
 * Enterprise-grade dev tool for real-time auth health monitoring
 * Follows Next.js App Router and React best practices
 *
 * FIXES APPLIED:
 * - BUG-002: Replaced all HTML entities (&amp;&amp;, &gt;) with actual operators
 * - PERF-001: Wrapped handleRefresh in useCallback
 * - PERF-002: Extracted formatExpiration outside component
 * - PERF-003: Wrapped all sub-components in React.memo()
 * - PERF-005: Wrapped sorting in useMemo()
 * - DX-002: Fixed storageType prop to use union type
 */

'use client';

import { useCallback, useMemo, memo } from 'react';
import { useAuthDiagnostics } from '@/lib/hooks/useAuthDiagnostics';
import type {
  TokenHealth,
  BackendHealth,
  UserAccountHealth,
  Recommendation,
} from '@/lib/types/auth-diagnostics';

interface AuthDiagnosticPanelProps {
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
   * Show detailed debug information
   * @default false
   */
  showDebugInfo?: boolean;

  /**
   * Optional className for custom styling
   */
  className?: string;
}

/**
 * ✅ FIXED: PERF-002 - Extracted outside component to prevent recreation
 * Formats expiration time in short format
 */
function formatExpirationShort(expiresIn: number, isExpired: boolean): string {
  if (isExpired) return 'Expired';
  if (expiresIn <= 0) return 'Expired';
  if (expiresIn < 60) return `${expiresIn}s`;
  if (expiresIn < 3600) return `${Math.floor(expiresIn / 60)}m`;
  return `${Math.floor(expiresIn / 3600)}h`;
}

/**
 * Dev tool component for comprehensive auth diagnostics
 *
 * @example
 * ```tsx
 * <AuthDiagnosticPanel autoRefresh={true} refreshInterval={30000} />
 * ```
 */
export function AuthDiagnosticPanel({
  autoRefresh = false,
  refreshInterval = 30000,
  showDebugInfo = false,
  className = '',
}: AuthDiagnosticPanelProps) {
  const {
    diagnostics,
    isLoading,
    error,
    runDiagnostics,
    refreshToken,
    refreshBackend,
    refreshUser,
    lastCheck,
  } = useAuthDiagnostics({
    autoRefresh,
    refreshInterval,
    runOnMount: true,
  });

  // ✅ FIXED: PERF-001 - Wrapped in useCallback
  const handleRefresh = useCallback(async () => {
    await runDiagnostics();
  }, [runDiagnostics]);

  // Render loading state
  // ✅ FIXED: BUG-002 - Replaced &amp;&amp; with &&
  if (isLoading && !diagnostics) {
    return (
      <div
        className={`auth-diagnostic-panel loading ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="panel-header">
          <h2>Authentication Diagnostics</h2>
          <div className="loading-spinner" aria-label="Loading diagnostics">
            <span className="spinner"></span>
            <span className="sr-only">Running diagnostics...</span>
          </div>
        </div>
      </div>
    );
  }

  // Render error state
  // ✅ FIXED: BUG-002 - Replaced &amp;&amp; with &&
  if (error && !diagnostics) {
    return (
      <div
        className={`auth-diagnostic-panel error ${className}`}
        role="alert"
        aria-live="assertive"
      >
        <div className="panel-header">
          <h2>Authentication Diagnostics</h2>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label="Retry diagnostics"
            className="refresh-button"
          >
            Retry
          </button>
        </div>
        <div className="error-message">
          <span className="error-icon" aria-hidden="true">
            ❌
          </span>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Render empty state
  if (!diagnostics) {
    return (
      <div className={`auth-diagnostic-panel empty ${className}`}>
        <div className="panel-header">
          <h2>Authentication Diagnostics</h2>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label="Run diagnostics"
            className="run-button"
          >
            Run Diagnostics
          </button>
        </div>
        <p className="empty-message">Click &quot;Run Diagnostics&quot; to check auth health</p>
      </div>
    );
  }

  // Main render with diagnostics data
  const { token, backend, user, storage, recommendations, overall } = diagnostics;

  return (
    <div
      className={`auth-diagnostic-panel ${overall.status} ${className}`}
      role="region"
      aria-labelledby="auth-diagnostics-title"
    >
      {/* Header with overall status */}
      <div className="panel-header">
        <h2 id="auth-diagnostics-title">Authentication Diagnostics</h2>
        <div className="header-actions">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            aria-label="Refresh all diagnostics"
            className="refresh-button"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
          {/* ✅ FIXED: BUG-002 - Replaced &amp;&amp; with && */}
          {lastCheck && (
            <span className="last-check" aria-label={`Last checked at ${lastCheck.toLocaleTimeString()}`}>
              Last check: {lastCheck.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Overall Health Score */}
      <div className="overall-status">
        <StatusBadge status={overall.status} score={overall.score} />
      </div>

      {/* Critical Recommendations */}
      {/* ✅ FIXED: BUG-002 - Replaced &gt; and &amp;&amp; with > and && */}
      {recommendations.length > 0 && (
        <RecommendationsList recommendations={recommendations} />
      )}

      {/* Component Health Cards */}
      <div className="health-cards">
        <TokenHealthCard
          health={token}
          onRefresh={refreshToken}
          showDebug={showDebugInfo}
        />
        <BackendHealthCard
          health={backend}
          onRefresh={refreshBackend}
          showDebug={showDebugInfo}
        />
        <UserHealthCard
          health={user}
          onRefresh={refreshUser}
          showDebug={showDebugInfo}
        />
      </div>

      {/* Storage Debug Info */}
      {/* ✅ FIXED: BUG-002 - Replaced &amp;&amp; with && */}
      {showDebugInfo && (
        <StorageDebugInfo storage={storage} />
      )}
    </div>
  );
}

/**
 * Status Badge Component
 * Displays overall health score with visual indicator
 *
 * ✅ FIXED: PERF-003 - Wrapped in React.memo()
 */
const StatusBadge = memo(function StatusBadge({
  status,
  score
}: {
  status: string;
  score: number
}) {
  const getStatusEmoji = () => {
    if (status === 'healthy') return '✅';
    if (status === 'warning') return '⚠️';
    return '❌';
  };

  const getStatusLabel = () => {
    if (status === 'healthy') return 'Healthy';
    if (status === 'warning') return 'Warning';
    return 'Critical';
  };

  return (
    <div
      className={`status-badge ${status}`}
      role="status"
      aria-label={`Overall status: ${getStatusLabel()}, Score: ${score} out of 100`}
    >
      <span className="status-emoji" aria-hidden="true">
        {getStatusEmoji()}
      </span>
      <div className="status-details">
        <span className="status-label">{getStatusLabel()}</span>
        <span className="status-score">{score}/100</span>
      </div>
    </div>
  );
});

/**
 * Recommendations List Component
 * Displays actionable recommendations sorted by priority
 *
 * ✅ FIXED: PERF-003 - Wrapped in React.memo()
 * ✅ FIXED: PERF-005 - Wrapped sorting in useMemo()
 */
const RecommendationsList = memo(function RecommendationsList({
  recommendations,
}: {
  recommendations: Recommendation[];
}) {
  // ✅ FIXED: PERF-005 - Memoize sorting
  const sorted = useMemo(() => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return [...recommendations].sort(
      (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
    );
  }, [recommendations]);

  return (
    <section className="recommendations" aria-labelledby="recommendations-title">
      <h3 id="recommendations-title">Recommendations</h3>
      <ul className="recommendations-list">
        {sorted.map((rec, index) => (
          <li
            key={index}
            className={`recommendation ${rec.priority}`}
            role="listitem"
          >
            <span className="priority-badge" aria-label={`Priority: ${rec.priority}`}>
              {rec.priority.toUpperCase()}
            </span>
            <div className="recommendation-content">
              <p className="reason">{rec.reason}</p>
              <p className="action">{rec.action}</p>
              {/* ✅ FIXED: BUG-002 - Replaced &amp;&amp; with && */}
              {rec.autoFixAvailable && (
                <span className="auto-fix" aria-label="Auto-fix available">
                  🔧 Auto-fix available
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
});

/**
 * Token Health Card Component
 * Displays JWT token status and expiration
 *
 * ✅ FIXED: PERF-003 - Wrapped in React.memo()
 * ✅ FIXED: PERF-002 - Uses extracted formatExpirationShort function
 */
const TokenHealthCard = memo(function TokenHealthCard({
  health,
  onRefresh,
  showDebug,
}: {
  health: TokenHealth;
  onRefresh: () => Promise<void>;
  showDebug: boolean;
}) {
  return (
    <div className="health-card token" role="article" aria-labelledby="token-health-title">
      <div className="card-header">
        <h3 id="token-health-title">
          <span className="icon" aria-hidden="true">
            🔑
          </span>
          Token Health
        </h3>
        <button
          onClick={onRefresh}
          aria-label="Refresh token health"
          className="card-refresh"
        >
          ↻
        </button>
      </div>

      <div className="card-body">
        <div className="status-row">
          <span className="label">Status:</span>
          <span className={`value ${health.isValid ? 'valid' : 'invalid'}`}>
            {health.isValid ? '✅ Valid' : '❌ Invalid'}
          </span>
        </div>

        <div className="status-row">
          <span className="label">Expires:</span>
          <span className={`value ${health.isExpired ? 'expired' : ''}`}>
            {formatExpirationShort(health.expiresIn, health.isExpired)}
          </span>
        </div>

        {/* ✅ FIXED: BUG-002 - Replaced &gt; and &amp;&amp; with > and && */}
        {health.warnings.length > 0 && (
          <div className="warnings">
            {health.warnings.map((warning, idx) => (
              <p key={idx} className="warning-text">
                ⚠️ {warning.message}
              </p>
            ))}
          </div>
        )}

        {/* ✅ FIXED: BUG-002 - Replaced &gt; and &amp;&amp; with > and && */}
        {health.errors.length > 0 && (
          <div className="errors">
            {health.errors.map((error, idx) => (
              <p key={idx} className="error-text">
                ❌ {error.message}
              </p>
            ))}
          </div>
        )}

        {/* ✅ FIXED: BUG-002 - Replaced &amp;&amp; with && */}
        {showDebug && health.payload && (
          <details className="debug-details">
            <summary>Debug Info</summary>
            <pre>{JSON.stringify(health.payload, null, 2)}</pre>
          </details>
        )}
      </div>
    </div>
  );
});

/**
 * Backend Health Card Component
 * Displays backend API status and response time
 *
 * ✅ FIXED: PERF-003 - Wrapped in React.memo()
 */
const BackendHealthCard = memo(function BackendHealthCard({
  health,
  onRefresh,
  showDebug,
}: {
  health: BackendHealth;
  onRefresh: () => Promise<void>;
  showDebug: boolean;
}) {
  return (
    <div className="health-card backend" role="article" aria-labelledby="backend-health-title">
      <div className="card-header">
        <h3 id="backend-health-title">
          <span className="icon" aria-hidden="true">
            🌐
          </span>
          Backend Health
        </h3>
        <button
          onClick={onRefresh}
          aria-label="Refresh backend health"
          className="card-refresh"
        >
          ↻
        </button>
      </div>

      <div className="card-body">
        <div className="status-row">
          <span className="label">Status:</span>
          <span className={`value ${health.isHealthy ? 'healthy' : 'down'}`}>
            {health.isHealthy ? '✅ Healthy' : '❌ Down'}
          </span>
        </div>

        <div className="status-row">
          <span className="label">Response Time:</span>
          {/* ✅ FIXED: BUG-002 - Replaced &gt; with > */}
          <span className={`value ${health.responseTime > 1000 ? 'slow' : ''}`}>
            {health.responseTime}ms
          </span>
        </div>

        {/* ✅ FIXED: BUG-002 - Replaced &amp;&amp; with && */}
        {health.version && (
          <div className="status-row">
            <span className="label">Version:</span>
            <span className="value">{health.version}</span>
          </div>
        )}

        {/* ✅ FIXED: BUG-002 - Replaced &amp;&amp; with && */}
        {health.error && (
          <div className="errors">
            <p className="error-text">❌ {health.error}</p>
          </div>
        )}

        {/* ✅ FIXED: BUG-002 - Replaced &amp;&amp; with && */}
        {showDebug && (
          <details className="debug-details">
            <summary>Debug Info</summary>
            <pre>{JSON.stringify(health, null, 2)}</pre>
          </details>
        )}
      </div>
    </div>
  );
});

/**
 * User Health Card Component
 * Displays user account status from localStorage
 *
 * ✅ FIXED: PERF-003 - Wrapped in React.memo()
 */
const UserHealthCard = memo(function UserHealthCard({
  health,
  onRefresh,
  showDebug,
}: {
  health: UserAccountHealth;
  onRefresh: () => Promise<void>;
  showDebug: boolean;
}) {
  return (
    <div className="health-card user" role="article" aria-labelledby="user-health-title">
      <div className="card-header">
        <h3 id="user-health-title">
          <span className="icon" aria-hidden="true">
            👤
          </span>
          User Account
        </h3>
        <button
          onClick={onRefresh}
          aria-label="Refresh user health"
          className="card-refresh"
        >
          ↻
        </button>
      </div>

      <div className="card-body">
        <div className="status-row">
          <span className="label">Exists:</span>
          <span className={`value ${health.exists ? 'valid' : 'invalid'}`}>
            {health.exists ? '✅ Yes' : '❌ No'}
          </span>
        </div>

        {/* ✅ FIXED: BUG-002 - Replaced &amp;&amp; with && */}
        {health.exists && (
          <>
            <div className="status-row">
              <span className="label">Active:</span>
              <span className={`value ${health.isActive ? 'valid' : 'invalid'}`}>
                {health.isActive ? '✅ Yes' : '❌ No'}
              </span>
            </div>

            <div className="status-row">
              <span className="label">Verified:</span>
              <span className={`value ${health.isVerified ? 'valid' : 'invalid'}`}>
                {health.isVerified ? '✅ Yes' : '❌ No'}
              </span>
            </div>

            {/* ✅ FIXED: BUG-002 - Replaced &amp;&amp; with && */}
            {health.email && (
              <div className="status-row">
                <span className="label">Email:</span>
                <span className="value">{health.email}</span>
              </div>
            )}

            {/* ✅ FIXED: BUG-002 - Replaced &amp;&amp; with && */}
            {health.role && (
              <div className="status-row">
                <span className="label">Role:</span>
                <span className="value">{health.role}</span>
              </div>
            )}
          </>
        )}

        {/* ✅ FIXED: BUG-002 - Replaced &amp;&amp; with && */}
        {health.error && (
          <div className="errors">
            <p className="error-text">❌ {health.error}</p>
          </div>
        )}

        {/* ✅ FIXED: BUG-002 - Replaced &amp;&amp; with && */}
        {showDebug && (
          <details className="debug-details">
            <summary>Debug Info</summary>
            <pre>{JSON.stringify(health, null, 2)}</pre>
          </details>
        )}
      </div>
    </div>
  );
});

/**
 * Storage Debug Info Component
 * Displays localStorage contents for debugging
 *
 * ✅ FIXED: PERF-003 - Wrapped in React.memo()
 * ✅ FIXED: DX-002 - Fixed storageType to use union type
 */
const StorageDebugInfo = memo(function StorageDebugInfo({
  storage,
}: {
  storage: {
    hasAccessToken: boolean;
    hasRefreshToken: boolean;
    hasUser: boolean;
    storageType: 'localStorage' | 'sessionStorage' | 'none'; // ✅ FIXED union type
  };
}) {
  return (
    <details className="storage-debug" open>
      <summary>Storage Debug Info</summary>
      <div className="debug-content">
        <div className="debug-row">
          <span className="label">Access Token:</span>
          <span className={`value ${storage.hasAccessToken ? 'present' : 'missing'}`}>
            {storage.hasAccessToken ? '✅ Present' : '❌ Missing'}
          </span>
        </div>
        <div className="debug-row">
          <span className="label">Refresh Token:</span>
          <span className={`value ${storage.hasRefreshToken ? 'present' : 'missing'}`}>
            {storage.hasRefreshToken ? '✅ Present' : '❌ Missing'}
          </span>
        </div>
        <div className="debug-row">
          <span className="label">User Data:</span>
          <span className={`value ${storage.hasUser ? 'present' : 'missing'}`}>
            {storage.hasUser ? '✅ Present' : '❌ Missing'}
          </span>
        </div>
        <div className="debug-row">
          <span className="label">Storage Type:</span>
          <span className="value">{storage.storageType}</span>
        </div>
      </div>
    </details>
  );
});
