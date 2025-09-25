'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QuestionMarkCircleIcon,
  LightBulbIcon,
  InformationCircleIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  BookOpenIcon,
  PlayIcon,
  XMarkIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { ResearchPhase } from './PrimaryToolbar';
import { cn } from '@/lib/utils';

interface HelpContent {
  id: string;
  type: 'guide' | 'tip' | 'video' | 'article' | 'faq';
  title: string;
  content: string;
  videoUrl?: string;
  articleUrl?: string;
  relatedPhases: ResearchPhase[];
  tags: string[];
  priority: number; // 1-5, higher is more important
}

interface ContextualHelpProps {
  currentPhase: ResearchPhase;
  currentTool?: string | undefined;
  studyId?: string | undefined;
  className?: string;
  position?: 'floating' | 'embedded' | 'sidebar';
}

/**
 * World-class Contextual Help System
 * Provides intelligent, context-aware assistance
 */
export function ContextualHelp({
  currentPhase,
  currentTool,
  className,
  position = 'floating',
}: ContextualHelpProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedContent, setSelectedContent] = useState<HelpContent | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [, setHelpHistory] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'search' | 'detail'>('list');

  // Phase-specific help content
  const helpDatabase: HelpContent[] = [
    // DISCOVER Phase
    {
      id: 'discover-start',
      type: 'guide',
      title: 'Getting Started with Literature Review',
      content: 'Begin your research journey by searching for relevant academic papers. Use keywords related to your research topic and explore different databases.',
      relatedPhases: ['discover'],
      tags: ['beginner', 'literature', 'search'],
      priority: 5,
    },
    {
      id: 'discover-tips',
      type: 'tip',
      title: 'Pro Tips for Literature Search',
      content: 'Use Boolean operators (AND, OR, NOT) to refine your searches. Save search queries for later use. Set up alerts for new papers in your field.',
      relatedPhases: ['discover'],
      tags: ['advanced', 'search', 'tips'],
      priority: 3,
    },
    {
      id: 'discover-video',
      type: 'video',
      title: 'Video: Systematic Literature Review',
      content: 'Learn how to conduct a systematic literature review in 10 minutes.',
      videoUrl: 'https://youtube.com/watch?v=example',
      relatedPhases: ['discover'],
      tags: ['video', 'tutorial', 'systematic'],
      priority: 4,
    },

    // DESIGN Phase
    {
      id: 'design-questions',
      type: 'guide',
      title: 'Formulating Research Questions',
      content: 'A good research question is specific, measurable, achievable, relevant, and time-bound (SMART). Start broad and narrow down based on your literature review.',
      relatedPhases: ['design'],
      tags: ['research questions', 'methodology'],
      priority: 5,
    },
    {
      id: 'design-hypothesis',
      type: 'article',
      title: 'Building Testable Hypotheses',
      content: 'Learn how to construct hypotheses that can be tested with Q-methodology.',
      articleUrl: '/docs/hypothesis-building',
      relatedPhases: ['design'],
      tags: ['hypothesis', 'methodology'],
      priority: 4,
    },

    // BUILD Phase
    {
      id: 'build-statements',
      type: 'guide',
      title: 'Creating Q-Statements',
      content: 'Q-statements should represent the full range of opinions on your topic. Aim for 40-80 statements that are clear, concise, and provocative.',
      relatedPhases: ['build'],
      tags: ['statements', 'q-methodology'],
      priority: 5,
    },
    {
      id: 'build-grid',
      type: 'tip',
      title: 'Designing Your Q-Sort Grid',
      content: 'Most Q-studies use a quasi-normal distribution. The grid should force participants to make choices while allowing flexibility.',
      relatedPhases: ['build'],
      tags: ['grid', 'distribution'],
      priority: 4,
    },
    {
      id: 'build-ai',
      type: 'guide',
      title: 'Using AI for Statement Generation',
      content: 'Our AI can help generate diverse statements. Review and refine AI suggestions to ensure they capture your research dimensions.',
      relatedPhases: ['build'],
      tags: ['ai', 'statements', 'automation'],
      priority: 3,
    },

    // RECRUIT Phase
    {
      id: 'recruit-sampling',
      type: 'guide',
      title: 'Participant Sampling Strategies',
      content: 'Q-methodology uses purposive sampling. Aim for diversity of viewpoints rather than statistical representation. 20-40 participants is typically sufficient.',
      relatedPhases: ['recruit'],
      tags: ['sampling', 'participants'],
      priority: 5,
    },
    {
      id: 'recruit-screening',
      type: 'tip',
      title: 'Effective Screening Questions',
      content: 'Use screening questions to ensure participants have relevant experience or opinions on your topic.',
      relatedPhases: ['recruit'],
      tags: ['screening', 'qualification'],
      priority: 3,
    },

    // COLLECT Phase
    {
      id: 'collect-monitor',
      type: 'guide',
      title: 'Monitoring Data Collection',
      content: 'Track response rates, completion times, and data quality in real-time. Send reminders to participants who haven\'t completed the study.',
      relatedPhases: ['collect'],
      tags: ['monitoring', 'data collection'],
      priority: 4,
    },
    {
      id: 'collect-quality',
      type: 'tip',
      title: 'Ensuring Data Quality',
      content: 'Look for patterns indicating careless responding: very short completion times, identical rankings, or missing post-sort explanations.',
      relatedPhases: ['collect'],
      tags: ['quality', 'validation'],
      priority: 5,
    },

    // ANALYZE Phase
    {
      id: 'analyze-factors',
      type: 'guide',
      title: 'Understanding Factor Analysis',
      content: 'Factor analysis identifies groups of participants with similar sorting patterns. Start with PCA, then rotate factors for interpretation.',
      relatedPhases: ['analyze'],
      tags: ['analysis', 'statistics', 'factors'],
      priority: 5,
    },
    {
      id: 'analyze-rotation',
      type: 'video',
      title: 'Video: Factor Rotation Explained',
      content: 'Visual guide to understanding varimax and manual rotation methods.',
      videoUrl: 'https://youtube.com/watch?v=rotation',
      relatedPhases: ['analyze'],
      tags: ['rotation', 'video', 'tutorial'],
      priority: 4,
    },

    // VISUALIZE Phase
    {
      id: 'visualize-charts',
      type: 'guide',
      title: 'Choosing the Right Visualizations',
      content: 'Factor arrays show idealized Q-sorts. Loading plots show participant-factor relationships. Use heat maps for correlation matrices.',
      relatedPhases: ['visualize'],
      tags: ['visualization', 'charts'],
      priority: 4,
    },

    // INTERPRET Phase
    {
      id: 'interpret-narrative',
      type: 'guide',
      title: 'Writing Factor Narratives',
      content: 'Describe each factor as a coherent viewpoint. Use distinguishing statements to highlight what makes each perspective unique.',
      relatedPhases: ['interpret'],
      tags: ['interpretation', 'narrative'],
      priority: 5,
    },
    {
      id: 'interpret-consensus',
      type: 'tip',
      title: 'Finding Consensus Statements',
      content: 'Consensus statements are ranked similarly across all factors. They represent shared understanding or agreement.',
      relatedPhases: ['interpret'],
      tags: ['consensus', 'analysis'],
      priority: 3,
    },

    // REPORT Phase
    {
      id: 'report-structure',
      type: 'guide',
      title: 'Structuring Your Report',
      content: 'Include: Introduction, Literature Review, Methodology, Results (factors), Discussion, and Conclusions. Use APA format for academic papers.',
      relatedPhases: ['report'],
      tags: ['report', 'writing', 'structure'],
      priority: 5,
    },

    // ARCHIVE Phase
    {
      id: 'archive-data',
      type: 'guide',
      title: 'Preparing Data for Archive',
      content: 'Include raw Q-sorts, analysis outputs, study materials, and documentation. Consider obtaining a DOI for your dataset.',
      relatedPhases: ['archive'],
      tags: ['archive', 'data', 'preservation'],
      priority: 4,
    },

    // Cross-phase FAQs
    {
      id: 'faq-participants',
      type: 'faq',
      title: 'How many participants do I need?',
      content: 'Q-methodology typically requires 20-40 participants. The goal is viewpoint diversity, not statistical generalization.',
      relatedPhases: ['design', 'recruit'],
      tags: ['faq', 'participants', 'sample size'],
      priority: 5,
    },
    {
      id: 'faq-statements',
      type: 'faq',
      title: 'How many statements should I use?',
      content: 'Most Q-studies use 40-80 statements. Too few limits expression; too many causes fatigue.',
      relatedPhases: ['build'],
      tags: ['faq', 'statements', 'q-set'],
      priority: 5,
    },
    {
      id: 'faq-factors',
      type: 'faq',
      title: 'How many factors should I extract?',
      content: 'Extract factors with eigenvalues >1.0 and at least 2 significantly loading participants. Usually 2-5 factors emerge.',
      relatedPhases: ['analyze'],
      tags: ['faq', 'factors', 'extraction'],
      priority: 4,
    },
  ];

  // Get relevant help content based on context
  const getRelevantHelp = (): HelpContent[] => {
    let relevant = helpDatabase.filter(help =>
      help.relatedPhases.includes(currentPhase)
    );

    // Add tool-specific help if available
    if (currentTool) {
      const toolHelp = helpDatabase.filter(help =>
        help.tags.includes(currentTool.toLowerCase())
      );
      relevant = [...relevant, ...toolHelp];
    }

    // Remove duplicates and sort by priority
    const uniqueHelp = Array.from(new Map(relevant.map(h => [h.id, h])).values());
    return uniqueHelp.sort((a, b) => b.priority - a.priority).slice(0, 10);
  };

  // Search help content
  const searchHelp = (query: string): HelpContent[] => {
    const lowerQuery = query.toLowerCase();
    return helpDatabase.filter(help =>
      help.title.toLowerCase().includes(lowerQuery) ||
      help.content.toLowerCase().includes(lowerQuery) ||
      help.tags.some(tag => tag.includes(lowerQuery))
    );
  };

  // Track help usage for analytics
  const trackHelpUsage = (helpId: string) => {
    setHelpHistory(prev => [...prev, helpId]);
    // Could send analytics to backend here
  };

  const getIcon = (type: HelpContent['type']) => {
    switch (type) {
      case 'guide':
        return <BookOpenIcon className="w-5 h-5" />;
      case 'tip':
        return <LightBulbIcon className="w-5 h-5" />;
      case 'video':
        return <PlayIcon className="w-5 h-5" />;
      case 'article':
        return <AcademicCapIcon className="w-5 h-5" />;
      case 'faq':
        return <ChatBubbleLeftRightIcon className="w-5 h-5" />;
      default:
        return <InformationCircleIcon className="w-5 h-5" />;
    }
  };

  const getTypeColor = (type: HelpContent['type']) => {
    switch (type) {
      case 'guide':
        return 'text-blue-600 bg-blue-50';
      case 'tip':
        return 'text-yellow-600 bg-yellow-50';
      case 'video':
        return 'text-purple-600 bg-purple-50';
      case 'article':
        return 'text-green-600 bg-green-50';
      case 'faq':
        return 'text-indigo-600 bg-indigo-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Floating help button
  if (position === 'floating') {
    return (
      <>
        {/* Floating help button */}
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "fixed bottom-6 right-6 z-50",
            "w-14 h-14 rounded-full",
            "bg-indigo-600 text-white shadow-lg",
            "flex items-center justify-center",
            "hover:bg-indigo-700 transition-colors",
            className
          )}
        >
          {isOpen ? (
            <XMarkIcon className="w-6 h-6" />
          ) : (
            <QuestionMarkCircleIcon className="w-6 h-6" />
          )}
        </motion.button>

        {/* Help panel */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-24 right-6 z-50 w-96 max-h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold">Help & Guidance</h3>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={cn(
                        "p-1 rounded",
                        viewMode === 'list' && "bg-gray-100 dark:bg-gray-700"
                      )}
                    >
                      <BookOpenIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('search')}
                      className={cn(
                        "p-1 rounded",
                        viewMode === 'search' && "bg-gray-100 dark:bg-gray-700"
                      )}
                    >
                      <QuestionMarkCircleIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {/* Search bar */}
                {viewMode === 'search' && (
                  <input
                    type="text"
                    placeholder="Search for help..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  />
                )}

                {/* Current context */}
                {viewMode === 'list' && (
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Current phase: <span className="font-medium capitalize">{currentPhase}</span>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="overflow-y-auto max-h-[400px] p-4">
                {viewMode === 'detail' && selectedContent ? (
                  // Detail view
                  <div className="space-y-4">
                    <button
                      onClick={() => {
                        setSelectedContent(null);
                        setViewMode('list');
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <ChevronRightIcon className="w-4 h-4 rotate-180" />
                      Back to list
                    </button>

                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className={cn("p-2 rounded-lg", getTypeColor(selectedContent.type))}>
                          {getIcon(selectedContent.type)}
                        </div>
                        <h4 className="font-semibold flex-1">{selectedContent.title}</h4>
                      </div>

                      <p className="text-gray-600 dark:text-gray-300">{selectedContent.content}</p>

                      {selectedContent.videoUrl && (
                        <a
                          href={selectedContent.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
                        >
                          <PlayIcon className="w-5 h-5" />
                          Watch Video
                        </a>
                      )}

                      {selectedContent.articleUrl && (
                        <a
                          href={selectedContent.articleUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                        >
                          <BookOpenIcon className="w-5 h-5" />
                          Read Article
                        </a>
                      )}

                      <div className="pt-3 border-t dark:border-gray-700">
                        <div className="flex flex-wrap gap-1">
                          {selectedContent.tags.map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // List view
                  <div className="space-y-2">
                    {(viewMode === 'search' ? searchHelp(searchQuery) : getRelevantHelp()).map((help) => (
                      <button
                        key={help.id}
                        onClick={() => {
                          setSelectedContent(help);
                          setViewMode('detail');
                          trackHelpUsage(help.id);
                        }}
                        className="w-full p-3 rounded-lg border dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                      >
                        <div className="flex items-start gap-3">
                          <div className={cn("p-1.5 rounded", getTypeColor(help.type))}>
                            {getIcon(help.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm mb-1">{help.title}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                              {help.content}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}

                    {(viewMode === 'search' && searchQuery && searchHelp(searchQuery).length === 0) && (
                      <div className="text-center py-8 text-gray-500">
                        No help articles found for "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>Press ? for keyboard shortcuts</span>
                  <a href="/docs" className="hover:text-indigo-600">
                    Full Documentation →
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Embedded or sidebar view
  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-lg", className)}>
      {/* Implementation for embedded/sidebar view would go here */}
      {/* Similar to the floating panel but without the absolute positioning */}
    </div>
  );
}