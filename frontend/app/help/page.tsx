'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card as AppleCard } from '@/components/apple-ui/Card/Card';
import { Button as AppleButton } from '@/components/apple-ui/Button/Button';

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = [
    { id: 'all', label: 'All Topics', icon: '📚' },
    { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
    { id: 'q-methodology', label: 'Q-Methodology', icon: '🔬' },
    { id: 'data-analysis', label: 'Data Analysis', icon: '📊' },
    { id: 'troubleshooting', label: 'Troubleshooting', icon: '🔧' },
    { id: 'api', label: 'API & Integration', icon: '⚡' },
  ];

  const tutorials = [
    {
      id: 1,
      category: 'getting-started',
      title: 'Creating Your First Study',
      duration: '5 min',
      difficulty: 'Beginner',
      description:
        'Learn how to set up and configure your first Q-methodology study.',
      video: true,
    },
    {
      id: 2,
      category: 'q-methodology',
      title: 'Understanding Q-Sort Distribution',
      duration: '8 min',
      difficulty: 'Intermediate',
      description:
        'Deep dive into forced distribution and its impact on results.',
      video: true,
    },
    {
      id: 3,
      category: 'data-analysis',
      title: 'Factor Analysis Interpretation',
      duration: '12 min',
      difficulty: 'Advanced',
      description:
        'Master the art of interpreting factor arrays and distinguishing statements.',
      video: true,
    },
    {
      id: 4,
      category: 'getting-started',
      title: 'Inviting Participants',
      duration: '3 min',
      difficulty: 'Beginner',
      description:
        'Learn multiple ways to invite and manage study participants.',
      video: false,
    },
    {
      id: 5,
      category: 'troubleshooting',
      title: 'Common Issues & Solutions',
      duration: '6 min',
      difficulty: 'Beginner',
      description: 'Quick fixes for the most common problems users encounter.',
      video: false,
    },
    {
      id: 6,
      category: 'api',
      title: 'REST API Authentication',
      duration: '10 min',
      difficulty: 'Advanced',
      description: 'Set up API access and authenticate your requests.',
      video: false,
    },
  ];

  const resources = [
    {
      title: 'Q-Methodology Primer',
      type: 'PDF',
      size: '2.4 MB',
      icon: '📄',
    },
    {
      title: 'Statistical Reference Guide',
      type: 'PDF',
      size: '3.1 MB',
      icon: '📈',
    },
    {
      title: 'Sample Study Templates',
      type: 'ZIP',
      size: '1.8 MB',
      icon: '📦',
    },
    {
      title: 'API Documentation',
      type: 'Web',
      size: 'Online',
      icon: '🌐',
    },
  ];

  const communityLinks = [
    {
      title: 'Discussion Forum',
      members: '5,234',
      posts: '12,456',
      icon: '💬',
    },
    {
      title: 'Research Showcase',
      members: '2,145',
      posts: '3,567',
      icon: '🏆',
    },
    {
      title: 'Feature Requests',
      members: '3,678',
      posts: '8,901',
      icon: '💡',
    },
  ];

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesCategory =
      selectedCategory === 'all' || tutorial.category === selectedCategory;
    const matchesSearch =
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'Intermediate':
        return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'Advanced':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Help Center</h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
              Everything you need to master VQMethod
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <input
                type="text"
                placeholder="Search for help articles, tutorials, or documentation..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pl-12 text-lg border border-gray-300 dark:border-gray-600 rounded-full focus:ring-2 focus:ring-system-blue focus:border-transparent dark:bg-gray-700"
              />
              <svg
                className="absolute left-4 top-4 h-6 w-6 text-gray-400"
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
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-6 py-3 rounded-full transition-all flex items-center gap-2 ${
                selectedCategory === category.id
                  ? 'bg-system-blue text-white shadow-lg'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:shadow-md'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Tutorials */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-semibold mb-4">
              Interactive Tutorials
            </h2>

            {filteredTutorials.length === 0 ? (
              <AppleCard className="p-8 text-center">
                <p className="text-gray-500">
                  No tutorials found matching your search.
                </p>
              </AppleCard>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredTutorials.map(tutorial => (
                  <AppleCard
                    key={tutorial.id}
                    className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold mb-1">{tutorial.title}</h3>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-500">
                            ⏱ {tutorial.duration}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(tutorial.difficulty)}`}
                          >
                            {tutorial.difficulty}
                          </span>
                        </div>
                      </div>
                      {tutorial.video && (
                        <div className="ml-3">
                          <svg
                            className="w-8 h-8 text-red-500"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M10 8.64L15.27 12 10 15.36V8.64M8 5v14l11-7L8 5z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {tutorial.description}
                    </p>
                    <AppleButton
                      variant="secondary"
                      size="small"
                      className="w-full"
                      onClick={() => {
                        // Navigate to tutorial page or open video
                        window.open(`/tutorials/${tutorial.id}`, '_blank');
                      }}
                    >
                      {tutorial.video ? 'Watch Tutorial' : 'Read Article'}
                    </AppleButton>
                  </AppleCard>
                ))}
              </div>
            )}

            {/* API Documentation Section */}
            <div className="mt-12">
              <h2 className="text-2xl font-semibold mb-4">
                Developer Resources
              </h2>
              <AppleCard className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      API Documentation
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">
                      Complete reference for integrating VQMethod into your
                      applications
                    </p>
                  </div>
                  <div className="text-4xl">🚀</div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <Link href="/api/docs" className="block">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <h4 className="font-medium mb-1">REST API</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        RESTful endpoints
                      </p>
                    </div>
                  </Link>
                  <Link href="/api/graphql" className="block">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <h4 className="font-medium mb-1">GraphQL</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Query language API
                      </p>
                    </div>
                  </Link>
                  <Link href="/api/webhooks" className="block">
                    <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                      <h4 className="font-medium mb-1">Webhooks</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Event notifications
                      </p>
                    </div>
                  </Link>
                </div>
                <AppleButton 
                  variant="primary" 
                  className="w-full"
                  onClick={() => {
                    window.location.href = '/documentation';
                  }}
                >
                  View Full Documentation
                </AppleButton>
              </AppleCard>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Links */}
            <AppleCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-3">
                <Link
                  href="/help/quick-start"
                  className="flex items-center gap-3 text-sm hover:text-system-blue"
                >
                  <span>⚡</span> Quick Start Guide
                </Link>
                <Link
                  href="/help/video-library"
                  className="flex items-center gap-3 text-sm hover:text-system-blue"
                >
                  <span>🎬</span> Video Library
                </Link>
                <Link
                  href="/help/glossary"
                  className="flex items-center gap-3 text-sm hover:text-system-blue"
                >
                  <span>📖</span> Glossary of Terms
                </Link>
                <Link
                  href="/help/best-practices"
                  className="flex items-center gap-3 text-sm hover:text-system-blue"
                >
                  <span>⭐</span> Best Practices
                </Link>
                <Link
                  href="/help/changelog"
                  className="flex items-center gap-3 text-sm hover:text-system-blue"
                >
                  <span>📝</span> What's New
                </Link>
              </div>
            </AppleCard>

            {/* Download Resources */}
            <AppleCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Download Resources</h3>
              <div className="space-y-3">
                {resources.map((resource, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{resource.icon}</span>
                      <div>
                        <p className="text-sm font-medium">{resource.title}</p>
                        <p className="text-xs text-gray-500">
                          {resource.type} • {resource.size}
                        </p>
                      </div>
                    </div>
                    <button 
                      className="text-system-blue hover:text-blue-700"
                      onClick={() => {
                        // Trigger download for the resource
                        const filename = resource.title.toLowerCase().replace(/\s+/g, '-') + '.' + resource.type.toLowerCase();
                        window.open(`/resources/download/${filename}`, '_blank');
                      }}
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
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </AppleCard>

            {/* Community Forum */}
            <AppleCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Community Forum</h3>
              <div className="space-y-3">
                {communityLinks.map((link, index) => (
                  <Link
                    key={index}
                    href={`/community/${link.title.toLowerCase().replace(' ', '-')}`}
                  >
                    <div className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{link.icon}</span>
                          <span className="font-medium text-sm">
                            {link.title}
                          </span>
                        </div>
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{link.members} members</span>
                        <span>{link.posts} posts</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </AppleCard>

            {/* Need More Help */}
            <AppleCard className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20">
              <h3 className="text-lg font-semibold mb-3">Still Need Help?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Our support team is ready to assist you with any questions.
              </p>
              <Link href="/contact">
                <AppleButton variant="primary" className="w-full">
                  Contact Support
                </AppleButton>
              </Link>
            </AppleCard>
          </div>
        </div>
      </div>
    </div>
  );
}
