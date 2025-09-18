'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AlertCircle, Sparkles, FileText, Plus, X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Statement {
  id: string;
  text: string;
  category?: string;
  perspective?: string;
  polarity?: 'positive' | 'negative' | 'neutral';
  confidence?: number;
}

interface StatementGeneratorProps {
  onStatementsGenerated?: (statements: Statement[]) => void;
  className?: string;
}

export function StatementGenerator({ onStatementsGenerated, className }: StatementGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [perspectives, setPerspectives] = useState<string[]>(['']);
  const [count, setCount] = useState(30);
  const [loading, setLoading] = useState(false);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [academicLevel, setAcademicLevel] = useState<'basic' | 'intermediate' | 'advanced'>('intermediate');
  const [avoidBias, setAvoidBias] = useState(true);

  const addPerspective = () => {
    setPerspectives([...perspectives, '']);
  };

  const removePerspective = (index: number) => {
    setPerspectives(perspectives.filter((_, i) => i !== index));
  };

  const updatePerspective = (index: number, value: string) => {
    const updated = [...perspectives];
    updated[index] = value;
    setPerspectives(updated);
  };

  const generateStatements = async () => {
    if (!topic.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const validPerspectives = perspectives.filter(p => p.trim());
      
      const response = await fetch('/api/ai/stimuli?action=generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          topic,
          count,
          perspectives: validPerspectives.length > 0 ? validPerspectives : undefined,
          avoidBias,
          academicLevel
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate statements');
      }

      const data = await response.json();
      
      if (data.success && data.data.statements) {
        const generatedStatements = data.data.statements.map((stmt: any, idx: number) => ({
          id: stmt.id || `stmt-${idx + 1}`,
          text: stmt.text,
          category: stmt.category,
          perspective: stmt.perspective || 'General',
          polarity: stmt.polarity,
          confidence: stmt.confidence
        }));
        
        setStatements(generatedStatements);
        if (onStatementsGenerated) {
          onStatementsGenerated(generatedStatements);
        }
        
        // Show validation results if available
        if (data.data.validation) {
          console.info('Statement validation:', data.data.validation);
        }
      }
    } catch (err: any) {
      console.error('Statement generation error:', err);
      setError(err.message || 'Failed to generate statements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeStatement = (id: string) => {
    const updated = statements.filter((s: any) => s.id !== id);
    setStatements(updated);
    if (onStatementsGenerated) {
      onStatementsGenerated(updated);
    }
  };

  const editStatement = (id: string, text: string) => {
    const updated = statements.map((s: any) => s.id === id ? { ...s, text } : s);
    setStatements(updated);
    if (onStatementsGenerated) {
      onStatementsGenerated(updated);
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Statement Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">
            Research Topic
          </label>
          <Textarea
            placeholder="e.g., Climate change attitudes and behaviors"
            value={topic}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTopic(e.target.value)}
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Perspectives (optional)
          </label>
          {perspectives.map((perspective, index) => (
            <div key={index} className="flex gap-2">
              <Input
                placeholder="e.g., Environmental activist, Industry worker..."
                value={perspective}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => updatePerspective(index, e.target.value)}
                disabled={loading}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removePerspective(index)}
                disabled={loading || perspectives.length === 1}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={addPerspective}
            disabled={loading}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Perspective
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Number of Statements
            </label>
            <Input
              type="number"
              min={10}
              max={100}
              value={count}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCount(parseInt(e.target.value) || 30)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              Academic Level
            </label>
            <select
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value as 'basic' | 'intermediate' | 'advanced')}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="basic">Basic</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="avoidBias"
            checked={avoidBias}
            onChange={(e) => setAvoidBias(e.target.checked)}
            disabled={loading}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="avoidBias" className="text-sm font-medium">
            Avoid bias in statement generation
          </label>
        </div>

        <Button
          onClick={generateStatements}
          disabled={loading || !topic.trim()}
          className="w-full"
        >
          {loading ? (
            <>Generating Statements...</>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate Statements
            </>
          )}
        </Button>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {statements.length > 0 && (
          <div className="space-y-2 pt-4 border-t">
            <h4 className="font-medium">Generated Statements ({statements.length})</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {statements.map((statement) => (
                <div key={statement.id} className="flex gap-2 p-3 border rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex-1">
                    <Textarea
                      value={statement.text}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => editStatement(statement.id, e.target.value)}
                      className="resize-none mb-2"
                      rows={2}
                    />
                    <div className="flex gap-2 flex-wrap">
                      {statement.perspective && statement.perspective !== 'General' && (
                        <span className="text-xs bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                          {statement.perspective}
                        </span>
                      )}
                      {statement.polarity && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded flex items-center gap-1">
                          {statement.polarity === 'positive' && <TrendingUp className="h-3 w-3 text-green-600" />}
                          {statement.polarity === 'negative' && <TrendingDown className="h-3 w-3 text-red-600" />}
                          {statement.polarity === 'neutral' && <Minus className="h-3 w-3 text-gray-600" />}
                          {statement.polarity}
                        </span>
                      )}
                      {statement.confidence && (
                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                          {Math.round(statement.confidence * 100)}% confidence
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStatement(statement.id)}
                    className="self-start"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default StatementGenerator;