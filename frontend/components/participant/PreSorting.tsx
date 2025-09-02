'use client';

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';

interface Statement {
  id: string;
  text: string;
}

interface PreSortingProps {
  onComplete: (data?: any) => void;
  onBack: () => void;
}

const mockStatements: Statement[] = [
  { id: '1', text: 'Climate change is the most pressing issue of our time' },
  { id: '2', text: 'Economic growth should be prioritized over environmental protection' },
  { id: '3', text: 'Individual actions can make a significant difference' },
  { id: '4', text: 'Government regulation is necessary to address climate change' },
  { id: '5', text: 'Technology will solve our environmental problems' },
  { id: '6', text: 'We should focus on adaptation rather than prevention' },
  { id: '7', text: 'Renewable energy is economically viable today' },
  { id: '8', text: 'Consumer behavior drives environmental impact' },
  { id: '9', text: 'International cooperation is essential for climate action' },
  { id: '10', text: 'Future generations will find solutions we cannot imagine' },
];

type BoxType = 'disagree' | 'neutral' | 'agree' | 'unsorted';

export default function PreSorting({ onComplete, onBack }: PreSortingProps) {
  const [statements, setStatements] = useState<Record<BoxType, Statement[]>>({
    unsorted: mockStatements,
    disagree: [],
    neutral: [],
    agree: [],
  });

  const [draggedStatement, setDraggedStatement] = useState<Statement | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<BoxType | null>(null);

  const handleDragStart = (statement: Statement, from: BoxType) => {
    setDraggedStatement(statement);
    setDraggedFrom(from);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, to: BoxType) => {
    e.preventDefault();
    
    if (!draggedStatement || !draggedFrom) return;

    setStatements((prev) => {
      const newStatements = { ...prev };
      
      // Remove from source
      newStatements[draggedFrom] = newStatements[draggedFrom].filter(
        (s) => s.id !== draggedStatement.id
      );
      
      // Add to destination
      newStatements[to] = [...newStatements[to], draggedStatement];
      
      return newStatements;
    });

    setDraggedStatement(null);
    setDraggedFrom(null);
  };

  const allSorted = statements.unsorted.length === 0;
  const progress = ((mockStatements.length - statements.unsorted.length) / mockStatements.length) * 100;

  const boxColors: Record<BoxType, string> = {
    disagree: 'border-system-red bg-red-500/5',
    neutral: 'border-system-orange bg-orange-500/5',
    agree: 'border-system-green bg-green-500/5',
    unsorted: 'border-quaternary-fill bg-tertiary-background',
  };

  const boxLabels: Record<BoxType, string> = {
    disagree: 'Disagree',
    neutral: 'Neutral',
    agree: 'Agree',
    unsorted: 'Unsorted Statements',
  };

  return (
    <Card className="max-w-6xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-label mb-2">Initial Sorting</h1>
          <p className="text-secondary-label">
            Drag each statement into one of the three boxes based on your initial reaction.
            This is a rough sort - you'll refine your choices in the next step.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-secondary-label">
            Sorted: {mockStatements.length - statements.unsorted.length} of {mockStatements.length}
          </span>
          <div className="w-48 h-2 bg-quaternary-fill rounded-full overflow-hidden">
            <div
              className="h-full bg-system-blue transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Unsorted Statements */}
        <div
          className={`p-4 rounded-lg border-2 ${boxColors.unsorted} min-h-[100px]`}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, 'unsorted')}
        >
          <h3 className="font-medium text-label mb-3">{boxLabels.unsorted}</h3>
          <div className="flex flex-wrap gap-2">
            {statements.unsorted.map((statement) => (
              <div
                key={statement.id}
                draggable
                onDragStart={() => handleDragStart(statement, 'unsorted')}
                className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-quaternary-fill cursor-move hover:shadow-md transition-shadow"
              >
                <p className="text-sm text-label">{statement.text}</p>
              </div>
            ))}
          </div>
          {statements.unsorted.length === 0 && (
            <p className="text-sm text-tertiary-label italic">All statements sorted!</p>
          )}
        </div>

        {/* Sorting Boxes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['disagree', 'neutral', 'agree'] as const).map((boxType) => (
            <div
              key={boxType}
              className={`p-4 rounded-lg border-2 ${boxColors[boxType]} min-h-[200px]`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, boxType)}
            >
              <h3 className="font-medium text-label mb-3">{boxLabels[boxType]}</h3>
              <div className="space-y-2">
                {statements[boxType].map((statement) => (
                  <div
                    key={statement.id}
                    draggable
                    onDragStart={() => handleDragStart(statement, boxType)}
                    className="p-2 bg-white dark:bg-gray-800 rounded border border-quaternary-fill cursor-move hover:shadow-md transition-shadow"
                  >
                    <p className="text-xs text-label">{statement.text}</p>
                  </div>
                ))}
              </div>
              {statements[boxType].length === 0 && (
                <p className="text-sm text-tertiary-label italic">Drop statements here</p>
              )}
            </div>
          ))}
        </div>

        <div className="bg-quaternary-fill/30 p-4 rounded-lg">
          <p className="text-sm text-secondary-label">
            <strong>Instructions:</strong> Drag and drop each statement into the box that best
            represents your initial feeling. You can move statements between boxes at any time.
          </p>
        </div>

        <div className="flex justify-between">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={() =>
              onComplete({
                disagree: statements.disagree,
                neutral: statements.neutral,
                agree: statements.agree,
              })
            }
            disabled={!allSorted}
          >
            Continue to Q-Sort
          </Button>
        </div>
      </div>
    </Card>
  );
}
