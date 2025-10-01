'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Compass,
  Smartphone,
  Tablet,
  Command,
  Gauge,
  MousePointer,
  Check,
  Info,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import confetti from 'canvas-confetti';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: React.ElementType;
  action?: () => void;
  route?: string; // Navigate to this route
  interactive?: boolean; // Allow user to interact with highlighted element
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to the New Navigation System! 🎉',
    description:
      "We've completely redesigned the navigation to make your research workflow smoother and more intuitive. Let's take a quick tour!",
    position: 'center',
    icon: Sparkles,
  },
  {
    id: 'phases',
    title: 'Research Lifecycle Navigation',
    description:
      'Your research journey is now organized into 10 clear phases: Discover, Design, Build, Recruit, Collect, Analyze, Visualize, Interpret, Report, and Archive.',
    target: '.primary-toolbar',
    position: 'bottom',
    icon: Compass,
  },
  {
    id: 'mobile',
    title: 'Mobile-First Design',
    description:
      'On mobile devices, navigate using the bottom tabs and swipe between phases for a seamless experience.',
    position: 'center',
    icon: Smartphone,
    route: '/discover',
  },
  {
    id: 'tablet',
    title: 'Optimized for Tablets',
    description:
      'Tablet users get a collapsible sidebar with all phases and quick settings access. Try it on your iPad!',
    position: 'center',
    icon: Tablet,
  },
  {
    id: 'command',
    title: 'Command Palette (Cmd+K)',
    description:
      "Press Cmd+K (or Ctrl+K on Windows) anytime to quickly jump to any feature. It's the fastest way to navigate!",
    target: '.quick-actions-trigger',
    position: 'bottom',
    icon: Command,
    interactive: true,
  },
  {
    id: 'performance',
    title: 'Performance Dashboard',
    description:
      "Monitor your app's performance with real-time Core Web Vitals, bundle size analysis, and AI-powered recommendations.",
    position: 'center',
    icon: Gauge,
    route: '/performance',
  },
  {
    id: 'gestures',
    title: 'Touch & Gesture Support',
    description:
      'Swipe between phases, pull to refresh, and enjoy haptic feedback on supported devices. The app feels native!',
    position: 'center',
    icon: MousePointer,
  },
  {
    id: 'features',
    title: 'Smart Feature Rollout',
    description:
      'New features are gradually rolled out using feature flags. You can preview experimental features in settings.',
    position: 'center',
    icon: Zap,
  },
  {
    id: 'complete',
    title: "You're All Set! 🚀",
    description:
      'Ready to explore the new navigation? Start with the Discover phase to begin your research journey.',
    position: 'center',
    icon: Check,
    action: () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    },
  },
];

interface OnboardingTourProps {
  isOpen?: boolean;
  onComplete?: () => void;
  onSkip?: () => void;
  startStep?: number;
}

export function OnboardingTour({
  isOpen = false,
  onComplete,
  onSkip,
  startStep = 0,
}: OnboardingTourProps) {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [currentStep, setCurrentStep] = useState(startStep);
  const [highlightBox, setHighlightBox] = useState<DOMRect | null>(null);
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  const currentTourStep = tourSteps[currentStep];

  // Listen for custom event to start tour
  useEffect(() => {
    const handleStartTour = () => {
      setIsVisible(true);
      setCurrentStep(0);
    };

    window.addEventListener('start-navigation-onboarding', handleStartTour);
    return () => {
      window.removeEventListener(
        'start-navigation-onboarding',
        handleStartTour
      );
    };
  }, []);

  // Update highlight box when step changes
  useEffect(() => {
    if (currentTourStep?.target) {
      const element = document.querySelector(currentTourStep.target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setHighlightBox(rect);
      } else {
        setHighlightBox(null);
      }
    } else {
      setHighlightBox(null);
    }
  }, [currentStep, currentTourStep]);

  // Handle navigation to specific routes
  useEffect(() => {
    if (currentTourStep?.route) {
      router.push(currentTourStep.route);
    }
  }, [currentTourStep, router]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    // Mark onboarding as complete
    const prefs = JSON.parse(
      localStorage.getItem('new-navigation-preferences') || '{}'
    );
    prefs.onboardingCompleted = true;
    localStorage.setItem('new-navigation-preferences', JSON.stringify(prefs));

    // Run completion action if provided
    if (currentTourStep?.action) {
      currentTourStep.action();
    }

    // Close tour
    setTimeout(() => {
      setIsVisible(false);
      onComplete?.();
    }, 1000);
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip?.();
  };

  if (!isVisible) return null;

  const Icon = currentTourStep?.icon;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100]">
        {/* Overlay with cutout */}
        <div
          ref={overlayRef}
          className="absolute inset-0 bg-black/50"
          onClick={currentTourStep?.interactive ? undefined : handleNext}
        >
          {highlightBox && !currentTourStep?.interactive && (
            <div
              className="absolute bg-transparent"
              style={{
                top: highlightBox.top - 4,
                left: highlightBox.left - 4,
                width: highlightBox.width + 8,
                height: highlightBox.height + 8,
                boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                borderRadius: '8px',
              }}
            />
          )}
        </div>

        {/* Tour Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className={cn(
            'absolute z-10',
            currentTourStep?.position === 'center' &&
              'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2',
            currentTourStep?.position === 'top' &&
              'top-4 left-1/2 -translate-x-1/2',
            currentTourStep?.position === 'bottom' &&
              'bottom-4 left-1/2 -translate-x-1/2',
            currentTourStep?.position === 'left' &&
              'left-4 top-1/2 -translate-y-1/2',
            currentTourStep?.position === 'right' &&
              'right-4 top-1/2 -translate-y-1/2',
            !currentTourStep?.position &&
              highlightBox &&
              'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
          )}
          style={
            highlightBox && currentTourStep?.position !== 'center'
              ? {
                  top:
                    currentTourStep?.position === 'bottom'
                      ? highlightBox.bottom + 16
                      : currentTourStep?.position === 'top'
                        ? highlightBox.top - 16
                        : 0,
                  transform: 'translateX(-50%)',
                }
              : {}
          }
        >
          <Card className="w-96 max-w-[90vw] p-6 shadow-xl">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                {Icon && (
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-semibold">
                    {currentTourStep?.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Step {currentStep + 1} of {tourSteps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={handleSkip}
                className="p-1 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content */}
            <p className="text-sm text-muted-foreground mb-6">
              {currentTourStep?.description}
            </p>

            {/* Progress */}
            <div className="flex gap-1 mb-6">
              {tourSteps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex-1 h-1 rounded-full transition-colors',
                    index <= currentStep
                      ? 'bg-primary'
                      : 'bg-gray-200 dark:bg-gray-700'
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <button
                onClick={handleSkip}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip tour
              </button>

              <div className="flex gap-2">
                {currentStep > 0 && (
                  <Button variant="outline" size="sm" onClick={handlePrevious}>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </Button>
                )}

                <Button size="sm" onClick={handleNext} className="min-w-24">
                  {currentStep === tourSteps.length - 1 ? (
                    <>
                      Complete
                      <Check className="h-4 w-4 ml-1" />
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Interactive hint */}
            {currentTourStep?.interactive && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    Try it now! Press Cmd+K to open the command palette.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Hook to trigger onboarding
export function useOnboardingTour() {
  const [showTour, setShowTour] = useState(false);

  const startTour = () => {
    setShowTour(true);
  };

  const completeTour = () => {
    setShowTour(false);
  };

  const skipTour = () => {
    setShowTour(false);
  };

  // Check if user needs onboarding
  useEffect(() => {
    const prefs = JSON.parse(
      localStorage.getItem('new-navigation-preferences') || '{}'
    );
    const hasSeenTour = prefs.onboardingCompleted;
    const isNewUser = !localStorage.getItem('userId');

    if (!hasSeenTour || isNewUser) {
      // Delay tour start to let app load
      setTimeout(() => {
        setShowTour(true);
      }, 1500);
    }
  }, []);

  return {
    showTour,
    startTour,
    completeTour,
    skipTour,
    TourComponent: () => (
      <OnboardingTour
        isOpen={showTour}
        onComplete={completeTour}
        onSkip={skipTour}
      />
    ),
  };
}

// Standalone button to restart tour
export function RestartTourButton() {
  const handleRestart = () => {
    window.dispatchEvent(new CustomEvent('start-navigation-onboarding'));
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRestart}
      className="gap-2"
    >
      <Sparkles className="h-4 w-4" />
      Tour Navigation
    </Button>
  );
}
