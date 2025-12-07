/**
 * PHASE 10.102 PHASE 6: MONITORING HOOKS
 *
 * Netflix-Grade Monitoring - React Hooks
 *
 * Custom hooks for fetching and managing monitoring data:
 * - useHealthMetrics(): System health status
 * - useBusinessMetrics(): Business KPIs
 * - useSLOMetrics(): Service Level Objectives
 * - useAlerts(): Active system alerts
 *
 * All hooks support auto-refresh and error handling.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  MetricsApiService,
  HealthMetrics,
  BusinessMetrics,
  SLOMetrics,
  AlertsResponse,
} from '../api/services/metrics-api.service';

// ============================================================================
// HOOK OPTIONS
// ============================================================================

interface UseMetricsOptions {
  /**
   * Auto-refresh interval in milliseconds
   * @default 30000 (30 seconds)
   */
  refreshInterval?: number;

  /**
   * Whether to fetch data on mount
   * @default true
   */
  fetchOnMount?: boolean;

  /**
   * Callback on error
   */
  onError?: (error: Error) => void;
}

// ============================================================================
// HEALTH METRICS HOOK
// ============================================================================

export interface UseHealthMetricsResult {
  data: HealthMetrics | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and monitor system health metrics
 *
 * @example
 * ```tsx
 * const { data, loading, error, refresh } = useHealthMetrics({
 *   refreshInterval: 30000, // Refresh every 30 seconds
 * });
 *
 * if (loading) return <Spinner />;
 * if (error) return <ErrorMessage error={error} />;
 *
 * return <HealthStatus health={data} />;
 * ```
 */
export function useHealthMetrics(options: UseMetricsOptions = {}): UseHealthMetricsResult {
  const {
    refreshInterval = 30000,
    fetchOnMount = true,
    onError,
  } = options;

  const [data, setData] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const metrics = await MetricsApiService.getHealthMetrics();
      setData(metrics);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch health metrics');
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [onError]);

  // Fetch on mount
  useEffect(() => {
    if (fetchOnMount) {
      fetchMetrics();
    }
  }, [fetchOnMount, fetchMetrics]);

  // Auto-refresh
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [refreshInterval, fetchMetrics]);

  return {
    data,
    loading,
    error,
    refresh: fetchMetrics,
  };
}

// ============================================================================
// BUSINESS METRICS HOOK
// ============================================================================

export interface UseBusinessMetricsResult {
  data: BusinessMetrics | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and monitor business metrics
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useBusinessMetrics({
 *   refreshInterval: 60000, // Refresh every minute
 * });
 *
 * return (
 *   <div>
 *     <h2>Searches: {data?.searches.last24h}</h2>
 *     <h2>Papers: {data?.papers.totalSaved}</h2>
 *   </div>
 * );
 * ```
 */
export function useBusinessMetrics(options: UseMetricsOptions = {}): UseBusinessMetricsResult {
  const {
    refreshInterval = 60000,
    fetchOnMount = true,
    onError,
  } = options;

  const [data, setData] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const metrics = await MetricsApiService.getBusinessMetrics();
      setData(metrics);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch business metrics');
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchMetrics();
    }
  }, [fetchOnMount, fetchMetrics]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [refreshInterval, fetchMetrics]);

  return {
    data,
    loading,
    error,
    refresh: fetchMetrics,
  };
}

// ============================================================================
// SLO METRICS HOOK
// ============================================================================

export interface UseSLOMetricsResult {
  data: SLOMetrics | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to fetch and monitor Service Level Objectives (SLOs)
 *
 * @example
 * ```tsx
 * const { data, loading, error } = useSLOMetrics({
 *   refreshInterval: 30000,
 * });
 *
 * return (
 *   <SLODashboard
 *     availability={data?.availability}
 *     latency={data?.latency}
 *     errorRate={data?.errorRate}
 *   />
 * );
 * ```
 */
export function useSLOMetrics(options: UseMetricsOptions = {}): UseSLOMetricsResult {
  const {
    refreshInterval = 30000,
    fetchOnMount = true,
    onError,
  } = options;

  const [data, setData] = useState<SLOMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const metrics = await MetricsApiService.getSLOMetrics();
      setData(metrics);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch SLO metrics');
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchMetrics();
    }
  }, [fetchOnMount, fetchMetrics]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchMetrics, refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [refreshInterval, fetchMetrics]);

  return {
    data,
    loading,
    error,
    refresh: fetchMetrics,
  };
}

// ============================================================================
// ALERTS HOOK
// ============================================================================

export interface UseAlertsResult {
  data: AlertsResponse | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  hasCriticalAlerts: boolean;
}

/**
 * Hook to fetch and monitor active system alerts
 *
 * @example
 * ```tsx
 * const { data, hasCriticalAlerts, refresh } = useAlerts({
 *   refreshInterval: 15000, // Check every 15 seconds
 *   onError: (error) => console.error('Alert fetch failed:', error),
 * });
 *
 * if (hasCriticalAlerts) {
 *   return <CriticalAlertBanner alerts={data?.active} />;
 * }
 * ```
 */
export function useAlerts(options: UseMetricsOptions = {}): UseAlertsResult {
  const {
    refreshInterval = 15000,
    fetchOnMount = true,
    onError,
  } = options;

  const [data, setData] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const alerts = await MetricsApiService.getAlerts();
      setData(alerts);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch alerts');
      setError(error);
      if (onError) {
        onError(error);
      }
    } finally {
      setLoading(false);
    }
  }, [onError]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchAlerts();
    }
  }, [fetchOnMount, fetchAlerts]);

  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(fetchAlerts, refreshInterval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [refreshInterval, fetchAlerts]);

  const hasCriticalAlerts = data ? data.count.critical > 0 : false;

  return {
    data,
    loading,
    error,
    refresh: fetchAlerts,
    hasCriticalAlerts,
  };
}

// ============================================================================
// COMBINED MONITORING HOOK (All Metrics at Once)
// ============================================================================

export interface UseMonitoringResult {
  health: UseHealthMetricsResult;
  business: UseBusinessMetricsResult;
  slo: UseSLOMetricsResult;
  alerts: UseAlertsResult;
}

/**
 * Combined hook that fetches all monitoring metrics
 *
 * Useful for admin dashboards that need comprehensive monitoring data.
 *
 * @example
 * ```tsx
 * const monitoring = useMonitoring({
 *   refreshInterval: 30000,
 * });
 *
 * return (
 *   <MonitoringDashboard
 *     health={monitoring.health.data}
 *     business={monitoring.business.data}
 *     slo={monitoring.slo.data}
 *     alerts={monitoring.alerts.data}
 *   />
 * );
 * ```
 */
export function useMonitoring(options: UseMetricsOptions = {}): UseMonitoringResult {
  const health = useHealthMetrics(options);
  const business = useBusinessMetrics(options);
  const slo = useSLOMetrics(options);
  const alerts = useAlerts(options);

  return {
    health,
    business,
    slo,
    alerts,
  };
}
