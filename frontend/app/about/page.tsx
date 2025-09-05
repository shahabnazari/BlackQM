'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card as AppleCard } from '@/components/apple-ui/Card/Card';
import { Button as AppleButton } from '@/components/apple-ui/Button/Button';

export default function AboutPage() {
  const [activeTab, setActiveTab] = useState<
    'methodology' | 'team' | 'achievements'
  >('methodology');

  const stats = [
    { label: 'Active Researchers', value: '10,000+', trend: '+25%' },
    { label: 'Studies Completed', value: '50,000+', trend: '+40%' },
    { label: 'Participants', value: '500K+', trend: '+60%' },
    { label: 'Academic Citations', value: '2,500+', trend: '+15%' },
  ];

  const teamMembers = [
    {
      name: 'Dr. Sarah Johnson',
      role: 'Chief Research Officer',
      credentials: 'PhD Psychology, Stanford',
      image: '/api/placeholder/150/150',
    },
    {
      name: 'Prof. Michael Chen',
      role: 'Q-Methodology Expert',
      credentials: 'PhD Statistics, MIT',
      image: '/api/placeholder/150/150',
    },
    {
      name: 'Dr. Emily Williams',
      role: 'Head of Product',
      credentials: 'PhD HCI, Carnegie Mellon',
      image: '/api/placeholder/150/150',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Advancing Q-Methodology Research
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-8">
              VQMethod brings cutting-edge technology to Q-methodology research,
              empowering researchers worldwide to uncover subjective viewpoints
              with unprecedented clarity and scale.
            </p>
            <div className="flex gap-4 justify-center">
              <Link href="/auth/register">
                <AppleButton variant="primary" size="large">
                  Start Your Research
                </AppleButton>
              </Link>
              <Link href="/contact">
                <AppleButton variant="secondary" size="large">
                  Contact Our Team
                </AppleButton>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <AppleCard key={index} className="p-6 text-center">
              <div className="text-3xl font-bold mb-2">{stat.value}</div>
              <div className="text-gray-600 dark:text-gray-400 mb-2">
                {stat.label}
              </div>
              <div className="text-sm text-green-600 font-medium">
                {stat.trend} this year
              </div>
            </AppleCard>
          ))}
        </div>
      </div>

      {/* Tabbed Content Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex justify-center mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
            <button
              onClick={() => setActiveTab('methodology')}
              className={`px-6 py-2 rounded-full transition-all ${
                activeTab === 'methodology'
                  ? 'bg-system-blue text-white'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Q-Methodology
            </button>
            <button
              onClick={() => setActiveTab('team')}
              className={`px-6 py-2 rounded-full transition-all ${
                activeTab === 'team'
                  ? 'bg-system-blue text-white'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Our Team
            </button>
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-6 py-2 rounded-full transition-all ${
                activeTab === 'achievements'
                  ? 'bg-system-blue text-white'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              Achievements
            </button>
          </div>
        </div>

        {/* Methodology Tab */}
        {activeTab === 'methodology' && (
          <AppleCard className="p-8">
            <h2 className="text-2xl font-bold mb-6">
              Understanding Q-Methodology
            </h2>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    1
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Subjective Viewpoints
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Q-methodology reveals patterns in subjective viewpoints,
                    helping researchers understand how different people think
                    about complex topics.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    2
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Statement Sorting
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Participants sort statements according to their personal
                    viewpoint, creating a unique Q-sort that represents their
                    subjective understanding.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">
                    3
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Factor Analysis
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Advanced statistical analysis identifies shared viewpoints,
                    revealing distinct perspectives that exist within your
                    participant group.
                  </p>
                </div>
              </div>
            </div>
          </AppleCard>
        )}

        {/* Team Tab */}
        {activeTab === 'team' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {teamMembers.map((member, index) => (
              <AppleCard key={index} className="p-6 text-center">
                <div className="w-32 h-32 mx-auto mb-4 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                  <svg
                    className="w-20 h-20 text-gray-400"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-1">{member.name}</h3>
                <p className="text-system-blue mb-2">{member.role}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {member.credentials}
                </p>
              </AppleCard>
            ))}
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <AppleCard className="p-8">
            <h2 className="text-2xl font-bold mb-6">Our Achievements</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-green-600 dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Industry Leader in Q-Research
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Recognized as the leading platform for Q-methodology
                    research by academic institutions worldwide.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-blue-600 dark:text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Published Research
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Over 500 peer-reviewed papers published using VQMethod,
                    advancing the field of Q-methodology.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-1">
                    Award-Winning Platform
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Recipient of multiple awards for innovation in research
                    methodology and user experience design.
                  </p>
                </div>
              </div>
            </div>
          </AppleCard>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Research?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of researchers using VQMethod to uncover meaningful
            insights.
          </p>
          <Link href="/auth/register">
            <AppleButton variant="secondary" size="large">
              Get Started Free
            </AppleButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
