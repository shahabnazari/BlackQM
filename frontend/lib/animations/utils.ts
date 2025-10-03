/**
 * Animation Utilities
 * Helper functions for animation calculations and optimizations
 */

import { PERFORMANCE_CONFIG, A11Y_CONFIG } from './constants';

/**
 * Check if user prefers reduced motion
 */
export const prefersReducedMotion = (): boolean => {
  if (!A11Y_CONFIG.respectPrefersReducedMotion) return false;
  
  if (typeof window === 'undefined') return false;
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
};

/**
 * Get animation duration based on reduced motion preference
 */
export const getAnimationDuration = (duration: number): number => {
  if (prefersReducedMotion()) {
    return duration * 0.01; // Almost instant for reduced motion
  }
  return duration;
};

/**
 * Calculate magnetic hover effect position
 */
export const calculateMagneticPosition = (
  mouseX: number,
  mouseY: number,
  elementRect: DOMRect,
  attractionRadius: number = 30,
  strength: number = 0.5
): { x: number; y: number } => {
  const elementCenterX = elementRect.left + elementRect.width / 2;
  const elementCenterY = elementRect.top + elementRect.height / 2;
  
  const deltaX = mouseX - elementCenterX;
  const deltaY = mouseY - elementCenterY;
  
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  
  if (distance < attractionRadius) {
    const force = (1 - distance / attractionRadius) * strength;
    return {
      x: deltaX * force,
      y: deltaY * force,
    };
  }
  
  return { x: 0, y: 0 };
};

/**
 * Generate random loading message
 */
export const getRandomLoadingMessage = (messages: readonly string[]): string => {
  const index = Math.floor(Math.random() * messages.length);
  return messages[index] || 'Loading...';
};

/**
 * Create shimmer animation keyframes
 */
export const createShimmerKeyframes = (): string => {
  return `
    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }
  `;
};

/**
 * Calculate stagger delay for list animations
 */
export const calculateStaggerDelay = (
  index: number,
  baseDelay: number = 0.05,
  maxDelay: number = 0.5
): number => {
  return Math.min(index * baseDelay, maxDelay);
};

/**
 * Apply GPU acceleration to element
 */
export const applyGpuAcceleration = (styles: React.CSSProperties): React.CSSProperties => {
  if (!PERFORMANCE_CONFIG.enableGpuAcceleration) return styles;
  
  return {
    ...styles,
    transform: styles.transform || 'translateZ(0)',
    willChange: PERFORMANCE_CONFIG.enableWillChange ? 'transform, opacity' : 'auto',
  };
};

/**
 * Calculate spring physics for drag animations
 */
export const calculateSpringPhysics = (
  _velocity: number,
  stiffness: number = 300,
  damping: number = 30
): { duration: number; bounce: number } => {
  const criticalDamping = 2 * Math.sqrt(stiffness);
  const dampingRatio = damping / criticalDamping;
  
  const duration = 1 / Math.sqrt(stiffness) * 1000; // Convert to ms
  const bounce = Math.max(0, 1 - dampingRatio);
  
  return { duration, bounce };
};

/**
 * Debounce animation triggers for performance
 */
export const debounceAnimation = <T extends (...args: any[]) => any>(
  func: T,
  delay: number = 100
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

/**
 * Throttle animation updates for performance
 */
export const throttleAnimation = <T extends (...args: any[]) => any>(
  func: T,
  limit: number = 16 // ~60fps
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

/**
 * Calculate easing curve points for custom animations
 */
export const calculateEasingPoints = (
  easing: string,
  steps: number = 60
): number[] => {
  const points: number[] = [];
  const match = easing.match(/cubic-bezier\(([\d.]+),\s*([\d.]+),\s*([\d.]+),\s*([\d.]+)\)/);
  
  if (match) {
    const [, _x1, y1, _x2, y2] = match.map(Number);

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const y = cubicBezier(t, 0, y1 || 0, y2 || 0, 1);
      points.push(y);
    }
  }
  
  return points;
};

/**
 * Cubic bezier calculation
 */
const cubicBezier = (
  t: number,
  p0: number,
  p1: number,
  p2: number,
  p3: number
): number => {
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  
  return mt3 * p0 + 3 * mt2 * t * p1 + 3 * mt * t2 * p2 + t3 * p3;
};

/**
 * Format animation CSS variable
 */
export const formatAnimationVar = (
  property: string,
  value: string | number
): string => {
  return `--animation-${property}: ${value}`;
};

/**
 * Create CSS transition string
 */
export const createTransition = (
  properties: string[],
  duration: number = 300,
  easing: string = 'ease'
): string => {
  return properties
    .map((prop: any) => `${prop} ${duration}ms ${easing}`)
    .join(', ');
};

/**
 * Check if element is in viewport for lazy animations
 */
export const isInViewport = (element: HTMLElement, threshold: number = 0): boolean => {
  const rect = element.getBoundingClientRect();
  
  return (
    rect.top <= (window.innerHeight || document.documentElement.clientHeight) + threshold &&
    rect.bottom >= -threshold &&
    rect.left <= (window.innerWidth || document.documentElement.clientWidth) + threshold &&
    rect.right >= -threshold
  );
};

/**
 * Request animation frame with fallback
 */
export const raf = (callback: FrameRequestCallback): number => {
  if (typeof window !== 'undefined' && window.requestAnimationFrame) {
    return window.requestAnimationFrame(callback);
  }
  return setTimeout(callback, 16) as unknown as number;
};

/**
 * Cancel animation frame with fallback
 */
export const cancelRaf = (id: number): void => {
  if (typeof window !== 'undefined' && window.cancelAnimationFrame) {
    window.cancelAnimationFrame(id);
  } else {
    clearTimeout(id);
  }
};