/**
 * PHASE 10.102 PHASE 6: METRICS API SERVICE
 *
 * Netflix-Grade Monitoring - Frontend API Client
 *
 * This service provides a typed interface to the backend monitoring endpoints:
 * - /metrics (Prometheus format)
 * - /metrics/health (System health)
 * - /metrics/business (Business metrics)
 * - /metrics/slo (SLO tracking)
 * - /metrics/performance (Performance data)
 * - /metrics/alerts (Active alerts)
 *
 * Used by React hooks to fetch real-time monitoring data.
 */

import { getAuthHeaders } from '../utils/auth-headers';

const API_BASE_URL = process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000/api';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface HealthMetrics {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  uptimeFormatted: string;
  checks: {
    database: boolean;
    cache: boolean;
    externalApis: boolean;
  };
  resources: {
    cpuUsage: number;
    memoryUsage: number;
    eventLoopLag: number;
  };
  timestamp: string;
}

export interface BusinessMetrics {
  searches: {
    total: number;
    last24h: number;
    bySource: Record<string, number>;
  };
  themeExtractions: {
    total: number;
    last24h: number;
    byPurpose: Record<string, number>;
  };
  papers: {
    totalSaved: number;
    totalProcessed: number;
  };
  users: {
    activeUsers: number;
    totalUsers: number;
  };
  timestamp: string;
}

export interface SLOMetrics {
  availability: {
    target: number; // e.g., 0.999 (99.9%)
    current: number;
    status: 'meeting' | 'at_risk' | 'breached';
  };
  latency: {
    p50: number;
    p95: number;
    p99: number;
    target: number; // e.g., 2000 (2 seconds for P95)
    status: 'meeting' | 'at_risk' | 'breached';
  };
  errorRate: {
    current: number; // e.g., 0.001 (0.1%)
    target: number; // e.g., 0.001 (0.1%)
    status: 'meeting' | 'at_risk' | 'breached';
  };
  timestamp: string;
}

export interface PerformanceMetrics {
  http: {
    requestsPerSecond: number;
    averageLatency: number;
    p95Latency: number;
    p99Latency: number;
  };
  database: {
    activeConnections: number;
    queryLatency: number;
  };
  cache: {
    hitRate: number;
    missRate: number;
    entries: number;
  };
  timestamp: string;
}

export interface Alert {
  id: string;
  name: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  value: number;
  threshold: number;
  startedAt: string;
  duration: string;
}

export interface AlertsResponse {
  active: Alert[];
  count: {
    critical: number;
    warning: number;
    info: number;
  };
  timestamp: string;
}

// ============================================================================
// API SERVICE
// ============================================================================

export class MetricsApiService {
  /**
   * Get system health metrics
   * Endpoint: GET /metrics/health
   */
  static async getHealthMetrics(): Promise<HealthMetrics> {
    try {
      const response = await fetch(`${API_BASE_URL}/metrics/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch health metrics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[MetricsApiService] Failed to fetch health metrics:', error);
      throw error;
    }
  }

  /**
   * Get business metrics
   * Endpoint: GET /metrics/business
   */
  static async getBusinessMetrics(): Promise<BusinessMetrics> {
    try {
      const response = await fetch(`${API_BASE_URL}/metrics/business`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch business metrics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[MetricsApiService] Failed to fetch business metrics:', error);
      throw error;
    }
  }

  /**
   * Get SLO (Service Level Objective) metrics
   * Endpoint: GET /metrics/slo
   */
  static async getSLOMetrics(): Promise<SLOMetrics> {
    try {
      const response = await fetch(`${API_BASE_URL}/metrics/slo`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch SLO metrics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[MetricsApiService] Failed to fetch SLO metrics:', error);
      throw error;
    }
  }

  /**
   * Get performance metrics
   * Endpoint: GET /metrics/performance
   */
  static async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    try {
      const response = await fetch(`${API_BASE_URL}/metrics/performance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch performance metrics: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[MetricsApiService] Failed to fetch performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get active alerts
   * Endpoint: GET /metrics/alerts
   */
  static async getAlerts(): Promise<AlertsResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/metrics/alerts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch alerts: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('[MetricsApiService] Failed to fetch alerts:', error);
      throw error;
    }
  }

  /**
   * Get raw Prometheus metrics (text format)
   * Endpoint: GET /metrics
   */
  static async getPrometheusMetrics(): Promise<string> {
    try {
      const response = await fetch(`${API_BASE_URL}/metrics`, {
        method: 'GET',
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch Prometheus metrics: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.error('[MetricsApiService] Failed to fetch Prometheus metrics:', error);
      throw error;
    }
  }
}
