'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChartBarIcon,
  CubeTransparentIcon,
  DocumentArrowDownIcon,
  AdjustmentsHorizontalIcon,
  PlayIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import { ProgressBar } from '@/components/apple-ui/ProgressBar';
import DataUploadSection from './components/DataUploadSection';
import FactorExtractionPanel from './components/FactorExtractionPanel';
import FactorRotationView from './components/FactorRotationView';
import FactorInterpretation from './components/FactorInterpretation';
import ExportPanel from './components/ExportPanel';
import { useQAnalysis } from './hooks/useQAnalysis';

export default function QMethodologyAnalysisPage() {
  const [activeTab, setActiveTab] = useState<
    'upload' | 'extract' | 'rotate' | 'interpret' | 'export'
  >('upload');
  const {
    analysisState,
    uploadData,
    runExtraction,
    rotateFactors,
    exportResults,
    isProcessing,
  } = useQAnalysis();

  const tabs = [
    {
      id: 'upload',
      label: 'Data Upload',
      icon: DocumentArrowDownIcon,
      enabled: true,
    },
    {
      id: 'extract',
      label: 'Factor Extraction',
      icon: ChartBarIcon,
      enabled: analysisState.dataUploaded,
    },
    {
      id: 'rotate',
      label: 'Factor Rotation',
      icon: CubeTransparentIcon,
      enabled: analysisState.factorsExtracted,
    },
    {
      id: 'interpret',
      label: 'Interpretation',
      icon: AdjustmentsHorizontalIcon,
      enabled: analysisState.factorsRotated,
    },
    {
      id: 'export',
      label: 'Export Results',
      icon: DocumentArrowDownIcon,
      enabled: analysisState.analysisComplete,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                Q Methodology Analysis Engine
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                PQMethod-compatible statistical analysis with real-time
                visualization
              </p>
            </div>
            <Badge
              variant={analysisState.analysisComplete ? 'success' : 'warning'}
              className="px-3 py-1"
            >
              {analysisState.analysisComplete
                ? 'Analysis Complete'
                : 'In Progress'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6" aria-label="Analysis steps">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => tab.enabled && setActiveTab(tab.id as any)}
                disabled={!tab.enabled}
                className={`
                  relative py-4 px-1 border-b-2 font-medium text-sm transition-colors
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : tab.enabled
                        ? 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                        : 'border-transparent text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  }
                `}
              >
                <span className="flex items-center space-x-2">
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </span>
                {activeTab === tab.id && (
                  <motion.div
                    className="absolute inset-x-0 bottom-[-2px] h-0.5 bg-blue-500"
                    layoutId="activeTab"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Progress Bar */}
      <div className="bg-white dark:bg-gray-800 px-6 py-3">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Analysis Progress:
          </span>
          <div className="flex-1">
            <ProgressBar
              value={analysisState.progress}
              max={100}
              className="h-2"
            />
          </div>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {analysisState.progress}%
          </span>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'upload' && (
            <DataUploadSection
              onUpload={uploadData}
              isUploading={isProcessing}
            />
          )}

          {activeTab === 'extract' && (
            <FactorExtractionPanel
              onExtract={runExtraction}
              extractionResults={analysisState.extractionResults}
              isExtracting={isProcessing}
            />
          )}

          {activeTab === 'rotate' && (
            <FactorRotationView
              factors={analysisState.factors || []}
              onRotate={rotateFactors}
              isRotating={isProcessing}
              rotationResults={analysisState.rotationResults}
            />
          )}

          {activeTab === 'interpret' && (
            <FactorInterpretation
              factors={analysisState.rotatedFactors || []}
              loadings={analysisState.factorLoadings || []}
              statements={analysisState.statements || []}
            />
          )}

          {activeTab === 'export' && (
            <ExportPanel
              analysisResults={analysisState}
              onExport={exportResults}
              isExporting={isProcessing}
            />
          )}
        </motion.div>
      </div>

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
        <Button
          variant="secondary"
          size="large"
          className="shadow-lg"
          onClick={() => window.location.reload()}
        >
          <ArrowPathIcon className="h-5 w-5 mr-2" />
          Reset Analysis
        </Button>
        {analysisState.analysisComplete && (
          <Button
            variant="primary"
            size="large"
            className="shadow-lg"
            onClick={() => setActiveTab('export')}
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Export Results
          </Button>
        )}
      </div>
    </div>
  );
}
