/**
 * API Configuration
 * Phase 10.91 Day 1 Step 7: Centralized API configuration
 *
 * Purpose:
 * - Single source of truth for all API endpoints
 * - Environment-aware configuration (dev, staging, production)
 * - Easy to update and maintain
 * - Type-safe configuration with TypeScript
 *
 * Usage:
 * ```tsx
 * import { API_CONFIG } from '@/lib/config/api.config';
 *
 * const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LITERATURE.SEARCH}`);
 * ```
 */

/**
 * Get base API URL from environment variables
 * Falls back to localhost:4000 for development
 */
const getBaseUrl = (): string => {
  // Server-side: Use internal network URL if available
  if (typeof window === 'undefined') {
    return process.env['API_URL_INTERNAL'] || process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000';
  }

  // Client-side: Use public URL
  return process.env['NEXT_PUBLIC_API_URL'] || 'http://localhost:4000';
};

/**
 * Main API Configuration Object
 */
export const API_CONFIG = {
  /**
   * Base API URL
   * Example: 'http://localhost:4000' or 'https://api.production.com'
   */
  BASE_URL: getBaseUrl(),

  /**
   * WebSocket Configuration
   */
  WEBSOCKET: {
    BASE_URL: getBaseUrl(),
    TRANSPORTS: ['websocket', 'polling'] as ('websocket' | 'polling')[],
    RECONNECTION: true,
    RECONNECTION_ATTEMPTS: 5,
    RECONNECTION_DELAY: 1000,
    TIMEOUT: 10000,
    
    // WebSocket Namespaces
    NAMESPACES: {
      THEME_EXTRACTION: '/theme-extraction',
      NOTIFICATIONS: '/notifications',
    },
  },

  /**
   * API Endpoints
   * Organized by feature domain
   */
  ENDPOINTS: {
    // Literature Search & Discovery
    LITERATURE: {
      SEARCH: '/api/literature/search',
      PAPER_DETAILS: '/api/literature/paper',
      SAVE_PAPER: '/api/literature/papers',
      DELETE_PAPER: '/api/literature/papers',
      USER_LIBRARY: '/api/literature/papers/user',
      EXPORT_CITATIONS: '/api/literature/export-citations',
      SEARCH_ALTERNATIVE: '/api/literature/search-alternative-sources',
    },

    // Theme Extraction
    THEMES: {
      EXTRACT: '/api/literature/extract-themes',
      LIST: '/api/literature/themes',
      DELETE: '/api/literature/themes',
      SUGGEST_QUESTIONS: '/api/literature/suggest-questions',
      GENERATE_HYPOTHESES: '/api/literature/generate-hypotheses',
      MAP_CONSTRUCTS: '/api/literature/map-constructs',
      GENERATE_STATEMENTS: '/api/literature/generate-statements',
      GENERATE_SURVEY: '/api/literature/generate-survey',
    },

    // Corpus Management
    CORPUS: {
      LIST: '/api/literature/corpus',
      CREATE: '/api/literature/corpus',
      DELETE: '/api/literature/corpus',
      DETAILS: '/api/literature/corpus',
    },

    // Research Artifacts
    RESEARCH: {
      SAVE_QUESTIONS: '/api/literature/research-questions',
      SAVE_HYPOTHESES: '/api/literature/hypotheses',
    },

    // Authentication & User
    AUTH: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      LOGOUT: '/api/auth/logout',
      REFRESH: '/api/auth/refresh',
      PROFILE: '/api/auth/profile',
    },

    // Analytics & Logging
    ANALYTICS: {
      LOGS: '/api/logs',
      EVENTS: '/api/analytics/events',
    },
  },

  /**
   * API Request Configuration
   */
  REQUEST: {
    /**
     * Default timeout for API requests (milliseconds)
     */
    TIMEOUT: 30000, // 30 seconds

    /**
     * Timeout for long-running operations like theme extraction
     */
    LONG_TIMEOUT: 300000, // 5 minutes

    /**
     * Retry configuration
     */
    RETRY: {
      MAX_ATTEMPTS: 3,
      INITIAL_DELAY: 1000, // 1 second
      MAX_DELAY: 10000, // 10 seconds
      BACKOFF_MULTIPLIER: 2,
    },
  },

  /**
   * Pagination defaults
   */
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 20,
    MAX_PAGE_SIZE: 100,
  },

  /**
   * Feature Flags
   * Control feature availability based on environment
   */
  FEATURES: {
    ENABLE_WEBSOCKET: true,
    ENABLE_ANALYTICS: process.env.NODE_ENV === 'production',
    ENABLE_ERROR_REPORTING: process.env.NODE_ENV === 'production',
    ENABLE_PERFORMANCE_MONITORING: true,
  },
} as const;

/**
 * Build full URL for an endpoint
 *
 * @param endpoint - The endpoint path (e.g., '/api/literature/search')
 * @param params - Optional query parameters
 * @returns Full URL with base URL and query params
 *
 * @example
 * buildUrl('/api/literature/search', { query: 'machine learning', limit: 20 })
 * // Returns: 'http://localhost:4000/api/literature/search?query=machine+learning&limit=20'
 */
export function buildUrl(
  endpoint: string,
  params?: Record<string, string | number | boolean>
): string {
  const url = new URL(endpoint, API_CONFIG.BASE_URL);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, String(value));
    });
  }
  
  return url.toString();
}

/**
 * Get full WebSocket URL for a namespace
 *
 * @param namespace - WebSocket namespace (e.g., '/theme-extraction')
 * @returns Full WebSocket URL
 *
 * @example
 * getWebSocketUrl('/theme-extraction')
 * // Returns: 'http://localhost:4000/theme-extraction'
 */
export function getWebSocketUrl(namespace: string): string {
  return `${API_CONFIG.WEBSOCKET.BASE_URL}${namespace}`;
}

/**
 * Check if a feature is enabled
 *
 * @param feature - Feature key from API_CONFIG.FEATURES
 * @returns Boolean indicating if feature is enabled
 *
 * @example
 * if (isFeatureEnabled('ENABLE_ANALYTICS')) {
 *   trackEvent('page_view');
 * }
 */
export function isFeatureEnabled(feature: keyof typeof API_CONFIG.FEATURES): boolean {
  return API_CONFIG.FEATURES[feature];
}

/**
 * Environment helpers
 */
export const ENV = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
} as const;

/**
 * Type exports for type-safe configuration usage
 */
export type ApiEndpoint = typeof API_CONFIG.ENDPOINTS;
export type WebSocketConfig = typeof API_CONFIG.WEBSOCKET;
export type RequestConfig = typeof API_CONFIG.REQUEST;

