'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card as AppleCard } from '@/components/apple-ui/Card/Card';
import { Button as AppleButton } from '@/components/apple-ui/Button/Button';

export default function PrivacyPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>([
    'data-collection',
  ]);

  const sections = [
    {
      id: 'data-collection',
      title: 'Data Collection',
      icon: '📊',
      content: [
        'We collect information you provide directly, such as when you create an account, participate in a study, or contact us for support.',
        'Automatically collected information includes usage data, device information, and cookies to improve your experience.',
        'Research data is collected with explicit consent and used only for specified research purposes.',
      ],
    },
    {
      id: 'data-usage',
      title: 'How We Use Your Data',
      icon: '🔍',
      content: [
        'To provide, maintain, and improve our Q-methodology research platform.',
        'To communicate with you about studies, updates, and support.',
        'To ensure platform security and prevent fraud.',
        'To comply with legal obligations and protect our rights.',
      ],
    },
    {
      id: 'data-protection',
      title: 'Data Protection',
      icon: '🔐',
      content: [
        'We implement industry-standard encryption for data in transit and at rest.',
        'Access controls ensure only authorized personnel can access your information.',
        'Regular security audits and penetration testing maintain our high security standards.',
        'We comply with GDPR, CCPA, and other applicable data protection regulations.',
      ],
    },
    {
      id: 'data-sharing',
      title: 'Data Sharing',
      icon: '🤝',
      content: [
        'We never sell your personal information to third parties.',
        'Research data is shared only with explicit consent and in anonymized form.',
        'We may share data with service providers who assist in platform operations.',
        'Legal requirements may necessitate disclosure to law enforcement.',
      ],
    },
    {
      id: 'user-rights',
      title: 'Your Rights',
      icon: '⚖️',
      content: [
        'Access: Request a copy of your personal data.',
        'Correction: Update or correct inaccurate information.',
        'Deletion: Request removal of your personal data.',
        'Portability: Receive your data in a machine-readable format.',
        'Opt-out: Unsubscribe from marketing communications.',
      ],
    },
    {
      id: 'cookies',
      title: 'Cookies & Tracking',
      icon: '🍪',
      content: [
        'Essential cookies enable core functionality.',
        'Analytics cookies help us understand usage patterns.',
        'Preference cookies remember your settings.',
        'You can control cookie preferences in your browser settings.',
      ],
    },
  ];

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter((id: any) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const filteredSections = sections.filter(
    section =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.content.some(item =>
        item.toLowerCase().includes(searchTerm.toLowerCase())
      )
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold">Privacy Policy</h1>
            <div className="text-sm text-gray-500">
              Last updated: September 4, 2025
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Privacy Center */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Bar */}
            <AppleCard className="p-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search privacy policy..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-system-blue focus:border-transparent dark:bg-gray-700"
                />
                <svg
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
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
            </AppleCard>

            {/* Collapsible Sections */}
            {filteredSections.map((section: any) => (
              <AppleCard key={section.id} className="overflow-hidden">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{section.icon}</span>
                    <h2 className="text-lg font-semibold">{section.title}</h2>
                  </div>
                  <svg
                    className={`w-5 h-5 transition-transform ${
                      expandedSections.includes(section.id) ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedSections.includes(section.id) && (
                  <div className="px-6 pb-4 border-t border-gray-200 dark:border-gray-700">
                    <ul className="mt-4 space-y-3">
                      {section.content.map((item: any, index: any) => (
                        <li key={index} className="flex items-start">
                          <svg
                            className="w-5 h-5 text-system-blue mt-0.5 mr-3 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-gray-600 dark:text-gray-400">
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AppleCard>
            ))}

            {/* Data Flow Diagram */}
            <AppleCard className="p-6">
              <h2 className="text-lg font-semibold mb-4">
                How Your Data Flows
              </h2>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                      <svg
                        className="w-8 h-8 text-system-blue"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">You</p>
                  </div>
                  <div className="flex-1 flex items-center px-4">
                    <div className="flex-1 border-t-2 border-dashed border-gray-400"></div>
                    <svg
                      className="w-6 h-6 text-gray-400 mx-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                      <svg
                        className="w-8 h-8 text-system-blue"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Encrypted</p>
                  </div>
                  <div className="flex-1 flex items-center px-4">
                    <div className="flex-1 border-t-2 border-dashed border-gray-400"></div>
                    <svg
                      className="w-6 h-6 text-gray-400 mx-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 8l4 4m0 0l-4 4m4-4H3"
                      />
                    </svg>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-white dark:bg-gray-600 rounded-full flex items-center justify-center mx-auto mb-2 shadow-md">
                      <svg
                        className="w-8 h-8 text-system-blue"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01"
                        />
                      </svg>
                    </div>
                    <p className="text-sm font-medium">Our Servers</p>
                  </div>
                </div>
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                  Your data is encrypted end-to-end and stored securely on our
                  servers
                </p>
              </div>
            </AppleCard>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <AppleCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <AppleButton
                  variant="secondary"
                  className="w-full justify-start"
                >
                  <svg
                    className="w-5 h-5 mr-2"
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
                  Download PDF
                </AppleButton>
                <AppleButton
                  variant="secondary"
                  className="w-full justify-start"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Manage Preferences
                </AppleButton>
                <AppleButton
                  variant="secondary"
                  className="w-full justify-start"
                >
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete My Data
                </AppleButton>
              </div>
            </AppleCard>

            {/* Contact Information */}
            <AppleCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Privacy Contact</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-medium">Data Protection Officer</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    privacy@vqmethod.com
                  </p>
                </div>
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    +1 (555) 123-4567
                  </p>
                </div>
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-gray-600 dark:text-gray-400">
                    123 Research Way
                    <br />
                    San Francisco, CA 94105
                  </p>
                </div>
              </div>
            </AppleCard>

            {/* Version History */}
            <AppleCard className="p-6">
              <h3 className="text-lg font-semibold mb-4">Version History</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">v2.0</span>
                  <span>Sep 4, 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">v1.9</span>
                  <span>Jun 15, 2025</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">v1.8</span>
                  <span>Mar 1, 2025</span>
                </div>
                <Link
                  href="/privacy/history"
                  className="text-system-blue hover:underline block mt-3"
                >
                  View all changes →
                </Link>
              </div>
            </AppleCard>
          </div>
        </div>
      </div>
    </div>
  );
}
