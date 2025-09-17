'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AlertCircle, Sparkles, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

interface BiasIssue {
  type: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion: string;
  affectedText?: string;
}

interface BiasDetectorProps {
  initialStatements?: string[];
  onBiasDetected?: (issues: BiasIssue[], score: number) => void;
  className?: string;
}

export function BiasDetector({ initialStatements = [], onBiasDetected, className }: BiasDetectorProps) {
  const [statements, setStatements] = useState(initialStatements.join('\n'));
  const [loading, setLoading] = useState(false);
  const [biasScore, setBiasScore] = useState<number | null>(null);
  const [issues, setIssues] = useState<BiasIssue[]>([]);
  const [error, setError] = useState<string | null>(null);

  const detectBias = async () => {
    if (!statements.trim()) return;

    setLoading(true);
    setError(null);

    try {
      // Simulate AI bias detection - replace with actual API call
      const mockIssues: BiasIssue[] = [
        {
          type: 'Gender Bias',
          severity: 'medium',
          description: 'Statement may contain gender-specific assumptions',
          suggestion: 'Consider using gender-neutral language',
          affectedText: 'Line 2: "businessmen"'
        },
        {
          type: 'Cultural Bias',
          severity: 'low',
          description: 'Statement may not be culturally inclusive',
          suggestion: 'Consider diverse cultural perspectives',
          affectedText: 'Line 5: Western-centric viewpoint'
        }
      ];

      const score = 75; // Mock bias score (100 = no bias, 0 = severe bias)

      setIssues(mockIssues);
      setBiasScore(score);

      if (onBiasDetected) {
        onBiasDetected(mockIssues, score);
      }
    } catch (err) {
      setError('Failed to analyze statements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'high': return <AlertCircle className="h-4 w-4" />;
      case 'medium': return <AlertTriangle className="h-4 w-4" />;
      case 'low': return <CheckCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Bias Detector
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Statements to Analyze
          </label>
          <Textarea
            placeholder="Enter your statements here, one per line..."
            value={statements}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setStatements(e.target.value)}
            rows={8}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground">
            Enter each statement on a new line for best results
          </p>
        </div>

        <Button
          onClick={detectBias}
          disabled={loading || !statements.trim()}
          className="w-full"
        >
          {loading ? (
            <>Analyzing for Bias...</>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Detect Bias
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {biasScore !== null && (
          <div className="space-y-4 pt-4 border-t">
            <div>
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium">Bias Score</h4>
                <span className={`text-2xl font-bold ${getScoreColor(biasScore)}`}>
                  {biasScore}/100
                </span>
              </div>
              <Progress value={biasScore} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                Higher scores indicate less bias
              </p>
            </div>

            {issues.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Detected Issues ({issues.length})</h4>
                <div className="space-y-3">
                  {issues.map((issue, index) => (
                    <div key={index} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className={getSeverityColor(issue.severity)}>
                          {getSeverityIcon(issue.severity)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{issue.type}</span>
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              issue.severity === 'high' ? 'bg-red-100 text-red-700' :
                              issue.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {issue.severity}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-1">
                            {issue.description}
                          </p>
                          {issue.affectedText && (
                            <p className="text-xs font-mono bg-secondary p-1 rounded mb-1">
                              {issue.affectedText}
                            </p>
                          )}
                          <p className="text-sm">
                            <span className="font-medium">Suggestion:</span> {issue.suggestion}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {issues.length === 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  No significant bias issues detected. Your statements appear well-balanced.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default BiasDetector;