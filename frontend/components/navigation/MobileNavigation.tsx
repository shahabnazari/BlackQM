'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  PenTool,
  Hammer,
  Users,
  ClipboardList,
  BarChart3,
  Eye,
  Brain,
  FileText,
  Archive,
  Menu,
  X,
  ChevronUp,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const mobilePhases = [
  {
    id: 1,
    name: 'DISCOVER',
    icon: Search,
    path: '/discover',
    color: 'bg-purple-500',
  },
  {
    id: 2,
    name: 'DESIGN',
    icon: PenTool,
    path: '/design',
    color: 'bg-indigo-500',
  },
  {
    id: 3,
    name: 'BUILD',
    icon: Hammer,
    path: '/studies/create',
    color: 'bg-blue-500',
  },
  {
    id: 4,
    name: 'RECRUIT',
    icon: Users,
    path: '/recruitment',
    color: 'bg-cyan-500',
  },
  {
    id: 5,
    name: 'COLLECT',
    icon: ClipboardList,
    path: '/collect',
    color: 'bg-teal-500',
  },
  {
    id: 6,
    name: 'ANALYZE',
    icon: BarChart3,
    path: '/analysis',
    color: 'bg-green-500',
  },
  {
    id: 7,
    name: 'VISUALIZE',
    icon: Eye,
    path: '/visualize',
    color: 'bg-lime-500',
  },
  {
    id: 8,
    name: 'INTERPRET',
    icon: Brain,
    path: '/interpret',
    color: 'bg-yellow-500',
  },
  {
    id: 9,
    name: 'REPORT',
    icon: FileText,
    path: '/report',
    color: 'bg-orange-500',
  },
  {
    id: 10,
    name: 'ARCHIVE',
    icon: Archive,
    path: '/archive',
    color: 'bg-red-500',
  },
];

interface MobileNavigationProps {
  className?: string;
}

export function MobileNavigation({ className }: MobileNavigationProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activePhase, setActivePhase] = useState(1);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Update active phase based on current path
  useEffect(() => {
    const currentPhase = mobilePhases.find(phase =>
      pathname.startsWith(phase.path)
    );
    if (currentPhase) {
      setActivePhase(currentPhase.id);
    }
  }, [pathname]);

  // Show scroll to top button when scrolled down
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePhaseClick = (phase: (typeof mobilePhases)[0]) => {
    setActivePhase(phase.id);
    router.push(phase.path);
    setIsExpanded(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Primary bottom navigation (5 items)
  const primaryPhases = [
    mobilePhases[0], // DISCOVER
    mobilePhases[2], // BUILD
    mobilePhases[5], // ANALYZE
    mobilePhases[8], // REPORT
    { id: 0, name: 'More', icon: Menu, path: '#', color: 'bg-gray-500' },
  ];

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 md:hidden',
          'bg-background border-t border-border',
          'safe-area-bottom', // iOS safe area
          className
        )}
      >
        <div className="flex items-center justify-around h-16">
          {primaryPhases.map(phase => {
            const Icon = phase?.icon;
            const isActive = activePhase === phase?.id;
            const isMore = phase?.id === 0;

            return (
              <button
                key={phase?.id}
                onClick={() =>
                  isMore ? setIsExpanded(!isExpanded) : phase && handlePhaseClick(phase)
                }
                className={cn(
                  'flex flex-col items-center justify-center',
                  'w-full h-full px-2 py-1',
                  'transition-all duration-200',
                  'touch-manipulation', // Optimize for touch
                  isActive && !isMore && 'text-primary',
                  !isActive && !isMore && 'text-muted-foreground',
                  'active:scale-95',
                  'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
                )}
                aria-label={phase?.name || 'Menu item'}
                aria-current={isActive ? 'page' : undefined}
              >
                <motion.div
                  initial={false}
                  animate={{ scale: isActive && !isMore ? 1.1 : 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                >
                  {Icon && (
                    <Icon
                      className={cn(
                        'h-5 w-5 mb-1',
                        isMore && isExpanded && 'rotate-180 transition-transform'
                      )}
                    />
                  )}
                </motion.div>
                <span className="text-xs font-medium">{phase?.name || ''}</span>
                {isActive && !isMore && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={cn(
                      'absolute top-0 left-0 right-0 h-0.5',
                      phase.color
                    )}
                    transition={{ type: 'spring', stiffness: 300 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Expanded Phase Menu - Sheet Style */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsExpanded(false)}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />

            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className={cn(
                'fixed bottom-16 left-0 right-0 z-40',
                'bg-background rounded-t-2xl shadow-xl',
                'max-h-[60vh] overflow-y-auto',
                'md:hidden'
              )}
            >
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm p-4 border-b">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Research Phases</h3>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 rounded-full hover:bg-accent"
                    aria-label="Close menu"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4">
                {mobilePhases.map(phase => {
                  const Icon = phase?.icon;
                  const isActive = activePhase === phase?.id;

                  return (
                    <motion.button
                      key={phase?.id}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePhaseClick(phase)}
                      className={cn(
                        'flex flex-col items-center justify-center',
                        'p-4 rounded-xl',
                        'transition-all duration-200',
                        'touch-manipulation',
                        isActive ? phase.color : 'bg-accent',
                        isActive && 'text-white',
                        'active:scale-95',
                        'focus:outline-none focus:ring-2 focus:ring-primary'
                      )}
                    >
                      <Icon className="h-6 w-6 mb-2" />
                      <span className="text-sm font-medium">{phase.name}</span>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Action Button - Scroll to Top */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className={cn(
              'fixed bottom-20 right-4 z-30',
              'bg-primary text-primary-foreground',
              'rounded-full p-3 shadow-lg',
              'md:hidden',
              'touch-manipulation'
            )}
            aria-label="Scroll to top"
          >
            <ChevronUp className="h-5 w-5" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
