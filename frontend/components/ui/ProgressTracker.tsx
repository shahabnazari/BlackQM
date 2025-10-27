'use client';

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CheckIcon } from '@heroicons/react/24/solid';
import { clsx } from 'clsx';

interface Step {
  id: string | number;
  label: string;
  description?: string;
  status: 'completed' | 'current' | 'upcoming' | 'error';
  optional?: boolean;
}

interface ProgressTrackerProps {
  steps: Step[];
  variant?: 'linear' | 'circular' | 'minimal';
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  showDescription?: boolean;
  animated?: boolean;
  className?: string;
}

/**
 * Progress Tracker Component
 * Phase 6.6: Visual indicators for multi-step processes
 *
 * Features:
 * - Multiple display variants
 * - Step status indicators
 * - Animated transitions
 * - Accessibility compliant
 * - Responsive design
 */
export function ProgressTracker({
  steps,
  variant = 'linear',
  orientation = 'horizontal',
  showLabels = true,
  showDescription = false,
  animated = true,
  className = '',
}: ProgressTrackerProps) {
  // Calculate progress percentage
  const progress = useMemo(() => {
    const completedSteps = steps.filter(
      (s: any) => s.status === 'completed'
    ).length;
    const currentStep = steps.findIndex(s => s.status === 'current');
    const totalProgress = completedSteps + (currentStep >= 0 ? 0.5 : 0);
    return (totalProgress / steps.length) * 100;
  }, [steps]);

  // Get current step index
  const currentStepIndex = useMemo(() => {
    return steps.findIndex(s => s.status === 'current');
  }, [steps]);

  if (variant === 'minimal') {
    return (
      <MinimalProgress
        steps={steps}
        progress={progress}
        currentStepIndex={currentStepIndex}
        animated={animated}
        className={className}
      />
    );
  }

  if (variant === 'circular') {
    return (
      <CircularProgress
        steps={steps}
        progress={progress}
        animated={animated}
        className={className}
      />
    );
  }

  // Default: Linear variant
  return (
    <LinearProgress
      steps={steps}
      orientation={orientation}
      showLabels={showLabels}
      showDescription={showDescription}
      animated={animated}
      className={className}
    />
  );
}

/**
 * Linear Progress Variant
 * Classic step-by-step progress indicator
 */
function LinearProgress({
  steps,
  orientation,
  showLabels,
  showDescription,
  animated,
  className,
}: Omit<ProgressTrackerProps, 'variant'>) {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div
      className={clsx(
        'progress-tracker-linear',
        isHorizontal ? 'flex items-start' : 'flex flex-col',
        className
      )}
      role="group"
      aria-label="Progress"
    >
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        const isCompleted = step.status === 'completed';
        const isCurrent = step.status === 'current';
        const isError = step.status === 'error';

        return (
          <div
            key={step.id}
            className={clsx(
              'flex',
              isHorizontal ? 'flex-col items-center' : 'items-start',
              !isLast && (isHorizontal ? 'flex-1' : 'pb-8')
            )}
          >
            {/* Step indicator and connector */}
            <div
              className={clsx(
                'relative flex items-center',
                isHorizontal ? 'w-full' : ''
              )}
            >
              {/* Step Circle */}
              <motion.div
                initial={animated ? { scale: 0 } : false}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={clsx(
                  'relative z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all',
                  isCompleted && 'border-system-green bg-system-green',
                  isCurrent && 'border-primary bg-primary',
                  isError && 'border-system-red bg-system-red',
                  !isCompleted &&
                    !isCurrent &&
                    !isError &&
                    'border-border bg-surface'
                )}
              >
                {isCompleted ? (
                  <CheckIcon className="h-5 w-5 text-white" />
                ) : isError ? (
                  <span className="text-white font-medium">!</span>
                ) : (
                  <span
                    className={clsx(
                      'text-sm font-medium',
                      isCurrent ? 'text-white' : 'text-text-secondary'
                    )}
                  >
                    {index + 1}
                  </span>
                )}
              </motion.div>

              {/* Connector Line */}
              {!isLast && (
                <div
                  className={clsx(
                    'absolute',
                    isHorizontal
                      ? 'left-[50px] right-0 top-5 h-[2px]'
                      : 'left-5 top-[50px] bottom-0 w-[2px]',
                    isCompleted ? 'bg-system-green' : 'bg-border'
                  )}
                >
                  {animated && isCompleted && (
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      className="h-full bg-system-green"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Step Label & Description */}
            {showLabels && (
              <div
                className={clsx(
                  isHorizontal ? 'mt-3 text-center' : 'ml-6 -mt-10',
                  !isLast && !isHorizontal && 'pb-8'
                )}
              >
                <div
                  className={clsx(
                    'font-medium',
                    isCurrent ? 'text-primary' : 'text-text',
                    step.optional && 'italic'
                  )}
                >
                  {step.label}
                  {step.optional && (
                    <span className="ml-1 text-xs text-text-tertiary">
                      (optional)
                    </span>
                  )}
                </div>
                {showDescription && step.description && (
                  <div className="mt-1 text-sm text-text-secondary">
                    {step.description}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Circular Progress Variant
 * Radial progress indicator
 */
function CircularProgress({
  steps,
  progress,
  animated,
  className,
}: {
  steps: Step[];
  progress: number;
  animated?: boolean;
  className?: string;
}) {
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const currentStep = steps.find(s => s.status === 'current');
  const completedCount = steps.filter(
    (s: any) => s.status === 'completed'
  ).length;

  return (
    <div className={clsx('flex flex-col items-center', className)}>
      <div className="relative">
        <svg width="140" height="140" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="70"
            cy="70"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-border"
          />
          {/* Progress circle */}
          <motion.circle
            cx="70"
            cy="70"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            initial={animated ? { strokeDashoffset: circumference } : false}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeInOut' }}
            className="text-primary"
            strokeLinecap="round"
          />
        </svg>
        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-2xl font-bold">{completedCount}</div>
          <div className="text-sm text-text-secondary">of {steps.length}</div>
        </div>
      </div>
      {currentStep && (
        <div className="mt-4 text-center">
          <div className="font-medium">{currentStep.label}</div>
          {currentStep.description && (
            <div className="mt-1 text-sm text-text-secondary">
              {currentStep.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Minimal Progress Variant
 * Simple progress bar with text
 */
function MinimalProgress({
  steps,
  progress,
  currentStepIndex,
  animated,
  className,
}: {
  steps: Step[];
  progress: number;
  currentStepIndex: number;
  animated?: boolean;
  className?: string;
}) {
  return (
    <div className={clsx('w-full', className)}>
      {/* Progress text */}
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-text-secondary">
          Step {currentStepIndex + 1} of {steps.length}
        </span>
        <span className="font-medium">{steps[currentStepIndex]?.label}</span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-border">
        <motion.div
          initial={animated ? { width: 0 } : false}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          className="h-full bg-gradient-to-r from-primary to-primary-dark"
        />
      </div>
    </div>
  );
}

/**
 * Study Progress Tracker
 * Specific implementation for Q-sort studies
 */
export function StudyProgressTracker({
  currentStep,
  totalSteps = 8,
  className,
}: {
  currentStep: number;
  totalSteps?: number;
  className?: string;
}) {
  const steps: Step[] = [
    { id: 1, label: 'Welcome', status: 'completed' },
    { id: 2, label: 'Consent', status: 'completed' },
    { id: 3, label: 'Demographics', status: 'completed' },
    { id: 4, label: 'Instructions', status: 'completed' },
    { id: 5, label: 'Initial Sort', status: 'current' },
    { id: 6, label: 'Q-Sort', status: 'upcoming' },
    { id: 7, label: 'Reflection', status: 'upcoming' },
    { id: 8, label: 'Complete', status: 'upcoming' },
  ]
    .slice(0, totalSteps)
    .map((step, index) => ({
      ...step,
      status:
        index < currentStep - 1
          ? 'completed'
          : index === currentStep - 1
            ? 'current'
            : 'upcoming',
    }));

  return (
    <ProgressTracker
      steps={steps}
      variant="minimal"
      animated
      {...(className && { className })}
    />
  );
}
