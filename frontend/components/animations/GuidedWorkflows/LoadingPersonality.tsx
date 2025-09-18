/**
 * Loading Personality Component
 * Engaging loading states with personality and context
 * Phase 5 - Day 14 Implementation
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LOADING_MESSAGES } from '@/lib/animations/constants';
import { getRandomLoadingMessage } from '@/lib/animations/utils';

interface LoadingPersonalityProps {
  show?: boolean;
  messages?: string[];
  rotationInterval?: number;
  showProgress?: boolean;
  progress?: number;
  showTips?: boolean;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

/**
 * Main Loading Personality Component
 */
export const LoadingPersonality: React.FC<LoadingPersonalityProps> = ({
  show = false,
  messages = LOADING_MESSAGES,
  rotationInterval = 3000,
  showProgress = false,
  progress = 0,
  showTips = true,
  className,
  size = 'medium',
}) => {
  const [currentMessage, setCurrentMessage] = useState(messages[0]);
  // Message index tracked internally by effect
  // const [messageIndex, setMessageIndex] = useState(0);
  const [tip, setTip] = useState<string>('');

  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      // setMessageIndex((prev) => (prev + 1) % messages.length);
      setCurrentMessage(getRandomLoadingMessage(messages));
    }, rotationInterval);

    return () => clearInterval(interval);
  }, [show, messages, rotationInterval]);

  useEffect(() => {
    // Generate contextual tips
    const tips = [
      'Did you know? Q-methodology was invented by William Stephenson in 1935.',
      'Tip: You can drag and drop statements directly from the initial sort.',
      'Fun fact: The average Q-sort takes participants 15-20 minutes to complete.',
      'Pro tip: Use keyboard shortcuts for faster statement sorting.',
      'Did you know? Factor rotation helps identify distinct viewpoints.',
      'Tip: Start with extreme statements to make sorting easier.',
    ];

    if (showTips && show) {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      setTip(randomTip);
    }
  }, [show, showTips]);

  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16',
  };

  return (
    <AnimatePresence mode="wait">
      {show && (
        <motion.div
          className={cn('flex flex-col items-center justify-center space-y-4', className)}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.3 }}
        >
          {/* Animated Loader */}
          <div className={cn('relative', sizeClasses[size])}>
            <AnimatedDots />
          </div>

          {/* Loading Message */}
          <AnimatePresence mode="wait">
            <motion.p
              key={currentMessage}
              className="text-gray-600 dark:text-gray-400 font-medium text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {currentMessage}
            </motion.p>
          </AnimatePresence>

          {/* Progress Bar */}
          {showProgress && (
            <div className="w-full max-w-xs">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  className="bg-blue-500 h-full rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                />
              </div>
              {progress > 0 && (
                <p className="text-xs text-gray-500 text-center mt-1">{progress}%</p>
              )}
            </div>
          )}

          {/* Tips */}
          {showTips && tip && (
            <motion.div
              className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg max-w-sm"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
            >
              <p className="text-xs text-blue-700 dark:text-blue-300">{tip}</p>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Animated Dots Loader
 */
const AnimatedDots: React.FC = () => {
  return (
    <div className="flex items-center justify-center space-x-2">
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className="w-3 h-3 bg-blue-500 rounded-full"
          animate={{
            y: [0, -12, 0],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: index * 0.2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
};

/**
 * Skeleton Loading with Personality
 */
export const PersonalitySkeletonLoader: React.FC<{
  type?: 'card' | 'list' | 'chart';
  message?: string;
}> = ({ type = 'card', message }) => {
  const [currentMessage, setCurrentMessage] = useState(
    message || 'Loading your content...'
  );

  useEffect(() => {
    const messages = [
      'Fetching your data...',
      'Almost there...',
      'Preparing your view...',
      'Loading components...',
      'One moment please...',
    ];

    const interval = setInterval(() => {
      setCurrentMessage(messages[Math.floor(Math.random() * messages.length)]);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <motion.p
        className="text-gray-500 text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {currentMessage}
      </motion.p>

      {type === 'card' && (
        <div className="space-y-4">
          {[0, 1, 2].map((i: any) => (
            <motion.div
              key={i}
              className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 h-32"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-gray-300 dark:bg-gray-700 rounded w-3/4" />
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-1/2" />
                <div className="h-3 bg-gray-300 dark:bg-gray-700 rounded w-2/3" />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Typing Indicator Component
 */
export const TypingIndicator: React.FC<{
  show?: boolean;
  message?: string;
}> = ({ show = false, message = 'Processing' }) => {
  const [dots, setDots] = useState('');

  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="inline-flex items-center space-x-1 text-gray-600"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <span>{message}</span>
          <span className="w-8 text-left">{dots}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Loading State Manager Hook
 */
export const useLoadingState = (initialMessage?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(initialMessage || '');
  const [progress, setProgress] = useState(0);

  const startLoading = (msg?: string) => {
    setIsLoading(true);
    setMessage(msg || 'Loading...');
    setProgress(0);
  };

  const updateProgress = (value: number, msg?: string) => {
    setProgress(Math.min(100, Math.max(0, value)));
    if (msg) setMessage(msg);
  };

  const stopLoading = () => {
    setIsLoading(false);
    setProgress(100);
    setTimeout(() => {
      setMessage('');
      setProgress(0);
    }, 300);
  };

  return {
    isLoading,
    message,
    progress,
    startLoading,
    updateProgress,
    stopLoading,
  };
};

/**
 * Smart Tooltip Component
 */
export const SmartTooltip: React.FC<{
  content: string;
  children: React.ReactNode;
  delay?: number;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({
  content,
  children,
  delay = 500,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout>();

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    setIsVisible(false);
  };

  const positionClasses = {
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2',
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
  };

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            className={cn(
              'absolute z-50 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg shadow-lg whitespace-nowrap pointer-events-none',
              positionClasses[position]
            )}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
          >
            {content}
            {/* Arrow */}
            <div
              className={cn(
                'absolute w-0 h-0 border-4 border-transparent',
                {
                  'border-t-gray-900 top-full left-1/2 -translate-x-1/2 -mt-px': position === 'bottom',
                  'border-b-gray-900 bottom-full left-1/2 -translate-x-1/2 -mb-px': position === 'top',
                  'border-l-gray-900 left-full top-1/2 -translate-y-1/2 -ml-px': position === 'right',
                  'border-r-gray-900 right-full top-1/2 -translate-y-1/2 -mr-px': position === 'left',
                }
              )}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};