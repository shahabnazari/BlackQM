'use client';

import React, { useState } from 'react';
import { GridConfigurationService, StandardGridConfig } from '@/lib/services/grid-configuration.service';
import { AppleUIGridBuilderV5 } from '@/components/grid/AppleUIGridBuilderV5';
import { AIGridDesignAssistant } from '@/components/grid/AIGridDesignAssistant';
import { CheckCircle, AlertCircle, Info, BookOpen } from 'lucide-react';

export default function TestScientificGrids() {
  const [selectedConfig, setSelectedConfig] = useState<StandardGridConfig | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const configs = GridConfigurationService.STANDARD_CONFIGS.map((config: any) => ({
    ...config,
    distribution: GridConfigurationService.getCorrectedDistribution(config)
  }));

  const validateConfig = (config: StandardGridConfig) => {
    const correctedDist = GridConfigurationService.getCorrectedDistribution(config);
    const validation = GridConfigurationService.validateDistribution(correctedDist, config.totalItems);
    return validation;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Scientifically-Backed Q-Sort Grid Configurations
          </h1>
          <p className="text-gray-600">
            Based on peer-reviewed Q-methodology research. Each configuration has been validated in published studies.
          </p>
        </div>

        {/* AI Assistant Button */}
        <div className="bg-blue-50 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Info className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900">
              Need help choosing the right configuration? Use our AI assistant for personalized recommendations.
            </span>
          </div>
          <button
            onClick={() => setShowAIAssistant(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Open AI Assistant
          </button>
        </div>

        {/* Standard Configurations */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Standard Configurations</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {configs.map((config: any) => {
              const validation = validateConfig(config);
              return (
                <div
                  key={config.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    selectedConfig?.id === config.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedConfig(config)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold">{config.name}</h3>
                    {validation.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                    )}
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>{config.description}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span>Range: {config.range.min} to {config.range.max}</span>
                      <span>Items: {config.totalItems}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <BookOpen className="w-3 h-3" />
                      <span className="text-xs">{config.citation}</span>
                    </div>
                  </div>

                  {/* Distribution Preview */}
                  <div className="mt-3 flex items-end gap-1 h-16">
                    {config.distribution.map((height: any, idx: any) => (
                      <div
                        key={idx}
                        className="flex-1 bg-blue-400 rounded-t"
                        style={{ height: `${(height / Math.max(...config.distribution)) * 100}%` }}
                      />
                    ))}
                  </div>

                  {/* Validation Score */}
                  <div className="mt-2">
                    <div className="text-xs text-gray-500">Validation Score</div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          validation.score >= 90 ? 'bg-green-500' :
                          validation.score >= 70 ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}
                        style={{ width: `${validation.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Issues if any */}
                  {!validation.isValid && validation.issues.length > 0 && (
                    <div className="mt-2 text-xs text-amber-600">
                      {validation.issues[0]}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Configuration Details */}
        {selectedConfig && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">
              {selectedConfig.name} - Detailed View
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Description</h3>
                  <p className="text-gray-600">{selectedConfig.description}</p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Recommended For</h3>
                  <ul className="list-disc list-inside text-gray-600">
                    {selectedConfig.recommendedFor.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">Time Estimate</h3>
                    <p className="text-gray-600">{selectedConfig.timeEstimate}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-700 mb-1">Expertise Level</h3>
                    <p className="text-gray-600 capitalize">{selectedConfig.expertiseLevel}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Distribution Pattern</h3>
                  <div className="flex items-center gap-2">
                    {selectedConfig.distribution.map((count, idx) => (
                      <div key={idx} className="text-center">
                        <div className="text-sm font-mono">{count}</div>
                        <div className="text-xs text-gray-500">
                          {selectedConfig.range.min + idx}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Scientific Rationale</h3>
                  <ul className="space-y-1">
                    {GridConfigurationService.getConfigurationRationale(selectedConfig).map((reason, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right: Visual Grid */}
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Grid Preview</h3>
                <div className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-center items-end gap-2">
                    {selectedConfig.distribution.map((height: any, idx: any) => {
                      const value = selectedConfig.range.min + idx;
                      return (
                        <div key={idx} className="flex flex-col items-center">
                          <div className="text-xs font-medium mb-1">
                            {value > 0 ? '+' : ''}{value}
                          </div>
                          <div className="flex flex-col gap-1">
                            {Array.from({ length: height }).map((_, cellIdx) => (
                              <div
                                key={cellIdx}
                                className="w-10 h-10 border-2 border-gray-300 rounded bg-white"
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Grid Builder */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Interactive Grid Builder</h2>
          <p className="text-gray-600 mb-4">
            Test the new scientifically-backed grid builder with optimal 36-item default configuration.
          </p>
          <AppleUIGridBuilderV5 
            studyId="test-scientific"
            onGridChange={(config) => console.log('Grid changed:', config)}
          />
        </div>

        {/* AI Assistant Modal */}
        {showAIAssistant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <AIGridDesignAssistant
              onRecommendation={(rec) => {
                console.log('AI Recommendation:', rec);
                setShowAIAssistant(false);
              }}
              onClose={() => setShowAIAssistant(false)}
            />
          </div>
        )}
      </div>
    </div>
  );
}