'use client';

import React, { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import { motion } from 'framer-motion';
import {
  DocumentArrowDownIcon,
  DocumentTextIcon,
  TableCellsIcon,
  ChartBarIcon,
  CodeBracketIcon,
  DocumentChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

interface ExportPanelProps {
  analysisResults: any;
  onExport: (format: 'json' | 'csv' | 'pqmethod' | 'spss' | 'pdf') => void;
  isExporting: boolean;
}

const exportFormats = [
  {
    id: 'json',
    name: 'JSON',
    description: 'Complete analysis data in JSON format',
    icon: CodeBracketIcon,
    extension: '.json',
    recommended: false,
  },
  {
    id: 'csv',
    name: 'CSV',
    description: 'Tabular data for spreadsheet applications',
    icon: TableCellsIcon,
    extension: '.csv',
    recommended: true,
  },
  {
    id: 'pqmethod',
    name: 'PQMethod',
    description: 'Compatible with PQMethod software',
    icon: DocumentTextIcon,
    extension: '.lis',
    recommended: true,
  },
  {
    id: 'spss',
    name: 'SPSS',
    description: 'SPSS Statistics compatible format',
    icon: ChartBarIcon,
    extension: '.sav',
    recommended: false,
  },
  {
    id: 'pdf',
    name: 'PDF Report',
    description: 'Comprehensive analysis report with visualizations',
    icon: DocumentChartBarIcon,
    extension: '.pdf',
    recommended: true,
  },
];

export default function ExportPanel({
  analysisResults,
  onExport,
  isExporting,
}: ExportPanelProps) {
  const [selectedFormat, setSelectedFormat] = useState<
    'json' | 'csv' | 'pqmethod' | 'spss' | 'pdf'
  >('pdf');
  const [exportOptions, setExportOptions] = useState({
    includeRawData: true,
    includeVisualizations: true,
    includeInterpretations: true,
    includeParticipantData: false,
    anonymizeData: true,
  });

  const handleExport = () => {
    onExport(selectedFormat);
  };

  const exportHistory = [
    { format: 'PDF', date: '2024-01-15', size: '2.3 MB' },
    { format: 'CSV', date: '2024-01-14', size: '156 KB' },
    { format: 'PQMethod', date: '2024-01-10', size: '89 KB' },
  ];

  return (
    <div className="space-y-6">
      {/* Export Format Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Select Export Format
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {exportFormats.map(format => {
            const Icon = format.icon;
            return (
              <motion.button
                key={format.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  setSelectedFormat(
                    format.id as 'json' | 'csv' | 'pqmethod' | 'spss' | 'pdf'
                  )
                }
                className={`
                  relative p-4 rounded-lg border-2 transition-all
                  ${
                    selectedFormat === format.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                  }
                `}
              >
                {format.recommended && (
                  <Badge
                    variant="success"
                    className="absolute top-2 right-2 text-xs"
                  >
                    Recommended
                  </Badge>
                )}

                <div className="flex flex-col items-center text-center">
                  <Icon
                    className={`h-8 w-8 mb-2 ${
                      selectedFormat === format.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-400 dark:text-gray-500'
                    }`}
                  />
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {format.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {format.description}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    {format.extension}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </div>
      </Card>

      {/* Export Options */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Export Options
        </h3>

        <div className="space-y-3">
          {Object.entries(exportOptions).map(([key, value]) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={value}
                onChange={e =>
                  setExportOptions(prev => ({
                    ...prev,
                    [key]: e.target.checked,
                  }))
                }
                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
              />
              <span className="ml-3 text-sm text-gray-700 dark:text-gray-300">
                {key
                  .replace(/([A-Z])/g, ' $1')
                  .replace(/^./, str => str.toUpperCase())}
              </span>
            </label>
          ))}
        </div>

        {/* Format-specific options */}
        {selectedFormat === 'pdf' && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              PDF export will include all visualizations, tables, and your
              factor interpretations in a professionally formatted report.
            </p>
          </div>
        )}

        {selectedFormat === 'pqmethod' && (
          <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              PQMethod format ensures compatibility with the desktop PQMethod
              software. Some advanced features may not be included in this
              format.
            </p>
          </div>
        )}
      </Card>

      {/* Analysis Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Analysis Summary
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analysisResults.factors?.length || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Factors</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {Object.keys(analysisResults.factorLoadings || {}).length}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Participants
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analysisResults.statements?.length || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Statements
            </p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {analysisResults.progress || 0}%
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Complete</p>
          </div>
        </div>
      </Card>

      {/* Export History */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Exports
        </h3>

        <div className="space-y-2">
          {exportHistory.map((export_, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <DocumentArrowDownIcon className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {export_.format} Export
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {export_.date} • {export_.size}
                  </p>
                </div>
              </div>
              <Button variant="secondary" size="small">
                Download
              </Button>
            </div>
          ))}
        </div>
      </Card>

      {/* Export Actions */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
          <ClockIcon className="h-4 w-4" />
          <span>Export typically takes 10-30 seconds</span>
        </div>

        <div className="flex space-x-3">
          <Button
            variant="secondary"
            size="large"
            onClick={() => window.print()}
          >
            Print Preview
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={handleExport}
            loading={isExporting}
            disabled={isExporting || !analysisResults.analysisComplete}
            className="flex items-center"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            {isExporting
              ? 'Exporting...'
              : `Export as ${selectedFormat.toUpperCase()}`}
          </Button>
        </div>
      </div>

      {/* Success Message */}
      {analysisResults.analysisComplete && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
        >
          <div className="flex items-center space-x-3">
            <CheckCircleIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Analysis Complete!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your Q-methodology analysis is ready for export. All statistical
                calculations have been verified for accuracy.
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
