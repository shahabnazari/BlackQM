'use client';

import React from 'react';
import InfoTooltip from '@/components/tooltips/InfoTooltip';
import { studyCreationTooltips } from '@/lib/tooltips/study-creation-tooltips';

export default function TestTooltips() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-label mb-8">Tooltip Test Page</h1>
        
        {/* Test different tooltip positions */}
        <div className="space-y-6">
          <div className="p-6 bg-secondary-background rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Position: Top (Default)</h2>
            <div className="flex items-center gap-2">
              <span className="text-label">Study Title</span>
              <InfoTooltip {...studyCreationTooltips.studyTitle} position="top" />
            </div>
          </div>

          <div className="p-6 bg-secondary-background rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Position: Bottom</h2>
            <div className="flex items-center gap-2">
              <span className="text-label">Welcome Message</span>
              <InfoTooltip {...studyCreationTooltips.welcomeMessage} position="bottom" />
            </div>
          </div>

          <div className="p-6 bg-secondary-background rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Position: Left</h2>
            <div className="flex justify-end">
              <div className="flex items-center gap-2">
                <span className="text-label">Consent Form</span>
                <InfoTooltip {...studyCreationTooltips.consentForm} position="left" />
              </div>
            </div>
          </div>

          <div className="p-6 bg-secondary-background rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Position: Right</h2>
            <div className="flex items-center gap-2">
              <span className="text-label">Pre-screening</span>
              <InfoTooltip {...studyCreationTooltips.preScreening} position="right" />
            </div>
          </div>
        </div>

        {/* Test edge cases */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Edge Cases</h2>
          
          <div className="p-6 bg-secondary-background rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Multiple tooltips in a row</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-label">Field 1</span>
                <InfoTooltip {...studyCreationTooltips.gridColumns} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-label">Field 2</span>
                <InfoTooltip {...studyCreationTooltips.distributionShape} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-label">Field 3</span>
                <InfoTooltip {...studyCreationTooltips.postSurvey} />
              </div>
            </div>
          </div>

          <div className="p-6 bg-secondary-background rounded-lg">
            <h3 className="text-lg font-semibold mb-4">At screen edges</h3>
            <div className="flex justify-between">
              <div className="flex items-center gap-2">
                <span className="text-label">Left edge</span>
                <InfoTooltip {...studyCreationTooltips.videoConferencing} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-label">Right edge</span>
                <InfoTooltip {...studyCreationTooltips.digitalSignature} />
              </div>
            </div>
          </div>

          <div className="p-6 bg-secondary-background rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Long content tooltip</h3>
            <div className="flex items-center gap-2">
              <span className="text-label">Templates</span>
              <InfoTooltip {...studyCreationTooltips.templates} />
            </div>
          </div>
        </div>

        {/* Color mode test */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold mb-4">Visual Test</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 bg-white dark:bg-gray-900 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Light background</h3>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 dark:text-gray-100">Organization Logo</span>
                <InfoTooltip {...studyCreationTooltips.organizationLogo} />
              </div>
            </div>
            <div className="p-6 bg-gray-100 dark:bg-gray-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Gray background</h3>
              <div className="flex items-center gap-2">
                <span className="text-gray-900 dark:text-gray-100">Organization Logo</span>
                <InfoTooltip {...studyCreationTooltips.organizationLogo} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}