/**
 * PHASE 10.102 PHASE 6: MONITORING DASHBOARD
 *
 * Comprehensive admin dashboard for system monitoring
 *
 * Features:
 * - Real-time health metrics (Golden Signals: Latency, Traffic, Errors, Saturation)
 * - Business KPIs (searches, theme extractions, papers, users)
 * - SLO tracking (availability, latency, error rate)
 * - Active alerts display
 * - Auto-refresh with manual refresh option
 * - Responsive grid layout
 * - Accessible (ARIA labels, semantic HTML)
 */

'use client';

import React from 'react';
import { useMonitoring } from '@/lib/hooks/useMonitoring';
import { AlertsBanner } from './AlertsBanner';

export interface MonitoringDashboardProps {
  /**
   * Auto-refresh interval in milliseconds
   * @default 30000 (30 seconds)
   */
  refreshInterval?: number;
}

export const MonitoringDashboard: React.FC<MonitoringDashboardProps> = ({
  refreshInterval = 30000,
}) => {
  const monitoring = useMonitoring({ refreshInterval });

  const { health, business, slo, alerts } = monitoring;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            System Monitoring
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Real-time performance and health metrics
          </p>
        </div>

        {/* Refresh Button */}
        <button
          onClick={() => {
            health.refresh();
            business.refresh();
            slo.refresh();
            alerts.refresh();
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          aria-label="Refresh all metrics"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Active Alerts */}
      <section aria-labelledby="alerts-heading">
        <h2 id="alerts-heading" className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Active Alerts
        </h2>
        <AlertsBanner criticalOnly={false} dismissible={true} />
        {!alerts.loading && (!alerts.data || alerts.data.active.length === 0) && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-4 text-green-800 dark:text-green-300">
            ✓ No active alerts - all systems operating normally
          </div>
        )}
      </section>

      {/* Golden Signals Grid */}
      <section aria-labelledby="golden-signals-heading">
        <h2 id="golden-signals-heading" className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Golden Signals (Google SRE Framework)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Signal 1: Latency (P95) */}
          <MetricCard
            title="Latency (P95)"
            value={slo.data?.latency.p95.toFixed(0) || '—'}
            unit="ms"
            status={slo.data?.latency.status || 'unknown'}
            target={`Target: <${slo.data?.latency.target || 2000}ms`}
            loading={slo.loading}
          />

          {/* Signal 2: Traffic (Requests/sec) */}
          <MetricCard
            title="Traffic"
            value={business.data?.searches.last24h.toString() || '—'}
            unit="searches/24h"
            status="meeting"
            target="Last 24 hours"
            loading={business.loading}
          />

          {/* Signal 3: Errors (Error Rate) */}
          <MetricCard
            title="Error Rate"
            value={
              slo.data
                ? `${(slo.data.errorRate.current * 100).toFixed(2)}`
                : '—'
            }
            unit="%"
            status={slo.data?.errorRate.status || 'unknown'}
            target={`Target: <${slo.data ? (slo.data.errorRate.target * 100).toFixed(2) : 0.1}%`}
            loading={slo.loading}
          />

          {/* Signal 4: Saturation (CPU/Memory) */}
          <MetricCard
            title="Saturation (CPU)"
            value={health.data?.resources.cpuUsage.toFixed(1) || '—'}
            unit="%"
            status={
              health.data
                ? health.data.resources.cpuUsage < 70
                  ? 'meeting'
                  : health.data.resources.cpuUsage < 85
                  ? 'at_risk'
                  : 'breached'
                : 'unknown'
            }
            target="Target: <70%"
            loading={health.loading}
          />
        </div>
      </section>

      {/* SLO Status */}
      <section aria-labelledby="slo-heading">
        <h2 id="slo-heading" className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Service Level Objectives (SLOs)
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Availability SLO */}
          <SLOCard
            title="Availability"
            current={slo.data?.availability.current || 0}
            target={slo.data?.availability.target || 0.999}
            status={slo.data?.availability.status || 'unknown'}
            loading={slo.loading}
          />

          {/* Latency SLO */}
          <SLOCard
            title="Latency (P95)"
            current={slo.data?.latency.p95 || 0}
            target={slo.data?.latency.target || 2000}
            status={slo.data?.latency.status || 'unknown'}
            unit="ms"
            loading={slo.loading}
          />

          {/* Error Rate SLO */}
          <SLOCard
            title="Error Rate"
            current={slo.data ? slo.data.errorRate.current * 100 : 0}
            target={slo.data ? slo.data.errorRate.target * 100 : 0.1}
            status={slo.data?.errorRate.status || 'unknown'}
            unit="%"
            inverse={true}
            loading={slo.loading}
          />
        </div>
      </section>

      {/* Business Metrics */}
      <section aria-labelledby="business-heading">
        <h2 id="business-heading" className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          Business Metrics
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Searches"
            value={business.data?.searches.total || 0}
            subtitle={`${business.data?.searches.last24h || 0} in last 24h`}
            loading={business.loading}
          />

          <StatCard
            title="Theme Extractions"
            value={business.data?.themeExtractions.total || 0}
            subtitle={`${business.data?.themeExtractions.last24h || 0} in last 24h`}
            loading={business.loading}
          />

          <StatCard
            title="Papers Saved"
            value={business.data?.papers.totalSaved || 0}
            subtitle={`${business.data?.papers.totalProcessed || 0} processed`}
            loading={business.loading}
          />

          <StatCard
            title="Active Users"
            value={business.data?.users.activeUsers || 0}
            subtitle={`${business.data?.users.totalUsers || 0} total users`}
            loading={business.loading}
          />
        </div>
      </section>

      {/* System Health */}
      <section aria-labelledby="health-heading">
        <h2 id="health-heading" className="text-xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
          System Health
        </h2>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Health Checks */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                Health Checks
              </h3>
              <div className="space-y-2">
                <HealthCheckRow
                  label="Database"
                  status={health.data?.checks.database || false}
                />
                <HealthCheckRow
                  label="Cache"
                  status={health.data?.checks.cache || false}
                />
                <HealthCheckRow
                  label="External APIs"
                  status={health.data?.checks.externalApis || false}
                />
              </div>
            </div>

            {/* Right Column: Resources */}
            <div>
              <h3 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                Resource Usage
              </h3>
              <div className="space-y-3">
                <ResourceBar
                  label="CPU Usage"
                  value={health.data?.resources.cpuUsage || 0}
                  max={100}
                  unit="%"
                />
                <ResourceBar
                  label="Memory Usage"
                  value={health.data?.resources.memoryUsage || 0}
                  max={100}
                  unit="%"
                />
                <ResourceBar
                  label="Event Loop Lag"
                  value={health.data?.resources.eventLoopLag || 0}
                  max={100}
                  unit="ms"
                />
              </div>
            </div>
          </div>

          {/* Uptime */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                System Uptime:
              </span>
              <span className="font-mono text-lg font-semibold text-gray-900 dark:text-gray-100">
                {health.data?.uptimeFormatted || '—'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Last Updated */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  );
};

// ============================================================================
// HELPER COMPONENTS
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string;
  unit: string;
  status: 'meeting' | 'at_risk' | 'breached' | 'unknown';
  target: string;
  loading: boolean;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  unit,
  status,
  target,
  loading,
}) => {
  const statusColors = {
    meeting: 'border-green-500 bg-green-50 dark:bg-green-900/20',
    at_risk: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
    breached: 'border-red-500 bg-red-50 dark:bg-red-900/20',
    unknown: 'border-gray-300 bg-gray-50 dark:bg-gray-900/20',
  };

  return (
    <div
      className={`${statusColors[status]} border-l-4 rounded-lg p-4`}
      role="region"
      aria-label={`${title} metric`}
    >
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
        {title}
      </h3>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          {loading ? '...' : value}
        </span>
        <span className="text-lg text-gray-600 dark:text-gray-400">{unit}</span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{target}</p>
    </div>
  );
};

interface SLOCardProps {
  title: string;
  current: number;
  target: number;
  status: 'meeting' | 'at_risk' | 'breached' | 'unknown';
  unit?: string;
  inverse?: boolean;
  loading: boolean;
}

const SLOCard: React.FC<SLOCardProps> = ({
  title,
  current,
  target,
  status,
  unit = '%',
  inverse = false,
  loading,
}) => {
  const percentage = inverse
    ? ((target - current) / target) * 100
    : (current / target) * 100;

  const statusColors = {
    meeting: 'text-green-600 dark:text-green-400',
    at_risk: 'text-yellow-600 dark:text-yellow-400',
    breached: 'text-red-600 dark:text-red-400',
    unknown: 'text-gray-600 dark:text-gray-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
        {title}
      </h3>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-3">
        <div
          className={`h-3 rounded-full transition-all ${
            status === 'meeting'
              ? 'bg-green-600'
              : status === 'at_risk'
              ? 'bg-yellow-600'
              : 'bg-red-600'
          }`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>

      {/* Values */}
      <div className="flex justify-between text-sm">
        <span className="text-gray-600 dark:text-gray-400">
          Current: <strong className="text-gray-900 dark:text-gray-100">{current.toFixed(2)}{unit}</strong>
        </span>
        <span className="text-gray-600 dark:text-gray-400">
          Target: <strong className="text-gray-900 dark:text-gray-100">{target.toFixed(2)}{unit}</strong>
        </span>
      </div>

      {/* Status */}
      <div className={`mt-2 text-sm font-semibold ${statusColors[status]}`}>
        {loading ? 'Loading...' : status === 'meeting' ? '✓ Meeting SLO' : status === 'at_risk' ? '⚠ At Risk' : '✗ Breached'}
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: number;
  subtitle: string;
  loading: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, subtitle, loading }) => {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
        {title}
      </h3>
      <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
        {loading ? '...' : value.toLocaleString()}
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
    </div>
  );
};

interface HealthCheckRowProps {
  label: string;
  status: boolean;
}

const HealthCheckRow: React.FC<HealthCheckRowProps> = ({ label, status }) => {
  return (
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}:</span>
      <span
        className={`text-sm font-semibold ${
          status ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}
      >
        {status ? '✓ Healthy' : '✗ Unhealthy'}
      </span>
    </div>
  );
};

interface ResourceBarProps {
  label: string;
  value: number;
  max: number;
  unit: string;
}

const ResourceBar: React.FC<ResourceBarProps> = ({ label, value, max, unit }) => {
  const percentage = (value / max) * 100;

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-600 dark:text-gray-400">{label}:</span>
        <span className="font-mono text-gray-900 dark:text-gray-100">
          {value.toFixed(1)}{unit}
        </span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            percentage < 70 ? 'bg-green-600' : percentage < 85 ? 'bg-yellow-600' : 'bg-red-600'
          }`}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        />
      </div>
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * USAGE IN ADMIN PAGE:
 *
 * ```tsx
 * // frontend/app/(admin)/monitoring/page.tsx
 * import { MonitoringDashboard } from '@/components/monitoring/MonitoringDashboard';
 *
 * export default function MonitoringPage() {
 *   return (
 *     <div>
 *       <MonitoringDashboard refreshInterval={30000} />
 *     </div>
 *   );
 * }
 * ```
 */
