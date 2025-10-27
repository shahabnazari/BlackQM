/**
 * Database Sources Transparency Component
 * Phase 9 Day 3.8: Shows which databases are being scraped and upcoming sources
 * Provides transparency about data sources for literature review
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Check,
  Clock,
  Lock,
  Info,
  ExternalLink,
  FileText,
  TrendingUp,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  BookOpen,
  Microscope,
  GitBranch,
  MessageCircle,
  Award,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface DatabaseSource {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  status: 'active' | 'coming-soon' | 'premium' | 'limited';
  coverage: string;
  recordCount?: string;
  updateFrequency?: string;
  apiLimits?: string;
  accessType: 'free' | 'free-limited' | 'subscription' | 'institutional';
  url?: string;
  features: string[];
  limitations?: string[];
}

const databaseSources: DatabaseSource[] = [
  // Currently Active Sources
  {
    id: 'semantic-scholar',
    name: 'Semantic Scholar',
    description: 'AI-powered research tool from Allen Institute for AI',
    icon: BookOpen,
    status: 'active',
    coverage: 'Computer Science, Medicine, Engineering',
    recordCount: '200M+ papers',
    updateFrequency: 'Daily',
    apiLimits: '100 requests/5 min',
    accessType: 'free',
    url: 'https://www.semanticscholar.org',
    features: [
      'AI-extracted insights',
      'Citation context',
      'Author profiles',
      'Paper recommendations',
    ],
  },
  {
    id: 'crossref',
    name: 'CrossRef',
    description: 'Official DOI registration agency database',
    icon: Database,
    status: 'active',
    coverage: 'All disciplines with DOIs',
    recordCount: '150M+ records',
    updateFrequency: 'Real-time',
    apiLimits: 'Polite crawling expected',
    accessType: 'free',
    url: 'https://www.crossref.org',
    features: [
      'DOI resolution',
      'Metadata retrieval',
      'Reference linking',
      'Funding information',
    ],
  },
  {
    id: 'pubmed',
    name: 'PubMed',
    description: 'Biomedical and life sciences literature',
    icon: Microscope,
    status: 'active',
    coverage: 'Medicine, Life Sciences',
    recordCount: '35M+ citations',
    updateFrequency: 'Daily',
    apiLimits: '3 requests/second',
    accessType: 'free',
    url: 'https://pubmed.ncbi.nlm.nih.gov',
    features: [
      'MeSH terms',
      'Clinical trials',
      'Full-text links',
      'Related articles',
    ],
  },
  {
    id: 'arxiv',
    name: 'arXiv',
    description: 'Preprint repository for STEM fields',
    icon: FileText,
    status: 'active',
    coverage: 'Physics, Math, CS, Biology, Economics',
    recordCount: '2.4M+ preprints',
    updateFrequency: 'Daily',
    apiLimits: 'Bulk download available',
    accessType: 'free',
    url: 'https://arxiv.org',
    features: [
      'Preprints',
      'Version history',
      'LaTeX source',
      'Category classification',
    ],
  },

  // Alternative Sources - Active
  {
    id: 'biorxiv',
    name: 'bioRxiv',
    description: 'Preprint server for biology',
    icon: Microscope,
    status: 'active',
    coverage: 'Biology, Life Sciences',
    recordCount: '200K+ preprints',
    accessType: 'free',
    url: 'https://www.biorxiv.org',
    features: ['Preprints', 'Peer review links', 'Version tracking', 'Metrics'],
  },
  {
    id: 'github-research',
    name: 'GitHub Research',
    description: 'Research code and reproducibility',
    icon: GitBranch,
    status: 'active',
    coverage: 'Computational research',
    accessType: 'free',
    features: [
      'Code repositories',
      'Data sets',
      'Notebooks',
      'Reproducibility info',
    ],
  },
  {
    id: 'stackoverflow',
    name: 'StackOverflow',
    description: 'Developer Q&A and technical discussions',
    icon: MessageCircle,
    status: 'active',
    coverage: 'Software development, technical problems',
    recordCount: '24M+ questions',
    accessType: 'free',
    url: 'https://stackoverflow.com',
    features: [
      'Code solutions',
      'Best practices',
      'Community voting',
      'Tag-based search',
    ],
  },
  {
    id: 'youtube',
    name: 'YouTube Videos',
    description: 'Educational video content via YouTube Data API v3',
    icon: MessageCircle,
    status: 'active',
    coverage: 'Educational videos, lectures, tutorials, research presentations',
    accessType: 'free',
    url: 'https://youtube.com',
    features: [
      '✅ Real-time video search',
      '✅ Full metadata (title, channel, description)',
      '✅ Published dates and thumbnails',
      '✅ Direct YouTube links',
    ],
  },
  {
    id: 'podcasts',
    name: 'Podcast Transcripts',
    description: 'Research podcasts and academic discussions',
    icon: MessageCircle,
    status: 'active',
    coverage: 'Academic podcasts, interviews, discussions',
    accessType: 'free',
    url: 'https://podcasts.apple.com',
    features: [
      'Episode transcripts',
      'RSS feed parsing',
      'Content mining',
      'Show notes',
    ],
  },

  // Coming Soon - Free/Limited Access
  {
    id: 'europe-pmc',
    name: 'Europe PMC',
    description: 'European life sciences literature database',
    icon: Globe,
    status: 'coming-soon',
    coverage: 'Life Sciences, Biomedicine',
    recordCount: '40M+ abstracts',
    updateFrequency: 'Daily',
    accessType: 'free',
    url: 'https://europepmc.org',
    features: [
      'Full-text search',
      'Data citations',
      'Preprints',
      'Text mining',
    ],
  },
  {
    id: 'core',
    name: 'CORE',
    description: 'Open access research papers aggregator',
    icon: Award,
    status: 'coming-soon',
    coverage: 'All disciplines',
    recordCount: '250M+ open access papers',
    accessType: 'free-limited',
    url: 'https://core.ac.uk',
    features: [
      'Full-text PDFs',
      'Discovery API',
      'Dataset links',
      'Similar papers',
    ],
  },

  // PHASE 9 DAY 13: Social Media Intelligence (ACTIVE)
  {
    id: 'twitter-academic',
    name: 'Twitter/X',
    description: 'Research discussions and trending academic topics',
    icon: MessageCircle,
    status: 'limited',
    coverage: 'Real-time academic discourse',
    apiLimits: 'Rate limited',
    accessType: 'free-limited',
    features: [
      'Sentiment analysis',
      'Engagement metrics',
      'Influence scoring',
      'Trending topics',
    ],
    limitations: [
      'API authentication required',
      'Rate limits apply',
      '⚠️ DEMO MODE: Mock data for testing',
    ],
  },
  {
    id: 'reddit-scholar',
    name: 'Reddit',
    description: 'Academic subreddit discussions and community insights',
    icon: MessageCircle,
    status: 'active',
    coverage: 'r/science, r/AskScience, discipline subreddits',
    accessType: 'free',
    features: [
      'Community discussions',
      'Sentiment analysis',
      'Upvote weighting',
      'Subreddit filtering',
      '✅ Live API integration',
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    description: 'Professional opinions and research insights',
    icon: MessageCircle,
    status: 'limited',
    coverage: 'Professional network, academic community',
    apiLimits: 'OAuth required',
    accessType: 'free-limited',
    features: [
      'Professional profiles',
      'Organization insights',
      'Engagement metrics',
      'Credibility scoring',
    ],
    limitations: [
      'OAuth 2.0 required',
      'Limited public data',
      '⚠️ DEMO MODE: Mock data for testing',
    ],
  },
  {
    id: 'facebook',
    name: 'Facebook',
    description: 'Public research groups and academic discussions',
    icon: MessageCircle,
    status: 'limited',
    coverage: 'Public groups, research communities',
    apiLimits: 'App review required',
    accessType: 'free-limited',
    features: [
      'Group discussions',
      'Engagement analysis',
      'Sentiment tracking',
      'Community insights',
    ],
    limitations: [
      'App review needed',
      'Limited public access',
      '⚠️ DEMO MODE: Mock data for testing',
    ],
  },
  {
    id: 'instagram',
    name: 'Instagram',
    description: 'Visual research content and academic outreach',
    icon: MessageCircle,
    status: 'limited',
    coverage: 'Academic accounts, research visualization',
    apiLimits: 'OAuth required',
    accessType: 'free-limited',
    features: [
      'Visual content',
      'Hashtag analysis',
      'Engagement metrics',
      'Save tracking',
    ],
    limitations: [
      'OAuth required',
      'Public accounts only',
      '⚠️ DEMO MODE: Mock data for testing',
    ],
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    description: 'Trending research content and public opinions',
    icon: MessageCircle,
    status: 'limited',
    coverage: 'Research education, science communication',
    apiLimits: 'Academic partnership',
    accessType: 'free-limited',
    features: [
      'Trend detection',
      'Viral content analysis',
      'View metrics',
      'Engagement scoring',
    ],
    limitations: [
      'Partnership required',
      'Limited historical data',
      '⚠️ DEMO MODE: Mock data for testing',
    ],
  },

  // Premium/Subscription Sources (Future)
  {
    id: 'web-of-science',
    name: 'Web of Science',
    description: 'Comprehensive citation database',
    icon: TrendingUp,
    status: 'premium',
    coverage: 'All disciplines',
    recordCount: '90M+ records',
    accessType: 'subscription',
    url: 'https://www.webofscience.com',
    features: [
      'Citation analysis',
      'Journal metrics',
      'Author profiles',
      'Funding data',
    ],
    limitations: ['Requires institutional access', 'Expensive licensing'],
  },
  {
    id: 'scopus',
    name: 'Scopus',
    description: "Elsevier's abstract and citation database",
    icon: Database,
    status: 'premium',
    coverage: 'Science, Technology, Medicine, Social Sciences',
    recordCount: '85M+ records',
    accessType: 'subscription',
    url: 'https://www.scopus.com',
    features: [
      'Author profiles',
      'Institution rankings',
      'Journal metrics',
      'Patent citations',
    ],
    limitations: ['Subscription required', 'Limited API access'],
  },
  {
    id: 'ieee-xplore',
    name: 'IEEE Xplore',
    description: 'Engineering and technology literature',
    icon: Microscope,
    status: 'premium',
    coverage: 'Engineering, Computer Science, Electronics',
    recordCount: '6M+ documents',
    accessType: 'institutional',
    url: 'https://ieeexplore.ieee.org',
    features: [
      'Standards',
      'Conference proceedings',
      'Technical reports',
      'Early access',
    ],
    limitations: ['Institutional subscription needed'],
  },
  {
    id: 'jstor',
    name: 'JSTOR',
    description: 'Digital library for scholars',
    icon: BookOpen,
    status: 'premium',
    coverage: 'Humanities, Social Sciences',
    recordCount: '12M+ academic articles',
    accessType: 'institutional',
    url: 'https://www.jstor.org',
    features: [
      'Historical archives',
      'Primary sources',
      'Books',
      'Research reports',
    ],
    limitations: ['Limited free access', 'Moving wall for recent content'],
  },
];

export default function DatabaseSourcesInfo() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'active' | 'coming-soon' | 'premium'
  >('all');

  const filteredSources = databaseSources.filter(source => {
    if (selectedCategory === 'all') return true;
    return source.status === selectedCategory;
  });

  const getStatusColor = (status: DatabaseSource['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
      case 'coming-soon':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
      case 'premium':
        return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30';
      case 'limited':
        return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
  };

  const getStatusIcon = (status: DatabaseSource['status']) => {
    switch (status) {
      case 'active':
        return <Check className="h-4 w-4" />;
      case 'coming-soon':
        return <Clock className="h-4 w-4" />;
      case 'premium':
        return <Lock className="h-4 w-4" />;
      case 'limited':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getAccessBadge = (accessType: DatabaseSource['accessType']) => {
    const colors = {
      free: 'bg-green-100 text-green-700',
      'free-limited': 'bg-blue-100 text-blue-700',
      subscription: 'bg-purple-100 text-purple-700',
      institutional: 'bg-orange-100 text-orange-700',
    };

    return (
      <Badge variant="outline" className={cn('text-xs', colors[accessType])}>
        {accessType.replace('-', ' ')}
      </Badge>
    );
  };

  const stats = {
    active: databaseSources.filter(s => s.status === 'active').length,
    comingSoon: databaseSources.filter(s => s.status === 'coming-soon').length,
    premium: databaseSources.filter(s => s.status === 'premium').length,
    total: databaseSources.length,
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle>Data Sources & Transparency</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4" />
                Hide Details
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4" />
                Show All Sources
              </>
            )}
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="text-sm text-muted-foreground">
              {stats.active} Active
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-muted-foreground">
              {stats.comingSoon} Coming Soon
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-purple-600" />
            <span className="text-sm text-muted-foreground">
              {stats.premium} Premium
            </span>
          </div>
        </div>
      </CardHeader>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <CardContent className="pt-0">
              <Separator className="mb-6" />

              {/* Category Filter */}
              <div className="flex gap-2 mb-6">
                {(['all', 'active', 'coming-soon', 'premium'] as const).map(
                  category => (
                    <Button
                      key={category}
                      variant={
                        selectedCategory === category ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => setSelectedCategory(category)}
                      className="capitalize"
                    >
                      {category.replace('-', ' ')}
                    </Button>
                  )
                )}
              </div>

              {/* Database Sources Grid */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredSources.map(source => {
                  const Icon = source.icon;
                  return (
                    <motion.div
                      key={source.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card className="h-full">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <Icon className="h-5 w-5 text-primary" />
                              <h4 className="font-semibold text-sm">
                                {source.name}
                              </h4>
                            </div>
                            <div className="flex items-center gap-1">
                              {getAccessBadge(source.accessType)}
                            </div>
                          </div>
                          <div
                            className={cn(
                              'inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full mt-2 w-fit',
                              getStatusColor(source.status)
                            )}
                          >
                            {getStatusIcon(source.status)}
                            <span className="capitalize">
                              {source.status.replace('-', ' ')}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-xs text-muted-foreground mb-3">
                            {source.description}
                          </p>

                          {/* Coverage & Stats */}
                          <div className="space-y-2 mb-3">
                            <div className="text-xs">
                              <span className="font-medium">Coverage:</span>{' '}
                              <span className="text-muted-foreground">
                                {source.coverage}
                              </span>
                            </div>
                            {source.recordCount && (
                              <div className="text-xs">
                                <span className="font-medium">Records:</span>{' '}
                                <span className="text-muted-foreground">
                                  {source.recordCount}
                                </span>
                              </div>
                            )}
                            {source.apiLimits && (
                              <div className="text-xs">
                                <span className="font-medium">API Limits:</span>{' '}
                                <span className="text-muted-foreground">
                                  {source.apiLimits}
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Features */}
                          <div className="space-y-1 mb-3">
                            <span className="text-xs font-medium">
                              Features:
                            </span>
                            <ul className="text-xs text-muted-foreground space-y-0.5">
                              {source.features
                                .slice(0, 3)
                                .map((feature, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-1"
                                  >
                                    <span className="text-green-600 mt-0.5">
                                      •
                                    </span>
                                    {feature}
                                  </li>
                                ))}
                            </ul>
                          </div>

                          {/* Limitations */}
                          {source.limitations && (
                            <div className="space-y-1">
                              <span className="text-xs font-medium">
                                Limitations:
                              </span>
                              <ul className="text-xs text-muted-foreground space-y-0.5">
                                {source.limitations.map((limitation, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-1"
                                  >
                                    <span className="text-orange-600 mt-0.5">
                                      •
                                    </span>
                                    {limitation}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* External Link */}
                          {source.url && source.status === 'active' && (
                            <div className="mt-3 pt-3 border-t">
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              >
                                Visit Website
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>

              {/* Data Usage Notice */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                <div className="flex gap-2">
                  <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Data Usage & Privacy Notice
                    </p>
                    <p className="text-xs text-muted-foreground">
                      VQMethod accesses publicly available academic databases
                      and respects all API rate limits and terms of service. We
                      do not store full-text articles unless explicitly saved by
                      users. All searches are logged for analytics and service
                      improvement. Premium database access requires separate
                      institutional or personal subscriptions.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      For social media sources (coming soon), we only analyze
                      publicly available posts and respect user privacy
                      settings. No personal data is collected without explicit
                      consent.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
