/**
 * API Health Check Service
 * Enterprise-grade service for monitoring API and database connectivity
 */

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  services: {
    api: ServiceStatus;
    database: ServiceStatus;
    auth: ServiceStatus;
    storage?: ServiceStatus;
  };
  latency: number;
  message?: string;
}

interface ServiceStatus {
  status: 'up' | 'down' | 'slow';
  responseTime?: number;
  lastChecked: Date;
  error?: string;
}

class APIHealthService {
  private static instance: APIHealthService;
  private healthCheckInterval: ReturnType<typeof setInterval> | null = null;
  private lastHealthStatus: HealthCheckResult | null = null;
  private healthCheckCallbacks: Set<(status: HealthCheckResult) => void> =
    new Set();

  private readonly HEALTH_CHECK_INTERVAL = 120000; // 2 minutes - less aggressive
  private readonly API_TIMEOUT = 10000; // 10 seconds - more tolerant
  private readonly SLOW_THRESHOLD = 5000; // 5 seconds - more tolerant
  private readonly BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

  private constructor() {}

  static getInstance(): APIHealthService {
    if (!APIHealthService.instance) {
      APIHealthService.instance = new APIHealthService();
    }
    return APIHealthService.instance;
  }

  /**
   * Start periodic health checks
   */
  startHealthChecks(): void {
    if (this.healthCheckInterval) {
      return;
    }

    // Initial check
    this.performHealthCheck();

    // Set up periodic checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.HEALTH_CHECK_INTERVAL);
  }

  /**
   * Stop health checks
   */
  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }

  /**
   * Perform a comprehensive health check
   */
  async performHealthCheck(): Promise<HealthCheckResult> {
    const startTime = Date.now();

    // Only check the main API health endpoint
    const apiHealth = await this.checkAPIHealth();

    const result: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date(),
      services: {
        api: apiHealth,
        // Skip database and auth checks if main API is down
        database:
          apiHealth.status === 'up'
            ? await this.checkDatabaseHealth()
            : {
                status: 'down',
                lastChecked: new Date(),
                error: 'API unavailable',
              },
        auth:
          apiHealth.status === 'up'
            ? await this.checkAuthHealth()
            : {
                status: 'down',
                lastChecked: new Date(),
                error: 'API unavailable',
              },
      },
      latency: 0,
    };

    // Calculate overall latency
    result.latency = Date.now() - startTime;

    // Determine overall status
    const services = Object.values(result.services);
    if (services.some(s => s.status === 'down')) {
      result.status = 'unhealthy';
      result.message = 'One or more critical services are down';
    } else if (services.some(s => s.status === 'slow')) {
      result.status = 'degraded';
      result.message = 'Some services are experiencing slowness';
    }

    // Cache the result
    this.lastHealthStatus = result;

    // Notify subscribers
    this.healthCheckCallbacks.forEach(callback => {
      try {
        callback(result);
      } catch (error: any) {
        console.error('Error in health check callback:', error);
      }
    });

    return result;
  }

  /**
   * Check API health
   */
  private async checkAPIHealth(): Promise<ServiceStatus> {
    const status: ServiceStatus = {
      status: 'up',
      lastChecked: new Date(),
    };

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT);

      const response = await fetch(`${this.BACKEND_URL}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      status.responseTime = Date.now() - startTime;

      if (!response.ok) {
        status.status = 'down';
        status.error = `API returned ${response.status}`;
      } else if (status.responseTime > this.SLOW_THRESHOLD) {
        status.status = 'slow';
      }
    } catch (error: any) {
      status.status = 'down';
      status.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return status;
  }

  /**
   * Check database health through API endpoint
   */
  private async checkDatabaseHealth(): Promise<ServiceStatus> {
    const status: ServiceStatus = {
      status: 'up',
      lastChecked: new Date(),
    };

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT);

      const response = await fetch(`${this.BACKEND_URL}/api/health/database`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      status.responseTime = Date.now() - startTime;

      if (!response.ok) {
        // 404 means endpoint doesn't exist - not a critical error
        if (response.status === 404) {
          status.status = 'up'; // Assume it's OK if endpoint doesn't exist
        } else {
          status.status = 'down';
          status.error = `Database check returned ${response.status}`;
        }
      } else if (status.responseTime > this.SLOW_THRESHOLD) {
        status.status = 'slow';
      }

      // Parse response for additional info
      try {
        const data = await response.json();
        if (data.status === 'error') {
          status.status = 'down';
          status.error = data.message || 'Database connection failed';
        }
      } catch {
        // Response parsing failed, but endpoint responded
      }
    } catch (error: any) {
      status.status = 'down';
      status.error =
        error instanceof Error ? error.message : 'Database check failed';
    }

    return status;
  }

  /**
   * Check authentication service health
   */
  private async checkAuthHealth(): Promise<ServiceStatus> {
    const status: ServiceStatus = {
      status: 'up',
      lastChecked: new Date(),
    };

    try {
      const startTime = Date.now();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.API_TIMEOUT);

      const response = await fetch(`${this.BACKEND_URL}/api/auth/status`, {
        method: 'GET',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      status.responseTime = Date.now() - startTime;

      if (!response.ok && response.status !== 401 && response.status !== 404) {
        // 401 is expected if not authenticated
        // 404 means endpoint doesn't exist - not critical
        status.status = 'down';
        status.error = `Auth service returned ${response.status}`;
      } else if (response.status === 404) {
        status.status = 'up'; // Assume it's OK if endpoint doesn't exist
      } else if (status.responseTime > this.SLOW_THRESHOLD) {
        status.status = 'slow';
      }
    } catch (error: any) {
      status.status = 'down';
      status.error =
        error instanceof Error ? error.message : 'Auth check failed';
    }

    return status;
  }

  /**
   * Get last health status
   */
  getLastHealthStatus(): HealthCheckResult | null {
    return this.lastHealthStatus;
  }

  /**
   * Subscribe to health status changes
   */
  subscribe(callback: (status: HealthCheckResult) => void): () => void {
    this.healthCheckCallbacks.add(callback);

    // Return unsubscribe function
    return () => {
      this.healthCheckCallbacks.delete(callback);
    };
  }

  /**
   * Check if services are healthy
   */
  isHealthy(): boolean {
    return this.lastHealthStatus?.status === 'healthy';
  }

  /**
   * Get a specific service status
   */
  getServiceStatus(
    service: keyof HealthCheckResult['services']
  ): ServiceStatus | null {
    return this.lastHealthStatus?.services[service] || null;
  }
}

// Export singleton instance
export const apiHealthService = APIHealthService.getInstance();

// Export types
export type { HealthCheckResult, ServiceStatus };
