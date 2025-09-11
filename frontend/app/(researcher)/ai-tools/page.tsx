'use client';

import { useState } from 'react';
import { Card } from '@/components/apple-ui/Card/Card';
import { Button } from '@/components/apple-ui/Button/Button';
import { GridDesignAssistant } from '@/components/ai/GridDesignAssistant';
import { StatementGenerator } from '@/components/ai/StatementGenerator';
import { BiasDetector } from '@/components/ai/BiasDetector';

export default function AIToolsPage() {
  const [activeTool, setActiveTool] = useState<'grid' | 'statements' | 'bias'>(
    'grid'
  );
  const [statements, setStatements] = useState<string[]>([]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-bg to-surface/20 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-text mb-2">
            AI Research Intelligence Tools
          </h1>
          <p className="text-text-secondary">
            Advanced AI-powered tools to enhance your Q-methodology research
          </p>
        </div>

        <div className="flex gap-3 mb-6">
          <Button
            onClick={() => setActiveTool('grid')}
            variant={activeTool === 'grid' ? 'primary' : 'secondary'}
            size="md"
          >
            Grid Design Assistant
          </Button>
          <Button
            onClick={() => setActiveTool('statements')}
            variant={activeTool === 'statements' ? 'primary' : 'secondary'}
            size="md"
          >
            Statement Generator
          </Button>
          <Button
            onClick={() => setActiveTool('bias')}
            variant={activeTool === 'bias' ? 'primary' : 'secondary'}
            size="md"
          >
            Bias Detector
          </Button>
        </div>

        <Card className="bg-surface/80 backdrop-blur-md border-border p-6">
          {activeTool === 'grid' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Grid Design Assistant
              </h2>
              <p className="text-text-secondary mb-6">
                Get AI-powered recommendations for optimal Q-sort grid
                distributions based on your research requirements.
              </p>
              <GridDesignAssistant
                statementCount={statements.length || 30}
                onApplySuggestion={distribution => {
                  console.log('Grid distribution applied:', distribution);
                }}
              />
            </div>
          )}

          {activeTool === 'statements' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">
                Statement Generator
              </h2>
              <p className="text-text-secondary mb-6">
                Generate balanced and comprehensive Q-methodology statements
                tailored to your research topic.
              </p>
              <StatementGenerator
                onStatementsGenerated={newStatements => {
                  setStatements(
                    newStatements.map(s => (typeof s === 'string' ? s : s.text))
                  );
                }}
                existingStatements={statements.map(text => ({
                  id: Math.random().toString(),
                  text,
                }))}
              />
            </div>
          )}

          {activeTool === 'bias' && (
            <div>
              <h2 className="text-2xl font-semibold mb-4">Bias Detector</h2>
              <p className="text-text-secondary mb-6">
                Analyze your statements for potential biases and get suggestions
                for more balanced alternatives.
              </p>
              <BiasDetector
                statements={
                  statements.length > 0
                    ? statements
                    : ['Example statement 1', 'Example statement 2']
                }
                onSuggestion={(original, suggestion) => {
                  console.log('Bias suggestion:', { original, suggestion });
                }}
              />
            </div>
          )}
        </Card>

        <div className="mt-8 p-4 bg-surface/60 rounded-lg border border-border">
          <h3 className="text-sm font-semibold text-text-secondary mb-2">
            AI Usage Notice
          </h3>
          <p className="text-xs text-text-secondary">
            All AI features use GPT-4 for enhanced accuracy. Usage is tracked
            and optimized with intelligent caching. Your data is processed
            securely and never stored permanently on external servers.
          </p>
        </div>
      </div>
    </div>
  );
}
