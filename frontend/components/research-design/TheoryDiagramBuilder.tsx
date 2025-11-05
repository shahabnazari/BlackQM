'use client';

import { useState } from 'react';
import {
  CubeTransparentIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import {
  researchDesignAPI,
  TheoryDiagram,
} from '@/lib/api/services/research-design-api.service';

/**
 * Phase 9.5 Day 3: Theory Diagram Builder
 *
 * Features:
 * - Visual construct relationship editor
 * - Generate theory diagram from themes
 * - Export diagram (SVG/PNG)
 * - Show construct definitions and sources
 */

interface TheoryDiagramBuilderProps {
  researchQuestion: string;
  themes?: any[];
  knowledgeGraphData?: any;
  onDiagramGenerated?: (diagram: TheoryDiagram) => void;
}

const RELATIONSHIP_TYPES = {
  causes: { label: 'Causes', color: 'text-red-600', arrow: '→' },
  influences: { label: 'Influences', color: 'text-blue-600', arrow: '⇢' },
  moderates: { label: 'Moderates', color: 'text-purple-600', arrow: '⊗' },
  mediates: { label: 'Mediates', color: 'text-green-600', arrow: '◇' },
  correlates: { label: 'Correlates', color: 'text-orange-600', arrow: '⇄' },
};

const STRENGTH_COLORS = {
  weak: 'border-gray-300 bg-gray-50',
  moderate: 'border-yellow-300 bg-yellow-50',
  strong: 'border-green-300 bg-green-50',
};

export default function TheoryDiagramBuilder({
  researchQuestion,
  themes = [],
  knowledgeGraphData,
  onDiagramGenerated,
}: TheoryDiagramBuilderProps) {
  const [diagram, setDiagram] = useState<TheoryDiagram | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedConstruct, setSelectedConstruct] = useState<string | null>(
    null
  );

  const handleGenerateDiagram = async () => {
    if (!researchQuestion.trim()) {
      setError('Please provide a research question first');
      return;
    }

    if (themes.length === 0) {
      setError('Please extract themes from literature first');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await researchDesignAPI.buildTheoryDiagram({
        researchQuestion,
        themes,
        knowledgeGraphData,
      });

      setDiagram(result);
      if (onDiagramGenerated) {
        onDiagramGenerated(result);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to generate theory diagram');
      console.error('Theory diagram generation error:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportDiagram = () => {
    // TODO: Implement SVG/PNG export
    alert('Export feature coming soon!');
  };

  const getConstructById = (id: string) => {
    return diagram?.constructs.find(c => c.id === id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <CubeTransparentIcon className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Theory Framework Builder
            </h2>
            <p className="text-sm text-gray-600">
              Conceptual framework from themes
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {diagram && (
            <button
              onClick={handleExportDiagram}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span>Export</span>
            </button>
          )}
          <button
            onClick={handleGenerateDiagram}
            disabled={isGenerating || !researchQuestion || themes.length === 0}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isGenerating ? (
              <>
                <ArrowPathIcon className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <SparklesIcon className="w-4 h-4" />
                <span>Generate Diagram</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Theory Diagram Visualization */}
      {diagram && (
        <div className="space-y-6">
          {/* Visual Diagram */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-8">
            <div className="bg-white rounded-lg p-6 min-h-[400px]">
              {/* Simplified Visual Representation */}
              <div className="space-y-8">
                {/* Constructs */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {diagram.constructs.map(construct => (
                    <button
                      key={construct.id}
                      onClick={() =>
                        setSelectedConstruct(
                          construct.id === selectedConstruct
                            ? null
                            : construct.id
                        )
                      }
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedConstruct === construct.id
                          ? 'border-purple-500 bg-purple-50 shadow-lg'
                          : 'border-gray-300 bg-white hover:border-purple-300 hover:shadow-md'
                      }`}
                    >
                      <div className="text-sm font-bold text-gray-900 mb-1">
                        {construct.name}
                      </div>
                      <div className="text-xs text-gray-600 line-clamp-2">
                        {construct.definition}
                      </div>
                      <div className="text-xs text-purple-600 mt-2">
                        {construct.sources.length} sources
                      </div>
                    </button>
                  ))}
                </div>

                {/* Relationships */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-4">
                    Relationships
                  </h3>
                  <div className="space-y-3">
                    {diagram.relationships.map((rel, idx) => {
                      const fromConstruct = getConstructById(rel.from);
                      const toConstruct = getConstructById(rel.to);
                      const relType = RELATIONSHIP_TYPES[rel.type];

                      return (
                        <div
                          key={idx}
                          className={`flex items-center space-x-3 p-3 rounded-lg border ${STRENGTH_COLORS[rel.strength]}`}
                        >
                          <div className="flex-1 flex items-center space-x-3">
                            <div className="px-3 py-1 bg-white rounded border border-gray-300">
                              <span className="text-sm font-medium text-gray-900">
                                {fromConstruct?.name}
                              </span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span
                                className={`text-xs font-medium ${relType.color}`}
                              >
                                {relType.label}
                              </span>
                              <span className="text-2xl">{relType.arrow}</span>
                            </div>
                            <div className="px-3 py-1 bg-white rounded border border-gray-300">
                              <span className="text-sm font-medium text-gray-900">
                                {toConstruct?.name}
                              </span>
                            </div>
                          </div>
                          <div className="text-xs text-gray-600">
                            {rel.strength} ({rel.evidence.length} papers)
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Construct Details */}
          {selectedConstruct && (
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              {(() => {
                const construct = getConstructById(selectedConstruct);
                if (!construct) return null;

                return (
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      {construct.name}
                    </h3>
                    <p className="text-sm text-gray-700 mb-4">
                      {construct.definition}
                    </p>
                    <div>
                      <p className="text-sm font-medium text-gray-900 mb-2">
                        Evidence from {construct.sources.length} sources:
                      </p>
                      <div className="space-y-1">
                        {construct.sources.slice(0, 5).map((source, idx) => (
                          <div key={idx} className="text-xs text-gray-600">
                            • {source}
                          </div>
                        ))}
                        {construct.sources.length > 5 && (
                          <div className="text-xs text-gray-500 italic">
                            ... and {construct.sources.length - 5} more sources
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Legend */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">
              Relationship Types
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {Object.entries(RELATIONSHIP_TYPES).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <span className="text-xl">{value.arrow}</span>
                  <span className={`text-xs font-medium ${value.color}`}>
                    {value.label}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-300">
              <div className="grid grid-cols-3 gap-3">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-gray-50 border-2 border-gray-300" />
                  <span className="text-xs text-gray-600">Weak</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-yellow-50 border-2 border-yellow-300" />
                  <span className="text-xs text-gray-600">Moderate</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 rounded bg-green-50 border-2 border-green-300" />
                  <span className="text-xs text-gray-600">Strong</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!diagram && !isGenerating && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <CubeTransparentIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Theory Diagram Yet
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Click "Generate Diagram" to build a conceptual framework from your
            themes
          </p>
          <p className="text-xs text-gray-500">
            We'll identify constructs and their relationships based on your
            literature review
          </p>
        </div>
      )}
    </div>
  );
}
