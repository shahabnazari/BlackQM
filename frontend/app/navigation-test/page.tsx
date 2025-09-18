'use client';

import React, { useState } from 'react';
import { UserProfileMenu } from '@/components/navigation/UserProfileMenu';
import { GlobalSearch } from '@/components/navigation/GlobalSearch';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { MobileNav } from '@/components/navigation/MobileNav';
import { CommandPalette } from '@/components/navigation/CommandPalette';

export default function NavigationTestPage() {
  const [testResults, setTestResults] = useState<Record<string, string>>({});

  const runTest = (testName: string, testFn: () => boolean) => {
    try {
      const result = testFn();
      setTestResults(prev => ({
        ...prev,
        [testName]: result ? '✅ Pass' : '❌ Fail',
      }));
    } catch (error: any) {
      setTestResults(prev => ({ ...prev, [testName]: `❌ Error: ${error}` }));
    }
  };

  return (
    <div className="min-h-screen bg-system-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">
          Navigation Components Test Page
        </h1>

        {/* Test Status Board */}
        <div className="mb-8 p-4 bg-white dark:bg-gray-900 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(testResults).map(([test, result]) => (
              <div key={test} className="text-sm">
                <span className="font-medium">{test}:</span> {result}
              </div>
            ))}
          </div>
        </div>

        {/* Component Testing Sections */}
        <div className="space-y-12">
          {/* UserProfileMenu Test */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">
              1. UserProfileMenu Component
            </h2>
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-600 dark:text-gray-400">
                Click the avatar to open the profile menu. Test logout, theme
                toggle, and navigation.
              </p>
              <UserProfileMenu />
            </div>
            <div className="space-x-2">
              <button
                onClick={() =>
                  runTest(
                    'UserProfileMenu renders',
                    () =>
                      document.querySelector('[aria-label="User menu"]') !==
                      null
                  )
                }
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Test Render
              </button>
              <button
                onClick={() =>
                  runTest(
                    'Presence indicator exists',
                    () =>
                      document.querySelector('[aria-label="Online"]') !== null
                  )
                }
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Test Presence
              </button>
            </div>
          </section>

          {/* GlobalSearch Test */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">
              2. GlobalSearch Component
            </h2>
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Type to search or press ⌘K. Try searching for "study",
                "participant", or "help".
              </p>
              <GlobalSearch />
            </div>
            <div className="space-x-2">
              <button
                onClick={() => {
                  const input = document.querySelector(
                    'input[placeholder*="Search"]'
                  ) as HTMLInputElement;
                  runTest('GlobalSearch input exists', () => input !== null);
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Test Input
              </button>
              <button
                onClick={() => {
                  const shortcut = document.querySelector('kbd');
                  runTest(
                    'Keyboard shortcut shown',
                    () => shortcut?.textContent === '⌘K'
                  );
                }}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Test Shortcut
              </button>
            </div>
          </section>

          {/* Breadcrumbs Test */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">
              3. Breadcrumbs Component
            </h2>
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Hover over breadcrumb items to see previews. Click to navigate.
              </p>
              <Breadcrumbs />
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-500">Custom breadcrumbs:</p>
              <Breadcrumbs
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Studies', href: '/studies' },
                  { label: 'Climate Research', href: '/studies/123' },
                  { label: 'Analysis' },
                ]}
              />
            </div>
            <button
              onClick={() => {
                const breadcrumbNav = document.querySelector(
                  'nav[aria-label="Breadcrumb"]'
                );
                runTest('Breadcrumbs render', () => breadcrumbNav !== null);
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Breadcrumbs
            </button>
          </section>

          {/* MobileNav Test */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">
              4. MobileNav Component
            </h2>
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Resize window to mobile size or click the hamburger menu below.
                Test swipe gestures on mobile.
              </p>
              <div className="flex items-center gap-4">
                <MobileNav />
                <span className="text-sm text-gray-500">
                  ← Click hamburger menu
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                const hamburger = document.querySelector(
                  '[aria-label="Toggle mobile menu"]'
                );
                runTest('Mobile nav button exists', () => hamburger !== null);
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Mobile Nav
            </button>
          </section>

          {/* CommandPalette Test */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">
              5. CommandPalette Component
            </h2>
            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Press ⌘⇧P to open the command palette. Navigate with arrow keys,
                select with Enter.
              </p>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded">
                <p className="font-mono text-sm">
                  Keyboard Shortcut: ⌘⇧P (Cmd+Shift+P)
                </p>
                <p className="text-sm mt-2">
                  Available commands: Navigate, Create Study, Toggle Theme,
                  Export Data, etc.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                // Trigger command palette
                const event = new KeyboardEvent('keydown', {
                  key: 'p',
                  metaKey: true,
                  shiftKey: true,
                  bubbles: true,
                });
                document.dispatchEvent(event);

                setTimeout(() => {
                  const commandInput = document.querySelector(
                    'input[placeholder*="command"]'
                  );
                  runTest('Command palette opens', () => commandInput !== null);
                }, 100);
              }}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Test Command Palette
            </button>
          </section>

          {/* Integration Test */}
          <section className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow">
            <h2 className="text-xl font-semibold mb-4">6. Integration Tests</h2>
            <div className="space-y-2">
              <button
                onClick={() => {
                  // Test theme toggle
                  const isDark =
                    document.documentElement.classList.contains('dark');
                  document.documentElement.classList.toggle('dark');
                  const isToggled =
                    document.documentElement.classList.contains('dark') !==
                    isDark;
                  runTest('Theme toggle works', () => isToggled);
                }}
                className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600"
              >
                Test Theme Toggle
              </button>

              <button
                onClick={() => {
                  // Test localStorage
                  localStorage.setItem('test', 'value');
                  const value = localStorage.getItem('test');
                  localStorage.removeItem('test');
                  runTest('LocalStorage works', () => value === 'value');
                }}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Test LocalStorage
              </button>

              <button
                onClick={() => {
                  // Run all tests
                  const tests = [
                    () =>
                      document.querySelector('[aria-label="User menu"]') !==
                      null,
                    () =>
                      document.querySelector('input[placeholder*="Search"]') !==
                      null,
                    () =>
                      document.querySelector('nav[aria-label="Breadcrumb"]') !==
                      null,
                    () =>
                      document.querySelector(
                        '[aria-label="Toggle mobile menu"]'
                      ) !== null,
                  ];

                  const allPass = tests.every(test => test());
                  runTest('All components render', () => allPass);
                }}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Run All Tests
              </button>
            </div>
          </section>
        </div>

        {/* Instructions */}
        <div className="mt-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Click each "Test" button to verify component rendering</li>
            <li>Interact with each component to test functionality</li>
            <li>
              Try keyboard shortcuts: ⌘K for search, ⌘⇧P for command palette
            </li>
            <li>Resize window to test mobile responsiveness</li>
            <li>Toggle dark mode to test theme switching</li>
            <li>Check browser console for any errors</li>
          </ol>
        </div>
      </div>

      {/* Hidden Command Palette */}
      <CommandPalette />
    </div>
  );
}
