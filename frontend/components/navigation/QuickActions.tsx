'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MagnifyingGlassIcon,
  DocumentPlusIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  BeakerIcon,
  BookOpenIcon,
  ClipboardDocumentCheckIcon,
  ArchiveBoxIcon,
  PhotoIcon,
} from '@heroicons/react/24/outline';
import { ResearchPhase } from './PrimaryToolbar';
import { AccessibleTooltip } from '../ui/accessible-tooltip';

interface QuickAction {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  shortcut?: string;
  phase: ResearchPhase;
  action: () => void;
  keywords: string[];
}

export function QuickActions() {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Define all quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'new-study',
      name: 'Create New Study',
      description: 'Start a new Q-methodology research study',
      icon: DocumentPlusIcon,
      shortcut: 'Cmd+N',
      phase: 'build',
      action: () => router.push('/studies/create'),
      keywords: ['new', 'create', 'study', 'start', 'begin'],
    },
    {
      id: 'literature-search',
      name: 'Search Literature',
      description: 'Search academic papers and references',
      icon: BookOpenIcon,
      shortcut: 'Cmd+L',
      phase: 'discover',
      action: () => router.push('/discover/literature'),
      keywords: ['literature', 'papers', 'research', 'articles', 'references'],
    },
    {
      id: 'recruit-participants',
      name: 'Recruit Participants',
      description: 'Start recruiting participants for your study',
      icon: UserGroupIcon,
      shortcut: 'Cmd+R',
      phase: 'recruit',
      action: () => router.push('/recruit'),
      keywords: [
        'recruit',
        'participants',
        'people',
        'subjects',
        'recruitment',
      ],
    },
    {
      id: 'analyze-data',
      name: 'Analyze Results',
      description: 'Run statistical analysis on collected data',
      icon: ChartBarIcon,
      shortcut: 'Cmd+A',
      phase: 'analyze',
      action: () => router.push('/analyze'),
      keywords: ['analyze', 'analysis', 'statistics', 'data', 'results'],
    },
    {
      id: 'visualize-data',
      name: 'Create Visualizations',
      description: 'Generate charts and graphs from your data',
      icon: PhotoIcon,
      shortcut: 'Cmd+V',
      phase: 'visualize',
      action: () => router.push('/visualize'),
      keywords: ['visualize', 'charts', 'graphs', 'plots', 'visualization'],
    },
    {
      id: 'design-methodology',
      name: 'Design Methodology',
      description: 'Configure your Q-sort methodology',
      icon: BeakerIcon,
      shortcut: 'Cmd+D',
      phase: 'design',
      action: () => router.push('/design'),
      keywords: ['design', 'methodology', 'configure', 'setup', 'q-sort'],
    },
    {
      id: 'generate-report',
      name: 'Generate Report',
      description: 'Create a comprehensive research report',
      icon: ClipboardDocumentCheckIcon,
      shortcut: 'Cmd+G',
      phase: 'report',
      action: () => router.push('/report'),
      keywords: ['report', 'generate', 'export', 'document', 'pdf'],
    },
    {
      id: 'archive-study',
      name: 'Archive Study',
      description: 'Archive and version control your study',
      icon: ArchiveBoxIcon,
      shortcut: 'Cmd+Shift+A',
      phase: 'archive',
      action: () => router.push('/archive'),
      keywords: ['archive', 'save', 'backup', 'version', 'store'],
    },
    {
      id: 'settings',
      name: 'Settings',
      description: 'Configure application preferences',
      icon: CogIcon,
      shortcut: 'Cmd+,',
      phase: 'discover',
      action: () => router.push('/settings'),
      keywords: ['settings', 'preferences', 'config', 'configure', 'options'],
    },
  ];

  // Filter actions based on search
  const filteredActions = quickActions.filter(action => {
    const searchLower = search.toLowerCase();
    return (
      action.name.toLowerCase().includes(searchLower) ||
      action.description.toLowerCase().includes(searchLower) ||
      action.keywords.some(keyword => keyword.includes(searchLower)) ||
      action.phase.includes(searchLower)
    );
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }

      // Handle individual shortcuts when palette is closed
      if (!isOpen) {
        quickActions.forEach(action => {
          if (action.shortcut) {
            const keys = action.shortcut.toLowerCase().split('+');
            const hasCmd = keys.includes('cmd') && (e.metaKey || e.ctrlKey);
            const hasShift = keys.includes('shift') && e.shiftKey;
            const hasAlt = keys.includes('alt') && e.altKey;
            const key = keys[keys.length - 1];

            if (
              hasCmd &&
              (!keys.includes('shift') || hasShift) &&
              (!keys.includes('alt') || hasAlt) &&
              e.key.toLowerCase() === key
            ) {
              e.preventDefault();
              action.action();
            }
          }
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, quickActions]);

  const runAction = useCallback((action: QuickAction) => {
    setIsOpen(false);
    setSearch('');
    // Small delay to allow modal to close
    setTimeout(() => {
      action.action();
    }, 100);
  }, []);

  return (
    <>
      {/* Quick Action Button */}
      <AccessibleTooltip
        content="Quick Actions (Cmd+K)"
        id="quick-actions-button"
      >
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400
                     hover:text-gray-900 dark:hover:text-gray-100 rounded-lg
                     hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Open quick actions"
        >
          <MagnifyingGlassIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Quick Actions</span>
          <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">
            ⌘K
          </kbd>
        </button>
      </AccessibleTooltip>

      {/* Command Palette */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-[90]"
              onClick={() => setIsOpen(false)}
            />

            {/* Command Palette */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="fixed top-[20%] left-1/2 -translate-x-1/2 w-full max-w-2xl z-[100]"
            >
              <Command
                className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl overflow-hidden"
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Escape') {
                    setIsOpen(false);
                  }
                }}
              >
                <div className="flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
                  <MagnifyingGlassIcon className="w-5 h-5 text-gray-400" />
                  <Command.Input
                    value={search}
                    onValueChange={setSearch}
                    placeholder="Search for actions..."
                    className="flex-1 px-3 py-4 bg-transparent outline-none
                             placeholder-gray-400 text-gray-900 dark:text-gray-100"
                    autoFocus
                  />
                  <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded">
                    ESC
                  </kbd>
                </div>

                <Command.List className="max-h-[400px] overflow-y-auto p-2">
                  {filteredActions.length === 0 && (
                    <Command.Empty className="py-8 text-center text-gray-500">
                      No actions found
                    </Command.Empty>
                  )}

                  {filteredActions.map(action => {
                    const Icon = action.icon;
                    return (
                      <Command.Item
                        key={action.id}
                        value={action.name}
                        onSelect={() => runAction(action)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg
                                 cursor-pointer transition-colors
                                 hover:bg-gray-100 dark:hover:bg-gray-800
                                 aria-selected:bg-gray-100 dark:aria-selected:bg-gray-800"
                      >
                        <div className={`p-2 rounded-lg phase-${action.phase}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {action.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {action.description}
                          </p>
                        </div>
                        {action.shortcut && (
                          <kbd className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 rounded">
                            {action.shortcut}
                          </kbd>
                        )}
                      </Command.Item>
                    );
                  })}
                </Command.List>

                <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500">
                    Use{' '}
                    <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                      ↑↓
                    </kbd>{' '}
                    to navigate,{' '}
                    <kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">
                      Enter
                    </kbd>{' '}
                    to select
                  </p>
                </div>
              </Command>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
