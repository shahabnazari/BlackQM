/**
 * Guided Tour Component
 * Interactive product tours and onboarding
 * Phase 5 - Day 14 Implementation
 */

import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import React, { useEffect, useState } from 'react';
import Joyride, { ACTIONS, CallBackProps, EVENTS, STATUS, Step } from 'react-joyride';

interface GuidedTourProps {
  steps: Step[];
  run?: boolean;
  continuous?: boolean;
  showProgress?: boolean;
  showSkipButton?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  tourKey?: string; // For localStorage persistence
  styles?: any;
}

/**
 * Main Guided Tour Component using React Joyride
 */
export const GuidedTour: React.FC<GuidedTourProps> = ({
  steps,
  run = false,
  continuous = true,
  showProgress = true,
  showSkipButton = true,
  onComplete,
  onSkip,
  tourKey,
  styles,
}) => {
  const [tourRun, setTourRun] = useState(run);
  const [_stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    // Check if tour has been completed before
    if (tourKey) {
      const hasSeenTour = localStorage.getItem(`tour-${tourKey}-completed`);
      if (hasSeenTour) {
        setTourRun(false);
      }
    }
  }, [tourKey]);

  useEffect(() => {
    setTourRun(run);
  }, [run]);

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { status, action, index, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any)) {
      // Mark tour as completed
      if (tourKey) {
        localStorage.setItem(`tour-${tourKey}-completed`, 'true');
      }

      if (status === STATUS.FINISHED) {
        onComplete?.();
      } else if (status === STATUS.SKIPPED) {
        onSkip?.();
      }

      setTourRun(false);
    } else if (type === EVENTS.STEP_AFTER) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }
  };

  const defaultStyles = {
    options: {
      primaryColor: '#007AFF',
      textColor: '#333',
      backgroundColor: '#fff',
      arrowColor: '#fff',
      overlayColor: 'rgba(0, 0, 0, 0.5)',
      spotlightShadow: '0 0 15px rgba(0, 122, 255, 0.5)',
      beaconSize: 36,
      zIndex: 10000,
    },
    tooltip: {
      borderRadius: 12,
      fontSize: 16,
    },
    tooltipContainer: {
      textAlign: 'left',
    },
    tooltipTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 8,
    },
    tooltipContent: {
      fontSize: 16,
      lineHeight: 1.6,
    },
    buttonNext: {
      backgroundColor: '#007AFF',
      borderRadius: 8,
      fontSize: 14,
      padding: '8px 16px',
    },
    buttonBack: {
      marginRight: 10,
      fontSize: 14,
    },
    buttonSkip: {
      fontSize: 14,
      color: '#999',
    },
  };

  return (
    <Joyride
      steps={steps}
      run={tourRun}
      continuous={continuous}
      showProgress={showProgress}
      showSkipButton={showSkipButton}
      callback={handleJoyrideCallback}
      styles={styles || defaultStyles}
      floaterProps={{
        disableAnimation: false,
        disableFlip: false,
      }}
      locale={{
        back: 'Back',
        close: 'Close',
        last: 'Finish',
        next: 'Next',
        skip: 'Skip Tour',
      }}
    />
  );
};

/**
 * Tour Step Builder Helper
 */
export const createTourStep = (
  target: string,
  content: string,
  title?: string,
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'auto',
  disableBeacon?: boolean
): Step => {
  return {
    target,
    content,
    title,
    placement: placement || 'bottom',
    disableBeacon: disableBeacon || false,
  };
};

/**
 * Onboarding Steps for Different User Types
 */
export const researcherOnboardingSteps: Step[] = [
  createTourStep(
    '.dashboard-header',
    'Welcome to VQMethod! This is your researcher dashboard where you can manage all your Q-methodology studies.',
    'Welcome to VQMethod! 👋',
    'center',
    true
  ),
  createTourStep(
    '.create-study-button',
    'Click here to create your first Q-methodology study. You\'ll be guided through the setup process.',
    'Create Your First Study',
    'bottom'
  ),
  createTourStep(
    '.studies-list',
    'All your studies will appear here. You can view, edit, and analyze them at any time.',
    'Your Studies',
    'top'
  ),
  createTourStep(
    '.participant-manager',
    'Manage and invite participants to your studies. Track their progress in real-time.',
    'Participant Management',
    'left'
  ),
  createTourStep(
    '.analytics-dashboard',
    'Access powerful analytics and visualizations for your Q-sort data.',
    'Analytics & Insights',
    'left'
  ),
  createTourStep(
    '.help-center',
    'Need help? Access documentation, tutorials, and support here.',
    'Help & Support',
    'top'
  ),
];

/**
 * Feature Spotlight Component
 */
export const FeatureSpotlight: React.FC<{
  target: string;
  title: string;
  description: string;
  show?: boolean;
  onDismiss?: () => void;
}> = ({
  target: _target,
  title,
  description,
  show = false,
  onDismiss,
}) => {
  const [isVisible, setIsVisible] = useState(show);

  useEffect(() => {
    setIsVisible(show);
  }, [show]);

  const handleDismiss = () => {
    setIsVisible(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed inset-0 z-50 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/50 pointer-events-auto" onClick={handleDismiss} />
          
          {/* Spotlight */}
          <motion.div
            className="absolute bg-white dark:bg-gray-800 rounded-xl p-4 shadow-2xl pointer-events-auto"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              // Position would be calculated based on target element
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
            }}
          >
            <h3 className="text-lg font-bold mb-2">{title}</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
            <button
              onClick={handleDismiss}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Got it!
            </button>
            
            {/* Pulse animation on target */}
            <motion.div
              className="absolute w-4 h-4 bg-blue-500 rounded-full"
              animate={{
                scale: [1, 1.5, 1],
                opacity: [1, 0.5, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              style={{
                // Position would be calculated based on target element
                top: -8,
                left: -8,
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Interactive Hint Component
 */
export const InteractiveHint: React.FC<{
  message: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  show?: boolean;
  delay?: number;
}> = ({
  message,
  position = 'top',
  show = false,
  delay = 500,
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, delay);

      return () => clearTimeout(timer);
    } else {
      setIsVisible(false);
      return undefined;
    }
  }, [show, delay]);

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            'absolute z-50 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-lg',
            positionClasses[position]
          )}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          {message}
          
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-2 h-2 bg-gray-900 transform rotate-45',
              {
                'top-full -mt-1 left-1/2 -ml-1': position === 'bottom',
                'bottom-full -mb-1 left-1/2 -ml-1': position === 'top',
                'left-full -ml-1 top-1/2 -mt-1': position === 'right',
                'right-full -mr-1 top-1/2 -mt-1': position === 'left',
              }
            )}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * Progress Indicator with Steps
 */
export const StepProgress: React.FC<{
  steps: string[];
  currentStep: number;
  showLabels?: boolean;
  className?: string;
}> = ({
  steps,
  currentStep,
  showLabels = true,
  className,
}) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      {steps.map((step, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <div key={index} className="flex items-center flex-1">
            <div className="relative">
              {/* Step Circle */}
              <motion.div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center font-medium',
                  {
                    'bg-blue-500 text-white': isActive || isCompleted,
                    'bg-gray-200 text-gray-500': !isActive && !isCompleted,
                  }
                )}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: index * 0.1 }}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </motion.div>

              {/* Step Label */}
              {showLabels && (
                <motion.p
                  className={cn(
                    'absolute top-12 left-1/2 -translate-x-1/2 text-xs whitespace-nowrap',
                    {
                      'text-blue-500 font-medium': isActive,
                      'text-gray-600': isCompleted,
                      'text-gray-400': !isActive && !isCompleted,
                    }
                  )}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.2 }}
                >
                  {step}
                </motion.p>
              )}
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <motion.div
                className="flex-1 h-0.5 mx-2"
                initial={{ scaleX: 0 }}
                animate={{
                  scaleX: 1,
                  backgroundColor: isCompleted ? '#3B82F6' : '#E5E7EB',
                }}
                transition={{ delay: index * 0.1 + 0.1, duration: 0.3 }}
                style={{ transformOrigin: 'left' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};