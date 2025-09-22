'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Sparkles, Grid3x3, ChevronRight, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface GridStructure {
  columns: number;
  distribution: number[];
  labels: string[];
}

interface AlternativeDesign {
  name: string;
  structure: number[];
  useCase: string;
}

interface GridRecommendation {
  gridStructure: GridStructure;
  reasoning: string;
  recommendations: string[];
  alternativeDesigns: AlternativeDesign[];
}

interface GridDesignAssistantProps {
  onDesignGenerated?: (design: GridRecommendation) => void;
  statementCount?: number;
  participantCount?: number;
  className?: string;
}

export function GridDesignAssistant({ 
  onDesignGenerated, 
  statementCount = 30,
  participantCount = 30,
  className 
}: GridDesignAssistantProps) {
  const [researchObjective, setResearchObjective] = useState('');
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<GridRecommendation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [_selectedDesign, setSelectedDesign] = useState<'main' | number>('main');

  const generateGridDesign = async () => {
    if (!researchObjective.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/grid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          researchObjective,
          statementCount,
          participantCount,
          fieldOfStudy: fieldOfStudy.trim() || undefined
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate grid design');
      }

      const data = await response.json();
      
      if (data.recommendation) {
        setRecommendation(data.recommendation);
        if (onDesignGenerated) {
          onDesignGenerated(data.recommendation);
        }
      }
      
      if (data.isFallback) {
        console.info('Using fallback grid design');
      }
    } catch (err: any) {
      console.error('Grid design generation error:', err);
      setError(err.message || 'Failed to generate grid design. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3x3 className="h-5 w-5" />
          AI Grid Design Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Research Objective <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="e.g., I'm studying environmental attitudes among college students to understand their perspectives on climate change policies..."
              value={researchObjective}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setResearchObjective(e.target.value)}
              rows={3}
              disabled={loading}
              className="resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Field of Study <span className="text-gray-500">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g., Environmental Psychology, Education, Marketing..."
              value={fieldOfStudy}
              onChange={(e) => setFieldOfStudy(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-4 text-sm text-gray-600">
            <span>Statements: {statementCount}</span>
            <span>•</span>
            <span>Participants: {participantCount}</span>
          </div>
        </div>

        <Button
          onClick={generateGridDesign}
          disabled={loading || !researchObjective.trim()}
          className="w-full"
        >
          {loading ? (
            <>Generating Design...</>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Grid Design
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {recommendation && (
          <div className="space-y-4 pt-4 border-t">
            {/* Main Recommendation */}
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Badge className="bg-blue-600 text-white">Recommended</Badge>
                {recommendation.gridStructure.columns}-Column Grid
              </h4>
              <div className="grid grid-cols-7 gap-1 mt-3 mb-3">
                {recommendation.gridStructure.distribution.map((height, idx) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div 
                      className="w-full bg-blue-500 dark:bg-blue-400 rounded-t"
                      style={{ height: `${height * 10}px` }}
                    />
                    <span className="text-xs mt-1">{height}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {recommendation.gridStructure.labels.map((label, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Scientific Reasoning */}
            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Info className="h-4 w-4" />
                Scientific Reasoning
              </h4>
              <p className="text-sm text-muted-foreground">{recommendation.reasoning}</p>
            </div>

            {/* Recommendations */}
            <div>
              <h4 className="font-medium mb-2">Study-Specific Recommendations</h4>
              <ul className="space-y-2">
                {recommendation.recommendations.map((rec, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-blue-500" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>

            {/* Alternative Designs */}
            {recommendation.alternativeDesigns && recommendation.alternativeDesigns.length > 0 && (
              <div>
                <h4 className="font-medium mb-2">Alternative Designs</h4>
                <div className="space-y-2">
                  {recommendation.alternativeDesigns.map((alt, i) => (
                    <div 
                      key={i}
                      className="p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer transition-colors"
                      onClick={() => setSelectedDesign(i)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{alt.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">{alt.useCase}</p>
                        </div>
                        <div className="flex gap-0.5">
                          {alt.structure.map((h, idx) => (
                            <div 
                              key={idx}
                              className="w-2 bg-gray-400 rounded-t"
                              style={{ height: `${h * 4}px` }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GridDesignAssistant;