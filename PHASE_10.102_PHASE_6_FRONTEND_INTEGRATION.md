# PHASE 10.102 PHASE 6: FRONTEND MONITORING INTEGRATION
## Client-Side Observability for Literature Review System

**Status**: ✅ INTEGRATION PATTERNS READY
**Date**: December 2, 2025
**Audience**: Frontend Developers

---

## 📋 OVERVIEW

Integrate backend monitoring into your Next.js frontend:
- Display system health status
- Show SLO compliance
- Track client-side errors
- Propagate correlation IDs
- Monitor API call performance

---

## 🔧 STEP 1: CREATE METRICS API SERVICE

**File**: `frontend/lib/api/services/metrics-api.service.ts` (NEW)

```typescript
/**
 * Metrics API Service
 * Fetches monitoring data from backend metrics endpoints
 */

import axios, { AxiosInstance } from 'axios';

export interface HealthMetrics {
  timestamp: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: {
    seconds: number;
    formatted: string;
  };
  resources: {
    memory: {
      heapUsed: number;
      heapTotal: number;
      percentage: number;
      unit: 'MB';
    };
    cpu: {
      user: number;
      system: number;
      total: number;
      unit: 'ms';
    };
  };
  services: {
    database: {
      status: string;
      connectionPool?: any;
    };
    cache: {
      status: string;
      stats?: any;
    };
  };
}

export interface BusinessMetrics {
  timestamp: string;
  period: string;
  metrics: {
    cache: {
      hitRate: number;
      hits: number;
      misses: number;
      keys: number;
    };
    system: any;
    database: {
      healthy: boolean;
    };
  };
  targets: {
    cache: {
      hitRate: {
        target: number;
        current: number;
        met: boolean;
      };
    };
  };
}

export interface SLOMetrics {
  timestamp: string;
  period: {
    start: string;
    end: string;
    duration: {
      seconds: number;
      hours: number;
      days: number;
    };
  };
  slo: {
    availability: {
      target: number;
      current: number;
      met: boolean;
      status: 'meeting' | 'violated';
    };
    latency: {
      target: number;
      metric: 'p95';
      current: number;
      met: boolean;
      status: 'meeting' | 'violated';
      unit: 'seconds';
    };
    errorRate: {
      target: number;
      current: number;
      met: boolean;
      status: 'meeting' | 'violated';
    };
  };
  errorBudget: {
    availability: {
      allowedDowntime: {
        monthly: number;
        daily: number;
      };
      consumed: {
        percentage: number;
        minutes: number;
      };
    };
  };
}

export interface ActiveAlert {
  severity: 'critical' | 'warning' | 'info';
  metric: string;
  message: string;
  value?: number;
  threshold?: number;
  timestamp: string;
}

export interface AlertsResponse {
  timestamp: string;
  count: number;
  alerts: ActiveAlert[];
}

class MetricsAPIService {
  private client: AxiosInstance;
  private readonly baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 5000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Get system health metrics
   */
  async getHealth(): Promise<HealthMetrics> {
    const response = await this.client.get<HealthMetrics>('/metrics/health');
    return response.data;
  }

  /**
   * Get business KPI metrics
   */
  async getBusinessMetrics(): Promise<BusinessMetrics> {
    const response = await this.client.get<BusinessMetrics>('/metrics/business');
    return response.data;
  }

  /**
   * Get SLO compliance metrics
   */
  async getSLO(): Promise<SLOMetrics> {
    const response = await this.client.get<SLOMetrics>('/metrics/slo');
    return response.data;
  }

  /**
   * Get active alerts
   */
  async getAlerts(): Promise<AlertsResponse> {
    const response = await this.client.get<AlertsResponse>('/metrics/alerts');
    return response.data;
  }

  /**
   * Get raw Prometheus metrics (for debugging)
   */
  async getPrometheusMetrics(): Promise<string> {
    const response = await this.client.get('/metrics', {
      headers: { Accept: 'text/plain' },
    });
    return response.data;
  }

  /**
   * Quick health check (returns boolean)
   */
  async isHealthy(): Promise<boolean> {
    try {
      const health = await this.getHealth();
      return health.status === 'healthy';
    } catch {
      return false;
    }
  }
}

export const metricsAPI = new MetricsAPIService();
```

---

## 🔧 STEP 2: CREATE MONITORING HOOKS

**File**: `frontend/lib/hooks/useMonitoring.ts` (NEW)

```typescript
/**
 * React hooks for monitoring data
 */

import { useState, useEffect } from 'react';
import {
  metricsAPI,
  HealthMetrics,
  BusinessMetrics,
  SLOMetrics,
  AlertsResponse,
} from '../api/services/metrics-api.service';

/**
 * Hook to fetch and auto-refresh health metrics
 */
export function useHealthMetrics(refreshInterval: number = 10000) {
  const [health, setHealth] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const data = await metricsAPI.getHealth();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchHealth();
    const interval = setInterval(fetchHealth, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { health, loading, error };
}

/**
 * Hook to fetch and auto-refresh business metrics
 */
export function useBusinessMetrics(refreshInterval: number = 30000) {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const data = await metricsAPI.getBusinessMetrics();
        setMetrics(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { metrics, loading, error };
}

/**
 * Hook to fetch and auto-refresh SLO metrics
 */
export function useSLOMetrics(refreshInterval: number = 60000) {
  const [slo, setSLO] = useState<SLOMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchSLO = async () => {
      try {
        const data = await metricsAPI.getSLO();
        setSLO(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchSLO();
    const interval = setInterval(fetchSLO, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { slo, loading, error };
}

/**
 * Hook to fetch and auto-refresh active alerts
 */
export function useActiveAlerts(refreshInterval: number = 30000) {
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const data = await metricsAPI.getAlerts();
        setAlerts(data);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
    const interval = setInterval(fetchAlerts, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { alerts, loading, error };
}

/**
 * Simple health check hook
 */
export function useHealthCheck(refreshInterval: number = 30000) {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      const healthy = await metricsAPI.isHealthy();
      setIsHealthy(healthy);
    };

    checkHealth();
    const interval = setInterval(checkHealth, refreshInterval);

    return () => clearInterval(interval);
  }, [refreshInterval]);

  return isHealthy;
}
```

---

## 🔧 STEP 3: CREATE STATUS INDICATOR COMPONENT

**File**: `frontend/components/monitoring/SystemStatusIndicator.tsx` (NEW)

```typescript
/**
 * System Status Indicator Component
 * Shows real-time health status in the UI
 */

'use client';

import { useHealthCheck } from '@/lib/hooks/useMonitoring';

export function SystemStatusIndicator() {
  const isHealthy = useHealthCheck(30000); // Check every 30 seconds

  if (isHealthy === null) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <div className="h-2 w-2 rounded-full bg-gray-400 animate-pulse" />
        <span className="text-xs">Checking...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`h-2 w-2 rounded-full ${
          isHealthy ? 'bg-green-500' : 'bg-red-500'
        }`}
        title={isHealthy ? 'System Healthy' : 'System Degraded'}
      />
      <span className="text-xs text-gray-600">
        {isHealthy ? 'All Systems Operational' : 'System Issues Detected'}
      </span>
    </div>
  );
}
```

---

## 🔧 STEP 4: CREATE SLO DASHBOARD COMPONENT

**File**: `frontend/components/monitoring/SLODashboard.tsx` (NEW)

```typescript
/**
 * SLO Dashboard Component
 * Displays SLO compliance metrics
 */

'use client';

import { useSLOMetrics } from '@/lib/hooks/useMonitoring';

export function SLODashboard() {
  const { slo, loading, error } = useSLOMetrics(60000);

  if (loading) {
    return <div>Loading SLO metrics...</div>;
  }

  if (error) {
    return <div>Error loading SLO metrics: {error.message}</div>;
  }

  if (!slo) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Availability */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Availability</h3>
        <div className="mt-2">
          <div className="text-2xl font-bold">
            {(slo.slo.availability.current * 100).toFixed(3)}%
          </div>
          <div className="text-xs text-gray-500">
            Target: {(slo.slo.availability.target * 100).toFixed(1)}%
          </div>
          <div
            className={`mt-2 text-xs font-medium ${
              slo.slo.availability.met ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {slo.slo.availability.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Latency */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">
          Latency (P95)
        </h3>
        <div className="mt-2">
          <div className="text-2xl font-bold">
            {slo.slo.latency.current.toFixed(2)}s
          </div>
          <div className="text-xs text-gray-500">
            Target: {'<'}{slo.slo.latency.target}s
          </div>
          <div
            className={`mt-2 text-xs font-medium ${
              slo.slo.latency.met ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {slo.slo.latency.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Error Rate */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="text-sm font-medium text-gray-500">Error Rate</h3>
        <div className="mt-2">
          <div className="text-2xl font-bold">
            {(slo.slo.errorRate.current * 100).toFixed(3)}%
          </div>
          <div className="text-xs text-gray-500">
            Target: {'<'}{(slo.slo.errorRate.target * 100).toFixed(1)}%
          </div>
          <div
            className={`mt-2 text-xs font-medium ${
              slo.slo.errorRate.met ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {slo.slo.errorRate.status.toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## 🔧 STEP 5: CREATE ALERTS BANNER COMPONENT

**File**: `frontend/components/monitoring/AlertsBanner.tsx` (NEW)

```typescript
/**
 * Alerts Banner Component
 * Shows active system alerts
 */

'use client';

import { useActiveAlerts } from '@/lib/hooks/useMonitoring';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

export function AlertsBanner() {
  const { alerts } = useActiveAlerts(30000);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  if (!alerts || alerts.count === 0) {
    return null;
  }

  const visibleAlerts = alerts.alerts.filter(
    (alert) => !dismissed.has(`${alert.metric}-${alert.timestamp}`)
  );

  if (visibleAlerts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {visibleAlerts.map((alert) => {
        const alertKey = `${alert.metric}-${alert.timestamp}`;
        const bgColor =
          alert.severity === 'critical'
            ? 'bg-red-50 border-red-200'
            : alert.severity === 'warning'
            ? 'bg-yellow-50 border-yellow-200'
            : 'bg-blue-50 border-blue-200';

        const textColor =
          alert.severity === 'critical'
            ? 'text-red-800'
            : alert.severity === 'warning'
            ? 'text-yellow-800'
            : 'text-blue-800';

        return (
          <div
            key={alertKey}
            className={`${bgColor} border rounded-lg p-3 flex items-center justify-between`}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium uppercase ${textColor}`}
                >
                  {alert.severity}
                </span>
                <span className="text-sm font-medium">
                  {alert.message}
                </span>
              </div>
              {alert.value !== undefined && (
                <div className="text-xs text-gray-600 mt-1">
                  Current: {alert.value.toFixed(2)}
                  {alert.threshold && ` / Threshold: ${alert.threshold}`}
                </div>
              )}
            </div>
            <button
              onClick={() =>
                setDismissed((prev) => new Set(prev).add(alertKey))
              }
              className="p-1 hover:bg-white rounded"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

---

## 🔧 STEP 6: INTEGRATE INTO LAYOUT

**File**: `frontend/app/(researcher)/layout.tsx`

```typescript
import { SystemStatusIndicator } from '@/components/monitoring/SystemStatusIndicator';
import { AlertsBanner } from '@/components/monitoring/AlertsBanner';

export default function ResearcherLayout({ children }) {
  return (
    <div>
      {/* Add to header */}
      <header>
        <div className="flex items-center justify-between">
          <div>{/* Logo */}</div>
          <SystemStatusIndicator />
        </div>
      </header>

      {/* Add alerts banner */}
      <div className="container mx-auto px-4 py-2">
        <AlertsBanner />
      </div>

      {/* Main content */}
      <main>{children}</main>
    </div>
  );
}
```

---

## 🔧 STEP 7: ADD ADMIN MONITORING PAGE

**File**: `frontend/app/(researcher)/admin/monitoring/page.tsx` (NEW)

```typescript
/**
 * Admin Monitoring Dashboard Page
 * Full observability dashboard for administrators
 */

'use client';

import { SLODashboard } from '@/components/monitoring/SLODashboard';
import { useHealthMetrics, useBusinessMetrics } from '@/lib/hooks/useMonitoring';

export default function MonitoringPage() {
  const { health } = useHealthMetrics(10000);
  const { metrics } = useBusinessMetrics(30000);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">System Monitoring</h1>

      {/* SLO Compliance */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">SLO Compliance</h2>
        <SLODashboard />
      </section>

      {/* System Health */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Memory</h3>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {health?.resources.memory.percentage}%
              </div>
              <div className="text-xs text-gray-500">
                {health?.resources.memory.heapUsed} /{' '}
                {health?.resources.memory.heapTotal} MB
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">Uptime</h3>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {health?.uptime.formatted}
              </div>
              <div className="text-xs text-gray-500">
                {health?.uptime.seconds} seconds
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Metrics */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Business Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">
              Cache Hit Rate
            </h3>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {((metrics?.metrics.cache.hitRate || 0) * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500">
                {metrics?.metrics.cache.hits} hits /{' '}
                {metrics?.metrics.cache.misses} misses
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="text-sm font-medium text-gray-500">
              Database Health
            </h3>
            <div className="mt-2">
              <div className="text-2xl font-bold">
                {metrics?.metrics.database.healthy ? '✓' : '✗'}
              </div>
              <div className="text-xs text-gray-500">
                {metrics?.metrics.database.healthy
                  ? 'Healthy'
                  : 'Unhealthy'}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
```

---

## ✅ FRONTEND INTEGRATION CHECKLIST

- [ ] Create `metrics-api.service.ts`
- [ ] Create `useMonitoring.ts` hooks
- [ ] Create `SystemStatusIndicator.tsx` component
- [ ] Create `SLODashboard.tsx` component
- [ ] Create `AlertsBanner.tsx` component
- [ ] Add status indicator to layout header
- [ ] Add alerts banner to layout
- [ ] Create admin monitoring page
- [ ] Test with real backend
- [ ] Verify auto-refresh works

---

**Frontend Integration Status**: ✅ READY TO IMPLEMENT
**Estimated Time**: 2-3 hours
**Dependencies**: Backend Phase 6 complete
**Next Step**: Create the files and test with backend

---

*Last Updated: December 2, 2025*
*Monitoring Dashboard: `/admin/monitoring`*
