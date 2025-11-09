/**
 * Phase 10 Day 27: Citation Lineage Visualization
 *
 * Visual representation of the complete provenance chain:
 * Paper → Gap → Question → Hypothesis → Theme → Statement → Factor → Insight
 */

'use client';

import React from 'react';
import { Card } from '../apple-ui/Card';
import { Badge } from '../apple-ui/Badge';
import {
  DocumentTextIcon,
  BeakerIcon,
  QuestionMarkCircleIcon,
  LightBulbIcon,
  SparklesIcon,
  ChartBarIcon,
  AcademicCapIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';
import { CitationNode } from '@/lib/api/services/repository-api.service';

interface CitationLineageProps {
  citationChain: CitationNode[];
  compact?: boolean;
}

const NODE_TYPE_ICONS: Record<string, any> = {
  paper: BeakerIcon,
  gap: AcademicCapIcon,
  question: QuestionMarkCircleIcon,
  hypothesis: LightBulbIcon,
  theme: SparklesIcon,
  statement: DocumentTextIcon,
  factor: ChartBarIcon,
  insight: LightBulbIcon,
};

const NODE_TYPE_COLORS: Record<string, string> = {
  paper: 'bg-blue-100 text-blue-700 border-blue-300',
  gap: 'bg-red-100 text-red-700 border-red-300',
  question: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  hypothesis: 'bg-purple-100 text-purple-700 border-purple-300',
  theme: 'bg-green-100 text-green-700 border-green-300',
  statement: 'bg-indigo-100 text-indigo-700 border-indigo-300',
  factor: 'bg-pink-100 text-pink-700 border-pink-300',
  insight: 'bg-orange-100 text-orange-700 border-orange-300',
};

export function CitationLineage({ citationChain, compact = false }: CitationLineageProps) {
  if (citationChain.length === 0) {
    return (
      <Card>
        <div className="p-4 text-center text-gray-500">
          No citation lineage available
        </div>
      </Card>
    );
  }

  if (compact) {
    // Compact horizontal view
    return (
      <div className="flex items-center gap-2 flex-wrap">
        {citationChain.map((node, index) => {
          const Icon = NODE_TYPE_ICONS[node.type] || DocumentTextIcon;
          const colorClass = NODE_TYPE_COLORS[node.type] || 'bg-gray-100 text-gray-700 border-gray-300';

          return (
            <React.Fragment key={node.id}>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${colorClass}`}>
                <Icon className="w-4 h-4" />
                <span className="text-xs font-medium capitalize">{node.type}</span>
              </div>
              {index < citationChain.length - 1 && (
                <ArrowRightIcon className="w-4 h-4 text-gray-400" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // Detailed vertical view
  return (
    <Card>
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Citation Lineage
        </h3>

        <div className="space-y-3">
          {citationChain.map((node, index) => {
            const Icon = NODE_TYPE_ICONS[node.type] || DocumentTextIcon;
            const colorClass = NODE_TYPE_COLORS[node.type] || 'bg-gray-100 text-gray-700 border-gray-300';

            return (
              <div key={node.id} className="relative">
                {/* Connection line */}
                {index < citationChain.length - 1 && (
                  <div className="absolute left-6 top-full w-0.5 h-3 bg-gray-300" />
                )}

                {/* Node */}
                <div className={`flex items-start gap-3 p-3 rounded-lg border ${colorClass}`}>
                  <div className="flex-shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs capitalize">
                        {node.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        Step {index + 1} of {citationChain.length}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 break-words">
                      {node.title}
                    </p>

                    {/* Metadata */}
                    {node.metadata && Object.keys(node.metadata).length > 0 && (
                      <div className="mt-2 space-y-1">
                        {Object.entries(node.metadata).map(([key, value]) => {
                          // Format specific metadata fields
                          if (key === 'authors' && Array.isArray(value)) {
                            return (
                              <div key={key} className="text-xs text-gray-600">
                                <span className="font-medium">Authors:</span> {value.slice(0, 3).join(', ')}
                                {value.length > 3 && ` +${value.length - 3} more`}
                              </div>
                            );
                          }
                          if (key === 'year' || key === 'doi') {
                            return (
                              <div key={key} className="text-xs text-gray-600">
                                <span className="font-medium capitalize">{key}:</span> {value}
                              </div>
                            );
                          }
                          if (key === 'variance' || key === 'relevanceScore') {
                            return (
                              <div key={key} className="text-xs text-gray-600">
                                <span className="font-medium capitalize">{key}:</span> {(value * 100).toFixed(1)}%
                              </div>
                            );
                          }
                          if (key === 'eigenvalue' || key === 'confidence') {
                            return (
                              <div key={key} className="text-xs text-gray-600">
                                <span className="font-medium capitalize">{key}:</span> {Number(value).toFixed(2)}
                              </div>
                            );
                          }
                          if (key === 'keywords' && Array.isArray(value)) {
                            return (
                              <div key={key} className="text-xs text-gray-600">
                                <span className="font-medium">Keywords:</span> {value.slice(0, 5).join(', ')}
                              </div>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Complete Lineage:</span> This insight traces back through {citationChain.length} research artifacts,
            ensuring full transparency and reproducibility.
          </div>
        </div>
      </div>
    </Card>
  );
}
