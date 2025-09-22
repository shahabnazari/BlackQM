import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import { Alert } from '@/components/ui/alert';
import { 
  BeakerIcon,
  ArrowPathRoundedSquareIcon,
  DocumentTextIcon,
  ChartPieIcon,
  SparklesIcon,
  BookOpenIcon,
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  PresentationChartLineIcon,
  DocumentDuplicateIcon
} from '@heroicons/react/24/outline';
import * as d3 from 'd3';

interface SynthesisTheme {
  id: string;
  name: string;
  description: string;
  prevalence: number;
  factors: number[];
  strength: 'dominant' | 'moderate' | 'emerging';
  evidence: string[];
  implications: string[];
}

interface FactorRelationship {
  factor1: number;
  factor2: number;
  similarity: number;
  sharedThemes: string[];
  divergentThemes: string[];
  relationshipType: 'aligned' | 'complementary' | 'opposing' | 'independent';
}

interface NarrativeStructure {
  introduction: string;
  mainFindings: {
    finding: string;
    evidence: string[];
    factors: number[];
  }[];
  crossCuttingThemes: {
    theme: string;
    description: string;
    significance: string;
  }[];
  tensions: {
    description: string;
    factors: number[];
    implications: string;
  }[];
  conclusion: string;
  recommendations: string[];
}

interface SynthesisMetrics {
  coherence: number;
  coverage: number;
  depth: number;
  clarity: number;
  actionability: number;
}

interface CrossFactorSynthesisToolProps {
  narratives: any[];
  themes: any[];
  factors: any[];
  studyData: any;
  onSynthesisComplete?: (synthesis: any) => void;
}

/**
 * CrossFactorSynthesisTool Component - Phase 8 Day 3
 * 
 * World-class synthesis capabilities:
 * - Multi-dimensional theme integration
 * - Factor relationship mapping
 * - Unified narrative generation
 * - Interactive synthesis visualization
 * - Export-ready reports
 */
export function CrossFactorSynthesisTool({
  narratives,
  themes,
  factors,
  studyData: _studyData,
  onSynthesisComplete
}: CrossFactorSynthesisToolProps) {
  const [synthesisThemes, setSynthesisThemes] = useState<SynthesisTheme[]>([]);
  const [factorRelationships, setFactorRelationships] = useState<FactorRelationship[]>([]);
  const [narrativeStructure, setNarrativeStructure] = useState<NarrativeStructure | null>(null);
  const [synthesisMetrics, setSynthesisMetrics] = useState<SynthesisMetrics | null>(null);
  const [synthesisMode, setSynthesisMode] = useState<'thematic' | 'narrative' | 'relational'>('thematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'visual'>('overview');
  const visualizationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (themes.length > 0 && narratives.length > 0) {
      performSynthesis();
    }
  }, [themes, narratives]);

  useEffect(() => {
    if (viewMode === 'visual' && factorRelationships.length > 0) {
      renderRelationshipNetwork();
    }
  }, [viewMode, factorRelationships]);

  const performSynthesis = async () => {
    setIsGenerating(true);

    try {
      // Extract and synthesize themes across factors
      const synthesized = synthesizeThemes();
      setSynthesisThemes(synthesized);

      // Analyze factor relationships
      const relationships = analyzeFactorRelationships();
      setFactorRelationships(relationships);

      // Generate narrative structure
      const narrative = generateNarrativeStructure(synthesized, relationships);
      setNarrativeStructure(narrative);

      // Calculate synthesis metrics
      const metrics = calculateSynthesisMetrics(synthesized, relationships, narrative);
      setSynthesisMetrics(metrics);

      if (onSynthesisComplete) {
        onSynthesisComplete({
          themes: synthesized,
          relationships,
          narrative,
          metrics,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error performing synthesis:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const synthesizeThemes = (): SynthesisTheme[] => {
    const themeMap = new Map<string, SynthesisTheme>();
    
    // Process themes from all sources
    themes.forEach(theme => {
      const key = theme.name.toLowerCase();
      
      if (!themeMap.has(key)) {
        themeMap.set(key, {
          id: `theme-${themeMap.size + 1}`,
          name: theme.name,
          description: theme.description,
          prevalence: 0,
          factors: [],
          strength: 'emerging',
          evidence: [],
          implications: []
        });
      }
      
      const synthTheme = themeMap.get(key)!;
      synthTheme.prevalence += theme.occurrences || 1;
      synthTheme.factors = [...new Set([...synthTheme.factors, ...(theme.factors || [])])];
      synthTheme.evidence = [...synthTheme.evidence, ...(theme.quotes || [])].slice(0, 5);
    });

    // Add themes from narratives
    narratives.forEach(narrative => {
      if (narrative.mainTheme) {
        const key = narrative.mainTheme.toLowerCase();
        if (!themeMap.has(key)) {
          themeMap.set(key, {
            id: `theme-${themeMap.size + 1}`,
            name: narrative.mainTheme,
            description: narrative.narrative?.substring(0, 200) || '',
            prevalence: 1,
            factors: [narrative.factorNumber],
            strength: 'moderate',
            evidence: narrative.distinguishingStatements || [],
            implications: []
          });
        } else {
          const synthTheme = themeMap.get(key)!;
          synthTheme.factors = [...new Set([...synthTheme.factors, narrative.factorNumber])];
        }
      }
    });

    // Calculate strength and generate implications
    const synthesized = Array.from(themeMap.values()).map(theme => {
      // Determine strength based on prevalence and factor coverage
      const factorCoverage = theme.factors.length / factors.length;
      if (factorCoverage > 0.6 && theme.prevalence > 5) {
        theme.strength = 'dominant';
      } else if (factorCoverage > 0.3 || theme.prevalence > 3) {
        theme.strength = 'moderate';
      }

      // Generate implications
      theme.implications = generateThemeImplications(theme);

      return theme;
    });

    return synthesized.sort((a, b) => b.prevalence - a.prevalence);
  };

  const generateThemeImplications = (theme: SynthesisTheme): string[] => {
    const implications: string[] = [];
    
    if (theme.strength === 'dominant') {
      implications.push(`This is a central theme requiring primary focus in interventions`);
    }
    
    if (theme.factors.length > factors.length / 2) {
      implications.push(`Broad consensus suggests high stakeholder alignment on this issue`);
    }
    
    if (theme.evidence.length > 0) {
      implications.push(`Strong empirical support from ${theme.evidence.length} distinct viewpoints`);
    }

    return implications;
  };

  const analyzeFactorRelationships = (): FactorRelationship[] => {
    const relationships: FactorRelationship[] = [];
    
    for (let i = 0; i < factors.length; i++) {
      for (let j = i + 1; j < factors.length; j++) {
        const factor1 = i + 1;
        const factor2 = j + 1;
        
        const narrative1 = narratives.find(n => n.factorNumber === factor1);
        const narrative2 = narratives.find(n => n.factorNumber === factor2);
        
        if (!narrative1 || !narrative2) continue;
        
        // Calculate similarity
        const sharedThemes = findSharedThemes(narrative1, narrative2);
        const divergentThemes = findDivergentThemes(narrative1, narrative2);
        const similarity = calculateSimilarity(narrative1, narrative2);
        
        // Determine relationship type
        let relationshipType: FactorRelationship['relationshipType'] = 'independent';
        if (similarity > 0.7) {
          relationshipType = 'aligned';
        } else if (similarity > 0.4) {
          relationshipType = 'complementary';
        } else if (similarity < 0.2 && divergentThemes.length > 2) {
          relationshipType = 'opposing';
        }
        
        relationships.push({
          factor1,
          factor2,
          similarity,
          sharedThemes,
          divergentThemes,
          relationshipType
        });
      }
    }
    
    return relationships;
  };

  const findSharedThemes = (narrative1: any, narrative2: any): string[] => {
    const themes1 = new Set([narrative1.mainTheme, ...(narrative1.keywords || [])]);
    const themes2 = new Set([narrative2.mainTheme, ...(narrative2.keywords || [])]);
    
    const shared: string[] = [];
    themes1.forEach(theme => {
      if (theme && themes2.has(theme)) {
        shared.push(theme);
      }
    });
    
    return shared;
  };

  const findDivergentThemes = (narrative1: any, narrative2: any): string[] => {
    const divergent: string[] = [];
    
    // Check for opposing views in distinguishing statements
    if (narrative1.distinguishingStatements && narrative2.distinguishingStatements) {
      // Simplified check - in real implementation would use NLP
      const hasOpposition = narrative1.distinguishingStatements.some((s1: string) =>
        narrative2.distinguishingStatements.some((s2: string) =>
          (s1.includes('not') && !s2.includes('not')) ||
          (!s1.includes('not') && s2.includes('not'))
        )
      );
      
      if (hasOpposition) {
        divergent.push('Opposing viewpoints detected');
      }
    }
    
    return divergent;
  };

  const calculateSimilarity = (narrative1: any, narrative2: any): number => {
    // Simplified similarity calculation
    const shared = findSharedThemes(narrative1, narrative2).length;
    const total = new Set([
      narrative1.mainTheme,
      narrative2.mainTheme,
      ...(narrative1.keywords || []),
      ...(narrative2.keywords || [])
    ]).size;
    
    return total > 0 ? shared / total : 0;
  };

  const generateNarrativeStructure = (
    themes: SynthesisTheme[],
    relationships: FactorRelationship[]
  ): NarrativeStructure => {
    const dominantThemes = themes.filter(t => t.strength === 'dominant');
    const tensions = identifyTensions(relationships);
    
    return {
      introduction: generateIntroduction(themes, factors),
      mainFindings: dominantThemes.slice(0, 5).map(theme => ({
        finding: `${theme.name}: ${theme.description}`,
        evidence: theme.evidence.slice(0, 3),
        factors: theme.factors
      })),
      crossCuttingThemes: themes
        .filter(t => t.factors.length > factors.length / 2)
        .slice(0, 3)
        .map(theme => ({
          theme: theme.name,
          description: theme.description,
          significance: `Present in ${theme.factors.length} of ${factors.length} factors`
        })),
      tensions: tensions.slice(0, 3),
      conclusion: generateConclusion(themes, relationships),
      recommendations: generateRecommendations(themes, tensions)
    };
  };

  const generateIntroduction = (themes: SynthesisTheme[], factors: any[]): string => {
    return `This synthesis integrates findings from ${factors.length} distinct factors, revealing ${themes.filter(t => t.strength === 'dominant').length} dominant themes and ${themes.length} total thematic patterns. The analysis demonstrates both convergent and divergent perspectives across the participant viewpoints.`;
  };

  const identifyTensions = (relationships: FactorRelationship[]): any[] => {
    return relationships
      .filter(r => r.relationshipType === 'opposing')
      .map(r => ({
        description: `Factors ${r.factor1} and ${r.factor2} show opposing views`,
        factors: [r.factor1, r.factor2],
        implications: r.divergentThemes.join('; ')
      }));
  };

  const generateConclusion = (themes: SynthesisTheme[], relationships: FactorRelationship[]): string => {
    const alignedCount = relationships.filter(r => r.relationshipType === 'aligned').length;
    const opposingCount = relationships.filter(r => r.relationshipType === 'opposing').length;
    
    return `The analysis reveals ${alignedCount} aligned factor pairs and ${opposingCount} opposing viewpoints. The ${themes[0]?.name || 'primary theme'} emerges as the most prevalent perspective, suggesting a focal point for future interventions.`;
  };

  const generateRecommendations = (themes: SynthesisTheme[], tensions: any[]): string[] => {
    const recommendations: string[] = [];
    
    // Theme-based recommendations
    themes.slice(0, 3).forEach(theme => {
      if (theme.strength === 'dominant') {
        recommendations.push(`Address "${theme.name}" as a priority area given its prevalence across ${theme.factors.length} factors`);
      }
    });
    
    // Tension-based recommendations
    if (tensions.length > 0) {
      recommendations.push(`Facilitate dialogue between opposing viewpoints to build consensus`);
    }
    
    // Coverage recommendations
    const uncoveredFactors = factors.filter((_, i) => 
      !themes.some(t => t.factors.includes(i + 1))
    );
    if (uncoveredFactors.length > 0) {
      recommendations.push(`Investigate perspectives from factors with limited thematic representation`);
    }
    
    return recommendations.slice(0, 5);
  };

  const calculateSynthesisMetrics = (
    themes: SynthesisTheme[],
    relationships: FactorRelationship[],
    narrative: NarrativeStructure
  ): SynthesisMetrics => {
    // Calculate coherence based on theme alignment
    const alignedRelationships = relationships.filter(r => r.relationshipType === 'aligned').length;
    const coherence = (alignedRelationships / relationships.length) * 100;
    
    // Calculate coverage based on factor representation
    const coveredFactors = new Set(themes.flatMap(t => t.factors));
    const coverage = (coveredFactors.size / factors.length) * 100;
    
    // Calculate depth based on evidence and implications
    const avgEvidence = themes.reduce((sum, t) => sum + t.evidence.length, 0) / themes.length;
    const depth = Math.min(100, avgEvidence * 20);
    
    // Calculate clarity based on narrative structure completeness
    const narrativeElements = [
      narrative.introduction,
      narrative.mainFindings.length > 0,
      narrative.crossCuttingThemes.length > 0,
      narrative.conclusion,
      narrative.recommendations.length > 0
    ];
    const clarity = (narrativeElements.filter(Boolean).length / narrativeElements.length) * 100;
    
    // Calculate actionability based on recommendations and implications
    const totalImplications = themes.reduce((sum, t) => sum + t.implications.length, 0);
    const actionability = Math.min(100, (narrative.recommendations.length * 10 + totalImplications * 5));
    
    return {
      coherence,
      coverage,
      depth,
      clarity,
      actionability
    };
  };

  const renderRelationshipNetwork = () => {
    if (!visualizationRef.current || factorRelationships.length === 0) return;
    
    // Clear previous visualization
    d3.select(visualizationRef.current).selectAll('*').remove();
    
    const width = visualizationRef.current.clientWidth;
    const height = 400;
    
    const svg = d3.select(visualizationRef.current)
      .append('svg')
      .attr('width', width)
      .attr('height', height);
    
    // Create nodes for factors
    const nodes = factors.map((_, i) => ({
      id: i + 1,
      label: `Factor ${i + 1}`,
      x: width / 2 + Math.cos((i * 2 * Math.PI) / factors.length) * 150,
      y: height / 2 + Math.sin((i * 2 * Math.PI) / factors.length) * 150
    }));
    
    // Create links from relationships
    const links = factorRelationships.map(rel => ({
      source: nodes.find(n => n.id === rel.factor1),
      target: nodes.find(n => n.id === rel.factor2),
      type: rel.relationshipType,
      similarity: rel.similarity
    }));
    
    // Add links
    const linkGroup = svg.append('g').attr('class', 'links');
    
    links.forEach(link => {
      if (!link.source || !link.target) return;
      
      const color = {
        aligned: '#10b981',
        complementary: '#3b82f6',
        opposing: '#ef4444',
        independent: '#9ca3af'
      }[link.type];
      
      linkGroup.append('line')
        .attr('x1', link.source.x)
        .attr('y1', link.source.y)
        .attr('x2', link.target.x)
        .attr('y2', link.target.y)
        .attr('stroke', color)
        .attr('stroke-width', 1 + link.similarity * 3)
        .attr('stroke-opacity', 0.6);
    });
    
    // Add nodes
    const nodeGroup = svg.append('g').attr('class', 'nodes');
    
    nodes.forEach(node => {
      const g = nodeGroup.append('g')
        .attr('transform', `translate(${node.x},${node.y})`);
      
      g.append('circle')
        .attr('r', 25)
        .attr('fill', '#8b5cf6')
        .attr('stroke', '#fff')
        .attr('stroke-width', 2);
      
      g.append('text')
        .attr('text-anchor', 'middle')
        .attr('dy', '0.3em')
        .attr('fill', '#fff')
        .attr('font-size', '12px')
        .attr('font-weight', 'bold')
        .text(`F${node.id}`);
    });
    
    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(20, 20)`);
    
    const legendItems = [
      { type: 'aligned', color: '#10b981', label: 'Aligned' },
      { type: 'complementary', color: '#3b82f6', label: 'Complementary' },
      { type: 'opposing', color: '#ef4444', label: 'Opposing' },
      { type: 'independent', color: '#9ca3af', label: 'Independent' }
    ];
    
    legendItems.forEach((item, i) => {
      const g = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);
      
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', 20)
        .attr('y2', 0)
        .attr('stroke', item.color)
        .attr('stroke-width', 2);
      
      g.append('text')
        .attr('x', 25)
        .attr('y', 0)
        .attr('dy', '0.3em')
        .attr('font-size', '12px')
        .text(item.label);
    });
  };

  const getStrengthBadge = (strength: SynthesisTheme['strength']) => {
    const configs = {
      dominant: { variant: 'destructive' as const, label: 'Dominant' },
      moderate: { variant: 'warning' as const, label: 'Moderate' },
      emerging: { variant: 'secondary' as const, label: 'Emerging' }
    };
    
    const config = configs[strength];
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  const getRelationshipBadge = (type: FactorRelationship['relationshipType']) => {
    const configs = {
      aligned: { variant: 'success' as const, label: 'Aligned' },
      complementary: { variant: 'default' as const, label: 'Complementary' },
      opposing: { variant: 'destructive' as const, label: 'Opposing' },
      independent: { variant: 'secondary' as const, label: 'Independent' }
    };
    
    const config = configs[type];
    return <Badge variant={config.variant} size="sm">{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-label flex items-center gap-2">
              <BeakerIcon className="w-6 h-6 text-indigo-600" />
              Cross-Factor Synthesis Tool
            </h2>
            <p className="text-sm text-secondary-label mt-1">
              Integrate findings across all factors to create unified insights
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={synthesisMode === 'thematic' ? 'primary' : 'secondary'}
              onClick={() => setSynthesisMode('thematic')}
            >
              <ChartPieIcon className="w-4 h-4" />
              Thematic
            </Button>
            <Button
              size="sm"
              variant={synthesisMode === 'narrative' ? 'primary' : 'secondary'}
              onClick={() => setSynthesisMode('narrative')}
            >
              <DocumentTextIcon className="w-4 h-4" />
              Narrative
            </Button>
            <Button
              size="sm"
              variant={synthesisMode === 'relational' ? 'primary' : 'secondary'}
              onClick={() => setSynthesisMode('relational')}
            >
              <ArrowPathRoundedSquareIcon className="w-4 h-4" />
              Relational
            </Button>
          </div>
        </div>

        {/* Synthesis Metrics */}
        {synthesisMetrics && (
          <div className="grid grid-cols-5 gap-4 mt-4">
            {Object.entries(synthesisMetrics).map(([key, value]) => (
              <div key={key} className="text-center">
                <div className="text-2xl font-bold text-indigo-600">
                  {value.toFixed(0)}%
                </div>
                <div className="text-xs text-secondary-label capitalize">{key}</div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 mt-4">
          <Button
            size="sm"
            variant="primary"
            onClick={performSynthesis}
            loading={isGenerating}
          >
            <SparklesIcon className="w-4 h-4" />
            Generate Synthesis
          </Button>
          
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as any)}
            className="px-3 py-1.5 text-sm border border-separator rounded-lg"
          >
            <option value="overview">Overview</option>
            <option value="detailed">Detailed</option>
            <option value="visual">Visual</option>
          </select>
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel */}
        <div className="lg:col-span-2 space-y-4">
          {synthesisMode === 'thematic' && (
            <>
              {/* Synthesized Themes */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <BookOpenIcon className="w-5 h-5 text-indigo-600" />
                  Synthesized Themes
                </h3>
                
                <div className="space-y-3">
                  {synthesisThemes.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => setSelectedTheme(theme.id)}
                      className="text-left focus:outline-none w-full"
                    >
                      <Card
                        className={`p-4 cursor-pointer transition-all ${
                          selectedTheme === theme.id 
                            ? 'ring-2 ring-indigo-500 bg-indigo-50' 
                            : 'hover:shadow-md'
                        }`}
                      >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{theme.name}</h4>
                          {getStrengthBadge(theme.strength)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" size="sm">
                            {theme.factors.length} factors
                          </Badge>
                          <Badge variant="default" size="sm">
                            {theme.prevalence} occurrences
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-secondary-label mb-2">{theme.description}</p>
                      
                      {viewMode === 'detailed' && (
                        <>
                          <div className="mt-3 pt-3 border-t border-separator">
                            <p className="text-xs font-medium mb-1">Evidence:</p>
                            <ul className="space-y-1">
                              {theme.evidence.slice(0, 3).map((evidence, idx) => (
                                <li key={idx} className="text-xs text-secondary-label">
                                  • {evidence}
                                </li>
                              ))}
                            </ul>
                          </div>
                          
                          {theme.implications.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-separator">
                              <p className="text-xs font-medium mb-1">Implications:</p>
                              <ul className="space-y-1">
                                {theme.implications.map((implication, idx) => (
                                  <li key={idx} className="text-xs text-secondary-label">
                                    • {implication}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      )}
                      
                      {/* Theme Coverage Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-secondary-label">Factor Coverage</span>
                          <span className="text-xs font-medium">
                            {((theme.factors.length / factors.length) * 100).toFixed(0)}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-system-gray-5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-indigo-400 to-indigo-600"
                            style={{ width: `${(theme.factors.length / factors.length) * 100}%` }}
                          />
                        </div>
                      </div>
                    </Card>
                    </button>
                  ))}
                </div>
              </Card>
            </>
          )}

          {synthesisMode === 'narrative' && narrativeStructure && (
            <>
              {/* Narrative Structure */}
              <Card className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
                  Synthesized Narrative
                </h3>
                
                {/* Introduction */}
                <div className="mb-6">
                  <h4 className="font-medium text-sm mb-2">Introduction</h4>
                  <p className="text-sm text-secondary-label">{narrativeStructure.introduction}</p>
                </div>
                
                {/* Main Findings */}
                <div className="mb-6">
                  <h4 className="font-medium text-sm mb-3">Main Findings</h4>
                  <div className="space-y-3">
                    {narrativeStructure.mainFindings.map((finding, index) => (
                      <Card key={index} className="p-3 bg-indigo-50">
                        <p className="text-sm font-medium mb-2">{finding.finding}</p>
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" size="sm">
                            Factors: {finding.factors.join(', ')}
                          </Badge>
                        </div>
                        {viewMode === 'detailed' && finding.evidence.length > 0 && (
                          <div className="text-xs text-secondary-label">
                            <p className="font-medium mb-1">Supporting evidence:</p>
                            <ul className="space-y-0.5">
                              {finding.evidence.map((evidence, idx) => (
                                <li key={idx}>• {evidence}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>
                
                {/* Cross-Cutting Themes */}
                {narrativeStructure.crossCuttingThemes.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-sm mb-3">Cross-Cutting Themes</h4>
                    <div className="space-y-2">
                      {narrativeStructure.crossCuttingThemes.map((theme, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-xs font-medium">
                            {index + 1}
                          </span>
                          <div>
                            <p className="font-medium text-sm">{theme.theme}</p>
                            <p className="text-xs text-secondary-label">{theme.description}</p>
                            <p className="text-xs text-indigo-600 mt-1">{theme.significance}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Tensions */}
                {narrativeStructure.tensions.length > 0 && (
                  <Alert variant="destructive" className="mb-6">
                    <h4 className="font-medium mb-2">Identified Tensions</h4>
                    <ul className="space-y-1 text-sm">
                      {narrativeStructure.tensions.map((tension, index) => (
                        <li key={index}>
                          • {tension.description} ({tension.implications})
                        </li>
                      ))}
                    </ul>
                  </Alert>
                )}
                
                {/* Conclusion */}
                <div className="mb-6">
                  <h4 className="font-medium text-sm mb-2">Conclusion</h4>
                  <p className="text-sm text-secondary-label">{narrativeStructure.conclusion}</p>
                </div>
                
                {/* Recommendations */}
                <Card className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50">
                  <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                    <ClipboardDocumentCheckIcon className="w-4 h-4 text-indigo-600" />
                    Recommendations
                  </h4>
                  <ul className="space-y-2">
                    {narrativeStructure.recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center text-xs font-medium mt-0.5">
                          {index + 1}
                        </span>
                        <p className="text-sm">{rec}</p>
                      </li>
                    ))}
                  </ul>
                </Card>
              </Card>
            </>
          )}

          {synthesisMode === 'relational' && (
            <>
              {viewMode === 'visual' ? (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ArrowPathRoundedSquareIcon className="w-5 h-5 text-indigo-600" />
                    Factor Relationship Network
                  </h3>
                  <div ref={visualizationRef} className="w-full" />
                </Card>
              ) : (
                <Card className="p-6">
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <ArrowPathRoundedSquareIcon className="w-5 h-5 text-indigo-600" />
                    Factor Relationships
                  </h3>
                  
                  <div className="space-y-3">
                    {factorRelationships.map((rel, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              Factor {rel.factor1} ↔ Factor {rel.factor2}
                            </span>
                            {getRelationshipBadge(rel.relationshipType)}
                          </div>
                          <Badge variant="secondary" size="sm">
                            {(rel.similarity * 100).toFixed(0)}% similar
                          </Badge>
                        </div>
                        
                        {rel.sharedThemes.length > 0 && (
                          <div className="mb-2">
                            <p className="text-xs font-medium text-system-green mb-1">Shared Themes:</p>
                            <div className="flex flex-wrap gap-1">
                              {rel.sharedThemes.map((theme, idx) => (
                                <Badge key={idx} variant="success" size="sm">{theme}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {rel.divergentThemes.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-system-orange mb-1">Divergent Views:</p>
                            <div className="flex flex-wrap gap-1">
                              {rel.divergentThemes.map((theme, idx) => (
                                <Badge key={idx} variant="warning" size="sm">{theme}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Synthesis Actions */}
          <Card className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50">
            <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
              <PresentationChartLineIcon className="w-4 h-4 text-indigo-600" />
              Export Options
            </h3>
            
            <div className="space-y-2">
              <Button size="sm" variant="primary" className="w-full">
                <DocumentDuplicateIcon className="w-4 h-4" />
                Export Full Report
              </Button>
              <Button size="sm" variant="secondary" className="w-full">
                <AcademicCapIcon className="w-4 h-4" />
                Academic Format
              </Button>
              <Button size="sm" variant="secondary" className="w-full">
                <ClipboardDocumentCheckIcon className="w-4 h-4" />
                Executive Summary
              </Button>
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="p-4">
            <h3 className="font-medium text-sm mb-3">Synthesis Statistics</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-secondary-label">Total Themes</p>
                <p className="text-2xl font-bold text-indigo-600">{synthesisThemes.length}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-label">Dominant Themes</p>
                <p className="text-2xl font-bold text-purple-600">
                  {synthesisThemes.filter(t => t.strength === 'dominant').length}
                </p>
              </div>
              <div>
                <p className="text-xs text-secondary-label">Factor Relationships</p>
                <p className="text-2xl font-bold text-pink-600">{factorRelationships.length}</p>
              </div>
              <div>
                <p className="text-xs text-secondary-label">Aligned Pairs</p>
                <p className="text-2xl font-bold text-green-600">
                  {factorRelationships.filter(r => r.relationshipType === 'aligned').length}
                </p>
              </div>
            </div>
          </Card>

          {/* Theme Distribution */}
          <Card className="p-4">
            <h3 className="font-medium text-sm mb-3">Theme Distribution</h3>
            <div className="space-y-2">
              {['dominant', 'moderate', 'emerging'].map(strength => {
                const count = synthesisThemes.filter(t => t.strength === strength).length;
                const percentage = synthesisThemes.length > 0 ? (count / synthesisThemes.length) * 100 : 0;
                
                return (
                  <div key={strength}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-secondary-label capitalize">{strength}</span>
                      <span className="text-xs font-medium">{count}</span>
                    </div>
                    <div className="w-full h-2 bg-system-gray-5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${
                          strength === 'dominant' 
                            ? 'bg-red-500' 
                            : strength === 'moderate'
                            ? 'bg-orange-500'
                            : 'bg-gray-400'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Synthesis Tips */}
          <Card className="p-4 bg-gradient-to-br from-yellow-50 to-orange-50">
            <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
              <AcademicCapIcon className="w-4 h-4 text-orange-600" />
              Synthesis Tips
            </h3>
            <ul className="text-xs text-secondary-label space-y-1">
              <li>• Look for themes present in 3+ factors</li>
              <li>• Identify contradictions for deeper analysis</li>
              <li>• Consider demographic patterns</li>
              <li>• Review participant comments for context</li>
              <li>• Validate findings with stakeholders</li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}