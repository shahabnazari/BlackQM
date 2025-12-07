/**
 * PHASE 10.102 PHASE 6: ALERTS BANNER
 *
 * Global banner displaying critical system alerts
 *
 * Features:
 * - Shows critical alerts at top of page
 * - Auto-dismissible with user preference persistence
 * - Severity-based styling (critical=red, warning=yellow, info=blue)
 * - Auto-refresh every 15 seconds
 * - Accessible (ARIA live region, keyboard navigation)
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useAlerts } from '@/lib/hooks/useMonitoring';
import type { Alert } from '@/lib/api/services/metrics-api.service';

export interface AlertsBannerProps {
  /**
   * Whether to auto-refresh alerts
   * @default true
   */
  autoRefresh?: boolean;

  /**
   * Refresh interval in milliseconds
   * @default 15000 (15 seconds)
   */
  refreshInterval?: number;

  /**
   * Whether to allow dismissing the banner
   * @default true
   */
  dismissible?: boolean;

  /**
   * Only show critical alerts (hide warnings and info)
   * @default false
   */
  criticalOnly?: boolean;
}

export const AlertsBanner: React.FC<AlertsBannerProps> = ({
  autoRefresh = true,
  refreshInterval = 15000,
  dismissible = true,
  criticalOnly = false,
}) => {
  const { data, loading } = useAlerts({
    refreshInterval: autoRefresh ? refreshInterval : 0,
  });

  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Load dismissed alerts from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('dismissed_alerts');
    if (stored) {
      try {
        setDismissedAlerts(new Set(JSON.parse(stored)));
      } catch (error) {
        console.error('Failed to parse dismissed alerts from localStorage:', error);
      }
    }
  }, []);

  // Save dismissed alerts to localStorage
  const dismissAlert = (alertId: string) => {
    const updated = new Set(dismissedAlerts);
    updated.add(alertId);
    setDismissedAlerts(updated);
    localStorage.setItem('dismissed_alerts', JSON.stringify(Array.from(updated)));
  };

  // Clear dismissed alerts when new alerts arrive
  useEffect(() => {
    if (data?.active && data.active.length > 0) {
      const activeAlertIds = new Set(data.active.map((a) => a.id));
      const stillRelevant = Array.from(dismissedAlerts).filter((id) =>
        activeAlertIds.has(id)
      );
      if (stillRelevant.length !== dismissedAlerts.size) {
        setDismissedAlerts(new Set(stillRelevant));
        localStorage.setItem('dismissed_alerts', JSON.stringify(stillRelevant));
      }
    }
  }, [data, dismissedAlerts]);

  // Filter alerts
  const activeAlerts = (data?.active || []).filter((alert) => {
    // Filter by severity
    if (criticalOnly && alert.severity !== 'critical') {
      return false;
    }
    // Filter dismissed alerts
    return !dismissedAlerts.has(alert.id);
  });

  // Don't render if no active alerts
  if (!loading && activeAlerts.length === 0) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="w-full"
    >
      {activeAlerts.map((alert) => (
        <AlertItem
          key={alert.id}
          alert={alert}
          dismissible={dismissible}
          onDismiss={() => dismissAlert(alert.id)}
        />
      ))}
    </div>
  );
};

// ============================================================================
// ALERT ITEM COMPONENT
// ============================================================================

interface AlertItemProps {
  alert: Alert;
  dismissible: boolean;
  onDismiss: () => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, dismissible, onDismiss }) => {
  // Severity styling
  const severityStyles = {
    critical: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      border: 'border-red-300 dark:border-red-700',
      text: 'text-red-800 dark:text-red-300',
      icon: '🔴',
    },
    warning: {
      bg: 'bg-yellow-50 dark:bg-yellow-900/20',
      border: 'border-yellow-300 dark:border-yellow-700',
      text: 'text-yellow-800 dark:text-yellow-300',
      icon: '⚠️',
    },
    info: {
      bg: 'bg-blue-50 dark:bg-blue-900/20',
      border: 'border-blue-300 dark:border-blue-700',
      text: 'text-blue-800 dark:text-blue-300',
      icon: 'ℹ️',
    },
  };

  const styles = severityStyles[alert.severity];

  return (
    <div
      className={`${styles.bg} ${styles.border} border-l-4 p-4 mb-2`}
      role="alert"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          {/* Icon */}
          <span className="text-xl" aria-hidden="true">
            {styles.icon}
          </span>

          {/* Alert Content */}
          <div className="flex-1">
            <h3 className={`font-semibold text-sm ${styles.text}`}>
              {alert.name}
            </h3>
            <p className={`text-sm mt-1 ${styles.text}`}>
              {alert.description}
            </p>

            {/* Alert Details */}
            <div className={`flex gap-4 mt-2 text-xs ${styles.text}`}>
              <span>
                <strong>Value:</strong> {alert.value.toFixed(2)}
              </span>
              <span>
                <strong>Threshold:</strong> {alert.threshold.toFixed(2)}
              </span>
              <span>
                <strong>Duration:</strong> {alert.duration}
              </span>
            </div>
          </div>
        </div>

        {/* Dismiss Button */}
        {dismissible && (
          <button
            onClick={onDismiss}
            className={`ml-4 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 ${styles.text}`}
            aria-label={`Dismiss ${alert.name} alert`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        )}
      </div>
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
 * // frontend/app/layout.tsx
 * import { AlertsBanner } from '@/components/monitoring/AlertsBanner';
 *
 * export default function RootLayout({ children }) {
 *   return (
 *     <html>
 *       <body>
 *         <AlertsBanner criticalOnly />
 *         <main>{children}</main>
 *       </body>
 *     </html>
 *   );
 * }
 * ```
 *
 * USAGE IN ADMIN DASHBOARD:
 *
 * ```tsx
 * // frontend/app/(admin)/monitoring/page.tsx
 * import { AlertsBanner } from '@/components/monitoring/AlertsBanner';
 *
 * export default function MonitoringPage() {
 *   return (
 *     <div>
 *       <h1>System Monitoring</h1>
 *       <AlertsBanner criticalOnly={false} dismissible={true} />
 *     </div>
 *   );
 * }
 * ```
 */
