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

interface PhaseConfig {
  id: ResearchPhase;
  label: string;
  description: string;
  icon: React.ComponentType<any>; // HeroIcon component
  color: string;
  bgColor: string;
}

const phaseConfigs: PhaseConfig[] = [
  {
    id: 'discover',
    label: 'Discover',
    description: 'Literature review & research foundation',
    icon: BookOpenIcon,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    id: 'design',
    label: 'Design',
    description: 'Formulate questions & methodology',
    icon: LightBulbIcon,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
  },
  {
    id: 'build',
    label: 'Build',
    description: 'Create study instruments',
    icon: WrenchIcon,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'recruit',
    label: 'Recruit',
    description: 'Find & manage participants',
    icon: UsersIcon,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  {
    id: 'collect',
    label: 'Collect',
    description: 'Gather research data',
    icon: ClipboardDocumentListIcon,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50',
  },
  {
    id: 'analyze',
    label: 'Analyze',
    description: 'Statistical analysis & patterns',
    icon: BeakerIcon,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
  },
  {
    id: 'visualize',
    label: 'Visualize',
    description: 'Create charts & visualizations',
    icon: ChartBarIcon,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  {
    id: 'interpret',
    label: 'Interpret',
    description: 'Extract meaning & insights',
    icon: DocumentTextIcon,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'report',
    label: 'Report',
    description: 'Document & share findings',
    icon: DocumentIcon,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
  },
  {
    id: 'archive',
    label: 'Archive',
    description: 'Store & share research',
    icon: ArchiveBoxIcon,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
];

export function PrimaryToolbar() {
  const { 
    currentPhase, 
    setCurrentPhase, 
    phaseProgress, 
    availablePhases,
    completedPhases 
  } = useNavigationState();
  
  const [expandedPhase, setExpandedPhase] = useState<ResearchPhase | null>(null);
  const [hoveredPhase, setHoveredPhase] = useState<ResearchPhase | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
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
      }
      
      // Escape key collapses secondary toolbar
      if (e.key === 'Escape') {
        setExpandedPhase(null);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [availablePhases, setCurrentPhase]);

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
            {/* Phase Navigation */}
            <div className="flex items-center space-x-1 overflow-x-auto">
              {phaseConfigs.map((phase) => {
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
                      'relative group flex flex-col items-center px-3 py-2 rounded-lg transition-all duration-200',
                      isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-40',
                      isActive || isExpanded ? phase.bgColor : 'hover:bg-gray-50',
                      isActive && 'ring-2 ring-offset-2 ring-blue-500'
                    )}
                  >
                    {/* Phase Icon & Label */}
                    <div className="flex items-center space-x-2">
                      <Icon className={cn('w-5 h-5', isActive ? phase.color : 'text-gray-600')} />
                      <span className={cn(
                        'text-sm font-medium',
                        isActive ? phase.color : 'text-gray-700'
                      )}>
                        {phase.label}
                      </span>
                      {isCompleted && (
                        <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      )}
                    </div>

                    {/* Progress Bar */}
                    {isAvailable && progress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.5, ease: 'easeOut' }}
                          className={cn('h-full', phase.bgColor.replace('50', '500'))}
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
                            <div className="mt-1 text-gray-300">{progress}% complete</div>
                          )}
                          <div className="mt-1 text-gray-400">⌘{phaseConfigs.indexOf(phase) + 1}</div>
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
            <div className="flex items-center space-x-2">
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
              <button className="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100">
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
    </>
  );
}