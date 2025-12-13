/**
 * Phase 10.126: Reduced Motion Hook
 *
 * Accessibility hook that detects user's motion preference.
 * Respects prefers-reduced-motion media query for users who
 * experience motion sickness or prefer minimal animations.
 *
 * @module PipelineOrchestra
 * @since Phase 10.126
 */

import { useState, useEffect } from 'react';

/**
 * Hook to detect reduced motion preference
 *
 * @returns true if user prefers reduced motion
 *
 * @example
 * ```tsx
 * const reducedMotion = useReducedMotion();
 *
 * return (
 *   <motion.div
 *     animate={reducedMotion ? {} : { scale: [1, 1.1, 1] }}
 *     transition={reducedMotion ? { duration: 0 } : { duration: 0.3 }}
 *   />
 * );
 * ```
 */
export function useReducedMotion(): boolean {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    // Check if we're in browser environment
    if (typeof window === 'undefined') return;

    // Create media query
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    // Set initial value
    setReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handleChange = (event: MediaQueryListEvent) => {
      setReducedMotion(event.matches);
    };

    // Modern browsers
    mediaQuery.addEventListener('change', handleChange);

    // Cleanup
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  return reducedMotion;
}

/**
 * Get animation props based on reduced motion preference
 *
 * @param reducedMotion - Whether reduced motion is preferred
 * @param fullMotion - Animation props for full motion
 * @param reduced - Animation props for reduced motion (optional, defaults to static)
 * @returns Appropriate animation props
 *
 * @example
 * ```tsx
 * const reducedMotion = useReducedMotion();
 * const animProps = getMotionProps(
 *   reducedMotion,
 *   { animate: { rotate: 360 }, transition: { repeat: Infinity } },
 *   { animate: {}, transition: { duration: 0 } }
 * );
 * ```
 */
export function getMotionProps<T extends object>(
  reducedMotion: boolean,
  fullMotion: T,
  reduced?: Partial<T>
): T {
  if (reducedMotion) {
    return reduced ? { ...fullMotion, ...reduced } : ({} as T);
  }
  return fullMotion;
}

/**
 * Get transition duration based on reduced motion preference
 *
 * @param reducedMotion - Whether reduced motion is preferred
 * @param duration - Normal duration in seconds
 * @returns Duration (0 if reduced motion, normal otherwise)
 */
export function getTransitionDuration(
  reducedMotion: boolean,
  duration: number
): number {
  return reducedMotion ? 0 : duration;
}

/**
 * Get spring config based on reduced motion preference
 *
 * @param reducedMotion - Whether reduced motion is preferred
 * @param config - Normal spring config
 * @returns Spring config (instant if reduced motion)
 */
export function getSpringConfig(
  reducedMotion: boolean,
  config: { stiffness: number; damping: number; mass?: number }
): { stiffness: number; damping: number; mass?: number } | { duration: number } {
  if (reducedMotion) {
    return { duration: 0 };
  }
  return config;
}

export default useReducedMotion;
