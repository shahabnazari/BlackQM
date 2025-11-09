/**
 * Phase 10 Day 27: Insight Card Component
 *
 * Rich metadata display for research insights with:
 * - Citation lineage
 * - Keywords and tags
 * - Provenance information
 * - View/citation counts
 * - Expandable details
 */

'use client';

import React, { useState } from 'react';
import { Card } from '../apple-ui/Card';
import { Badge } from '../apple-ui/Badge';
import { Button } from '../apple-ui/Button';
import {
  DocumentTextIcon,
  BeakerIcon,
  ChatBubbleBottomCenterTextIcon,
  AcademicCapIcon,
  LightBulbIcon,
  ChartBarIcon,
  TagIcon,
  EyeIcon,
  ChatBubbleLeftIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ShareIcon,
} from '@heroicons/react/24/outline';
import { ResearchInsight } from '@/lib/api/services/repository-api.service';

interface InsightCardProps {
  insight: ResearchInsight;
  onViewDetails?: (insightId: string) => void;
  onAnnotate?: (insightId: string) => void;
  onShare?: (insight: ResearchInsight) => void;
  compact?: boolean;
}

// Icon mapping for insight types
const INSIGHT_TYPE_ICONS: Record<string, any> = {
  statement: DocumentTextIcon,
  factor: ChartBarIcon,
  theme: LightBulbIcon,
  gap: AcademicCapIcon,
  quote: ChatBubbleLeftIcon,
  paper_finding: BeakerIcon,
  hypothesis: ChatBubbleBottomCenterTextIcon,
};

// Color mapping for insight types
const INSIGHT_TYPE_COLORS: Record<string, string> = {
  statement: 'bg-blue-50 text-blue-700',
  factor: 'bg-purple-50 text-purple-700',
  theme: 'bg-yellow-50 text-yellow-700',
  gap: 'bg-red-50 text-red-700',
  quote: 'bg-green-50 text-green-700',
  paper_finding: 'bg-indigo-50 text-indigo-700',
  hypothesis: 'bg-pink-50 text-pink-700',
};

export function InsightCard({ insight, onViewDetails, onAnnotate, onShare, compact = false }: InsightCardProps) {
  const [expanded, setExpanded] = useState(false);

  const TypeIcon = INSIGHT_TYPE_ICONS[insight.type] || DocumentTextIcon;
  const typeColor = INSIGHT_TYPE_COLORS[insight.type] || 'bg-gray-50 text-gray-700';

  // Format type label
  const typeLabel = insight.type.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Calculate confidence badge color
  const confidenceBadge = insight.provenance.confidence >= 0.9
    ? { variant: 'default' as const, label: 'High Confidence' }
    : insight.provenance.confidence >= 0.7
    ? { variant: 'secondary' as const, label: 'Medium Confidence' }
    : { variant: 'destructive' as const, label: 'Low Confidence' };

  // Truncate content for compact view
  const displayContent = compact && !expanded && insight.content.length > 200
    ? `${insight.content.substring(0, 200)}...`
    : insight.content;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${typeColor}`}>
              <TypeIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-gray-900">{insight.title}</h3>
                {insight.version > 1 && (
                  <Badge variant="secondary">v{insight.version}</Badge>
                )}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary">{typeLabel}</Badge>
                <Badge variant={confidenceBadge.variant}>
                  {confidenceBadge.label}
                </Badge>
                {insight.isPublic && (
                  <Badge variant="default">Public</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <EyeIcon className="w-4 h-4" />
              <span>{insight.viewCount}</span>
            </div>
            <div className="flex items-center gap-1">
              <ChatBubbleLeftIcon className="w-4 h-4" />
              <span>{insight.citationCount}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-3">
          <p className="text-gray-700 leading-relaxed">{displayContent}</p>
          {compact && insight.content.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-blue-600 hover:text-blue-800 text-sm mt-2 flex items-center gap-1"
            >
              {expanded ? (
                <>
                  <ChevronUpIcon className="w-4 h-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDownIcon className="w-4 h-4" />
                  Show more
                </>
              )}
            </button>
          )}
        </div>

        {/* Keywords */}
        {insight.keywords.length > 0 && (
          <div className="mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <TagIcon className="w-4 h-4 text-gray-500" />
              {insight.keywords.slice(0, 5).map((keyword, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {insight.keywords.length > 5 && (
                <span className="text-xs text-gray-500">+{insight.keywords.length - 5} more</span>
              )}
            </div>
          </div>
        )}

        {/* Citation Chain Summary */}
        {insight.citationChain.length > 0 && (
          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Citation Lineage:</div>
            <div className="flex items-center gap-1 flex-wrap text-xs">
              {insight.citationChain.map((node, index) => (
                <React.Fragment key={node.id}>
                  <Badge variant="secondary" className="text-xs">
                    {node.type}
                  </Badge>
                  {index < insight.citationChain.length - 1 && (
                    <span className="text-gray-400">→</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Provenance */}
        {!compact && (
          <div className="mb-3 text-xs text-gray-500 space-y-1">
            <div>
              <span className="font-medium">Extraction Method:</span> {insight.provenance.extractionMethod}
            </div>
            <div>
              <span className="font-medium">Confidence:</span> {(insight.provenance.confidence * 100).toFixed(0)}%
            </div>
            <div>
              <span className="font-medium">Generated:</span> {new Date(insight.provenance.generatedAt).toLocaleDateString()}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
          {onViewDetails && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onViewDetails(insight.id)}
            >
              View Details
            </Button>
          )}
          {onAnnotate && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onAnnotate(insight.id)}
            >
              <ChatBubbleBottomCenterTextIcon className="w-4 h-4 mr-1" />
              Annotate
            </Button>
          )}
          {onShare && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onShare(insight)}
            >
              <ShareIcon className="w-4 h-4 mr-1" />
              Share
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
