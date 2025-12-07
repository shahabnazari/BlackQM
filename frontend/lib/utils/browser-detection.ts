/**
 * Phase 10.93 Day 9 - Browser Detection and Compatibility Utility
 *
 * Enterprise-grade browser detection with feature capability checks.
 * Used for conditional polyfills, browser-specific optimizations,
 * and compatibility testing.
 *
 * @module browser-detection
 * @since Phase 10.93 Day 9
 * @author VQMethod Team
 * @enterprise-grade Production-ready with comprehensive browser support
 */

/**
 * Supported browser types
 */
export type BrowserType =
  | 'chrome'
  | 'firefox'
  | 'safari'
  | 'edge'
  | 'opera'
  | 'ie'
  | 'samsung'
  | 'unknown';

/**
 * Supported operating systems
 */
export type OperatingSystem =
  | 'windows'
  | 'macos'
  | 'linux'
  | 'ios'
  | 'android'
  | 'unknown';

/**
 * Browser information interface
 */
export interface BrowserInfo {
  /** Browser type */
  type: BrowserType;
  /** Browser version */
  version: string;
  /** Operating system */
  os: OperatingSystem;
  /** Is mobile device */
  isMobile: boolean;
  /** Is tablet device */
  isTablet: boolean;
  /** Is desktop device */
  isDesktop: boolean;
  /** Screen width */
  screenWidth: number;
  /** Screen height */
  screenHeight: number;
  /** Viewport width */
  viewportWidth: number;
  /** Viewport height */
  viewportHeight: number;
  /** Device pixel ratio */
  devicePixelRatio: number;
  /** Touch support */
  hasTouch: boolean;
  /** User agent string */
  userAgent: string;
}

/**
 * Feature support interface
 */
export interface FeatureSupport {
  /** Service Worker API */
  serviceWorker: boolean;
  /** IndexedDB API */
  indexedDB: boolean;
  /** Local Storage */
  localStorage: boolean;
  /** Session Storage */
  sessionStorage: boolean;
  /** Web Workers */
  webWorkers: boolean;
  /** WebGL */
  webGL: boolean;
  /** WebRTC */
  webRTC: boolean;
  /** Geolocation */
  geolocation: boolean;
  /** Notifications API */
  notifications: boolean;
  /** Clipboard API */
  clipboard: boolean;
  /** IntersectionObserver */
  intersectionObserver: boolean;
  /** ResizeObserver */
  resizeObserver: boolean;
  /** MutationObserver */
  mutationObserver: boolean;
  /** CSS Grid */
  cssGrid: boolean;
  /** CSS Flexbox */
  cssFlexbox: boolean;
  /** ES6 Modules */
  esModules: boolean;
}

/**
 * Performance timing interface
 */
export interface PerformanceTiming {
  /** DNS lookup time */
  dnsTime: number;
  /** TCP connection time */
  tcpTime: number;
  /** Request time */
  requestTime: number;
  /** Response time */
  responseTime: number;
  /** DOM content loaded time */
  domContentLoadedTime: number;
  /** Page load time */
  loadTime: number;
  /** First paint time */
  firstPaint: number | null;
  /** First contentful paint */
  firstContentfulPaint: number | null;
  /** Largest contentful paint */
  largestContentfulPaint: number | null;
  /** Time to interactive */
  timeToInteractive: number | null;
}

/**
 * Constants for browser detection
 */
const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

/**
 * Detect browser type from user agent
 *
 * @param userAgent - User agent string
 * @returns Browser type
 */
function detectBrowserType(userAgent: string): BrowserType {
  const ua = userAgent.toLowerCase();

  // Edge (Chromium-based)
  if (ua.includes('edg/')) {
    return 'edge';
  }

  // Chrome
  if (ua.includes('chrome/') && !ua.includes('edg/')) {
    return 'chrome';
  }

  // Firefox
  if (ua.includes('firefox/')) {
    return 'firefox';
  }

  // Safari
  if (ua.includes('safari/') && !ua.includes('chrome/') && !ua.includes('edg/')) {
    return 'safari';
  }

  // Opera
  if (ua.includes('opr/') || ua.includes('opera/')) {
    return 'opera';
  }

  // Internet Explorer
  if (ua.includes('msie') || ua.includes('trident/')) {
    return 'ie';
  }

  // Samsung Internet
  if (ua.includes('samsungbrowser/')) {
    return 'samsung';
  }

  return 'unknown';
}

/**
 * Detect browser version
 *
 * @param userAgent - User agent string
 * @param browserType - Browser type
 * @returns Browser version
 */
function detectBrowserVersion(userAgent: string, browserType: BrowserType): string {
  const ua = userAgent.toLowerCase();

  try {
    switch (browserType) {
      case 'chrome': {
        const match = ua.match(/chrome\/(\d+\.\d+)/);
        return match?.[1] ?? 'unknown';
      }
      case 'firefox': {
        const match = ua.match(/firefox\/(\d+\.\d+)/);
        return match?.[1] ?? 'unknown';
      }
      case 'safari': {
        const match = ua.match(/version\/(\d+\.\d+)/);
        return match?.[1] ?? 'unknown';
      }
      case 'edge': {
        const match = ua.match(/edg\/(\d+\.\d+)/);
        return match?.[1] ?? 'unknown';
      }
      case 'opera': {
        const match = ua.match(/(opr|opera)\/(\d+\.\d+)/);
        return match?.[2] ?? 'unknown';
      }
      case 'samsung': {
        const match = ua.match(/samsungbrowser\/(\d+\.\d+)/);
        return match?.[1] ?? 'unknown';
      }
      default:
        return 'unknown';
    }
  } catch (error) {
    console.error('[BrowserDetection] Version detection failed:', error);
    return 'unknown';
  }
}

/**
 * Detect operating system
 *
 * @param userAgent - User agent string
 * @returns Operating system
 */
function detectOperatingSystem(userAgent: string): OperatingSystem {
  const ua = userAgent.toLowerCase();

  if (ua.includes('iphone') || ua.includes('ipad') || ua.includes('ipod')) {
    return 'ios';
  }

  if (ua.includes('android')) {
    return 'android';
  }

  if (ua.includes('win')) {
    return 'windows';
  }

  if (ua.includes('mac')) {
    return 'macos';
  }

  if (ua.includes('linux') || ua.includes('x11')) {
    return 'linux';
  }

  return 'unknown';
}

/**
 * Detect if device is mobile
 *
 * @param userAgent - User agent string
 * @param screenWidth - Screen width
 * @returns True if mobile
 */
function detectIsMobile(userAgent: string, screenWidth: number): boolean {
  const ua = userAgent.toLowerCase();
  const hasMobileKeywords =
    ua.includes('mobile') ||
    ua.includes('android') ||
    ua.includes('iphone') ||
    ua.includes('ipod');

  return hasMobileKeywords || screenWidth < MOBILE_BREAKPOINT;
}

/**
 * Detect if device is tablet
 *
 * @param userAgent - User agent string
 * @param screenWidth - Screen width
 * @returns True if tablet
 */
function detectIsTablet(userAgent: string, screenWidth: number): boolean {
  const ua = userAgent.toLowerCase();
  const hasTabletKeywords = ua.includes('ipad') || ua.includes('tablet');

  return (
    hasTabletKeywords ||
    (screenWidth >= MOBILE_BREAKPOINT && screenWidth < TABLET_BREAKPOINT)
  );
}

/**
 * Get browser information
 *
 * Server-safe: Returns default values if window is not available
 *
 * @returns Browser information
 */
export function getBrowserInfo(): BrowserInfo {
  // Server-side rendering fallback
  if (typeof window === 'undefined') {
    return {
      type: 'unknown',
      version: 'unknown',
      os: 'unknown',
      isMobile: false,
      isTablet: false,
      isDesktop: true,
      screenWidth: 1920,
      screenHeight: 1080,
      viewportWidth: 1920,
      viewportHeight: 1080,
      devicePixelRatio: 1,
      hasTouch: false,
      userAgent: 'SSR',
    };
  }

  const userAgent = window.navigator.userAgent;
  const browserType = detectBrowserType(userAgent);
  const version = detectBrowserVersion(userAgent, browserType);
  const os = detectOperatingSystem(userAgent);

  const screenWidth = window.screen.width;
  const screenHeight = window.screen.height;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const devicePixelRatio = window.devicePixelRatio || 1;

  // STRICT AUDIT FIX: TYPE-001 & BUG-001 - DocumentTouch is a legacy feature not in modern TypeScript
  // Use type assertion for legacy browser support
  const windowWithLegacyFeatures = window as Window & {
    DocumentTouch?: typeof Document;
  };

  const hasTouch =
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    !!(windowWithLegacyFeatures.DocumentTouch &&
      document instanceof windowWithLegacyFeatures.DocumentTouch);

  const isMobile = detectIsMobile(userAgent, screenWidth);
  const isTablet = detectIsTablet(userAgent, screenWidth);
  const isDesktop = !isMobile && !isTablet;

  return {
    type: browserType,
    version,
    os,
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    screenHeight,
    viewportWidth,
    viewportHeight,
    devicePixelRatio,
    hasTouch,
    userAgent,
  };
}

/**
 * Check feature support
 *
 * Server-safe: Returns all false if window is not available
 *
 * @returns Feature support object
 */
export function checkFeatureSupport(): FeatureSupport {
  // Server-side rendering fallback
  if (typeof window === 'undefined') {
    return {
      serviceWorker: false,
      indexedDB: false,
      localStorage: false,
      sessionStorage: false,
      webWorkers: false,
      webGL: false,
      webRTC: false,
      geolocation: false,
      notifications: false,
      clipboard: false,
      intersectionObserver: false,
      resizeObserver: false,
      mutationObserver: false,
      cssGrid: false,
      cssFlexbox: false,
      esModules: false,
    };
  }

  return {
    serviceWorker: 'serviceWorker' in navigator,
    indexedDB: 'indexedDB' in window,
    localStorage: (() => {
      try {
        const test = '__localStorage__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    })(),
    sessionStorage: (() => {
      try {
        const test = '__sessionStorage__';
        sessionStorage.setItem(test, test);
        sessionStorage.removeItem(test);
        return true;
      } catch {
        return false;
      }
    })(),
    webWorkers: 'Worker' in window,
    webGL: (() => {
      try {
        const canvas = document.createElement('canvas');
        return !!(
          canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        );
      } catch {
        return false;
      }
    })(),
    webRTC:
      'RTCPeerConnection' in window ||
      'webkitRTCPeerConnection' in window ||
      'mozRTCPeerConnection' in window,
    geolocation: 'geolocation' in navigator,
    notifications: 'Notification' in window,
    clipboard: 'clipboard' in navigator,
    intersectionObserver: 'IntersectionObserver' in window,
    resizeObserver: 'ResizeObserver' in window,
    mutationObserver: 'MutationObserver' in window,
    cssGrid: CSS.supports('display', 'grid'),
    cssFlexbox: CSS.supports('display', 'flex'),
    esModules: 'noModule' in document.createElement('script'),
  };
}

/**
 * Get performance timing metrics
 *
 * Server-safe: Returns null values if not available
 *
 * @returns Performance timing metrics
 */
export function getPerformanceTiming(): PerformanceTiming {
  if (typeof window === 'undefined' || !window.performance) {
    return {
      dnsTime: 0,
      tcpTime: 0,
      requestTime: 0,
      responseTime: 0,
      domContentLoadedTime: 0,
      loadTime: 0,
      firstPaint: null,
      firstContentfulPaint: null,
      largestContentfulPaint: null,
      timeToInteractive: null,
    };
  }

  const timing = window.performance.timing;
  const navigation = timing.navigationStart;

  // Navigation Timing API
  const dnsTime = timing.domainLookupEnd - timing.domainLookupStart;
  const tcpTime = timing.connectEnd - timing.connectStart;
  const requestTime = timing.responseStart - timing.requestStart;
  const responseTime = timing.responseEnd - timing.responseStart;
  const domContentLoadedTime = timing.domContentLoadedEventEnd - navigation;
  const loadTime = timing.loadEventEnd - navigation;

  // Paint Timing API
  let firstPaint: number | null = null;
  let firstContentfulPaint: number | null = null;

  if (window.performance.getEntriesByType) {
    const paintEntries = window.performance.getEntriesByType('paint');
    paintEntries.forEach((entry) => {
      if (entry.name === 'first-paint') {
        firstPaint = entry.startTime;
      } else if (entry.name === 'first-contentful-paint') {
        firstContentfulPaint = entry.startTime;
      }
    });
  }

  // Largest Contentful Paint (LCP)
  let largestContentfulPaint: number | null = null;
  if ('PerformanceObserver' in window) {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & {
          renderTime?: number;
          loadTime?: number;
        };
        largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime || null;
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    } catch {
      // LCP not supported
    }
  }

  // Time to Interactive (estimated)
  const timeToInteractive = domContentLoadedTime;

  return {
    dnsTime,
    tcpTime,
    requestTime,
    responseTime,
    domContentLoadedTime,
    loadTime,
    firstPaint,
    firstContentfulPaint,
    largestContentfulPaint,
    timeToInteractive,
  };
}

/**
 * Check if browser is supported
 *
 * STRICT AUDIT FIX: DX-001 - Added explicit documentation for default behavior
 *
 * @param minVersions - Minimum supported versions per browser (default: {} = all versions accepted)
 * @returns True if supported
 *
 * @example
 * // Accept all browser versions
 * isBrowserSupported()
 *
 * @example
 * // Require minimum versions
 * isBrowserSupported({ chrome: 100, firefox: 100, safari: 15 })
 */
export function isBrowserSupported(
  minVersions: Partial<Record<BrowserType, number>> = {}
): boolean {
  const info = getBrowserInfo();

  // Unknown browser - assume not supported
  if (info.type === 'unknown') {
    return false;
  }

  // Internet Explorer - not supported
  if (info.type === 'ie') {
    return false;
  }

  // Check minimum version if specified
  if (minVersions[info.type]) {
    const currentVersion = parseFloat(info.version);
    const minVersion = minVersions[info.type]!;

    if (isNaN(currentVersion) || currentVersion < minVersion) {
      return false;
    }
  }

  return true;
}

/**
 * Get formatted browser string for logging
 *
 * @returns Formatted browser string
 */
export function getBrowserString(): string {
  const info = getBrowserInfo();
  const device = info.isMobile ? 'Mobile' : info.isTablet ? 'Tablet' : 'Desktop';

  return `${info.type} ${info.version} on ${info.os} (${device})`;
}

/**
 * Log browser information to console (development only)
 */
export function logBrowserInfo(): void {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  const info = getBrowserInfo();
  const features = checkFeatureSupport();
  const timing = getPerformanceTiming();

  console.group('[Browser Detection]');
  console.log('Browser:', info.type, info.version);
  console.log('OS:', info.os);
  console.log('Device:', info.isMobile ? 'Mobile' : info.isTablet ? 'Tablet' : 'Desktop');
  console.log('Screen:', `${info.screenWidth}x${info.screenHeight}`);
  console.log('Viewport:', `${info.viewportWidth}x${info.viewportHeight}`);
  console.log('DPR:', info.devicePixelRatio);
  console.log('Touch:', info.hasTouch ? 'Yes' : 'No');
  console.groupEnd();

  console.group('[Feature Support]');
  Object.entries(features).forEach(([feature, supported]) => {
    console.log(`${feature}:`, supported ? '✅' : '❌');
  });
  console.groupEnd();

  console.group('[Performance Timing]');
  console.log('DNS Time:', `${timing.dnsTime}ms`);
  console.log('TCP Time:', `${timing.tcpTime}ms`);
  console.log('Request Time:', `${timing.requestTime}ms`);
  console.log('Response Time:', `${timing.responseTime}ms`);
  console.log('DOM Content Loaded:', `${timing.domContentLoadedTime}ms`);
  console.log('Page Load:', `${timing.loadTime}ms`);
  if (timing.firstPaint) {
    console.log('First Paint:', `${timing.firstPaint}ms`);
  }
  if (timing.firstContentfulPaint) {
    console.log('First Contentful Paint:', `${timing.firstContentfulPaint}ms`);
  }
  console.groupEnd();
}
