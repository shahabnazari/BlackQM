'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { AlertCircle, Sparkles, FileText, Plus, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Statement {
  id: string;
  text: string;
  category?: string;
  perspective?: string;
}

interface StatementGeneratorProps {
  onStatementsGenerated?: (statements: Statement[]) => void;
  className?: string;
}

export function StatementGenerator({ onStatementsGenerated, className }: StatementGeneratorProps) {
  const [topic, setTopic] = useState('');
  const [perspectives, setPerspectives] = useState<string[]>(['']);
  const [count, setCount] = useState(20);
  const [loading, setLoading] = useState(false);
  const [statements, setStatements] = useState<Statement[]>([]);
  const [error, setError] = useState<string | null>(null);

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
      // Simulate AI generation - replace with actual API call
      const mockStatements: Statement[] = Array.from({ length: count }, (_, i) => ({
        id: `stmt-${i + 1}`,
        text: `Generated statement ${i + 1} about ${topic}`,
        category: ['Environmental', 'Social', 'Economic'][i % 3],
        perspective: perspectives[i % perspectives.length] || 'General'
      }));

      setStatements(mockStatements);
      if (onStatementsGenerated) {
        onStatementsGenerated(mockStatements);
      }
    } catch (err) {
      setError('Failed to generate statements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeStatement = (id: string) => {
    const updated = statements.filter(s => s.id !== id);
    setStatements(updated);
    if (onStatementsGenerated) {
      onStatementsGenerated(updated);
    }
  };

  const editStatement = (id: string, text: string) => {
    const updated = statements.map(s => s.id === id ? { ...s, text } : s);
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

        <div className="space-y-2">
          <label className="text-sm font-medium">
            Number of Statements
          </label>
          <Input
            type="number"
            min={5}
            max={100}
            value={count}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCount(parseInt(e.target.value) || 20)}
            disabled={loading}
          />
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
                <div key={statement.id} className="flex gap-2 p-2 border rounded">
                  <Textarea
                    value={statement.text}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => editStatement(statement.id, e.target.value)}
                    className="flex-1 resize-none"
                    rows={2}
                  />
                  <div className="flex flex-col gap-1">
                    {statement.category && (
                      <span className="text-xs bg-secondary px-2 py-1 rounded">
                        {statement.category}
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStatement(statement.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
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