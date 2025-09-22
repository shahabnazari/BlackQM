'use client';

import InfoTooltip from '@/components/tooltips/InfoTooltip';
import InfoTooltipV2 from '@/components/tooltips/InfoTooltipV2';
import { studyCreationTooltips } from '@/lib/tooltips/study-creation-tooltips';

const defaultTooltip = {
  title: 'Information',
  content: 'No information available'
};

export default function TestTooltipsComparison() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tooltip Component Comparison
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing usability, accessibility, and visual improvements
          </p>
        </div>
        
        {/* Side by side comparison */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Original Version */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Original Tooltip (v1)
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Study Title</span>
                    <InfoTooltip {...(studyCreationTooltips.studyTitle || defaultTooltip)} />
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Welcome Message</span>
                    <InfoTooltip {...(studyCreationTooltips.welcomeMessage || defaultTooltip)} position="bottom" />
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Consent Form</span>
                    <InfoTooltip {...(studyCreationTooltips.consentForm || defaultTooltip)} position="left" />
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Grid Configuration</span>
                    <InfoTooltip {...(studyCreationTooltips.gridColumns || defaultTooltip)} position="right" />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded text-xs">
                <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Issues:</p>
                <ul className="text-yellow-700 dark:text-yellow-300 space-y-0.5">
                  <li>• Mixed hover/click behavior</li>
                  <li>• No keyboard navigation</li>
                  <li>• Missing ARIA attributes</li>
                  <li>• No boundary detection</li>
                  <li>• Instant show/hide (no delay)</li>
                </ul>
              </div>
            </div>
          </div>
          
          {/* Improved Version */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                Improved Tooltip (v2)
              </h2>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Study Title</span>
                    <InfoTooltipV2 {...(studyCreationTooltips.studyTitle || defaultTooltip)} />
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Welcome Message</span>
                    <InfoTooltipV2 {...(studyCreationTooltips.welcomeMessage || defaultTooltip)} position="bottom" />
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Consent Form</span>
                    <InfoTooltipV2 {...(studyCreationTooltips.consentForm || defaultTooltip)} position="auto" />
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 dark:text-gray-300">Grid Configuration</span>
                    <InfoTooltipV2 {...(studyCreationTooltips.gridColumns || defaultTooltip)} position="auto" />
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                <p className="font-semibold text-green-800 dark:text-green-200 mb-1">Improvements:</p>
                <ul className="text-green-700 dark:text-green-300 space-y-0.5">
                  <li>✓ Smart hover delay (300ms)</li>
                  <li>✓ ESC key to close</li>
                  <li>✓ Full ARIA support</li>
                  <li>✓ Auto-positioning & boundary detection</li>
                  <li>✓ Smooth animations</li>
                  <li>✓ Portal rendering (no z-index issues)</li>
                  <li>✓ Focus management</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Edge case testing */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Edge Case Testing (V2)
          </h2>
          
          <div className="space-y-6">
            {/* Test at edges */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                Screen Edge Positioning (Auto-adjust)
              </h3>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Far Left</span>
                  <InfoTooltipV2 {...(studyCreationTooltips.preScreening || defaultTooltip)} position="auto" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Center</span>
                  <InfoTooltipV2 {...(studyCreationTooltips.postSurvey || defaultTooltip)} position="auto" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Far Right</span>
                  <InfoTooltipV2 {...(studyCreationTooltips.videoConferencing || defaultTooltip)} position="auto" />
                </div>
              </div>
            </div>
            
            {/* Multiple tooltips */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                Multiple Tooltips in Form
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm flex-1">Organization Name</label>
                  <InfoTooltipV2 {...(studyCreationTooltips.organizationLogo || defaultTooltip)} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm flex-1">Digital Signature</label>
                  <InfoTooltipV2 {...(studyCreationTooltips.digitalSignature || defaultTooltip)} />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm flex-1">Template Selection</label>
                  <InfoTooltipV2 {...(studyCreationTooltips.templates || defaultTooltip)} />
                </div>
              </div>
            </div>
            
            {/* Keyboard navigation test */}
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded">
              <h3 className="text-sm font-semibold mb-3 text-gray-700 dark:text-gray-300">
                Keyboard Navigation Test
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                Tab through these tooltips and press Space/Enter to open, ESC to close
              </p>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm">First</span>
                  <InfoTooltipV2 {...(studyCreationTooltips.studyTitle || defaultTooltip)} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Second</span>
                  <InfoTooltipV2 {...(studyCreationTooltips.welcomeMessage || defaultTooltip)} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Third</span>
                  <InfoTooltipV2 {...(studyCreationTooltips.consentForm || defaultTooltip)} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance test */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Performance Test (Many Tooltips)
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(studyCreationTooltips).map(([key, tooltip]) => (
              <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="flex items-center justify-between">
                  <span className="text-xs truncate mr-2">{key}</span>
                  <InfoTooltipV2 {...(tooltip || defaultTooltip)} position="auto" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}