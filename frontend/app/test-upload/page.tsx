'use client';

import React, { useState } from 'react';
import RichTextEditorV2 from '@/components/editors/RichTextEditorV2';
import ResearcherSignature from '@/components/study-creation/ResearcherSignature';
import { AlertTriangle, Info, Check } from 'lucide-react';

export default function TestNewFeatures() {
  const [welcomeContent, setWelcomeContent] = useState('');
  const [consentContent, setConsentContent] = useState('');
  const [signatureUrl, setSignatureUrl] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            New Feature Test Page
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Testing image upload, font size selector, signature improvements, and legal disclaimers
          </p>
        </div>

        {/* Feature 1: Legal Disclaimer */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Legal Compliance Disclaimers
          </h2>
          
          <div className="space-y-4">
            <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
              <p className="text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400">⚠️</span>
                <span>
                  <strong>Important:</strong> These templates are suggestions only. You must ensure compliance with your institution\'s IRB, local laws, and regulations (GDPR, HIPAA, etc.). Always consult your legal/ethics team before use.
                </span>
              </p>
            </div>
            
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>
                  This disclaimer now appears when selecting templates for both welcome messages and consent forms.
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Feature 2: Rich Text Editor with Image Upload */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Enhanced Rich Text Editor
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-200 mb-2">
                New Features:
              </h3>
              <ul className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Local Image Upload:</strong> Click the upload icon to add images from your computer (max 5MB)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Font Size Selector:</strong> Choose from 8pt to 16pt (replaced heading options)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span><strong>No URL Images:</strong> Only local file uploads are allowed for security</span>
                </li>
              </ul>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Welcome Message Editor
              </label>
              <RichTextEditorV2
                content={welcomeContent}
                onChange={setWelcomeContent}
                placeholder="Try uploading an image, changing font size (8-16pt), or formatting text..."
                minLength={50}
                maxLength={1000}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Consent Form Editor
              </label>
              <RichTextEditorV2
                content={consentContent}
                onChange={setConsentContent}
                placeholder="Create your consent form with images and custom font sizes..."
                minLength={100}
                maxLength={2000}
              />
            </div>
          </div>
        </div>

        {/* Feature 3: Improved Typed Signature */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">
            Improved Signature Component
          </h2>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-800 dark:text-blue-200 mb-2">
                Signature Improvements:
              </h3>
              <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Larger Typed Signature:</strong> Increased font size from 32px to 48px for better visibility</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Better Preview:</strong> Preview now shows at 42px for accurate representation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3 h-3 mt-0.5 flex-shrink-0" />
                  <span><strong>Larger Canvas:</strong> Canvas size increased to 500x150px</span>
                </li>
              </ul>
            </div>
            
            <ResearcherSignature
              onSignatureComplete={(url) => setSignatureUrl(url)}
              currentSignatureUrl={signatureUrl}
              onRemove={() => setSignatureUrl('')}
            />
          </div>
        </div>

        {/* Feature Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
            Summary of Changes
          </h2>
          
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">Rich Text Editor</h3>
              <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                <li>✅ Local image upload only (no URLs)</li>
                <li>✅ Font size selector: 8pt to 16pt</li>
                <li>✅ Removed heading options (H1-H4)</li>
                <li>✅ Max 5MB image size limit</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">Signature Component</h3>
              <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                <li>✅ Typed signature: 48px font (was 32px)</li>
                <li>✅ Preview: 42px font (was 28px)</li>
                <li>✅ Canvas: 500x150px (was 400x120px)</li>
                <li>✅ Better visibility and legibility</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">Legal Compliance</h3>
              <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                <li>⚠️ Templates are suggestions only</li>
                <li>⚠️ Must comply with IRB requirements</li>
                <li>⚠️ Check GDPR, HIPAA regulations</li>
                <li>⚠️ Consult legal/ethics teams</li>
              </ul>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4">
              <h3 className="font-semibold text-sm mb-2">User Experience</h3>
              <ul className="text-xs space-y-1 text-gray-600 dark:text-gray-400">
                <li>✅ More intuitive font controls</li>
                <li>✅ Secure local-only uploads</li>
                <li>✅ Clear legal guidance</li>
                <li>✅ Professional appearance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}