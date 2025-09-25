'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpenIcon,
  LightBulbIcon,
  WrenchIcon,
  UsersIcon,
  ClipboardDocumentListIcon,
  BeakerIcon,
  ChartBarIcon,
  DocumentTextIcon,
  DocumentIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { useNavigationState } from '@/hooks/useNavigationState';
import { SecondaryToolbar } from './SecondaryToolbar';
import { PhaseAvailability } from './PhaseAvailability';
import { ContextualHelp } from './ContextualHelp';
import { PhaseOnboarding } from './PhaseOnboarding';
import { NavigationPreferences } from './NavigationPreferences';
import { GlobalSearch } from './GlobalSearch';
import { cn } from '@/lib/utils';

export type ResearchPhase =
  | 'discover'
  | 'design'
  | 'build'
  | 'recruit'
  | 'collect'
  | 'analyze'
  | 'visualize'
  | 'interpret'
  | 'report'
  | 'archive';

export type NavigationMode = 'expanded' | 'compact' | 'minimal' | 'icons';

interface PhaseConfig {
  id: ResearchPhase;
  label: string;
  shortLabel: string;
  description: string;
  icon: React.ComponentType<any>; // HeroIcon component
  color: string;
  bgColor: string;
  hoverBg: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
}

const phaseConfigs: PhaseConfig[] = [
  {
    id: 'discover',
    label: 'Discover',
    shortLabel: 'DIS',
    description: 'Literature review & research foundation',
    icon: BookOpenIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    hoverBg: 'hover:bg-purple-100',
    gradientFrom: 'from-purple-400',
    gradientTo: 'to-purple-600',
    borderColor: 'border-purple-300',
  },
  {
    id: 'design',
    label: 'Design',
    shortLabel: 'DES',
    description: 'Formulate questions & methodology',
    icon: LightBulbIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    hoverBg: 'hover:bg-yellow-100',
    gradientFrom: 'from-yellow-400',
    gradientTo: 'to-yellow-600',
    borderColor: 'border-yellow-300',
  },
  {
    id: 'build',
    label: 'Build',
    shortLabel: 'BLD',
    description: 'Create study instruments',
    icon: WrenchIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    hoverBg: 'hover:bg-blue-100',
    gradientFrom: 'from-blue-400',
    gradientTo: 'to-blue-600',
    borderColor: 'border-blue-300',
  },
  {
    id: 'recruit',
    label: 'Recruit',
    shortLabel: 'REC',
    description: 'Find & manage participants',
    icon: UsersIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    hoverBg: 'hover:bg-green-100',
    gradientFrom: 'from-green-400',
    gradientTo: 'to-green-600',
    borderColor: 'border-green-300',
  },
  {
    id: 'collect',
    label: 'Collect',
    shortLabel: 'COL',
    description: 'Gather research data',
    icon: ClipboardDocumentListIcon,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
    hoverBg: 'hover:bg-teal-100',
    gradientFrom: 'from-teal-400',
    gradientTo: 'to-teal-600',
    borderColor: 'border-teal-300',
  },
  {
    id: 'analyze',
    label: 'Analyze',
    shortLabel: 'ANA',
    description: 'Statistical analysis & patterns',
    icon: BeakerIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    hoverBg: 'hover:bg-indigo-100',
    gradientFrom: 'from-indigo-400',
    gradientTo: 'to-indigo-600',
    borderColor: 'border-indigo-300',
  },
  {
    id: 'visualize',
    label: 'Visualize',
    shortLabel: 'VIS',
    description: 'Create charts & visualizations',
    icon: ChartBarIcon,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
    hoverBg: 'hover:bg-pink-100',
    gradientFrom: 'from-pink-400',
    gradientTo: 'to-pink-600',
    borderColor: 'border-pink-300',
  },
  {
    id: 'interpret',
    label: 'Interpret',
    shortLabel: 'INT',
    description: 'Extract meaning & insights',
    icon: DocumentTextIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    hoverBg: 'hover:bg-orange-100',
    gradientFrom: 'from-orange-400',
    gradientTo: 'to-orange-600',
    borderColor: 'border-orange-300',
  },
  {
    id: 'report',
    label: 'Report',
    shortLabel: 'REP',
    description: 'Document & share findings',
    icon: DocumentIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    hoverBg: 'hover:bg-red-100',
    gradientFrom: 'from-red-400',
    gradientTo: 'to-red-600',
    borderColor: 'border-red-300',
  },
  {
    id: 'archive',
    label: 'Archive',
    shortLabel: 'ARC',
    description: 'Store & share research',
    icon: ArchiveBoxIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    hoverBg: 'hover:bg-gray-100',
    gradientFrom: 'from-gray-400',
    gradientTo: 'to-gray-600',
    borderColor: 'border-gray-300',
  },
];

export function PrimaryToolbar() {
  const {
    currentPhase,
    setCurrentPhase,
    phaseProgress,
    availablePhases,
    completedPhases,
    studyId,
  } = useNavigationState();

  const [expandedPhase, setExpandedPhase] = useState<ResearchPhase | null>(
    null
  );
  const [hoveredPhase, setHoveredPhase] = useState<ResearchPhase | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [userId] = useState<string>('user123'); // TODO: Get from auth context
  const [navigationMode, setNavigationMode] = useState<NavigationMode>('expanded');
  const [showSearch, setShowSearch] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  // Load navigation preferences from localStorage
  useEffect(() => {
    const savedMode = localStorage.getItem('navigationMode') as NavigationMode;
    if (savedMode) {
      setNavigationMode(savedMode);
    }
  }, []);

  // Save navigation mode preference
  const updateNavigationMode = (mode: NavigationMode) => {
    setNavigationMode(mode);
    localStorage.setItem('navigationMode', mode);
  };

  // Keyboard navigation and shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Phase navigation (Cmd/Ctrl + 1-9, 0)
      if (e.metaKey || e.ctrlKey) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 9) {
          e.preventDefault();
          const phase = phaseConfigs[num - 1];
          if (phase && availablePhases.includes(phase.id)) {
            setCurrentPhase(phase.id);
            setExpandedPhase(phase.id);
          }
        } else if (e.key === '0') {
          e.preventDefault();
          const phase = phaseConfigs[9];
          if (phase && availablePhases.includes(phase.id)) {
            setCurrentPhase(phase.id);
            setExpandedPhase(phase.id);
          }
        }
        // Quick actions
        else if (e.key === 'k') {
          e.preventDefault();
          setShowSearch(!showSearch);
        } else if (e.key === ',') {
          e.preventDefault();
          setShowPreferences(!showPreferences);
        } else if (e.key === '\\') {
          e.preventDefault();
          // Cycle through navigation modes
          const modes: NavigationMode[] = ['expanded', 'compact', 'minimal', 'icons'];
          const currentIndex = modes.indexOf(navigationMode);
          const nextMode = modes[(currentIndex + 1) % modes.length];
          updateNavigationMode(nextMode);
        }
      }

      // Escape key actions
      if (e.key === 'Escape') {
        setExpandedPhase(null);
        setShowSearch(false);
        setShowPreferences(false);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [availablePhases, setCurrentPhase, navigationMode, showSearch, showPreferences]);

  const handlePhaseClick = (phase: ResearchPhase) => {
    if (!availablePhases.includes(phase)) return;

    setCurrentPhase(phase);
    if (expandedPhase === phase) {
      setExpandedPhase(null);
    } else {
      setExpandedPhase(phase);
    }
  };

  return (
    <>
      {/* Primary Research Lifecycle Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex items-center justify-between px-4 py-2">
            {/* Navigation Mode Toggle */}
            <div className="flex items-center mr-4">
              <button
                onClick={() => {
                  const modes: NavigationMode[] = ['expanded', 'compact', 'minimal', 'icons'];
                  const currentIndex = modes.indexOf(navigationMode);
                  const nextMode = modes[(currentIndex + 1) % modes.length];
                  updateNavigationMode(nextMode);
                }}
                className="p-1.5 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                title={`Navigation: ${navigationMode} (⌘\\)`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                    d={navigationMode === 'expanded' 
                      ? "M4 6h16M4 12h16M4 18h16" // Expanded
                      : navigationMode === 'compact'
                      ? "M4 6h16M4 12h8M4 18h16" // Compact
                      : navigationMode === 'minimal'
                      ? "M4 6h16M4 12h16" // Minimal
                      : "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" // Icons
                    } 
                  />
                </svg>
              </button>
            </div>

            {/* Phase Navigation */}
            <div className="flex items-center space-x-1 overflow-x-auto flex-1">
              {phaseConfigs.map(phase => {
                const Icon = phase.icon;
                const progress = phaseProgress[phase.id] || 0;
                const isAvailable = availablePhases.includes(phase.id);
                const isCompleted = completedPhases.includes(phase.id);
                const isActive = currentPhase === phase.id;
                const isExpanded = expandedPhase === phase.id;
                const isHovered = hoveredPhase === phase.id;

                return (
                  <motion.button
                    key={phase.id}
                    onClick={() => handlePhaseClick(phase.id)}
                    onMouseEnter={() => setHoveredPhase(phase.id)}
                    onMouseLeave={() => setHoveredPhase(null)}
                    disabled={!isAvailable}
                    whileHover={isAvailable ? { scale: 1.05 } : {}}
                    whileTap={isAvailable ? { scale: 0.95 } : {}}
                    className={cn(
                      'relative group flex items-center rounded-lg transition-all duration-200',
                      // Size based on navigation mode
                      navigationMode === 'expanded' && 'px-3 py-2',
                      navigationMode === 'compact' && 'px-2 py-1.5',
                      navigationMode === 'minimal' && 'px-2 py-1',
                      navigationMode === 'icons' && 'p-2',
                      // Colors and states
                      isAvailable
                        ? 'cursor-pointer'
                        : 'cursor-not-allowed opacity-40',
                      isActive || isExpanded
                        ? `${phase.bgColor} ${phase.borderColor} border`
                        : phase.hoverBg,
                      isActive && 'ring-2 ring-offset-1',
                      isActive && phase.borderColor.replace('border', 'ring'),
                      // Gradient background for completed phases
                      isCompleted && `bg-gradient-to-r ${phase.gradientFrom} ${phase.gradientTo} text-white`
                    )}
                    style={{
                      background: isCompleted ? `linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` : undefined
                    }}
                  >
                    {/* Phase Icon & Label */}
                    <div className="flex items-center space-x-2">
                      <Icon
                        className={cn(
                          navigationMode === 'icons' ? 'w-6 h-6' : 'w-5 h-5',
                          isCompleted ? 'text-white' : isActive ? phase.color : 'text-gray-600'
                        )}
                      />
                      {navigationMode !== 'icons' && (
                        <>
                          <span
                            className={cn(
                              'font-medium',
                              navigationMode === 'expanded' ? 'text-sm' : 'text-xs',
                              isCompleted ? 'text-white' : isActive ? phase.color : 'text-gray-700'
                            )}
                          >
                            {navigationMode === 'minimal' ? phase.shortLabel : phase.label}
                          </span>
                          {isCompleted && navigationMode === 'expanded' && (
                            <CheckCircleIcon className="w-4 h-4 text-white opacity-80" />
                          )}
                        </>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {isAvailable && progress > 0 && navigationMode !== 'icons' && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={cn(
                            'h-full bg-gradient-to-r',
                            phase.gradientFrom,
                            phase.gradientTo
                          )}
                        />
                      </div>
                    )}

                    {/* Tooltip */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 5 }}
                          className="absolute bottom-full mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg whitespace-nowrap z-50"
                        >
                          <div className="font-medium">{phase.description}</div>
                          {progress > 0 && (
                            <div className="mt-1 text-gray-300">
                              {progress}% complete
                            </div>
                          )}
                          <div className="mt-1 text-gray-400">
                            ⌘{phaseConfigs.indexOf(phase) + 1}
                          </div>
                          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full">
                            <div className="border-4 border-transparent border-t-gray-900" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-1">
              {/* Phase Availability Compact View */}
              {studyId && (
                <PhaseAvailability
                  studyId={studyId || 'default'}
                  currentPhase={currentPhase}
                  onPhaseSelect={setCurrentPhase}
                  compact={true}
                  className="mr-2"
                />
              )}

              {/* Phase Tutorial Button */}
              <button 
                onClick={() => setShowOnboarding(true)}
                className="p-2 text-indigo-500 hover:text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"
                title="View phase tutorial (⌘?)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </button>

              {/* Search Button */}
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                title="Search (⌘K)"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>

              {/* Preferences Button */}
              <button 
                onClick={() => setShowPreferences(!showPreferences)}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                title="Navigation preferences (⌘,)"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>

              {/* Help Button */}
              <button 
                onClick={() => {}}
                className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                title="Help"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Toolbar */}
      <AnimatePresence>
        {expandedPhase && (
          <SecondaryToolbar
            phase={expandedPhase}
            onClose={() => setExpandedPhase(null)}
          />
        )}
      </AnimatePresence>

      {/* Phase Onboarding */}
      {showOnboarding && studyId && (
        <PhaseOnboarding
          phase={currentPhase}
          studyId={studyId || 'default'}
          userId={userId}
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
        />
      )}

      {/* Contextual Help */}
      <ContextualHelp
        currentPhase={currentPhase}
        currentTool={expandedPhase ? 'secondary-toolbar' : undefined}
        studyId={studyId}
        position="floating"
      />

      {/* Navigation Preferences Panel */}
      {showPreferences && (
        <NavigationPreferences
          isOpen={showPreferences}
          onClose={() => setShowPreferences(false)}
          onPreferencesChange={() => {
            // Preferences will be automatically loaded from localStorage
            // by the navigation components
          }}
        />
      )}

      {/* Global Search */}
      {showSearch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50" 
            onClick={() => setShowSearch(false)}
          />
          <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl z-10">
            <GlobalSearch
              className="w-full"
              placeholder="Search phases, studies, or help..."
              showShortcut={false}
            />
          </div>
        </div>
      )}
    </>
  );
}
