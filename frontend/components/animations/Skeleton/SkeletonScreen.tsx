/**
 * SkeletonScreen Component
 * Enterprise-grade skeleton loading states with shimmer effects
 * Phase 5 - Day 11 Implementation
 */

import { SKELETON_CONFIG } from '@/lib/animations/constants';
import { prefersReducedMotion } from '@/lib/animations/utils';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rect' | 'circle' | 'card' | 'button';
  width?: string | number;
  height?: string | number;
  animate?: boolean;
  shimmer?: boolean;
  rounded?: boolean;
  lines?: number; // For text variant
}

/**
 * Base Skeleton component with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'rect',
  width,
  height,
  animate = true,
  shimmer = true,
  rounded = true,
  lines = 1,
}) => {
  const shouldAnimate = animate && !prefersReducedMotion();

  const baseClasses = cn(
    'relative overflow-hidden bg-gray-200 dark:bg-gray-700',
    {
      'rounded-md': rounded && variant === 'rect',
      'rounded-lg': rounded && variant === 'card',
      'rounded-full': variant === 'circle' || variant === 'button',
      'h-4': variant === 'text' && !height,
      'h-32': variant === 'card' && !height,
      'h-10 px-4': variant === 'button' && !height,
    },
    className
  );

  const shimmerElement = shouldAnimate && shimmer && (
    <motion.div
      className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent"
      animate={{ x: ['100%', '200%'] }}
      transition={{
        duration: SKELETON_CONFIG.shimmerDuration,
        repeat: Infinity,
        ease: 'linear',
      }}
    />
  );

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(baseClasses, index === lines - 1 && 'w-3/4')}
            style={{ width: index === lines - 1 ? '75%' : width, height }}
          >
            {shimmerElement}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={baseClasses} style={{ width, height }}>
      {shimmerElement}
    </div>
  );
};

/**
 * Skeleton Card component
 */
export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl p-6 space-y-4', className)}>
      <div className="flex items-center space-x-4">
        <Skeleton variant="circle" width={48} height={48} />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" width="60%" />
          <Skeleton variant="text" width="40%" />
        </div>
      </div>
      <Skeleton variant="rect" height={120} />
      <div className="space-y-2">
        <Skeleton variant="text" lines={3} />
      </div>
      <div className="flex space-x-2">
        <Skeleton variant="button" width={100} />
        <Skeleton variant="button" width={100} />
      </div>
    </div>
  );
};

/**
 * Skeleton Table component
 */
export const SkeletonTable: React.FC<{ 
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex space-x-4 p-4 border-b dark:border-gray-700">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton 
            key={index} 
            variant="text" 
            width={`${100 / columns}%`}
            className="h-6"
          />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div 
          key={rowIndex} 
          className="flex space-x-4 p-4 border-b dark:border-gray-700"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton 
              key={colIndex} 
              variant="text" 
              width={`${100 / columns}%`}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton Chart component for visualizations
 */
export const SkeletonChart: React.FC<{ 
  className?: string;
  type?: 'bar' | 'line' | 'pie';
}> = ({ className, type = 'bar' }) => {
  return (
    <div className={cn('bg-white dark:bg-gray-800 rounded-xl p-6', className)}>
      {/* Chart Title */}
      <div className="mb-4">
        <Skeleton variant="text" width="40%" className="h-6" />
      </div>
      
      {/* Chart Area */}
      <div className="relative h-64">
        {type === 'bar' && (
          <div className="absolute bottom-0 left-0 right-0 flex items-end justify-around h-full">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton
                key={index}
                variant="rect"
                width="12%"
                height={`${30 + Math.random() * 70}%`}
                className="mx-1"
              />
            ))}
          </div>
        )}
        
        {type === 'line' && (
          <div className="absolute inset-0 flex items-center">
            <Skeleton variant="rect" height={2} className="w-full" />
          </div>
        )}
        
        {type === 'pie' && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Skeleton variant="circle" width={200} height={200} />
          </div>
        )}
      </div>
      
      {/* Legend */}
      <div className="mt-4 flex justify-center space-x-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="flex items-center space-x-2">
            <Skeleton variant="rect" width={12} height={12} />
            <Skeleton variant="text" width={60} />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Skeleton Form component
 */
export const SkeletonForm: React.FC<{ 
  fields?: number;
  className?: string;
}> = ({ fields = 4, className }) => {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton variant="text" width="30%" className="h-5" />
          <Skeleton variant="rect" height={40} />
        </div>
      ))}
      <div className="flex space-x-4 pt-4">
        <Skeleton variant="button" width={120} />
        <Skeleton variant="button" width={120} />
      </div>
    </div>
  );
};

/**
 * Skeleton List component
 */
export const SkeletonList: React.FC<{ 
  items?: number;
  className?: string;
  showAvatar?: boolean;
}> = ({ items = 5, className, showAvatar = true }) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="flex items-center space-x-4 p-3">
          {showAvatar && <Skeleton variant="circle" width={40} height={40} />}
          <div className="flex-1 space-y-2">
            <Skeleton variant="text" width="70%" />
            <Skeleton variant="text" width="50%" className="h-3" />
          </div>
          <Skeleton variant="rect" width={60} height={24} />
        </div>
      ))}
    </div>
  );
};

/**
 * Skeleton Dashboard Widget
 */
export const SkeletonWidget: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-xl p-6 space-y-4',
      className
    )}>
      <div className="flex justify-between items-center">
        <Skeleton variant="text" width="40%" className="h-6" />
        <Skeleton variant="rect" width={24} height={24} />
      </div>
      <div className="space-y-2">
        <Skeleton variant="text" width="30%" className="h-10" />
        <Skeleton variant="text" width="60%" className="h-4" />
      </div>
      <Skeleton variant="rect" height={100} />
    </div>
  );
};

/**
 * Skeleton Profile component
 */
export const SkeletonProfile: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('flex items-center space-x-4', className)}>
      <Skeleton variant="circle" width={64} height={64} />
      <div className="space-y-2">
        <Skeleton variant="text" width={150} className="h-6" />
        <Skeleton variant="text" width={200} className="h-4" />
        <Skeleton variant="text" width={100} className="h-4" />
      </div>
    </div>
  );
};