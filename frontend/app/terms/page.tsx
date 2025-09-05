'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card as AppleCard } from '@/components/apple-ui/Card/Card';
import { Button as AppleButton } from '@/components/apple-ui/Button/Button';

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [showSummary, setShowSummary] = useState(true);

  const sections = {
    general: {
      title: 'General Terms',
      summary: 'Basic rules for using VQMethod platform',
      content: [
        {
          heading: 'Account Registration',
          text: 'You must provide accurate information when creating an account. You are responsible for maintaining the security of your account credentials.',
        },
        {
          heading: 'Acceptable Use',
          text: 'You agree to use VQMethod only for legitimate research purposes and in compliance with all applicable laws and regulations.',
        },
        {
          heading: 'Age Requirements',
          text: 'You must be at least 18 years old to use VQMethod, or have parental consent if conducting educational research.',
        },
      ],
    },
    research: {
      title: 'Research Terms',
      summary: 'Guidelines for conducting research studies',
      content: [
        {
          heading: 'Research Ethics',
          text: 'All research must comply with institutional review board (IRB) requirements and ethical guidelines for human subjects research.',
        },
        {
          heading: 'Participant Consent',
          text: 'You must obtain appropriate consent from all study participants and clearly communicate how their data will be used.',
        },
        {
          heading: 'Data Accuracy',
          text: 'You are responsible for ensuring the accuracy and integrity of research data collected through the platform.',
        },
      ],
    },
    intellectual: {
      title: 'Intellectual Property',
      summary: 'Ownership and usage rights',
      content: [
        {
          heading: 'Your Content',
          text: 'You retain ownership of your research data and content. You grant us a license to process and store this data to provide our services.',
        },
        {
          heading: 'Platform Content',
          text: 'VQMethod and its features are protected by intellectual property laws. You may not copy or reverse engineer our platform.',
        },
        {
          heading: 'Feedback',
          text: 'Any feedback or suggestions you provide may be used to improve our services without compensation.',
        },
      ],
    },
    payment: {
      title: 'Payment Terms',
      summary: 'Billing and subscription details',
      content: [
        {
          heading: 'Subscription Plans',
          text: 'Paid features are billed according to your selected plan. Prices may change with 30 days notice.',
        },
        {
          heading: 'Refunds',
          text: 'We offer a 30-day money-back guarantee for annual subscriptions. Monthly subscriptions are non-refundable.',
        },
        {
          heading: 'Auto-Renewal',
          text: 'Subscriptions automatically renew unless cancelled before the renewal date.',
        },
      ],
    },
    liability: {
      title: 'Limitation of Liability',
      summary: 'Legal disclaimers and limitations',
      content: [
        {
          heading: 'Service Availability',
          text: 'We strive for 99.9% uptime but do not guarantee uninterrupted service. Scheduled maintenance will be announced in advance.',
        },
        {
          heading: 'Data Loss',
          text: 'While we implement robust backup systems, we are not liable for data loss beyond our reasonable control.',
        },
        {
          heading: 'Indirect Damages',
          text: 'We are not liable for indirect, incidental, or consequential damages arising from use of our services.',
        },
      ],
    },
  };

  const recentChanges = [
    { date: 'Sep 1, 2025', change: 'Updated payment terms for clarity' },
    { date: 'Aug 15, 2025', change: 'Added GDPR compliance section' },
    { date: 'Jul 20, 2025', change: 'Clarified data retention policies' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Terms of Service</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Effective Date: September 4, 2025
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowSummary(!showSummary)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showSummary
                    ? 'bg-system-blue text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {showSummary ? 'Hide Summary' : 'Show Summary'}
              </button>
              <AppleButton variant="secondary">Download PDF</AppleButton>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <AppleCard className="p-4 sticky top-4">
              <h3 className="font-semibold mb-4">Quick Navigation</h3>
              <nav className="space-y-2">
                {Object.entries(sections).map(([key, section]) => (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                      activeSection === key
                        ? 'bg-system-blue text-white'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">{section.title}</div>
                    {showSummary && activeSection !== key && (
                      <div className="text-xs mt-1 opacity-80">
                        {section.summary}
                      </div>
                    )}
                  </button>
                ))}
              </nav>
            </AppleCard>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plain Language Summary */}
            {showSummary && (
              <AppleCard className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">💡</div>
                  <div>
                    <h3 className="font-semibold mb-2">
                      Plain Language Summary
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {sections[activeSection as keyof typeof sections].summary}
                    </p>
                  </div>
                </div>
              </AppleCard>
            )}

            {/* Section Content */}
            <AppleCard className="p-6">
              <h2 className="text-2xl font-bold mb-6">
                {sections[activeSection as keyof typeof sections].title}
              </h2>
              <div className="space-y-6">
                {sections[activeSection as keyof typeof sections].content.map(
                  (item, index) => (
                    <div
                      key={index}
                      className="border-l-4 border-system-blue pl-4"
                    >
                      <h3 className="font-semibold mb-2">{item.heading}</h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        {item.text}
                      </p>
                    </div>
                  )
                )}
              </div>
            </AppleCard>

            {/* Agreement Tracking */}
            <AppleCard className="p-6">
              <h3 className="font-semibold mb-4">Your Agreement History</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div>
                    <p className="font-medium">Current Version (v2.0)</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Agreed on: Registration Date
                    </p>
                  </div>
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </AppleCard>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Recent Changes */}
            <AppleCard className="p-6">
              <h3 className="font-semibold mb-4">Recent Changes</h3>
              <div className="space-y-3">
                {recentChanges.map((change, index) => (
                  <div key={index} className="text-sm">
                    <p className="font-medium text-gray-900 dark:text-gray-100">
                      {change.date}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {change.change}
                    </p>
                  </div>
                ))}
              </div>
              <Link
                href="/terms/history"
                className="text-system-blue hover:underline text-sm block mt-4"
              >
                View full history →
              </Link>
            </AppleCard>

            {/* Context Help */}
            <AppleCard className="p-6">
              <h3 className="font-semibold mb-4">Need Help?</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-system-blue mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <p className="font-medium">Questions?</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      Contact our legal team at legal@vqmethod.com
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <svg
                    className="w-5 h-5 text-system-blue mt-0.5"
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
                  <div>
                    <p className="font-medium">Legal Glossary</p>
                    <Link
                      href="/terms/glossary"
                      className="text-system-blue hover:underline"
                    >
                      View definitions →
                    </Link>
                  </div>
                </div>
              </div>
            </AppleCard>

            {/* Download Options */}
            <AppleCard className="p-6">
              <h3 className="font-semibold mb-4">Export Options</h3>
              <div className="space-y-2">
                <AppleButton
                  variant="secondary"
                  className="w-full justify-start"
                  size="small"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  PDF Format
                </AppleButton>
                <AppleButton
                  variant="secondary"
                  className="w-full justify-start"
                  size="small"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Word Document
                </AppleButton>
                <AppleButton
                  variant="secondary"
                  className="w-full justify-start"
                  size="small"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                  Print Version
                </AppleButton>
              </div>
            </AppleCard>
          </div>
        </div>
      </div>
    </div>
  );
}
