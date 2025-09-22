import React, { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import { 
  BeakerIcon,
  ArrowsRightLeftIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import type { FactorNarrative, Theme } from '@/lib/stores/interpretation.store';

interface CrossFactorSynthesisPanelProps {
  narratives: FactorNarrative[];
  themes: Theme[];
  factors: any[];
}

/**
 * CrossFactorSynthesisPanel Component - Phase 8 Day 1
 * 
 * Synthesizes insights across all factors
 * Creates overarching narrative and recommendations
 */
export function CrossFactorSynthesisPanel({
  narratives,
  themes,
  factors
}: CrossFactorSynthesisPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['themes']));
  const [generating, setGenerating] = useState(false);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const handleGenerateSynthesis = async () => {
    setGenerating(true);
    // TODO: Call synthesis generation API
    setTimeout(() => setGenerating(false), 2000);
  };

  // Find common themes across factors
  const commonThemes = themes.filter(theme => theme.factors.length >= Math.ceil(factors.length / 2));
  const uniqueThemes = themes.filter(theme => theme.factors.length === 1);

  return (
    <Card className="p-6 bg-white">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-label flex items-center gap-2">
            <BeakerIcon className="w-6 h-6 text-purple-500" />
            Cross-Factor Synthesis
          </h2>
          <p className="text-sm text-secondary-label mt-1">
            Integrate findings across all factors to create a comprehensive understanding
          </p>
        </div>
        
        <Button
          size="sm"
          variant="primary"
          onClick={handleGenerateSynthesis}
          loading={generating}
          className="flex items-center gap-2"
        >
          <SparklesIcon className="w-4 h-4" />
          Generate Synthesis
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card className="p-3 bg-system-purple/5 border border-system-purple/20">
          <p className="text-xs text-secondary-label mb-1">Factors</p>
          <p className="text-lg font-semibold text-system-purple">{factors.length}</p>
        </Card>
        <Card className="p-3 bg-system-blue/5 border border-system-blue/20">
          <p className="text-xs text-secondary-label mb-1">Narratives</p>
          <p className="text-lg font-semibold text-system-blue">{narratives.length}</p>
        </Card>
        <Card className="p-3 bg-system-green/5 border border-system-green/20">
          <p className="text-xs text-secondary-label mb-1">Common Themes</p>
          <p className="text-lg font-semibold text-system-green">{commonThemes.length}</p>
        </Card>
        <Card className="p-3 bg-system-orange/5 border border-system-orange/20">
          <p className="text-xs text-secondary-label mb-1">Unique Views</p>
          <p className="text-lg font-semibold text-system-orange">{uniqueThemes.length}</p>
        </Card>
      </div>

      {/* Synthesis Content */}
      <div className="space-y-4">
        {/* Common Themes Section */}
        <div className="border border-system-gray-4 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('themes')}
            className="w-full p-4 bg-system-gray-6 hover:bg-system-gray-5 transition-colors flex items-center justify-between"
          >
            <h3 className="font-medium text-label flex items-center gap-2">
              <ArrowsRightLeftIcon className="w-5 h-5 text-system-blue" />
              Common Themes Across Factors
            </h3>
            {expandedSections.has('themes') ? (
              <ChevronDownIcon className="w-5 h-5 text-secondary-label" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-secondary-label" />
            )}
          </button>
          
          {expandedSections.has('themes') && (
            <div className="p-4 space-y-3">
              {commonThemes.length === 0 ? (
                <p className="text-sm text-secondary-label">
                  No common themes identified yet. Extract themes first.
                </p>
              ) : (
                commonThemes.map((theme, index) => (
                  <Card key={index} className="p-3 bg-system-blue/5 border border-system-blue/10">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-label">{theme.name}</h4>
                      <Badge variant="info" size="sm">
                        {theme.factors.length}/{factors.length} factors
                      </Badge>
                    </div>
                    <p className="text-xs text-secondary-label mb-2">{theme.description}</p>
                    <div className="flex gap-1">
                      {theme.factors.map(f => (
                        <Badge key={f} variant="default" size="sm">F{f}</Badge>
                      ))}
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Divergent Views Section */}
        <div className="border border-system-gray-4 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('divergent')}
            className="w-full p-4 bg-system-gray-6 hover:bg-system-gray-5 transition-colors flex items-center justify-between"
          >
            <h3 className="font-medium text-label flex items-center gap-2">
              <DocumentDuplicateIcon className="w-5 h-5 text-system-orange" />
              Divergent Perspectives
            </h3>
            {expandedSections.has('divergent') ? (
              <ChevronDownIcon className="w-5 h-5 text-secondary-label" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-secondary-label" />
            )}
          </button>
          
          {expandedSections.has('divergent') && (
            <div className="p-4 space-y-3">
              {uniqueThemes.length === 0 ? (
                <p className="text-sm text-secondary-label">
                  No unique perspectives identified yet.
                </p>
              ) : (
                uniqueThemes.map((theme, index) => (
                  <Card key={index} className="p-3 bg-system-orange/5 border border-system-orange/10">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-sm text-label">{theme.name}</h4>
                      <Badge variant="warning" size="sm">
                        Unique to F{theme.factors[0]}
                      </Badge>
                    </div>
                    <p className="text-xs text-secondary-label">{theme.description}</p>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>

        {/* Overarching Narrative Section */}
        <div className="border border-system-gray-4 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('narrative')}
            className="w-full p-4 bg-system-gray-6 hover:bg-system-gray-5 transition-colors flex items-center justify-between"
          >
            <h3 className="font-medium text-label flex items-center gap-2">
              <DocumentDuplicateIcon className="w-5 h-5 text-system-purple" />
              Overarching Narrative
            </h3>
            {expandedSections.has('narrative') ? (
              <ChevronDownIcon className="w-5 h-5 text-secondary-label" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-secondary-label" />
            )}
          </button>
          
          {expandedSections.has('narrative') && (
            <div className="p-4">
              {narratives.length === 0 ? (
                <div className="text-center py-8">
                  <DocumentDuplicateIcon className="w-8 h-8 mx-auto text-system-gray-4 mb-3" />
                  <p className="text-sm text-secondary-label mb-3">
                    Generate factor narratives first to create an overarching synthesis
                  </p>
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={handleGenerateSynthesis}
                    loading={generating}
                  >
                    Generate Synthesis
                  </Button>
                </div>
              ) : (
                <div className="prose prose-sm max-w-none">
                  <p className="text-sm text-label">
                    This Q-methodology study reveals {factors.length} distinct perspectives on the topic. 
                    The analysis shows both areas of consensus and divergence among participants.
                  </p>
                  
                  {commonThemes.length > 0 && (
                    <p className="text-sm text-label mt-3">
                      <strong>Common Ground:</strong> Despite different viewpoints, participants share 
                      {' '}{commonThemes.length} common themes, including {commonThemes.slice(0, 2).map(t => `"${t.name}"`).join(' and ')}.
                      These shared perspectives suggest fundamental agreement on core aspects of the issue.
                    </p>
                  )}
                  
                  {uniqueThemes.length > 0 && (
                    <p className="text-sm text-label mt-3">
                      <strong>Unique Perspectives:</strong> Each factor also presents unique viewpoints, 
                      with {uniqueThemes.length} themes appearing in only single factors. This diversity 
                      highlights the complexity and multifaceted nature of the topic.
                    </p>
                  )}
                  
                  <p className="text-sm text-label mt-3">
                    <strong>Implications:</strong> The synthesis of these findings suggests that effective 
                    approaches to this topic should acknowledge both the shared values and the legitimate 
                    differences in perspective among stakeholders.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recommendations Section */}
        <div className="border border-system-gray-4 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('recommendations')}
            className="w-full p-4 bg-system-gray-6 hover:bg-system-gray-5 transition-colors flex items-center justify-between"
          >
            <h3 className="font-medium text-label flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-system-green" />
              Key Recommendations
            </h3>
            {expandedSections.has('recommendations') ? (
              <ChevronDownIcon className="w-5 h-5 text-secondary-label" />
            ) : (
              <ChevronRightIcon className="w-5 h-5 text-secondary-label" />
            )}
          </button>
          
          {expandedSections.has('recommendations') && (
            <div className="p-4">
              <div className="space-y-3">
                <Card className="p-3 bg-system-green/5 border border-system-green/10">
                  <h4 className="text-sm font-medium text-label mb-1">For Researchers</h4>
                  <ul className="text-xs text-secondary-label space-y-1">
                    <li>• Further explore the divergent themes through follow-up interviews</li>
                    <li>• Validate common themes with a larger sample</li>
                    <li>• Consider longitudinal study to track perspective changes</li>
                  </ul>
                </Card>
                
                <Card className="p-3 bg-system-blue/5 border border-system-blue/10">
                  <h4 className="text-sm font-medium text-label mb-1">For Practitioners</h4>
                  <ul className="text-xs text-secondary-label space-y-1">
                    <li>• Design interventions that address common concerns</li>
                    <li>• Tailor approaches for different stakeholder groups</li>
                    <li>• Use consensus points as foundation for collaboration</li>
                  </ul>
                </Card>
                
                <Card className="p-3 bg-system-purple/5 border border-system-purple/10">
                  <h4 className="text-sm font-medium text-label mb-1">For Policy Makers</h4>
                  <ul className="text-xs text-secondary-label space-y-1">
                    <li>• Consider diverse perspectives in policy formulation</li>
                    <li>• Focus on areas of high consensus for initial action</li>
                    <li>• Engage different factor groups in consultation</li>
                  </ul>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}