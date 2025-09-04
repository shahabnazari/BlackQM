'use client';

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';

interface Statement {
  id: string;
  text: string;
  category?: string;
}

interface FamiliarizationProps {
  onComplete: (data?: any) => void;
  onBack: () => void;
}

// Mock statements for demonstration
const mockStatements: Statement[] = [
  { id: '1', text: 'Climate change is the most pressing issue of our time', category: 'Environment' },
  { id: '2', text: 'Economic growth should be prioritized over environmental protection', category: 'Economy' },
  { id: '3', text: 'Individual actions can make a significant difference', category: 'Social' },
  { id: '4', text: 'Government regulation is necessary to address climate change', category: 'Policy' },
  { id: '5', text: 'Technology will solve our environmental problems', category: 'Technology' },
  { id: '6', text: 'We should focus on adaptation rather than prevention', category: 'Strategy' },
  { id: '7', text: 'Renewable energy is economically viable today', category: 'Energy' },
  { id: '8', text: 'Consumer behavior drives environmental impact', category: 'Social' },
  { id: '9', text: 'International cooperation is essential for climate action', category: 'Policy' },
  { id: '10', text: 'Future generations will find solutions we cannot imagine', category: 'Future' },
];

export default function Familiarization({ onComplete, onBack }: FamiliarizationProps) {
  const [viewedStatements, setViewedStatements] = useState<Set<string>>(new Set());
  const [currentView, setCurrentView] = useState<'grid' | 'list' | 'single'>('single');
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleStatementView = (id: string) => {
    setViewedStatements((prev) => new Set(prev).add(id));
  };

  const handleNext = () => {
    if (currentIndex < mockStatements.length - 1) {
      const currentStatement = mockStatements[currentIndex];
      handleStatementView(currentStatement.id);
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const allViewed = viewedStatements.size === mockStatements.length;
  const progress = (viewedStatements.size / mockStatements.length) * 100;

  return (
    <Card className="max-w-6xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-label mb-2">
            Review All Statements
          </h1>
          <p className="text-secondary-label">
            Please take time to read and familiarize yourself with all the statements.
            You'll be sorting these statements in the next steps.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <span className="text-sm text-secondary-label">
              Viewed: {viewedStatements.size} of {mockStatements.length}
            </span>
            <div className="w-48 h-2 bg-quaternary-fill rounded-full overflow-hidden">
              <div
                className="h-full bg-system-blue transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button
              variant={currentView === 'single' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setCurrentView('single')}
            >
              Single
            </Button>
            <Button
              variant={currentView === 'grid' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setCurrentView('grid')}
            >
              Grid View
            </Button>
            <Button
              variant={currentView === 'list' ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setCurrentView('list')}
            >
              List View
            </Button>
          </div>
        </div>

        {currentView === 'single' ? (
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-start justify-between mb-4">
                <span className="text-xs font-medium text-tertiary-label">
                  #{mockStatements[currentIndex].id}
                </span>
                {mockStatements[currentIndex].category && (
                  <Badge variant="secondary" size="sm">
                    {mockStatements[currentIndex].category}
                  </Badge>
                )}
              </div>
              <p className="text-lg text-label">{mockStatements[currentIndex].text}</p>
            </Card>
            <div className="flex justify-between">
              <Button
                variant="secondary"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              {currentIndex < mockStatements.length - 1 ? (
                <Button
                  variant="primary"
                  onClick={handleNext}
                >
                  Next
                </Button>
              ) : (
                <span className="text-sm text-system-green">All statements viewed</span>
              )}
            </div>
          </div>
        ) : currentView === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockStatements.map((statement) => {
              const isViewed = viewedStatements.has(statement.id);
              return (
                <div
                  key={statement.id}
                  className={`
                    p-4 rounded-lg border transition-all cursor-pointer
                    ${
                      isViewed
                        ? 'border-system-green bg-green-500/5'
                        : 'border-quaternary-fill bg-tertiary-background hover:border-system-blue'
                    }
                  `}
                  onClick={() => handleStatementView(statement.id)}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-medium text-tertiary-label">
                      #{statement.id}
                    </span>
                    {statement.category && (
                      <Badge variant="secondary" size="sm">
                        {statement.category}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-label">{statement.text}</p>
                  {isViewed && (
                    <div className="mt-2 text-xs text-system-green">✓ Viewed</div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {mockStatements.map((statement) => {
              const isViewed = viewedStatements.has(statement.id);
              return (
                <div
                  key={statement.id}
                  className={`
                    p-4 rounded-lg border transition-all cursor-pointer
                    ${
                      isViewed
                        ? 'border-system-green bg-green-500/5'
                        : 'border-quaternary-fill bg-tertiary-background hover:border-system-blue'
                    }
                  `}
                  onClick={() => handleStatementView(statement.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <span className="text-xs font-medium text-tertiary-label">
                          #{statement.id}
                        </span>
                        {statement.category && (
                          <Badge variant="secondary" size="sm">
                            {statement.category}
                          </Badge>
                        )}
                      </div>
                      <p className="text-label">{statement.text}</p>
                    </div>
                    {isViewed && (
                      <div className="ml-4 text-system-green">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="bg-quaternary-fill/30 p-4 rounded-lg">
          <p className="text-sm text-secondary-label">
            <strong>Tip:</strong> Click on each statement to mark it as viewed. You need to
            view all statements before proceeding to the next step.
          </p>
        </div>

        <div className="flex justify-between">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={() => onComplete({ viewedAll: true })}
            disabled={!allViewed}
          >
            Continue to Pre-Sorting
          </Button>
        </div>
      </div>
    </Card>
  );
}
