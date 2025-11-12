/**
 * Phase 10.1 Day 11: Enterprise-Grade Dev Manager Configuration
 * Zero Technical Debt - All values configurable via environment variables
 */

module.exports = {
  // Health Check Configuration
  healthCheck: {
    interval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 15000, // 15 seconds
    timeout: parseInt(process.env.HEALTH_CHECK_TIMEOUT) || 5000, // 5 seconds
    maxConsecutiveFailures: parseInt(process.env.MAX_HEALTH_FAILURES) || 3,
    verboseLogging: process.env.VERBOSE_HEALTH_CHECKS === 'true',
  },

  // Restart Configuration with Exponential Backoff
  restart: {
    initialDelay: parseInt(process.env.RESTART_INITIAL_DELAY) || 3000, // 3 seconds
    maxDelay: parseInt(process.env.RESTART_MAX_DELAY) || 60000, // 60 seconds (1 minute)
    maxAttempts: parseInt(process.env.RESTART_MAX_ATTEMPTS) || 10,
    backoffMultiplier: parseFloat(process.env.RESTART_BACKOFF_MULTIPLIER) || 2,
    restartDelay: parseInt(process.env.RESTART_DELAY) || 2000, // Delay before restart (2 seconds)
    integrationDelay: parseInt(process.env.INTEGRATION_DELAY) || 2000, // Wait before integration check
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info', // debug, info, warn, error
    maxFileSize: parseInt(process.env.LOG_MAX_FILE_SIZE) || 10485760, // 10MB
    maxFiles: parseInt(process.env.LOG_MAX_FILES) || 5,
    enableConsole: process.env.LOG_CONSOLE !== 'false',
    enableFile: process.env.LOG_FILE !== 'false',
    prettyPrint: process.env.LOG_PRETTY === 'true',
  },

  // Stall Detection Configuration
  stallDetection: {
    interval: parseInt(process.env.STALL_CHECK_INTERVAL) || 30000, // 30 seconds
    timeout: parseInt(process.env.STALL_TIMEOUT) || 180000, // 3 minutes
    enabled: process.env.STALL_DETECTION !== 'false',
  },

  // Port Configuration
  ports: {
    frontend: parseInt(process.env.FRONTEND_PORT) || 3000,
    backend: parseInt(process.env.BACKEND_PORT) || 4000,
    monitoring: parseInt(process.env.MONITORING_PORT) || 9090,
  },

  // Process Configuration
  process: {
    killTimeout: parseInt(process.env.PROCESS_KILL_TIMEOUT) || 20000, // 20 seconds
    startupTimeout: parseInt(process.env.PROCESS_STARTUP_TIMEOUT) || 30000, // 30 seconds
    detached: process.env.PROCESS_DETACHED === 'true', // false by default for dev
  },

  // Monitoring & Metrics
  monitoring: {
    enabled: process.env.MONITORING_ENABLED !== 'false',
    metricsEnabled: process.env.METRICS_ENABLED !== 'false',
    statusApiEnabled: process.env.STATUS_API_ENABLED !== 'false',
  },
};
