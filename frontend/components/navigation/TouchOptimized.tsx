"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TouchOptimizedProps {
  children: React.ReactNode;
  onTap?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  hapticFeedback?: boolean;
  className?: string;
  disabled?: boolean;
}

export function TouchOptimized({
  children,
  onTap,
  onLongPress,
  onDoubleTap,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  hapticFeedback = true,
  className,
  disabled = false
}: TouchOptimizedProps) {
  const [isTouching, setIsTouching] = useState(false);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [lastTap, setLastTap] = useState(0);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const controls = useAnimation();

  // Haptic feedback (vibration) for supported devices
  const triggerHaptic = () => {
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  };

  // Touch start handler
  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    setTouchStart({ x: touch?.clientX ?? 0, y: touch?.clientY ?? 0 });
    setIsTouching(true);
    
    // Trigger press animation
    controls.start({ scale: 0.95 });
    triggerHaptic();
    
    // Setup long press detection
    if (onLongPress) {
      longPressTimer.current = setTimeout(() => {
        onLongPress();
        triggerHaptic();
        controls.start({ scale: 1.05, transition: { type: "spring" } });
      }, 500);
    }
  };

  // Touch end handler
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (disabled || !touchStart) return;
    
    const touch = e.changedTouches[0];
    const deltaX = (touch?.clientX ?? 0) - touchStart.x;
    const deltaY = (touch?.clientY ?? 0) - touchStart.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Clear long press timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    
    // Reset animation
    controls.start({ scale: 1 });
    setIsTouching(false);
    
    // Detect swipe gestures
    const swipeThreshold = 50;
    if (distance > swipeThreshold) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
          triggerHaptic();
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
          triggerHaptic();
        }
      } else {
        // Vertical swipe
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown();
          triggerHaptic();
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp();
          triggerHaptic();
        }
      }
    } else {
      // Detect tap or double tap
      const now = Date.now();
      const doubleTapDelay = 300;
      
      if (onDoubleTap && now - lastTap < doubleTapDelay) {
        onDoubleTap();
        triggerHaptic();
        setLastTap(0);
      } else {
        setLastTap(now);
        if (onTap) {
          onTap();
          triggerHaptic();
        }
      }
    }
    
    setTouchStart(null);
  };

  // Touch cancel handler
  const handleTouchCancel = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    controls.start({ scale: 1 });
    setIsTouching(false);
    setTouchStart(null);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <motion.div
      animate={controls}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className={cn(
        "touch-manipulation select-none",
        "cursor-pointer",
        disabled && "opacity-50 cursor-not-allowed",
        className
      )}
      style={{
        WebkitTapHighlightColor: 'transparent',
        WebkitTouchCallout: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'manipulation'
      }}
    >
      {children}
      
      {/* Touch feedback overlay */}
      {isTouching && (
        <div className="absolute inset-0 bg-primary/10 rounded-inherit pointer-events-none" />
      )}
    </motion.div>
  );
}

// Touch-optimized button component
interface TouchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  haptic?: boolean;
}

export function TouchButton({
  children,
  variant = 'default',
  size = 'md',
  haptic = true,
  className,
  disabled,
  onClick,
  ...props
}: TouchButtonProps) {
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm min-h-[44px]',
    md: 'px-4 py-3 text-base min-h-[48px]',
    lg: 'px-6 py-4 text-lg min-h-[56px]'
  };

  const variantClasses = {
    default: 'bg-accent hover:bg-accent/80',
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    danger: 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
  };

  return (
    <TouchOptimized
      onTap={onClick}
      hapticFeedback={haptic}
      disabled={disabled}
      className="inline-block"
    >
      <button
        className={cn(
          "flex items-center justify-center",
          "rounded-lg font-medium",
          "transition-colors duration-200",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
          "touch-manipulation",
          sizeClasses[size],
          variantClasses[variant],
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    </TouchOptimized>
  );
}

// Touch-optimized card component
interface TouchCardProps {
  children: React.ReactNode;
  onTap?: () => void;
  onLongPress?: () => void;
  className?: string;
}

export function TouchCard({
  children,
  onTap,
  onLongPress,
  className
}: TouchCardProps) {
  return (
    <TouchOptimized
      onTap={onTap}
      onLongPress={onLongPress}
      className={cn(
        "block bg-card rounded-xl p-4",
        "border border-border",
        "shadow-sm hover:shadow-md",
        "transition-shadow duration-200",
        className
      )}
    >
      {children}
    </TouchOptimized>
  );
}

// Touch-optimized list item
interface TouchListItemProps {
  children: React.ReactNode;
  onTap?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
}

export function TouchListItem({
  children,
  onTap,
  onSwipeLeft,
  onSwipeRight,
  className
}: TouchListItemProps) {
  return (
    <TouchOptimized
      onTap={onTap}
      onSwipeLeft={onSwipeLeft}
      onSwipeRight={onSwipeRight}
      className={cn(
        "block bg-background",
        "border-b border-border",
        "px-4 py-3",
        "hover:bg-accent/50",
        "transition-colors duration-200",
        className
      )}
    >
      <div className="flex items-center justify-between">
        {children}
      </div>
    </TouchOptimized>
  );
}

// Pull to refresh component
interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  className
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const startY = useRef(0);
  const threshold = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (window.scrollY === 0 && startY.current) {
      const currentY = e.touches[0].clientY;
      const distance = Math.max(0, currentY - startY.current);
      setPullDistance(Math.min(distance, threshold * 1.5));
    }
  };

  const handleTouchEnd = async () => {
    if (pullDistance > threshold && !isRefreshing) {
      setIsRefreshing(true);
      await onRefresh();
      setIsRefreshing(false);
    }
    setPullDistance(0);
    startY.current = 0;
  };

  return (
    <div
      className={cn("relative", className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <motion.div
        animate={{ 
          height: pullDistance,
          opacity: pullDistance / threshold
        }}
        className="absolute top-0 left-0 right-0 flex items-center justify-center overflow-hidden"
      >
        <motion.div
          animate={{ 
            rotate: isRefreshing ? 360 : pullDistance * 3,
            scale: Math.min(1, pullDistance / threshold)
          }}
          transition={{ 
            rotate: { duration: 1, repeat: isRefreshing ? Infinity : 0 }
          }}
          className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
        />
      </motion.div>
      
      {/* Content */}
      <motion.div
        animate={{ y: pullDistance / 2 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        {children}
      </motion.div>
    </div>
  );
}