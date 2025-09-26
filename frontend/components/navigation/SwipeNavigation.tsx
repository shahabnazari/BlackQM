'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  motion,
  useMotionValue,
  useTransform,
  AnimatePresence,
  PanInfo,
} from 'framer-motion';
import { useRouter, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const phases = [
  {
    id: 1,
    name: 'DISCOVER',
    path: '/discover',
    color: 'from-purple-500 to-purple-600',
  },
  {
    id: 2,
    name: 'DESIGN',
    path: '/design',
    color: 'from-indigo-500 to-indigo-600',
  },
  {
    id: 3,
    name: 'BUILD',
    path: '/studies/create',
    color: 'from-blue-500 to-blue-600',
  },
  {
    id: 4,
    name: 'RECRUIT',
    path: '/recruitment',
    color: 'from-cyan-500 to-cyan-600',
  },
  {
    id: 5,
    name: 'COLLECT',
    path: '/collect',
    color: 'from-teal-500 to-teal-600',
  },
  {
    id: 6,
    name: 'ANALYZE',
    path: '/analysis',
    color: 'from-green-500 to-green-600',
  },
  {
    id: 7,
    name: 'VISUALIZE',
    path: '/visualize',
    color: 'from-lime-500 to-lime-600',
  },
  {
    id: 8,
    name: 'INTERPRET',
    path: '/interpret',
    color: 'from-yellow-500 to-yellow-600',
  },
  {
    id: 9,
    name: 'REPORT',
    path: '/report',
    color: 'from-orange-500 to-orange-600',
  },
  {
    id: 10,
    name: 'ARCHIVE',
    path: '/archive',
    color: 'from-red-500 to-red-600',
  },
];

interface SwipeNavigationProps {
  children?: React.ReactNode;
  className?: string;
  enabled?: boolean;
}

export function SwipeNavigation({
  children,
  className,
  enabled = true,
}: SwipeNavigationProps) {
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, 0, 200], [0.5, 1, 0.5]);
  const scale = useTransform(x, [-200, 0, 200], [0.9, 1, 0.9]);

  // Update current phase based on pathname
  useEffect(() => {
    const currentPhase = phases.findIndex(phase =>
      pathname.startsWith(phase.path)
    );
    if (currentPhase !== -1) {
      setCurrentPhaseIndex(currentPhase);
    }
  }, [pathname]);

  // Show swipe hint on first visit
  useEffect(() => {
    const hasSeenHint = localStorage.getItem('swipe-hint-seen');
    if (hasSeenHint) {
      setShowHint(false);
      return; // Add explicit return for this path
    } else {
      const timer = setTimeout(() => {
        setShowHint(false);
        localStorage.setItem('swipe-hint-seen', 'true');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const navigateToPhase = (index: number) => {
    if (index >= 0 && index < phases.length && phases[index]) {
      setCurrentPhaseIndex(index);
      router.push(phases[index].path);
    }
  };

  const handleDragEnd = (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    setIsDragging(false);
    const threshold = 50;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (Math.abs(offset) > threshold || Math.abs(velocity) > 500) {
      if (offset > 0) {
        // Swiped right - go to previous phase
        navigateToPhase(currentPhaseIndex - 1);
      } else {
        // Swiped left - go to next phase
        navigateToPhase(currentPhaseIndex + 1);
      }
    }
  };

  // Touch-friendly navigation buttons
  const NavigationButton = ({
    direction,
    onClick,
  }: {
    direction: 'prev' | 'next';
    onClick: () => void;
  }) => {
    const isPrev = direction === 'prev';
    const disabled = isPrev
      ? currentPhaseIndex === 0
      : currentPhaseIndex === phases.length - 1;

    return (
      <motion.button
        whileTap={{ scale: disabled ? 1 : 0.9 }}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          'absolute top-1/2 -translate-y-1/2 z-20',
          isPrev ? 'left-2' : 'right-2',
          'bg-background/80 backdrop-blur-sm',
          'rounded-full p-2 shadow-lg',
          'transition-all duration-200',
          'touch-manipulation',
          disabled ? 'opacity-30' : 'opacity-70 hover:opacity-100',
          'md:hidden' // Only show on mobile/tablet
        )}
        aria-label={isPrev ? 'Previous phase' : 'Next phase'}
      >
        {isPrev ? (
          <ChevronLeft className="h-6 w-6" />
        ) : (
          <ChevronRight className="h-6 w-6" />
        )}
      </motion.button>
    );
  };

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
    >
      {/* Phase Indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 md:hidden">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-background/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg"
        >
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {phases.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-all duration-300',
                    index === currentPhaseIndex
                      ? 'w-6 bg-primary'
                      : 'bg-muted-foreground/30'
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium ml-2">
              {phases[currentPhaseIndex]?.name}
            </span>
          </div>
        </motion.div>
      </div>

      {/* Swipe Hint */}
      <AnimatePresence>
        {showHint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 md:hidden"
          >
            <motion.div
              animate={{ x: [-20, 20, -20] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="bg-primary text-primary-foreground rounded-full px-4 py-2 shadow-lg"
            >
              <span className="text-sm font-medium flex items-center gap-2">
                <ChevronLeft className="h-4 w-4" />
                Swipe to navigate
                <ChevronRight className="h-4 w-4" />
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Buttons */}
      <NavigationButton
        direction="prev"
        onClick={() => navigateToPhase(currentPhaseIndex - 1)}
      />
      <NavigationButton
        direction="next"
        onClick={() => navigateToPhase(currentPhaseIndex + 1)}
      />

      {/* Swipeable Content Container */}
      <motion.div
        drag="x"
        dragElastic={0.2}
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={handleDragEnd}
        style={{ x, opacity, scale }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'relative',
          isDragging && 'cursor-grabbing',
          !isDragging && 'cursor-grab'
        )}
      >
        {/* Background Gradient */}
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br opacity-5',
            phases[currentPhaseIndex]?.color
          )}
        />

        {/* Main Content */}
        <div className="relative">{children}</div>
      </motion.div>

      {/* Edge Indicators */}
      <AnimatePresence>
        {isDragging && (
          <>
            {/* Left Edge - Previous Phase */}
            {currentPhaseIndex > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: x.get() > 50 ? 1 : 0, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20"
              >
                <div
                  className={cn(
                    'bg-gradient-to-r p-4 rounded-r-xl shadow-lg',
                    phases[currentPhaseIndex - 1].color
                  )}
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                  <span className="text-white font-medium text-sm">
                    {phases[currentPhaseIndex - 1].name}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Right Edge - Next Phase */}
            {currentPhaseIndex < phases.length - 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: x.get() < -50 ? 1 : 0, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20"
              >
                <div
                  className={cn(
                    'bg-gradient-to-l p-4 rounded-l-xl shadow-lg',
                    phases[currentPhaseIndex + 1].color
                  )}
                >
                  <span className="text-white font-medium text-sm">
                    {phases[currentPhaseIndex + 1].name}
                  </span>
                  <ChevronRight className="h-6 w-6 text-white" />
                </div>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
