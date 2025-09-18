'use client';

import {
    ArchiveBoxIcon,
    BeakerIcon,
    BookOpenIcon,
    ChartBarIcon,
    CheckCircleIcon,
    ClipboardDocumentListIcon,
    DocumentIcon,
    DocumentTextIcon,
    LightBulbIcon,
    LockClosedIcon,
    SparklesIcon,
    UsersIcon,
    WrenchScrewdriverIcon,
} from '@heroicons/react/24/outline';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';

// Type Definitions
interface ResearchPhase {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
  description: string;
  progress: number;
  isLocked: boolean;
  isActive: boolean;
  children: SecondaryNavItem[];
}

interface SecondaryNavItem {
  id: string;
  label: string;
  path: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: string;
  aiEnabled?: boolean;
  isNew?: boolean;
  shortcut?: string;
}

/**
 * Research Lifecycle Double Toolbar Navigation
 * 
 * This component provides a comprehensive research journey navigation system
 * with primary phases and contextual secondary tools.
 */
export function ResearchToolbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [activePhase, setActivePhase] = useState<string | null>(null);
  const [secondaryOpen, setSecondaryOpen] = useState(false);
  const [_phaseProgress, _setPhaseProgress] = useState<Map<string, number>>(new Map());

  // Research Lifecycle Phases Configuration
  const researchPhases: ResearchPhase[] = [
    {
      id: 'discover',
      label: 'Discover',
      icon: BookOpenIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 hover:bg-purple-100',
      description: 'Literature review & research foundation',
      progress: 75,
      isLocked: false,
      isActive: pathname.startsWith('/discover'),
      children: [
        { id: 'literature', label: 'Literature Search', path: '/discover/literature', aiEnabled: true },
        { id: 'references', label: 'Reference Manager', path: '/discover/references' },
        { id: 'knowledge-map', label: 'Knowledge Map', path: '/discover/knowledge-map', badge: 'NEW' },
        { id: 'gaps', label: 'Research Gaps', path: '/discover/gaps', aiEnabled: true },
        { id: 'prior-studies', label: 'Prior Studies', path: '/discover/prior-studies' },
      ],
    },
    {
      id: 'design',
      label: 'Design',
      icon: LightBulbIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50 hover:bg-yellow-100',
      description: 'Formulate questions & methodology',
      progress: 60,
      isLocked: false,
      isActive: pathname.startsWith('/design'),
      children: [
        { id: 'questions', label: 'Research Questions', path: '/design/questions', aiEnabled: true },
        { id: 'hypothesis', label: 'Hypothesis Builder', path: '/design/hypothesis' },
        { id: 'methodology', label: 'Methodology Selection', path: '/design/methodology' },
        { id: 'protocol', label: 'Study Protocol', path: '/design/protocol' },
        { id: 'ethics', label: 'Ethics Review', path: '/design/ethics', badge: 'REQUIRED' },
      ],
    },
    {
      id: 'build',
      label: 'Build',
      icon: WrenchScrewdriverIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 hover:bg-blue-100',
      description: 'Create study instruments',
      progress: 40,
      isLocked: false,
      isActive: pathname.startsWith('/build') || pathname.startsWith('/studies/create'),
      children: [
        { id: 'study-setup', label: 'Study Setup', path: '/studies/create', shortcut: '⌘N' },
        { id: 'grid', label: 'Q-Grid Designer', path: '/build/grid', aiEnabled: true },
        { id: 'stimuli', label: 'Statement Generator', path: '/build/stimuli', aiEnabled: true },
        { id: 'questionnaire', label: 'Questionnaire Builder', path: '/build/questionnaire' },
        { id: 'consent', label: 'Consent Forms', path: '/build/consent' },
      ],
    },
    {
      id: 'recruit',
      label: 'Recruit',
      icon: UsersIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50 hover:bg-green-100',
      description: 'Find & manage participants',
      progress: 20,
      isLocked: false,
      isActive: pathname.startsWith('/recruit'),
      children: [
        { id: 'pool', label: 'Participant Pool', path: '/recruit/participants' },
        { id: 'invitations', label: 'Invitations', path: '/recruit/invitations', badge: '12' },
        { id: 'screening', label: 'Screening', path: '/recruit/screening', aiEnabled: true },
        { id: 'scheduling', label: 'Scheduling', path: '/recruit/scheduling' },
        { id: 'compensation', label: 'Compensation', path: '/recruit/compensation' },
      ],
    },
    {
      id: 'collect',
      label: 'Collect',
      icon: ClipboardDocumentListIcon,
      color: 'text-teal-600',
      bgColor: 'bg-teal-50 hover:bg-teal-100',
      description: 'Gather research data',
      progress: 10,
      isLocked: true,
      isActive: pathname.startsWith('/collect'),
      children: [
        { id: 'sessions', label: 'Active Sessions', path: '/collect/sessions', badge: '3 LIVE' },
        { id: 'qsort', label: 'Q-Sort Interface', path: '/collect/qsort' },
        { id: 'surveys', label: 'Survey Responses', path: '/collect/surveys' },
        { id: 'progress', label: 'Progress Tracker', path: '/collect/progress' },
        { id: 'quality', label: 'Quality Control', path: '/collect/quality', aiEnabled: true },
      ],
    },
    {
      id: 'analyze',
      label: 'Analyze',
      icon: BeakerIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 hover:bg-indigo-100',
      description: 'Statistical analysis & patterns',
      progress: 0,
      isLocked: true,
      isActive: pathname.startsWith('/analysis'),
      children: [
        { id: 'q-analysis', label: 'Q-Analysis', path: '/analysis/q-methodology', aiEnabled: true },
        { id: 'statistics', label: 'Statistical Tests', path: '/analysis/statistics' },
        { id: 'rotation', label: 'Factor Rotation', path: '/analysis/rotation' },
        { id: 'correlation', label: 'Correlation Matrix', path: '/analysis/correlation' },
        { id: 'insights', label: 'AI Insights', path: '/analysis/insights', aiEnabled: true, isNew: true },
      ],
    },
    {
      id: 'visualize',
      label: 'Visualize',
      icon: ChartBarIcon,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 hover:bg-pink-100',
      description: 'Create charts & visualizations',
      progress: 0,
      isLocked: true,
      isActive: pathname.startsWith('/visualize'),
      children: [
        { id: 'arrays', label: 'Factor Arrays', path: '/visualize/arrays' },
        { id: 'loadings', label: 'Loading Plots', path: '/visualize/loadings' },
        { id: 'scree', label: 'Scree Plot', path: '/visualize/scree' },
        { id: 'heatmaps', label: 'Heat Maps', path: '/visualize/heatmaps' },
        { id: 'dashboards', label: 'Custom Dashboards', path: '/visualize/dashboards', badge: 'PRO' },
      ],
    },
    {
      id: 'interpret',
      label: 'Interpret',
      icon: DocumentTextIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 hover:bg-orange-100',
      description: 'Extract meaning & insights',
      progress: 0,
      isLocked: true,
      isActive: pathname.startsWith('/interpret'),
      children: [
        { id: 'narratives', label: 'Factor Narratives', path: '/interpret/narratives', aiEnabled: true },
        { id: 'consensus', label: 'Consensus Analysis', path: '/interpret/consensus' },
        { id: 'distinguishing', label: 'Distinguishing Views', path: '/interpret/distinguishing' },
        { id: 'themes', label: 'Theme Extraction', path: '/interpret/themes', aiEnabled: true },
        { id: 'synthesis', label: 'Cross-Factor Synthesis', path: '/interpret/synthesis' },
      ],
    },
    {
      id: 'report',
      label: 'Report',
      icon: DocumentIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50 hover:bg-red-100',
      description: 'Document & share findings',
      progress: 0,
      isLocked: true,
      isActive: pathname.startsWith('/report'),
      children: [
        { id: 'generator', label: 'Report Generator', path: '/report/generator', aiEnabled: true },
        { id: 'summary', label: 'Executive Summary', path: '/report/summary', aiEnabled: true },
        { id: 'export', label: 'Publication Export', path: '/report/export' },
        { id: 'presentation', label: 'Presentation Mode', path: '/report/presentation' },
        { id: 'collaborate', label: 'Collaboration', path: '/report/collaborate', badge: 'TEAM' },
      ],
    },
    {
      id: 'archive',
      label: 'Archive',
      icon: ArchiveBoxIcon,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50 hover:bg-gray-100',
      description: 'Store & share research',
      progress: 0,
      isLocked: true,
      isActive: pathname.startsWith('/archive'),
      children: [
        { id: 'studies', label: 'Study Archive', path: '/archive/studies' },
        { id: 'repository', label: 'Data Repository', path: '/archive/repository' },
        { id: 'doi', label: 'DOI Assignment', path: '/archive/doi', badge: 'CITE' },
        { id: 'sharing', label: 'Public Sharing', path: '/archive/sharing' },
        { id: 'versions', label: 'Version Control', path: '/archive/versions' },
      ],
    },
  ];

  // Handle phase selection
  const handlePhaseClick = (phase: ResearchPhase) => {
    if (phase.isLocked) {
      // Show locked message
      alert(`The ${phase.label} phase will be unlocked when you complete earlier phases.`);
      return;
    }

    if (activePhase === phase.id && secondaryOpen) {
      setSecondaryOpen(false);
      setActivePhase(null);
    } else {
      setActivePhase(phase.id);
      setSecondaryOpen(true);
    }
  };

  // Handle tool navigation
  const handleToolClick = (tool: SecondaryNavItem) => {
    router.push(tool.path);
    // Keep secondary open for exploration
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyboard = (e: KeyboardEvent) => {
      // Cmd/Ctrl + 1-9 for phase navigation
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (index < researchPhases.length) {
          handlePhaseClick(researchPhases[index]);
        }
      }
      // Escape to close secondary
      if (e.key === 'Escape' && secondaryOpen) {
        setSecondaryOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyboard);
    return () => window.removeEventListener('keydown', handleKeyboard);
  }, [secondaryOpen, researchPhases]);

  // Get active phase for secondary toolbar
  const currentPhase = researchPhases.find(p => p.id === activePhase);

  return (
    <>
      {/* Primary Research Lifecycle Toolbar */}
      <div className="sticky top-16 z-30 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-2">
            {/* Phase Buttons */}
            <div className="flex items-center gap-1 overflow-x-auto">
              {researchPhases.map((phase, index) => {
                const Icon = phase.icon;
                const isActive = phase.id === activePhase;
                const isComplete = phase.progress === 100;

                return (
                  <button
                    key={phase.id}
                    onClick={() => handlePhaseClick(phase)}
                    disabled={phase.isLocked}
                    className={`
                      group relative flex items-center gap-2 px-3 py-2 rounded-lg
                      text-sm font-medium transition-all duration-200
                      ${isActive ? phase.bgColor : 'hover:bg-gray-100'}
                      ${phase.isLocked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      ${isActive ? phase.color : 'text-gray-600'}
                    `}
                    aria-label={`${phase.label} phase - ${phase.description}`}
                    aria-expanded={isActive && secondaryOpen}
                  >
                    {/* Phase Icon */}
                    <div className="relative">
                      <Icon className="w-5 h-5" />
                      {phase.isLocked && (
                        <LockClosedIcon className="absolute -bottom-1 -right-1 w-3 h-3 text-gray-400" />
                      )}
                      {isComplete && !phase.isLocked && (
                        <CheckCircleIcon className="absolute -bottom-1 -right-1 w-3 h-3 text-green-500" />
                      )}
                    </div>

                    {/* Phase Label */}
                    <span className="hidden sm:inline">{phase.label}</span>
                    
                    {/* Keyboard Shortcut */}
                    <span className="hidden lg:inline text-xs text-gray-400">
                      ⌘{index + 1}
                    </span>

                    {/* Progress Bar */}
                    {!phase.isLocked && phase.progress > 0 && phase.progress < 100 && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${phase.bgColor} transition-all duration-300`}
                          style={{ width: `${phase.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none">
                      <div className="font-semibold">{phase.label}</div>
                      <div className="text-gray-300">{phase.description}</div>
                      {phase.progress > 0 && <div className="text-gray-400 mt-1">{phase.progress}% complete</div>}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 ml-4">
              <button className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Contextual Toolbar */}
      <AnimatePresence>
        {secondaryOpen && currentPhase && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="sticky top-28 z-20 border-b border-gray-200 bg-gray-50 shadow-sm overflow-hidden"
          >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
              <div className="flex items-center justify-between">
                {/* Tool Buttons */}
                <div className="flex items-center gap-2 overflow-x-auto">
                  {currentPhase.children.map((tool) => (
                    <button
                      key={tool.id}
                      onClick={() => handleToolClick(tool)}
                      className={`
                        group flex items-center gap-2 px-3 py-2 rounded-lg
                        text-sm font-medium transition-all duration-200
                        ${pathname === tool.path 
                          ? 'bg-white shadow-sm ring-1 ring-gray-200' 
                          : 'hover:bg-white hover:shadow-sm'
                        }
                        text-gray-700 hover:text-gray-900
                      `}
                    >
                      {/* Tool Label */}
                      <span>{tool.label}</span>

                      {/* Badges */}
                      {tool.aiEnabled && (
                        <SparklesIcon className="w-4 h-4 text-purple-500" />
                      )}
                      {tool.badge && (
                        <span className={`
                          px-2 py-0.5 text-xs font-semibold rounded-full
                          ${tool.badge === 'NEW' ? 'bg-green-100 text-green-700' :
                            tool.badge === 'PRO' ? 'bg-purple-100 text-purple-700' :
                            tool.badge === 'REQUIRED' ? 'bg-red-100 text-red-700' :
                            tool.badge === 'TEAM' ? 'bg-blue-100 text-blue-700' :
                            tool.badge.includes('LIVE') ? 'bg-red-500 text-white animate-pulse' :
                            'bg-gray-100 text-gray-700'
                          }
                        `}>
                          {tool.badge}
                        </span>
                      )}
                      {tool.shortcut && (
                        <span className="hidden lg:inline text-xs text-gray-400">
                          {tool.shortcut}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Phase Info */}
                <div className="hidden md:flex items-center gap-4 ml-4">
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">{currentPhase.label}</span>
                    <span className="mx-2">·</span>
                    <span>{currentPhase.progress}% complete</span>
                  </div>
                  <button
                    onClick={() => setSecondaryOpen(false)}
                    className="p-1 rounded hover:bg-gray-200"
                    aria-label="Close secondary toolbar"
                  >
                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}