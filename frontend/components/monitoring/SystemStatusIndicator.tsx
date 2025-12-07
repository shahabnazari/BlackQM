/**
 * PHASE 10.102 PHASE 6: SYSTEM STATUS INDICATOR
 *
 * Compact system health indicator for global display (e.g., in header/footer)
 *
 * Features:
 * - Real-time health status (healthy/degraded/unhealthy)
 * - Color-coded indicator (green/yellow/red)
 * - Tooltip with detailed metrics
 * - Auto-refresh every 30 seconds
 * - Accessible (ARIA labels, keyboard navigation)
 */

'use client';

import React from 'react';
import { useHealthMetrics } from '@/lib/hooks/useMonitoring';

export interface SystemStatusIndicatorProps {
  /**
   * Whether to show detailed tooltip on hover
   * @default true
   */
  showTooltip?: boolean;

  /**
   * Custom refresh interval in milliseconds
   * @default 30000 (30 seconds)
   */
  refreshInterval?: number;

  /**
   * CSS class name for custom styling
   */
  className?: string;
}

export const SystemStatusIndicator: React.FC<SystemStatusIndicatorProps> = ({
  showTooltip = true,
  refreshInterval = 30000,
  className = '',
}) => {
  const { data, loading, error } = useHealthMetrics({ refreshInterval });

  // Determine status
  const status = error ? 'unhealthy' : data?.status || 'unknown';

  // Status colors
  const statusColors = {
    healthy: 'bg-green-500',
    degraded: 'bg-yellow-500',
    unhealthy: 'bg-red-500',
    unknown: 'bg-gray-400',
  };

  // Status text
  const statusText = {
    healthy: 'All Systems Operational',
    degraded: 'Performance Degraded',
    unhealthy: 'System Issues Detected',
    unknown: 'Status Unknown',
  };

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      {/* Status Indicator Dot */}
      <div
        className={`h-3 w-3 rounded-full ${statusColors[status]} ${
          status === 'healthy' ? 'animate-pulse' : ''
        }`}
        aria-label={`System status: ${statusText[status]}`}
        role="status"
      />

      {/* Status Text */}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {loading ? 'Checking...' : statusText[status]}
      </span>

      {/* Detailed Tooltip (shown on hover) */}
      {showTooltip && data && (
        <div className="absolute left-0 top-full mt-2 z-50 hidden group-hover:block">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 min-w-[280px]">
            <h4 className="font-semibold text-sm mb-2 text-gray-900 dark:text-gray-100">
              System Health
            </h4>

            {/* Uptime */}
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">Uptime:</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">
                {data.uptimeFormatted}
              </span>
            </div>

            {/* CPU Usage */}
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">CPU Usage:</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">
                {data.resources.cpuUsage.toFixed(1)}%
              </span>
            </div>

            {/* Memory Usage */}
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-600 dark:text-gray-400">Memory Usage:</span>
              <span className="font-mono text-gray-900 dark:text-gray-100">
                {data.resources.memoryUsage.toFixed(1)}%
              </span>
            </div>

            {/* Health Checks */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <h5 className="font-semibold text-xs mb-2 text-gray-900 dark:text-gray-100">
                Health Checks
              </h5>
              <div className="space-y-1">
                <HealthCheck label="Database" status={data.checks.database} />
                <HealthCheck label="Cache" status={data.checks.cache} />
                <HealthCheck label="External APIs" status={data.checks.externalApis} />
              </div>
            </div>

            {/* Last Updated */}
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
              Last updated: {new Date(data.timestamp).toLocaleTimeString()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// HELPER COMPONENT: HEALTH CHECK
// ============================================================================

interface HealthCheckProps {
  label: string;
  status: boolean;
}

const HealthCheck: React.FC<HealthCheckProps> = ({ label, status }) => {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-gray-600 dark:text-gray-400">{label}:</span>
      <span
        className={`font-semibold ${
          status ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
        }`}
      >
        {status ? '✓ Healthy' : '✗ Unhealthy'}
      </span>
    </div>
  );
};

// ============================================================================
// USAGE EXAMPLE
// ============================================================================

/**
 * USAGE IN LAYOUT:
 *
 * ```tsx
 * // frontend/app/layout.tsx or header component
 * import { SystemStatusIndicator } from '@/components/monitoring/SystemStatusIndicator';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <header>
 *           <nav>
 *             ...
 *             <SystemStatusIndicator />
 *           </nav>
 *         </header>
 *         {children}
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 */
