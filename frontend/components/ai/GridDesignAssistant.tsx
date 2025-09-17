'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Sparkles, Grid3x3, ChevronRight } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface GridDesignAssistantProps {
  onDesignGenerated?: (design: any) => void;
  className?: string;
}

export function GridDesignAssistant({ onDesignGenerated, className }: GridDesignAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [gridStructure, setGridStructure] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generateGridDesign = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Simulate AI generation - replace with actual API call
      const mockDesign = {
        gridSize: '4x4',
        distribution: {
          mostAgree: [-2, -1],
          neutral: [0],
          mostDisagree: [1, 2]
        },
        reasoning: 'This grid structure allows for optimal statement distribution',
        recommendations: [
          'Consider using a balanced distribution',
          'Ensure statements cover different perspectives'
        ]
      };

      setGridStructure(mockDesign);
      if (onDesignGenerated) {
        onDesignGenerated(mockDesign);
      }
    } catch (err) {
      setError('Failed to generate grid design. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Grid3x3 className="h-5 w-5" />
          Grid Design Assistant
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Describe your research objectives
          </label>
          <Textarea
            placeholder="e.g., I'm studying environmental attitudes among college students..."
            value={prompt}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setPrompt(e.target.value)}
            rows={4}
            disabled={loading}
          />
        </div>

        <Button
          onClick={generateGridDesign}
          disabled={loading || !prompt.trim()}
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

        {gridStructure && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <h4 className="font-medium mb-2">Recommended Grid Size</h4>
              <p className="text-sm text-muted-foreground">{gridStructure.gridSize}</p>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Distribution Strategy</h4>
              <div className="space-y-1 text-sm text-muted-foreground">
                <div>Most Agree: {gridStructure.distribution.mostAgree.join(', ')}</div>
                <div>Neutral: {gridStructure.distribution.neutral.join(', ')}</div>
                <div>Most Disagree: {gridStructure.distribution.mostDisagree.join(', ')}</div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Reasoning</h4>
              <p className="text-sm text-muted-foreground">{gridStructure.reasoning}</p>
            </div>

            <div>
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="space-y-1">
                {gridStructure.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <ChevronRight className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default GridDesignAssistant;