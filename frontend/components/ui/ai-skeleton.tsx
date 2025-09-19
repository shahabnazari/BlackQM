'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface AISkeletonProps {
  className?: string;
  variant?: 'default' | 'compact' | 'analysis' | 'chat';
}

/**
 * Loading skeleton for AI components
 * Provides consistent loading states across all AI features
 */
export function AISkeleton({ className = '', variant = 'default' }: AISkeletonProps) {
  if (variant === 'chat') {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Assistant message skeleton */}
        <div className="flex gap-2">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
            <div className="h-4 bg-muted rounded animate-pulse w-1/2" />
          </div>
        </div>
        
        {/* User message skeleton */}
        <div className="flex gap-2 justify-end">
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-primary/20 rounded animate-pulse w-2/3 ml-auto" />
          </div>
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse flex-shrink-0" />
        </div>
        
        {/* Input skeleton */}
        <div className="h-10 bg-muted rounded animate-pulse" />
      </div>
    );
  }
  
  if (variant === 'analysis') {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Tabs skeleton */}
        <div className="flex space-x-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-8 w-20 bg-muted rounded animate-pulse" />
          ))}
        </div>
        
        {/* Stats grid skeleton */}
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-3 border rounded space-y-2">
              <div className="h-8 w-8 bg-muted rounded animate-pulse mx-auto" />
              <div className="h-6 bg-muted rounded animate-pulse w-1/2 mx-auto" />
              <div className="h-3 bg-muted rounded animate-pulse w-2/3 mx-auto" />
            </div>
          ))}
        </div>
        
        {/* Chart skeleton */}
        <div className="h-64 bg-muted rounded animate-pulse" />
      </div>
    );
  }
  
  if (variant === 'compact') {
    return (
      <div className={`space-y-3 ${className}`}>
        {/* Title skeleton */}
        <div className="h-5 bg-muted rounded animate-pulse w-1/3" />
        
        {/* Content lines */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-full" />
          <div className="h-4 bg-muted rounded animate-pulse w-5/6" />
          <div className="h-4 bg-muted rounded animate-pulse w-4/6" />
        </div>
        
        {/* Button skeleton */}
        <div className="h-10 bg-muted rounded animate-pulse w-full" />
      </div>
    );
  }
  
  // Default variant - full card skeleton
  return (
    <Card className={className}>
      <CardHeader className="space-y-2">
        {/* Icon and title skeleton */}
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-muted rounded animate-pulse" />
          <div className="h-6 bg-muted rounded animate-pulse w-32" />
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Input/textarea skeleton */}
        <div className="space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-24" />
          <div className="h-32 bg-muted rounded animate-pulse" />
        </div>
        
        {/* Options skeleton */}
        <div className="flex gap-4">
          <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-20" />
          <div className="h-4 w-4 bg-muted rounded-full animate-pulse" />
          <div className="h-4 bg-muted rounded animate-pulse w-32" />
        </div>
        
        {/* Button skeleton */}
        <div className="h-10 bg-muted rounded animate-pulse w-full" />
        
        {/* Results skeleton */}
        <div className="pt-4 border-t space-y-3">
          {/* Score bars */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 bg-muted rounded animate-pulse w-16" />
                  <div className="h-3 bg-muted rounded animate-pulse w-8" />
                </div>
                <div className="h-2 bg-muted rounded animate-pulse w-full" />
              </div>
            ))}
          </div>
          
          {/* Issue cards */}
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 bg-muted rounded animate-pulse" />
                  <div className="h-4 bg-muted rounded animate-pulse w-24" />
                  <div className="h-4 bg-muted rounded animate-pulse w-12" />
                </div>
                <div className="h-3 bg-muted rounded animate-pulse w-full" />
                <div className="h-3 bg-muted rounded animate-pulse w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Statement skeleton for loading states
 */
export function StatementSkeleton() {
  return (
    <div className="p-4 border rounded-lg space-y-2">
      <div className="flex items-start gap-2">
        <div className="h-4 w-4 bg-muted rounded animate-pulse mt-0.5" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded animate-pulse w-full" />
          <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-6 bg-muted rounded animate-pulse w-16" />
        <div className="h-6 bg-muted rounded animate-pulse w-20" />
      </div>
    </div>
  );
}

/**
 * Grid skeleton for Q-sort grid loading
 */
export function GridSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between">
        <div className="h-6 bg-muted rounded animate-pulse w-32" />
        <div className="h-6 bg-muted rounded animate-pulse w-24" />
      </div>
      
      {/* Grid */}
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 21 }).map((_, i) => (
          <div key={i} className="aspect-square bg-muted rounded animate-pulse" />
        ))}
      </div>
      
      {/* Labels */}
      <div className="flex justify-between">
        <div className="h-4 bg-muted rounded animate-pulse w-20" />
        <div className="h-4 bg-muted rounded animate-pulse w-16" />
        <div className="h-4 bg-muted rounded animate-pulse w-20" />
      </div>
    </div>
  );
}

export default AISkeleton;