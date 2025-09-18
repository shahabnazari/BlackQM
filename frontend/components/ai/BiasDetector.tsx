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
  biasType?: 'language' | 'perspective' | 'cultural' | 'confirmation' | 'sampling' | 'demographic';
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
  const [analysisType, setAnalysisType] = useState<'quick' | 'comprehensive'>('comprehensive');
  const [diversityScore, setDiversityScore] = useState<number | null>(null);
  const [culturalScore, setCulturalScore] = useState<number | null>(null);

  const detectBias = async () => {
    if (!statements.trim()) return;

    setLoading(true);
    setError(null);
    
    // Reset previous results
    setIssues([]);
    setBiasScore(null);
    setDiversityScore(null);
    setCulturalScore(null);

    try {
      const statementsArray = statements.split('\n').filter(s => s.trim());
      
      const action = analysisType === 'quick' ? 'quick-check' : 'comprehensive';
      
      const response = await fetch(`/api/ai/bias?action=${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          statements: statementsArray,
          checkTypes: ['language', 'perspective', 'cultural', 'demographic']
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze statements');
      }

      const data = await response.json();
      
      if (data.success) {
        if (analysisType === 'quick') {
          // Quick check response
          setBiasScore(data.data.score);
          
          // Create simplified issues based on score
          const quickIssues: BiasIssue[] = [];
          if (data.data.score < 80) {
            quickIssues.push({
              type: 'General Bias',
              severity: data.data.score < 60 ? 'high' : 'medium',
              description: data.data.recommendation,
              suggestion: 'Consider running comprehensive analysis for detailed feedback'
            });
          }
          setIssues(quickIssues);
        } else {
          // Comprehensive analysis response
          const biasData = data.data.bias || data.data;
          const overallScore = biasData.overallScore || data.data.quickScore || 75;
          
          setBiasScore(overallScore);
          
          if (data.data.diversity) {
            setDiversityScore(data.data.diversity.score);
          }
          
          if (data.data.cultural) {
            setCulturalScore(data.data.cultural.score);
          }
          
          // Process issues from API response
          const processedIssues: BiasIssue[] = [];
          
          if (biasData.issues) {
            biasData.issues.forEach((issue: any) => {
              processedIssues.push({
                type: issue.type || 'Bias Issue',
                severity: issue.severity || 'medium',
                description: issue.description,
                suggestion: issue.suggestion || issue.recommendation,
                affectedText: issue.affectedStatement,
                biasType: issue.biasType
              });
            });
          }
          
          setIssues(processedIssues);
        }
        
        if (onBiasDetected) {
          onBiasDetected(issues, biasScore || 0);
        }
      }
    } catch (err: any) {
      console.error('Bias detection error:', err);
      setError(err.message || 'Failed to analyze statements. Please try again.');
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

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Analysis Type
          </label>
          <div className="flex gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="quick"
                checked={analysisType === 'quick'}
                onChange={() => setAnalysisType('quick')}
                disabled={loading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Quick Check</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                value="comprehensive"
                checked={analysisType === 'comprehensive'}
                onChange={() => setAnalysisType('comprehensive')}
                disabled={loading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm">Comprehensive Analysis</span>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            {analysisType === 'quick' 
              ? 'Fast heuristic-based check for immediate feedback'
              : 'Deep AI-powered analysis including cultural and diversity assessment'}
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">Bias Score</h4>
                  <span className={`text-xl font-bold ${getScoreColor(biasScore)}`}>
                    {biasScore}
                  </span>
                </div>
                <Progress value={biasScore} className="h-2" />
              </div>
              
              {diversityScore !== null && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Diversity</h4>
                    <span className={`text-xl font-bold ${getScoreColor(diversityScore)}`}>
                      {diversityScore}
                    </span>
                  </div>
                  <Progress value={diversityScore} className="h-2" />
                </div>
              )}
              
              {culturalScore !== null && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-medium">Cultural</h4>
                    <span className={`text-xl font-bold ${getScoreColor(culturalScore)}`}>
                      {culturalScore}
                    </span>
                  </div>
                  <Progress value={culturalScore} className="h-2" />
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Scores out of 100 - Higher scores indicate better quality
            </p>

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