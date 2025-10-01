'use client';

import React from 'react';
import { PrimaryToolbar } from '@/components/navigation/PrimaryToolbar';
import { NavigationProvider } from '@/hooks/useNavigationState';

export default function TestNavigationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavigationProvider studyId="test-study">
        {/* Primary Toolbar with Sequential Flow */}
        <PrimaryToolbar />

        <div className="max-w-screen-2xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-4">Navigation Test Page</h1>
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">
              Research Lifecycle Navigation Test
            </h2>
            <p className="text-gray-600 mb-4">
              This page tests the new sequential navigation with:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>
                Primary toolbar showing 10 research phases with arrows between
                them
              </li>
              <li>
                Secondary toolbar always visible showing sequential steps within
                each phase
              </li>
              <li>
                Numbers indicating the order of steps in secondary toolbar
              </li>
              <li>Visual flow indicators (arrows) between items</li>
              <li>
                Phase persistence - secondary toolbar stays visible when
                switching phases
              </li>
            </ul>

            <div className="mt-6 p-4 bg-blue-50 rounded">
              <h3 className="font-semibold text-blue-800 mb-2">
                Try These Actions:
              </h3>
              <ol className="list-decimal pl-6 space-y-1 text-blue-700">
                <li>Click different phases in the primary toolbar</li>
                <li>Notice the secondary toolbar updates but stays visible</li>
                <li>
                  See the numbered steps in each phase's secondary toolbar
                </li>
                <li>Observe the arrows showing sequential flow</li>
                <li>Check that completed phases show green arrows</li>
              </ol>
            </div>
          </div>
        </div>
      </NavigationProvider>
    </div>
  );
}
