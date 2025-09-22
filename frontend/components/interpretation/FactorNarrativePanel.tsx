import React, { useState, useEffect } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import { 
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  SparklesIcon,
  DocumentTextIcon,
  ChartBarSquareIcon
} from '@heroicons/react/24/outline';
import type { FactorNarrative } from '@/lib/stores/interpretation.store';

interface FactorNarrativePanelProps {
  factor: any;
  factorNumber: number;
  narrative?: FactorNarrative;
  editMode: boolean;
  onEditToggle: () => void;
  onGenerate: () => void;
  generating: boolean;
}

/**
 * FactorNarrativePanel Component - Phase 8 Day 1
 * 
 * Interactive panel for viewing and editing factor narratives
 * Integrates AI-generated content with manual refinement
 */
export function FactorNarrativePanel({
  factor,
  factorNumber,
  narrative,
  editMode,
  onEditToggle,
  onGenerate,
  generating
}: FactorNarrativePanelProps) {
  const [editedNarrative, setEditedNarrative] = useState({
    title: narrative?.title || '',
    mainTheme: narrative?.mainTheme || '',
    narrative: narrative?.narrative || ''
  });

  useEffect(() => {
    if (narrative) {
      setEditedNarrative({
        title: narrative.title,
        mainTheme: narrative.mainTheme,
        narrative: narrative.narrative
      });
    }
  }, [narrative]);

  const handleSave = () => {
    // TODO: Save edited narrative to backend
    onEditToggle();
  };

  const handleCancel = () => {
    setEditedNarrative({
      title: narrative?.title || '',
      mainTheme: narrative?.mainTheme || '',
      narrative: narrative?.narrative || ''
    });
    onEditToggle();
  };

  return (
    <Card className="p-6 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-label flex items-center gap-2">
            <DocumentTextIcon className="w-6 h-6 text-orange-500" />
            Factor {factorNumber} Narrative
          </h2>
          {factor && (
            <div className="flex items-center gap-3 mt-2">
              <Badge variant="info">
                {factor.eigenvalue ? `Eigenvalue: ${factor.eigenvalue.toFixed(2)}` : 'No eigenvalue'}
              </Badge>
              <Badge variant="success">
                {factor.variance ? `Variance: ${factor.variance.toFixed(1)}%` : 'No variance'}
              </Badge>
              <Badge variant="default">
                {narrative?.participantCount || 0} Participants
              </Badge>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!narrative && !editMode && (
            <Button
              size="sm"
              variant="primary"
              onClick={onGenerate}
              loading={generating}
              className="flex items-center gap-2"
            >
              <SparklesIcon className="w-4 h-4" />
              Generate Narrative
            </Button>
          )}
          
          {narrative && !editMode && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onEditToggle}
              className="flex items-center gap-2"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </Button>
          )}
          
          {editMode && (
            <>
              <Button
                size="sm"
                variant="primary"
                onClick={handleSave}
                className="flex items-center gap-2"
              >
                <CheckIcon className="w-4 h-4" />
                Save
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCancel}
                className="flex items-center gap-2"
              >
                <XMarkIcon className="w-4 h-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {!narrative && !generating ? (
        <div className="text-center py-12">
          <DocumentTextIcon className="w-12 h-12 mx-auto text-system-gray-4 mb-4" />
          <p className="text-secondary-label mb-4">No narrative generated yet</p>
          <Button
            variant="primary"
            onClick={onGenerate}
            loading={generating}
            className="flex items-center gap-2 mx-auto"
          >
            <SparklesIcon className="w-4 h-4" />
            Generate AI Narrative
          </Button>
        </div>
      ) : generating ? (
        <div className="text-center py-12">
          <div className="animate-pulse">
            <SparklesIcon className="w-12 h-12 mx-auto text-system-blue mb-4" />
            <p className="text-secondary-label">Generating narrative...</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-secondary-label mb-2">
              Factor Title
            </label>
            {editMode ? (
              <input
                type="text"
                value={editedNarrative.title}
                onChange={(e) => setEditedNarrative({ ...editedNarrative, title: e.target.value })}
                className="w-full px-3 py-2 border border-system-gray-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-system-blue"
                placeholder="Enter a descriptive title for this factor..."
              />
            ) : (
              <h3 className="text-lg font-semibold text-label">
                {narrative?.title || 'Untitled Factor'}
              </h3>
            )}
          </div>

          {/* Main Theme */}
          <div>
            <label className="block text-sm font-medium text-secondary-label mb-2">
              Main Theme
            </label>
            {editMode ? (
              <input
                type="text"
                value={editedNarrative.mainTheme}
                onChange={(e) => setEditedNarrative({ ...editedNarrative, mainTheme: e.target.value })}
                className="w-full px-3 py-2 border border-system-gray-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-system-blue"
                placeholder="Describe the main theme of this factor..."
              />
            ) : (
              <p className="text-label">
                {narrative?.mainTheme || 'No theme identified'}
              </p>
            )}
          </div>

          {/* Narrative */}
          <div>
            <label className="block text-sm font-medium text-secondary-label mb-2">
              Narrative Description
            </label>
            {editMode ? (
              <textarea
                value={editedNarrative.narrative}
                onChange={(e) => setEditedNarrative({ ...editedNarrative, narrative: e.target.value })}
                className="w-full px-3 py-2 border border-system-gray-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-system-blue h-48 resize-none"
                placeholder="Write a comprehensive narrative for this factor..."
              />
            ) : (
              <div className="prose prose-sm max-w-none">
                <p className="text-label whitespace-pre-wrap">
                  {narrative?.narrative || 'No narrative available'}
                </p>
              </div>
            )}
          </div>

          {/* Distinguishing Statements */}
          {narrative?.distinguishingStatements && narrative.distinguishingStatements.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-secondary-label mb-3 flex items-center gap-2">
                <ChartBarSquareIcon className="w-4 h-4" />
                Distinguishing Statements
              </h4>
              <div className="space-y-2">
                {narrative.distinguishingStatements.map((statement, index) => (
                  <div key={index} className="p-3 bg-system-blue/5 rounded-lg border border-system-blue/10">
                    <p className="text-sm text-label">{statement}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Consensus Statements */}
          {narrative?.consensusStatements && narrative.consensusStatements.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-secondary-label mb-3 flex items-center gap-2">
                <CheckIcon className="w-4 h-4" />
                Consensus Statements
              </h4>
              <div className="space-y-2">
                {narrative.consensusStatements.map((statement, index) => (
                  <div key={index} className="p-3 bg-system-green/5 rounded-lg border border-system-green/10">
                    <p className="text-sm text-label">{statement}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Confidence Score */}
          {narrative?.confidence && (
            <div className="flex items-center justify-between p-4 bg-system-gray-6 rounded-lg">
              <span className="text-sm text-secondary-label">AI Confidence</span>
              <div className="flex items-center gap-2">
                <div className="w-32 h-2 bg-system-gray-5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-system-green transition-all duration-300"
                    style={{ width: `${narrative.confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{Math.round(narrative.confidence * 100)}%</span>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}