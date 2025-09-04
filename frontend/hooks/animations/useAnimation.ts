/**
 * useAnimation Hook
 * Core animation hook for managing animation states and preferences
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { useReducedMotion } from 'framer-motion';
import { 
  prefersReducedMotion,
  getAnimationDuration,
  applyGpuAcceleration,
  raf,
  cancelRaf
} from '@/lib/animations/utils';
import { ANIMATION_TIMING, SPRING_PHYSICS } from '@/lib/animations/constants';

interface UseAnimationOptions {
  duration?: number;
  delay?: number;
  easing?: string;
  spring?: typeof SPRING_PHYSICS[keyof typeof SPRING_PHYSICS];
  respectReducedMotion?: boolean;
  autoStart?: boolean;
}

interface UseAnimationReturn {
  isAnimating: boolean;
  isPaused: boolean;
  progress: number;
  start: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  reverse: () => void;
  getDuration: () => number;
}

/**
 * Core animation hook for managing animation lifecycle
 */
export const useAnimation = (
  options: UseAnimationOptions = {}
): UseAnimationReturn => {
  const {
    duration = ANIMATION_TIMING.normal,
    delay = 0,
    easing = 'ease',
    spring,
    respectReducedMotion = true,
    autoStart = false,
  } = options;

  const [isAnimating, setIsAnimating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isReversed, setIsReversed] = useState(false);
  
  const animationRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const pausedTimeRef = useRef<number>();
  const shouldReduceMotion = useReducedMotion();

  const animationDuration = respectReducedMotion && shouldReduceMotion 
    ? getAnimationDuration(duration)
    : duration;

  const animate = useCallback(() => {
    if (!startTimeRef.current) {
      startTimeRef.current = performance.now();
    }

    const currentTime = performance.now();
    const elapsed = currentTime - startTimeRef.current;
    const normalizedProgress = Math.min(elapsed / animationDuration, 1);
    
    const finalProgress = isReversed ? 1 - normalizedProgress : normalizedProgress;
    setProgress(finalProgress);

    if (normalizedProgress < 1 && !isPaused) {
      animationRef.current = raf(() => animate());
    } else {
      setIsAnimating(false);
    }
  }, [animationDuration, isPaused, isReversed]);

  const start = useCallback(() => {
    if (delay > 0) {
      setTimeout(() => {
        setIsAnimating(true);
        setProgress(0);
        startTimeRef.current = performance.now();
        animate();
      }, delay);
    } else {
      setIsAnimating(true);
      setProgress(0);
      startTimeRef.current = performance.now();
      animate();
    }
  }, [delay, animate]);

  const pause = useCallback(() => {
    if (isAnimating && !isPaused) {
      setIsPaused(true);
      pausedTimeRef.current = performance.now();
      if (animationRef.current) {
        cancelRaf(animationRef.current);
      }
    }
  }, [isAnimating, isPaused]);

  const resume = useCallback(() => {
    if (isPaused && pausedTimeRef.current && startTimeRef.current) {
      setIsPaused(false);
      const pauseDuration = performance.now() - pausedTimeRef.current;
      startTimeRef.current += pauseDuration;
      animate();
    }
  }, [isPaused, animate]);

  const reset = useCallback(() => {
    setIsAnimating(false);
    setIsPaused(false);
    setProgress(0);
    setIsReversed(false);
    startTimeRef.current = undefined;
    pausedTimeRef.current = undefined;
    if (animationRef.current) {
      cancelRaf(animationRef.current);
    }
  }, []);

  const reverse = useCallback(() => {
    setIsReversed(!isReversed);
    if (isAnimating) {
      const currentProgress = progress;
      setProgress(1 - currentProgress);
      startTimeRef.current = performance.now() - (1 - currentProgress) * animationDuration;
    }
  }, [isReversed, isAnimating, progress, animationDuration]);

  const getDuration = useCallback(() => animationDuration, [animationDuration]);

  useEffect(() => {
    if (autoStart) {
      start();
    }
    
    return () => {
      if (animationRef.current) {
        cancelRaf(animationRef.current);
      }
    };
  }, []);

  return {
    isAnimating,
    isPaused,
    progress,
    start,
    pause,
    resume,
    reset,
    reverse,
    getDuration,
  };
};

/**
 * Hook for managing entrance animations
 */
export const useEntranceAnimation = (
  delay: number = 0,
  duration: number = ANIMATION_TIMING.normal
) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return {
    isVisible,
    animationProps: {
      initial: { opacity: 0, y: 20 },
      animate: isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 },
      transition: { duration: duration / 1000 },
    },
  };
};

/**
 * Hook for managing hover animations
 */
export const useHoverAnimation = (scale: number = 1.02) => {
  const [isHovered, setIsHovered] = useState(false);

  return {
    isHovered,
    hoverProps: {
      onMouseEnter: () => setIsHovered(true),
      onMouseLeave: () => setIsHovered(false),
      animate: { scale: isHovered ? scale : 1 },
      transition: { type: 'spring', stiffness: 300, damping: 20 },
    },
  };
};

/**
 * Hook for managing press animations
 */
export const usePressAnimation = (scale: number = 0.95) => {
  const [isPressed, setIsPressed] = useState(false);

  return {
    isPressed,
    pressProps: {
      onMouseDown: () => setIsPressed(true),
      onMouseUp: () => setIsPressed(false),
      onMouseLeave: () => setIsPressed(false),
      animate: { scale: isPressed ? scale : 1 },
      transition: { duration: 0.1 },
    },
  };
};