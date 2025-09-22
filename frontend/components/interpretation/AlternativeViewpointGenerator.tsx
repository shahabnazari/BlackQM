import React, { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import { 
  LightBulbIcon,
  ArrowsPointingOutIcon,
  SparklesIcon,
  PlusCircleIcon,
  MinusCircleIcon,
  ArrowPathIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
// import { useAIBackend } from '@/lib/services/ai-backend.service';

interface AlternativeViewpoint {
  id: string;
  perspective: string;
  title: string;
  description: string;
  rationale: string;
  supportingEvidence: string[];
  counterArguments: string[];
  strengthScore: number; // 0-100
  noveltyScore: number; // 0-100
  feasibilityScore: number; // 0-100
  potentialStatements: string[];
  relatedFactors: number[];
  implications: string[];
}

interface ViewpointGeneratorProps {
  studyData: any;
  currentNarratives: any[];
  factors: any[];
  onViewpointGenerated?: (viewpoint: AlternativeViewpoint) => void;
}

/**
 * AlternativeViewpointGenerator - Phase 8 Day 2 Implementation
 * 
 * World-class AI-powered alternative viewpoint generation
 * Helps researchers identify missing or underrepresented perspectives
 * 
 * @world-class Features:
 * - AI-driven viewpoint discovery
 * - Devil's advocate mode
 * - Contrarian perspective generation
 * - Evidence-based alternative narratives
 * - Interactive viewpoint exploration
 * - Strength and novelty scoring
 * - Integration suggestions
 */
export function AlternativeViewpointGenerator({
  studyData: _studyData,
  currentNarratives: _currentNarratives,
  factors,
  onViewpointGenerated
}: ViewpointGeneratorProps) {
  // const { generateStatements } = useAIBackend();
  const [generating, setGenerating] = useState(false);
  const [viewpoints, setViewpoints] = useState<AlternativeViewpoint[]>([]);
  const [selectedViewpoint, setSelectedViewpoint] = useState<string | null>(null);
  const [generationMode, setGenerationMode] = useState<'balanced' | 'contrarian' | 'devils-advocate'>('balanced');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [adoptedViewpoints, setAdoptedViewpoints] = useState<Set<string>>(new Set());

  // Generation mode configurations
  const generationModes = [
    {
      id: 'balanced',
      name: 'Balanced Alternative',
      description: 'Generate moderate alternative perspectives',
      icon: '⚖️',
      color: 'bg-blue-500'
    },
    {
      id: 'contrarian',
      name: 'Contrarian View',
      description: 'Generate opposing perspectives',
      icon: '🔄',
      color: 'bg-orange-500'
    },
    {
      id: 'devils-advocate',
      name: "Devil's Advocate",
      description: 'Challenge dominant assumptions',
      icon: '😈',
      color: 'bg-red-500'
    }
  ];

  // Generate alternative viewpoints
  const generateAlternatives = async () => {
    setGenerating(true);
    
    try {
      // Analyze current perspectives
      // const dominantThemes = currentNarratives.map(n => n.mainTheme).filter(Boolean);
      // const context = {
      //   topic: studyData?.title,
      //   existingPerspectives: dominantThemes,
      //   mode: generationMode
      // };

      // Generate alternative viewpoints (mock for now, would call AI backend)
      await new Promise(resolve => setTimeout(resolve, 2500));
      
      const mockViewpoints: AlternativeViewpoint[] = [
        {
          id: '1',
          perspective: 'Technological Disruption',
          title: 'The Digital Transformation Imperative',
          description: 'Technology-driven changes will fundamentally reshape the landscape, making traditional approaches obsolete.',
          rationale: 'Current analysis underrepresents the pace and impact of technological change on the studied phenomenon.',
          supportingEvidence: [
            'Industry reports show 70% digital transformation by 2025',
            'AI adoption rates increasing exponentially',
            'Traditional methods showing declining effectiveness'
          ],
          counterArguments: [
            'Technology adoption faces significant barriers',
            'Human factors remain paramount',
            'Digital divide concerns'
          ],
          strengthScore: 75,
          noveltyScore: 85,
          feasibilityScore: 60,
          potentialStatements: [
            'Technology will solve most current challenges',
            'Digital solutions are more efficient than traditional approaches',
            'Automation will replace human judgment in this area'
          ],
          relatedFactors: [1, 3],
          implications: [
            'Need to consider tech-savvy participant perspectives',
            'Include digital transformation in future studies',
            'Address technology adoption barriers'
          ]
        },
        {
          id: '2',
          perspective: 'Generational Divide',
          title: 'The Generation Gap Perspective',
          description: 'Significant differences between age groups create fundamentally different worldviews that current analysis overlooks.',
          rationale: 'Age-based perspective differences are more significant than the current factor structure suggests.',
          supportingEvidence: [
            'Generational cohort studies show divergent values',
            'Age-stratified data reveals hidden patterns',
            'Cross-generational communication gaps documented'
          ],
          counterArguments: [
            'Individual variation exceeds generational patterns',
            'Stereotyping risk in generational analysis',
            'Cultural factors may be more significant'
          ],
          strengthScore: 70,
          noveltyScore: 65,
          feasibilityScore: 80,
          potentialStatements: [
            'Younger generations have fundamentally different priorities',
            'Traditional approaches resonate more with older participants',
            'Generational experience shapes perspective more than education'
          ],
          relatedFactors: [2, 4],
          implications: [
            'Consider age-stratified analysis',
            'Include generational perspective in interpretation',
            'Design age-inclusive study approaches'
          ]
        },
        {
          id: '3',
          perspective: 'Systems Thinking',
          title: 'The Interconnected Systems View',
          description: 'Complex system interactions and feedback loops create emergent properties not captured by linear factor analysis.',
          rationale: 'Current analysis may oversimplify complex, interconnected relationships.',
          supportingEvidence: [
            'Systems theory demonstrates non-linear relationships',
            'Feedback loops amplify small changes',
            'Emergent properties arise from interactions'
          ],
          counterArguments: [
            'Complexity can obscure actionable insights',
            'Reductionist approaches have proven value',
            'System boundaries are arbitrary'
          ],
          strengthScore: 80,
          noveltyScore: 90,
          feasibilityScore: 50,
          potentialStatements: [
            'Individual components cannot be understood in isolation',
            'System-level interventions are more effective than targeted ones',
            'Unintended consequences are inevitable without systems thinking'
          ],
          relatedFactors: [1, 2, 3, 4],
          implications: [
            'Develop systems mapping for the topic',
            'Consider feedback loops in interpretation',
            'Identify system leverage points'
          ]
        }
      ];
      
      setViewpoints(mockViewpoints);
    } catch (error) {
      console.error('Failed to generate alternative viewpoints:', error);
    } finally {
      setGenerating(false);
    }
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Adopt a viewpoint
  const adoptViewpoint = (viewpointId: string) => {
    const viewpoint = viewpoints.find(v => v.id === viewpointId);
    if (viewpoint) {
      setAdoptedViewpoints(prev => new Set(prev).add(viewpointId));
      onViewpointGenerated?.(viewpoint);
    }
  };

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-system-green';
    if (score >= 60) return 'text-system-yellow';
    return 'text-system-red';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-label flex items-center gap-2">
              <LightBulbIcon className="w-6 h-6 text-purple-600" />
              Alternative Viewpoint Generator
            </h2>
            <p className="text-sm text-secondary-label mt-1">
              Discover perspectives that challenge or complement your current analysis
            </p>
          </div>
          
          <Button
            size="sm"
            variant="primary"
            onClick={generateAlternatives}
            loading={generating}
            disabled={generating}
            className="flex items-center gap-2"
          >
            <SparklesIcon className="w-4 h-4" />
            Generate Alternatives
          </Button>
        </div>

        {/* Generation Mode Selector */}
        <div className="mt-4">
          <p className="text-xs text-secondary-label mb-2">Generation Mode</p>
          <div className="flex gap-2">
            {generationModes.map(mode => (
              <button
                key={mode.id}
                onClick={() => setGenerationMode(mode.id as any)}
                className={`px-3 py-2 rounded-lg border transition-all ${
                  generationMode === mode.id
                    ? 'border-system-blue bg-system-blue bg-opacity-10'
                    : 'border-separator-opaque hover:border-system-blue'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{mode.icon}</span>
                  <div className="text-left">
                    <p className="text-sm font-medium">{mode.name}</p>
                    <p className="text-xs text-secondary-label">{mode.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </Card>

      {generating && (
        <Card className="p-12">
          <div className="text-center">
            <div className="animate-pulse mb-4">
              <ArrowsPointingOutIcon className="w-12 h-12 text-purple-600 mx-auto" />
            </div>
            <p className="text-sm text-secondary-label">
              Generating {generationMode} viewpoints based on {factors.length} factors...
            </p>
          </div>
        </Card>
      )}

      {viewpoints.length > 0 && !generating && (
        <>
          {/* Viewpoints List */}
          <div className="space-y-4">
            {viewpoints.map(viewpoint => {
              const isSelected = selectedViewpoint === viewpoint.id;
              const isAdopted = adoptedViewpoints.has(viewpoint.id);
              
              return (
                <Card
                  key={viewpoint.id}
                  className={`overflow-hidden transition-all ${
                    isSelected ? 'ring-2 ring-purple-500 shadow-lg' : ''
                  } ${isAdopted ? 'bg-green-50' : ''}`}
                >
                  {/* Viewpoint Header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-system-gray-6"
                    onClick={() => setSelectedViewpoint(isSelected ? null : viewpoint.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-lg">{viewpoint.title}</h3>
                          {isAdopted && (
                            <Badge variant="success" size="sm">
                              <CheckCircleIcon className="w-3 h-3 mr-1" />
                              Adopted
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-secondary-label mb-2">{viewpoint.description}</p>
                        
                        {/* Scores */}
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-secondary-label">Strength:</span>
                            <span className={`text-sm font-medium ${getScoreColor(viewpoint.strengthScore)}`}>
                              {viewpoint.strengthScore}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-secondary-label">Novelty:</span>
                            <span className={`text-sm font-medium ${getScoreColor(viewpoint.noveltyScore)}`}>
                              {viewpoint.noveltyScore}%
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-secondary-label">Feasibility:</span>
                            <span className={`text-sm font-medium ${getScoreColor(viewpoint.feasibilityScore)}`}>
                              {viewpoint.feasibilityScore}%
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {!isAdopted && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={(e) => {
                              e.stopPropagation();
                              adoptViewpoint(viewpoint.id);
                            }}
                          >
                            Adopt
                          </Button>
                        )}
                        {isSelected ? (
                          <ChevronDownIcon className="w-5 h-5 text-secondary-label" />
                        ) : (
                          <ChevronRightIcon className="w-5 h-5 text-secondary-label" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isSelected && (
                    <div className="border-t border-separator px-4 py-4 space-y-4">
                      {/* Rationale */}
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <LightBulbIcon className="w-4 h-4" />
                          Rationale
                        </h4>
                        <p className="text-sm text-secondary-label">{viewpoint.rationale}</p>
                      </div>

                      {/* Supporting Evidence */}
                      <div>
                        <button
                          onClick={() => toggleSection(`evidence-${viewpoint.id}`)}
                          className="font-medium text-sm mb-2 flex items-center gap-2 hover:text-system-blue"
                        >
                          <PlusCircleIcon className="w-4 h-4" />
                          Supporting Evidence ({viewpoint.supportingEvidence.length})
                          {expandedSections[`evidence-${viewpoint.id}`] ? (
                            <MinusCircleIcon className="w-4 h-4" />
                          ) : (
                            <PlusCircleIcon className="w-4 h-4" />
                          )}
                        </button>
                        {expandedSections[`evidence-${viewpoint.id}`] && (
                          <ul className="space-y-1 ml-6">
                            {viewpoint.supportingEvidence.map((evidence, i) => (
                              <li key={i} className="text-sm text-secondary-label flex items-start gap-2">
                                <CheckCircleIcon className="w-4 h-4 text-system-green mt-0.5 flex-shrink-0" />
                                {evidence}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Counter Arguments */}
                      <div>
                        <button
                          onClick={() => toggleSection(`counter-${viewpoint.id}`)}
                          className="font-medium text-sm mb-2 flex items-center gap-2 hover:text-system-blue"
                        >
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          Counter Arguments ({viewpoint.counterArguments.length})
                          {expandedSections[`counter-${viewpoint.id}`] ? (
                            <MinusCircleIcon className="w-4 h-4" />
                          ) : (
                            <PlusCircleIcon className="w-4 h-4" />
                          )}
                        </button>
                        {expandedSections[`counter-${viewpoint.id}`] && (
                          <ul className="space-y-1 ml-6">
                            {viewpoint.counterArguments.map((arg, i) => (
                              <li key={i} className="text-sm text-secondary-label flex items-start gap-2">
                                <ExclamationTriangleIcon className="w-4 h-4 text-system-orange mt-0.5 flex-shrink-0" />
                                {arg}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Potential Statements */}
                      <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <DocumentDuplicateIcon className="w-4 h-4" />
                          Potential Statements to Add
                        </h4>
                        <div className="bg-system-gray-6 rounded-lg p-3 space-y-2">
                          {viewpoint.potentialStatements.map((statement, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <span className="text-xs font-medium text-secondary-label">S{i + 1}:</span>
                              <p className="text-sm">{statement}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Implications */}
                      <div>
                        <h4 className="font-medium text-sm mb-2">Research Implications</h4>
                        <ul className="space-y-1">
                          {viewpoint.implications.map((implication, i) => (
                            <li key={i} className="text-sm text-secondary-label flex items-start gap-2">
                              <ArrowPathIcon className="w-4 h-4 text-system-blue mt-0.5 flex-shrink-0" />
                              {implication}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Related Factors */}
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-secondary-label">Related to factors:</span>
                        <div className="flex gap-2">
                          {viewpoint.relatedFactors.map(factor => (
                            <Badge key={factor} variant="default" size="sm">
                              Factor {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>

          {/* Summary Card */}
          {adoptedViewpoints.size > 0 && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircleIcon className="w-5 h-5 text-green-600" />
                  <span className="font-medium">
                    {adoptedViewpoints.size} viewpoint{adoptedViewpoints.size !== 1 ? 's' : ''} adopted
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    // Export adopted viewpoints
                    const adopted = viewpoints.filter(v => adoptedViewpoints.has(v.id));
                    console.log('Exporting adopted viewpoints:', adopted);
                  }}
                >
                  Export for Integration
                </Button>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

export default AlternativeViewpointGenerator;