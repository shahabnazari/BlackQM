'use client';

import React, { useState } from 'react';
import { StimuliUploadSystemV2 } from '@/components/stimuli/StimuliUploadSystemV2';
import { CheckCircle, Upload, AlertCircle, Info } from 'lucide-react';

export default function TestBulkUploadPage() {
  const [completedStimuli, setCompletedStimuli] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  
  // Configure a test grid
  const testGrid = {
    columns: [
      { value: -2, label: 'Strongly Disagree', cells: 2 },
      { value: -1, label: 'Disagree', cells: 3 },
      { value: 0, label: 'Neutral', cells: 4 },
      { value: 1, label: 'Agree', cells: 3 },
      { value: 2, label: 'Strongly Agree', cells: 2 }
    ],
    totalCells: 14
  };

  const handleStimuliComplete = (stimuli: any[]) => {
    setCompletedStimuli(stimuli);
    setShowResults(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bulk Upload Test
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Test the improved bulk upload system with concurrent processing
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                V2 System
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Instructions */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-900 mb-2">
                Test Instructions
              </h3>
              <div className="space-y-1 text-sm text-blue-800">
                <p>1. Drag and drop multiple files at once (images, videos, audio, PDFs)</p>
                <p>2. Watch the concurrent upload queue process files efficiently</p>
                <p>3. Try uploading 10+ files to see the queue management in action</p>
                <p>4. Test error recovery by disconnecting network during upload</p>
                <p>5. Grid capacity: {testGrid.totalCells} items</p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Highlight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Upload className="w-5 h-5 text-green-600" />
              </div>
              <h4 className="font-semibold">Concurrent Uploads</h4>
            </div>
            <p className="text-sm text-gray-600">
              Processes up to 3 files simultaneously for faster bulk uploads
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-blue-600" />
              </div>
              <h4 className="font-semibold">Smart Queue</h4>
            </div>
            <p className="text-sm text-gray-600">
              Automatic queue management with progress tracking for each file
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <h4 className="font-semibold">Error Recovery</h4>
            </div>
            <p className="text-sm text-gray-600">
              Automatic retry with exponential backoff for failed uploads
            </p>
          </div>
        </div>

        {/* Upload Component */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <StimuliUploadSystemV2
            studyId="test-study"
            grid={testGrid}
            onStimuliComplete={handleStimuliComplete}
          />
        </div>

        {/* Results */}
        {showResults && (
          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
              <h3 className="text-lg font-semibold text-green-900">
                Upload Complete!
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Stimuli:</span>
                <span className="ml-2 font-semibold">{completedStimuli.length}</span>
              </div>
              <div>
                <span className="text-gray-600">Grid Capacity:</span>
                <span className="ml-2 font-semibold">{testGrid.totalCells}</span>
              </div>
            </div>
            <div className="mt-4">
              <h4 className="font-medium mb-2">Uploaded Items:</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {completedStimuli.map((stimulus, index) => (
                  <div
                    key={stimulus.id}
                    className="bg-white rounded border p-2 text-xs"
                  >
                    <span className="font-medium">#{index + 1}</span>
                    <span className="ml-2 text-gray-600">{stimulus.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Test Scenarios */}
        <div className="mt-8 bg-gray-100 rounded-lg p-6">
          <h3 className="font-semibold mb-4">Test Scenarios to Try:</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <strong>Bulk Upload:</strong> Select 10-20 files at once
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <strong>Mixed Types:</strong> Upload images, videos, and PDFs together
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <strong>Large Files:</strong> Try files up to 50MB
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <strong>Cancel & Retry:</strong> Cancel uploads mid-process and retry
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-600">✓</span>
              <div>
                <strong>Grid Overflow:</strong> Try uploading more than 14 files
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}