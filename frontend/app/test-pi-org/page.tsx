'use client';

import React, { useState } from 'react';

export default function TestPIOrganization() {
  const [data, setData] = useState({
    researcherName: 'Dr. Sarah Johnson',
    organizationName: 'Stanford University',
    organizationLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Stanford_University_seal_2003.svg/200px-Stanford_University_seal_2003.svg.png'
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          PI and Organization Display Test
        </h1>
        
        {/* Test Input Controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold mb-4">Test Data Input</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Principal Investigator Name
            </label>
            <input
              type="text"
              value={data.researcherName}
              onChange={(e: any) => setData({...data, researcherName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Dr. John Smith"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Organization/University
            </label>
            <input
              type="text"
              value={data.organizationName}
              onChange={(e: any) => setData({...data, organizationName: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Stanford University"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Logo URL (optional)
            </label>
            <input
              type="text"
              value={data.organizationLogoUrl}
              onChange={(e: any) => setData({...data, organizationLogoUrl: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="https://..."
            />
          </div>
        </div>
        
        {/* Preview Section - How it appears in the form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Form Display Preview</h2>
          
          <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center gap-4 p-4">
              {data.organizationLogoUrl && (
                <div className="flex-shrink-0 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                  <img 
                    src={data.organizationLogoUrl} 
                    alt="Organization logo" 
                    className="h-14 w-auto object-contain"
                    onError={(e: any) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              <div className="flex-1">
                <div>
                  {data.researcherName && (
                    <p className="text-sm font-semibold text-gray-900">
                      {data.researcherName}
                    </p>
                  )}
                  {data.organizationName && (
                    <p className="text-xs text-gray-600">
                      {data.organizationName}
                    </p>
                  )}
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    ✓ Logo uploaded successfully
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Consent Form Header Preview */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Consent Form Header Preview</h2>
          
          <div className="bg-white rounded border border-gray-300 overflow-hidden">
            {(data.researcherName || data.organizationName || data.organizationLogoUrl) && (
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  {data.organizationLogoUrl && (
                    <img 
                      src={data.organizationLogoUrl} 
                      alt="" 
                      className="h-10 w-auto object-contain"
                      onError={(e: any) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  )}
                  <div>
                    {data.researcherName && (
                      <p className="text-sm font-semibold text-gray-900">
                        {data.researcherName}
                      </p>
                    )}
                    {data.organizationName && (
                      <p className="text-xs text-gray-600">
                        {data.organizationName}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">Research Consent Form</h3>
              <p className="text-sm text-gray-600">
                This is where the consent form content would appear...
              </p>
            </div>
          </div>
        </div>
        
        {/* Different Scenarios */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Different Scenarios</h2>
          
          <div className="grid gap-4">
            {/* Scenario 1: All fields */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">With Logo + PI + Organization:</p>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded">
                <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center text-xs">
                  Logo
                </div>
                <div>
                  <p className="text-sm font-semibold">Dr. Sarah Johnson</p>
                  <p className="text-xs text-gray-600">Stanford University</p>
                </div>
              </div>
            </div>
            
            {/* Scenario 2: No logo */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">PI + Organization (No Logo):</p>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded">
                <div>
                  <p className="text-sm font-semibold">Dr. Michael Chen</p>
                  <p className="text-xs text-gray-600">MIT</p>
                </div>
              </div>
            </div>
            
            {/* Scenario 3: Only PI */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">PI Only:</p>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded">
                <div>
                  <p className="text-sm font-semibold">Dr. Emily Rodriguez</p>
                </div>
              </div>
            </div>
            
            {/* Scenario 4: Only Organization */}
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">Organization Only:</p>
              <div className="flex items-center gap-3 bg-gray-50 p-3 rounded">
                <div>
                  <p className="text-xs text-gray-600">Harvard University</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}