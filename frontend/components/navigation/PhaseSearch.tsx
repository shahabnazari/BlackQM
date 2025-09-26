'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { ResearchPhase } from './PrimaryToolbar';
import { cn } from '@/lib/utils';
import { AccessibleTooltip } from '../ui/accessible-tooltip';

interface SearchableItem {
  id: string;
  title: string;
  description: string;
  phase: ResearchPhase;
  path: string;
  keywords: string[];
  category: 'page' | 'feature' | 'tool' | 'setting';
  icon?: React.ComponentType<any>;
}

export function PhaseSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<ResearchPhase | 'all'>(
    'all'
  );
  const router = useRouter();

  // Define all searchable items across phases
  const searchableItems: SearchableItem[] = [
    // DISCOVER Phase
    {
      id: 'literature-search',
      title: 'Literature Search',
      description: 'Search academic papers and references',
      phase: 'discover',
      path: '/discover/literature',
      keywords: ['papers', 'research', 'articles', 'pubmed', 'crossref'],
      category: 'page',
    },
    {
      id: 'knowledge-map',
      title: 'Knowledge Mapping',
      description: 'Visualize research connections',
      phase: 'discover',
      path: '/discover/knowledge-map',
      keywords: ['map', 'connections', 'visualization', 'network'],
      category: 'tool',
    },
    {
      id: 'research-gaps',
      title: 'Research Gap Analysis',
      description: 'Identify research opportunities',
      phase: 'discover',
      path: '/discover/gaps',
      keywords: ['gaps', 'opportunities', 'analysis', 'missing'],
      category: 'feature',
    },

    // DESIGN Phase
    {
      id: 'methodology-design',
      title: 'Methodology Design',
      description: 'Configure Q-sort methodology',
      phase: 'design',
      path: '/design/methodology',
      keywords: ['q-sort', 'grid', 'configuration', 'setup'],
      category: 'page',
    },
    {
      id: 'statement-builder',
      title: 'Statement Builder',
      description: 'Create and manage Q statements',
      phase: 'design',
      path: '/design/statements',
      keywords: ['statements', 'cards', 'items', 'questions'],
      category: 'tool',
    },
    {
      id: 'protocol-creator',
      title: 'Study Protocol',
      description: 'Design study protocol',
      phase: 'design',
      path: '/design/protocol',
      keywords: ['protocol', 'procedure', 'instructions', 'guide'],
      category: 'feature',
    },

    // BUILD Phase
    {
      id: 'study-builder',
      title: 'Study Builder',
      description: 'Create new research study',
      phase: 'build',
      path: '/studies/create',
      keywords: ['create', 'new', 'study', 'build', 'configure'],
      category: 'page',
    },
    {
      id: 'questionnaire-builder',
      title: 'Questionnaire Builder',
      description: 'Design participant questionnaires',
      phase: 'build',
      path: '/build/questionnaire',
      keywords: ['survey', 'questions', 'form', 'demographic'],
      category: 'tool',
    },

    // RECRUIT Phase
    {
      id: 'participant-recruitment',
      title: 'Participant Recruitment',
      description: 'Manage participant recruitment',
      phase: 'recruit',
      path: '/recruit',
      keywords: ['participants', 'recruitment', 'invite', 'schedule'],
      category: 'page',
    },
    {
      id: 'screening-tools',
      title: 'Screening Tools',
      description: 'Screen and qualify participants',
      phase: 'recruit',
      path: '/recruit/screening',
      keywords: ['screen', 'qualify', 'eligibility', 'criteria'],
      category: 'feature',
    },

    // COLLECT Phase
    {
      id: 'data-collection',
      title: 'Data Collection',
      description: 'Monitor live data collection',
      phase: 'collect',
      path: '/collect',
      keywords: ['collect', 'data', 'responses', 'monitor', 'live'],
      category: 'page',
    },
    {
      id: 'q-sort-interface',
      title: 'Q-Sort Interface',
      description: 'Participant sorting interface',
      phase: 'collect',
      path: '/participant',
      keywords: ['sort', 'drag', 'drop', 'participant', 'interface'],
      category: 'tool',
    },

    // ANALYZE Phase
    {
      id: 'analysis-hub',
      title: 'Analysis Hub',
      description: 'Statistical analysis center',
      phase: 'analyze',
      path: '/analyze',
      keywords: ['analysis', 'statistics', 'factor', 'rotation', 'pca'],
      category: 'page',
    },
    {
      id: 'factor-analysis',
      title: 'Factor Analysis',
      description: 'Perform factor analysis',
      phase: 'analyze',
      path: '/analyze/factors',
      keywords: ['factor', 'pca', 'rotation', 'eigenvalues'],
      category: 'feature',
    },

    // VISUALIZE Phase
    {
      id: 'visualization-center',
      title: 'Visualization Center',
      description: 'Create charts and graphs',
      phase: 'visualize',
      path: '/visualize',
      keywords: ['charts', 'graphs', 'plots', 'visualization', 'diagrams'],
      category: 'page',
    },
    {
      id: 'heatmaps',
      title: 'Correlation Heatmaps',
      description: 'Generate correlation heatmaps',
      phase: 'visualize',
      path: '/visualize/heatmaps',
      keywords: ['heatmap', 'correlation', 'matrix', 'heat'],
      category: 'tool',
    },

    // INTERPRET Phase
    {
      id: 'interpretation',
      title: 'Results Interpretation',
      description: 'Interpret analysis results',
      phase: 'interpret',
      path: '/interpret',
      keywords: ['interpret', 'results', 'meaning', 'insights', 'findings'],
      category: 'page',
    },
    {
      id: 'ai-insights',
      title: 'AI Insights',
      description: 'AI-powered insights',
      phase: 'interpret',
      path: '/interpret/ai',
      keywords: ['ai', 'artificial', 'intelligence', 'insights', 'suggestions'],
      category: 'feature',
    },

    // REPORT Phase
    {
      id: 'report-generator',
      title: 'Report Generator',
      description: 'Generate research reports',
      phase: 'report',
      path: '/report',
      keywords: ['report', 'export', 'pdf', 'document', 'paper'],
      category: 'page',
    },
    {
      id: 'manuscript-writer',
      title: 'Manuscript Writer',
      description: 'AI-assisted manuscript writing',
      phase: 'report',
      path: '/report/manuscript',
      keywords: ['manuscript', 'paper', 'academic', 'write', 'publish'],
      category: 'tool',
    },

    // ARCHIVE Phase
    {
      id: 'study-archive',
      title: 'Study Archive',
      description: 'Archive and version studies',
      phase: 'archive',
      path: '/archive',
      keywords: ['archive', 'version', 'backup', 'history', 'restore'],
      category: 'page',
    },
    {
      id: 'version-control',
      title: 'Version Control',
      description: 'Study version management',
      phase: 'archive',
      path: '/archive/versions',
      keywords: ['version', 'git', 'branch', 'commit', 'history'],
      category: 'feature',
    },
  ];

  // Filter items based on search and phase
  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return searchableItems.filter(item => {
      // Filter by phase
      if (selectedPhase !== 'all' && item.phase !== selectedPhase) {
        return false;
      }

      // Filter by search query
      if (query) {
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          item.keywords.some(keyword => keyword.includes(query)) ||
          item.phase.includes(query)
        );
      }

      return true;
    });
  }, [searchQuery, selectedPhase, searchableItems]);

  // Group items by phase
  const groupedItems = useMemo(() => {
    const groups: Record<ResearchPhase, SearchableItem[]> = {
      discover: [],
      design: [],
      build: [],
      recruit: [],
      collect: [],
      analyze: [],
      visualize: [],
      interpret: [],
      report: [],
      archive: [],
    };

    filteredItems.forEach(item => {
      groups[item.phase].push(item);
    });

    return groups;
  }, [filteredItems]);

  const handleSelect = useCallback(
    (item: SearchableItem) => {
      router.push(item.path);
      setIsOpen(false);
      setSearchQuery('');
      setSelectedPhase('all');
    },
    [router]
  );

  const phaseColors: Record<ResearchPhase, string> = {
    discover: 'bg-purple-100 text-purple-700 border-purple-300',
    design: 'bg-yellow-100 text-yellow-700 border-yellow-300',
    build: 'bg-blue-100 text-blue-700 border-blue-300',
    recruit: 'bg-green-100 text-green-700 border-green-300',
    collect: 'bg-teal-100 text-teal-700 border-teal-300',
    analyze: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    visualize: 'bg-pink-100 text-pink-700 border-pink-300',
    interpret: 'bg-orange-100 text-orange-700 border-orange-300',
    report: 'bg-red-100 text-red-700 border-red-300',
    archive: 'bg-gray-100 text-gray-700 border-gray-300',
  };

  return (
    <>
      {/* Search Button */}
      <AccessibleTooltip
        content="Search across all phases (Cmd+/)"
        id="phase-search-button"
      >
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400
                     hover:text-gray-900 dark:hover:text-gray-100 rounded-lg
                     hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Search across phases"
        >
          <MagnifyingGlassIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Search</span>
          <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">
            /
          </kbd>
        </button>
      </AccessibleTooltip>

      {/* Search Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[90]"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-[10%] left-1/2 -translate-x-1/2 w-full max-w-3xl z-[100]"
            >
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl">
                {/* Search Header */}
                <div className="flex items-center gap-3 p-4 border-b border-gray-200 dark:border-gray-700">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search features, tools, and settings..."
                    className="flex-1 bg-transparent outline-none text-gray-900 dark:text-gray-100"
                    autoFocus
                  />
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* Phase Filter */}
                <div className="flex gap-2 p-3 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                  <button
                    onClick={() => setSelectedPhase('all')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap',
                      selectedPhase === 'all'
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    )}
                  >
                    All Phases
                  </button>
                  {Object.keys(phaseColors).map(phase => (
                    <button
                      key={phase}
                      onClick={() => setSelectedPhase(phase as ResearchPhase)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-medium capitalize whitespace-nowrap border',
                        selectedPhase === phase
                          ? phaseColors[phase as ResearchPhase]
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      )}
                    >
                      {phase}
                    </button>
                  ))}
                </div>

                {/* Search Results */}
                <div className="max-h-[400px] overflow-y-auto">
                  {filteredItems.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                      No results found for "{searchQuery}"
                    </div>
                  ) : (
                    Object.entries(groupedItems).map(([phase, items]) => {
                      if (items.length === 0) return null;

                      return (
                        <div key={phase}>
                          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800">
                            <span
                              className={cn(
                                'inline-block px-2 py-1 rounded text-xs font-medium capitalize',
                                phaseColors[phase as ResearchPhase]
                              )}
                            >
                              {phase}
                            </span>
                          </div>
                          {items.map(item => (
                            <button
                              key={item.id}
                              onClick={() => handleSelect(item)}
                              className="w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                            >
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {item.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                  {item.description}
                                </p>
                              </div>
                              <span
                                className={cn(
                                  'px-2 py-0.5 text-xs rounded capitalize',
                                  item.category === 'page' &&
                                    'bg-blue-100 text-blue-700',
                                  item.category === 'feature' &&
                                    'bg-green-100 text-green-700',
                                  item.category === 'tool' &&
                                    'bg-purple-100 text-purple-700',
                                  item.category === 'setting' &&
                                    'bg-gray-100 text-gray-700'
                                )}
                              >
                                {item.category}
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex justify-between">
                  <span>
                    {filteredItems.length} result
                    {filteredItems.length !== 1 ? 's' : ''}
                  </span>
                  <span>
                    Press{' '}
                    <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                      Enter
                    </kbd>{' '}
                    to select,{' '}
                    <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                      Esc
                    </kbd>{' '}
                    to close
                  </span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
