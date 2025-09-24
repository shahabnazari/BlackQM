'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
} from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  Search,
  BookOpen,
  Layers,
  Users,
  Database,
  BarChart3,
  Eye,
  Brain,
  FileText,
  Archive,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CheckCircle,
  Lock,
} from 'lucide-react';
import { ResearchPhase } from './PrimaryToolbar';
import { useNavigationState } from '@/hooks/useNavigationState';
import { useSwipeable } from 'react-swipeable';

interface PhaseInfo {
  id: ResearchPhase;
  label: string;
  icon: React.ElementType;
  color: string;
  route: string;
  description: string;
}

const PHASES: PhaseInfo[] = [
  {
    id: 'discover',
    label: 'Discover',
    icon: Search,
    color: 'bg-purple-500',
    route: '/discover',
    description: 'Literature & research',
  },
  {
    id: 'design',
    label: 'Design',
    icon: BookOpen,
    color: 'bg-indigo-500',
    route: '/design',
    description: 'Methodology design',
  },
  {
    id: 'build',
    label: 'Build',
    icon: Layers,
    color: 'bg-blue-500',
    route: '/build',
    description: 'Create study',
  },
  {
    id: 'recruit',
    label: 'Recruit',
    icon: Users,
    color: 'bg-cyan-500',
    route: '/recruit',
    description: 'Find participants',
  },
  {
    id: 'collect',
    label: 'Collect',
    icon: Database,
    color: 'bg-teal-500',
    route: '/collect',
    description: 'Gather data',
  },
  {
    id: 'analyze',
    label: 'Analyze',
    icon: BarChart3,
    color: 'bg-green-500',
    route: '/analyze',
    description: 'Statistical analysis',
  },
  {
    id: 'visualize',
    label: 'Visualize',
    icon: Eye,
    color: 'bg-emerald-500',
    route: '/visualize',
    description: 'Create visualizations',
  },
  {
    id: 'interpret',
    label: 'Interpret',
    icon: Brain,
    color: 'bg-orange-500',
    route: '/interpret',
    description: 'Extract insights',
  },
  {
    id: 'report',
    label: 'Report',
    icon: FileText,
    color: 'bg-red-500',
    route: '/report',
    description: 'Generate reports',
  },
  {
    id: 'archive',
    label: 'Archive',
    icon: Archive,
    color: 'bg-gray-500',
    route: '/archive',
    description: 'Preserve study',
  },
];

interface MobilePhaseNavigatorProps {
  className?: string;
  showLabels?: boolean;
  position?: 'top' | 'bottom';
}

export function MobilePhaseNavigator({
  className = '',
  showLabels = false,
  position = 'bottom',
}: MobilePhaseNavigatorProps) {
  const router = useRouter();
  const { currentPhase, availablePhases, completedPhases, phaseProgress } =
    useNavigationState();
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const navOpacity = useTransform(scrollY, [0, 100], [1, 0.95]);

  // Find current phase index
  useEffect(() => {
    const index = PHASES.findIndex(p => p.id === currentPhase);
    if (index >= 0) {
      setActivePhaseIndex(index);
    }
  }, [currentPhase]);

  // Check if phase is accessible
  const isPhaseAccessible = useCallback(
    (phaseId: ResearchPhase) => {
      return (
        availablePhases.includes(phaseId) || completedPhases.includes(phaseId)
      );
    },
    [availablePhases, completedPhases]
  );

  // Navigate to phase
  const navigateToPhase = useCallback(
    (phase: PhaseInfo) => {
      if (isPhaseAccessible(phase.id)) {
        router.push(phase.route);
        setIsMenuOpen(false);
      }
    },
    [router, isPhaseAccessible]
  );

  // Handle swipe navigation
  const handlers = useSwipeable({
    onSwipedLeft: () => {
      if (activePhaseIndex < PHASES.length - 1) {
        const nextPhase = PHASES[activePhaseIndex + 1];
        if (nextPhase && isPhaseAccessible(nextPhase.id)) {
          navigateToPhase(nextPhase);
        }
      }
    },
    onSwipedRight: () => {
      if (activePhaseIndex > 0) {
        const prevPhase = PHASES[activePhaseIndex - 1];
        if (prevPhase && isPhaseAccessible(prevPhase.id)) {
          navigateToPhase(prevPhase);
        }
      }
    },
    trackMouse: false,
  });

  // Get phase status
  const getPhaseStatus = (phaseId: ResearchPhase) => {
    if (completedPhases.includes(phaseId)) return 'completed';
    if (currentPhase === phaseId) return 'current';
    if (availablePhases.includes(phaseId)) return 'available';
    return 'locked';
  };

  // Bottom navigation bar (iOS-style tab bar)
  const renderBottomNav = () => (
    <motion.div
      className={`
        fixed bottom-0 left-0 right-0 z-40
        bg-white/95 backdrop-blur-lg border-t border-gray-200
        safe-bottom ${className}
      `}
      style={{ opacity: navOpacity }}
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      <div className="flex justify-around items-center py-2 px-2">
        {/* Show 5 items: 2 before, current, 2 after */}
        {PHASES.slice(
          Math.max(0, activePhaseIndex - 2),
          Math.min(PHASES.length, activePhaseIndex + 3)
        ).map(phase => {
          const Icon = phase.icon;
          const status = getPhaseStatus(phase.id);
          const progress = phaseProgress[phase.id] || 0;
          const isCurrent = phase.id === currentPhase;

          return (
            <motion.button
              key={phase.id}
              className={`
                flex flex-col items-center justify-center p-2 rounded-lg
                ${status === 'locked' ? 'opacity-40' : 'opacity-100'}
                ${isCurrent ? 'bg-blue-50' : ''}
              `}
              onClick={() => navigateToPhase(phase)}
              disabled={status === 'locked'}
              whileTap={status !== 'locked' ? { scale: 0.95 } : {}}
            >
              <div className="relative">
                <Icon
                  className={`
                  w-6 h-6
                  ${isCurrent ? 'text-blue-600' : status === 'completed' ? 'text-green-600' : 'text-gray-600'}
                `}
                />

                {/* Progress indicator */}
                {status === 'current' && progress > 0 && progress < 100 && (
                  <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-gray-200 rounded-full">
                    <motion.div
                      className="h-full bg-blue-600 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                    />
                  </div>
                )}

                {/* Completed badge */}
                {status === 'completed' && (
                  <CheckCircle className="absolute -top-1 -right-1 w-3 h-3 text-green-500" />
                )}

                {/* Lock badge */}
                {status === 'locked' && (
                  <Lock className="absolute -top-1 -right-1 w-3 h-3 text-gray-400" />
                )}
              </div>

              {showLabels && (
                <span
                  className={`
                  text-xs mt-1
                  ${isCurrent ? 'text-blue-600 font-medium' : 'text-gray-600'}
                `}
                >
                  {phase.label}
                </span>
              )}
            </motion.button>
          );
        })}

        {/* Menu button */}
        <motion.button
          className="p-2"
          onClick={() => setIsMenuOpen(true)}
          whileTap={{ scale: 0.95 }}
        >
          <Menu className="w-6 h-6 text-gray-600" />
        </motion.button>
      </div>
    </motion.div>
  );

  // Top navigation bar (Android-style)
  const renderTopNav = () => (
    <motion.div
      className={`
        fixed top-0 left-0 right-0 z-40
        bg-white/95 backdrop-blur-lg border-b border-gray-200
        safe-top ${className}
      `}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Current phase info */}
        <div className="flex items-center space-x-3">
          {activePhaseIndex > 0 && (
            <motion.button
              onClick={() => {
                const prevPhase = PHASES[activePhaseIndex - 1];
                if (prevPhase) navigateToPhase(prevPhase);
              }}
              whileTap={{ scale: 0.95 }}
            >
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            </motion.button>
          )}

          <div className="flex items-center space-x-2">
            {PHASES[activePhaseIndex] && (
              <>
                {React.createElement(PHASES[activePhaseIndex].icon, {
                  className: 'w-6 h-6 text-blue-600',
                })}
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {PHASES[activePhaseIndex].label}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {PHASES[activePhaseIndex].description}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Navigation controls */}
        <div className="flex items-center space-x-2">
          {activePhaseIndex < PHASES.length - 1 && (
            <motion.button
              onClick={() => {
                const nextPhase = PHASES[activePhaseIndex + 1];
                if (nextPhase) navigateToPhase(nextPhase);
              }}
              whileTap={{ scale: 0.95 }}
              disabled={
                !PHASES[activePhaseIndex + 1] ||
                !isPhaseAccessible(
                  PHASES[activePhaseIndex + 1]?.id || 'archive'
                )
              }
              className={
                !PHASES[activePhaseIndex + 1] ||
                !isPhaseAccessible(
                  PHASES[activePhaseIndex + 1]?.id || 'archive'
                )
                  ? 'opacity-40'
                  : ''
              }
            >
              <ChevronRight className="w-6 h-6 text-gray-600" />
            </motion.button>
          )}

          <motion.button
            onClick={() => setIsMenuOpen(true)}
            whileTap={{ scale: 0.95 }}
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </motion.button>
        </div>
      </div>

      {/* Phase dots indicator */}
      <div className="flex justify-center items-center pb-2 space-x-1.5">
        {PHASES.map((phase, index) => {
          const status = getPhaseStatus(phase.id);
          return (
            <motion.button
              key={phase.id}
              className={`
                w-2 h-2 rounded-full transition-all
                ${index === activePhaseIndex ? 'w-8 bg-blue-600' : ''}
                ${status === 'completed' ? 'bg-green-500' : ''}
                ${status === 'available' ? 'bg-gray-400' : ''}
                ${status === 'locked' ? 'bg-gray-200' : ''}
              `}
              onClick={() => navigateToPhase(phase)}
              disabled={status === 'locked'}
              whileHover={status !== 'locked' ? { scale: 1.2 } : {}}
            />
          );
        })}
      </div>
    </motion.div>
  );

  // Full screen menu overlay
  const renderMenu = () => (
    <AnimatePresence>
      {isMenuOpen && (
        <motion.div
          className="fixed inset-0 z-50 bg-white"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">Research Phases</h2>
              <motion.button
                onClick={() => setIsMenuOpen(false)}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-6 h-6 text-gray-600" />
              </motion.button>
            </div>

            {/* Phase list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {PHASES.map(phase => {
                const Icon = phase.icon;
                const status = getPhaseStatus(phase.id);
                const progress = phaseProgress[phase.id] || 0;
                const isCurrent = phase.id === currentPhase;

                return (
                  <motion.button
                    key={phase.id}
                    className={`
                      w-full p-4 rounded-xl border-2 transition-all
                      ${isCurrent ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                      ${status === 'locked' ? 'opacity-50' : ''}
                    `}
                    onClick={() => navigateToPhase(phase)}
                    disabled={status === 'locked'}
                    whileTap={status !== 'locked' ? { scale: 0.98 } : {}}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`p-2 rounded-lg ${phase.color} bg-opacity-10`}
                        >
                          <Icon
                            className={`w-6 h-6 ${phase.color.replace('bg-', 'text-')}`}
                          />
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-gray-900">
                            {phase.label}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {phase.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {status === 'completed' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {status === 'current' && (
                          <div className="text-sm font-medium text-blue-600">
                            {progress}%
                          </div>
                        )}
                        {status === 'locked' && (
                          <Lock className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Progress bar */}
                    {status === 'current' && progress > 0 && progress < 100 && (
                      <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-blue-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>
                  {completedPhases.length} of {PHASES.length} phases complete
                </span>
                <motion.button
                  className="text-blue-600 font-medium"
                  onClick={() => {
                    router.push('/dashboard');
                    setIsMenuOpen(false);
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  Go to Dashboard
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <div {...handlers}>
        {position === 'bottom' ? renderBottomNav() : renderTopNav()}
      </div>
      {renderMenu()}
    </>
  );
}

// Export a hook for detecting mobile viewport
export function useMobileNavigation() {
  const [isMobile, setIsMobile] = useState(false);
  const [viewportHeight, setViewportHeight] = useState(0);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      setViewportHeight(window.innerHeight);

      // Set CSS variable for safe areas
      const root = document.documentElement;
      root.style.setProperty('--safe-top', `env(safe-area-inset-top, 0px)`);
      root.style.setProperty(
        '--safe-bottom',
        `env(safe-area-inset-bottom, 0px)`
      );
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);

    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  return { isMobile, viewportHeight };
}
