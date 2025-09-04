/**
 * EmptyState Component
 * Beautiful empty state illustrations with animations
 * Phase 5 - Day 12 Implementation
 */

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/apple-ui/Button/Button';
import { EMPTY_STATE_CONFIG, ANIMATION_VARIANTS } from '@/lib/animations/constants';
import { 
  NoStudiesIllustration,
  NoDataIllustration,
  NoParticipantsIllustration,
  SessionExpiredIllustration,
  NotFoundIllustration,
  ErrorIllustration
} from './Illustrations';

export type EmptyStateType = 
  | 'noStudies'
  | 'noData'
  | 'noParticipants'
  | 'sessionExpired'
  | 'notFound'
  | 'error'
  | 'custom';

interface EmptyStateProps {
  type?: EmptyStateType;
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  illustration?: React.ReactNode;
  className?: string;
  animate?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Main EmptyState component
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'custom',
  title,
  message,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  illustration,
  className,
  animate = true,
  size = 'md',
}) => {
  // Get default config based on type
  const defaultConfig = type !== 'custom' ? EMPTY_STATE_CONFIG[type] : null;
  
  const finalTitle = title || defaultConfig?.title || 'No Content';
  const finalMessage = message || defaultConfig?.message || 'Nothing to display at the moment.';
  const finalActionLabel = actionLabel || defaultConfig?.action;

  // Select illustration based on type
  const getIllustration = () => {
    if (illustration) return illustration;
    
    switch (type) {
      case 'noStudies':
        return <NoStudiesIllustration />;
      case 'noData':
        return <NoDataIllustration />;
      case 'noParticipants':
        return <NoParticipantsIllustration />;
      case 'sessionExpired':
        return <SessionExpiredIllustration />;
      case 'notFound':
        return <NotFoundIllustration />;
      case 'error':
        return <ErrorIllustration />;
      default:
        return <NoDataIllustration />;
    }
  };

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  };

  const illustrationSizes = {
    sm: 'h-32 w-32',
    md: 'h-48 w-48',
    lg: 'h-64 w-64',
  };

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center',
        sizeClasses[size],
        className
      )}
      variants={animate ? ANIMATION_VARIANTS.fadeIn : undefined}
      initial={animate ? 'hidden' : undefined}
      animate={animate ? 'visible' : undefined}
      transition={{ duration: 0.4 }}
    >
      {/* Illustration */}
      <motion.div
        className={cn('mb-6', illustrationSizes[size])}
        variants={animate ? ANIMATION_VARIANTS.scaleIn : undefined}
        initial={animate ? 'hidden' : undefined}
        animate={animate ? 'visible' : undefined}
        transition={{ delay: 0.1, duration: 0.5, type: 'spring' }}
      >
        {getIllustration()}
      </motion.div>

      {/* Title */}
      <motion.h3
        className="mb-2 text-xl font-semibold text-gray-900 dark:text-white"
        variants={animate ? ANIMATION_VARIANTS.slideUp : undefined}
        initial={animate ? 'hidden' : undefined}
        animate={animate ? 'visible' : undefined}
        transition={{ delay: 0.2, duration: 0.4 }}
      >
        {finalTitle}
      </motion.h3>

      {/* Message */}
      <motion.p
        className="mb-6 text-gray-600 dark:text-gray-400 max-w-sm"
        variants={animate ? ANIMATION_VARIANTS.slideUp : undefined}
        initial={animate ? 'hidden' : undefined}
        animate={animate ? 'visible' : undefined}
        transition={{ delay: 0.3, duration: 0.4 }}
      >
        {finalMessage}
      </motion.p>

      {/* Actions */}
      {(finalActionLabel || secondaryActionLabel) && (
        <motion.div
          className="flex flex-col sm:flex-row gap-3"
          variants={animate ? ANIMATION_VARIANTS.slideUp : undefined}
          initial={animate ? 'hidden' : undefined}
          animate={animate ? 'visible' : undefined}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          {finalActionLabel && onAction && (
            <Button
              onClick={onAction}
              variant="primary"
              size="md"
            >
              {finalActionLabel}
            </Button>
          )}
          
          {secondaryActionLabel && onSecondaryAction && (
            <Button
              onClick={onSecondaryAction}
              variant="secondary"
              size="md"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

/**
 * Specialized empty state for studies
 */
export const EmptyStudyState: React.FC<{
  onCreateStudy?: () => void;
  className?: string;
}> = ({ onCreateStudy, className }) => {
  return (
    <EmptyState
      type="noStudies"
      onAction={onCreateStudy}
      className={className}
      size="lg"
    />
  );
};

/**
 * Specialized empty state for data/visualizations
 */
export const EmptyDataState: React.FC<{
  onInviteParticipants?: () => void;
  className?: string;
}> = ({ onInviteParticipants, className }) => {
  return (
    <EmptyState
      type="noData"
      onAction={onInviteParticipants}
      className={className}
    />
  );
};

/**
 * Specialized empty state for participants
 */
export const EmptyParticipantState: React.FC<{
  onShareStudy?: () => void;
  className?: string;
}> = ({ onShareStudy, className }) => {
  return (
    <EmptyState
      type="noParticipants"
      onAction={onShareStudy}
      className={className}
    />
  );
};

/**
 * Specialized 404 not found state
 */
export const NotFoundState: React.FC<{
  onGoHome?: () => void;
  className?: string;
}> = ({ onGoHome, className }) => {
  return (
    <EmptyState
      type="notFound"
      onAction={onGoHome}
      className={className}
      size="lg"
    />
  );
};

/**
 * Specialized error state
 */
export const ErrorState: React.FC<{
  error?: string;
  onRetry?: () => void;
  className?: string;
}> = ({ error, onRetry, className }) => {
  return (
    <EmptyState
      type="error"
      message={error || EMPTY_STATE_CONFIG.error.message}
      onAction={onRetry}
      className={className}
    />
  );
};

/**
 * Loading state with custom message
 */
export const LoadingState: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = 'Loading...', className }) => {
  return (
    <motion.div
      className={cn('flex flex-col items-center justify-center p-8', className)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        className="w-16 h-16 mb-4"
        animate={{ rotate: 360 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
      >
        <svg className="w-full h-full" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </motion.div>
      <p className="text-gray-600 dark:text-gray-400">{message}</p>
    </motion.div>
  );
};