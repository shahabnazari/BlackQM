'use client';

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';

interface CommentaryProps {
  onComplete: (data?: any) => void;
  onBack: () => void;
  qSortData?: any;
}

// interface CommentaryItem {
//   statementId: string;
//   statementText: string;
//   position: number;
//   comment: string;
// }

// Mock extreme statements for demonstration
const mockExtremeStatements = [
  {
    id: '1',
    text: 'Climate change is the most pressing issue of our time',
    position: 4,
  },
  {
    id: '2',
    text: 'Economic growth should be prioritized over environmental protection',
    position: -4,
  },
  {
    id: '7',
    text: 'Renewable energy is economically viable today',
    position: 3,
  },
  {
    id: '6',
    text: 'We should focus on adaptation rather than prevention',
    position: -3,
  },
];

export default function Commentary({ onComplete, onBack }: CommentaryProps) {
  const [comments, setComments] = useState<Record<string, string>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  const currentStatement = mockExtremeStatements[currentIndex];
  const isLastStatement = currentIndex === mockExtremeStatements.length - 1;
  const allCommented = mockExtremeStatements.every((s) => comments[s.id]?.length >= 50);

  const handleCommentChange = (value: string) => {
    setComments((prev) => ({
      ...prev,
      [currentStatement.id]: value,
    }));
  };

  const handleNext = () => {
    if (currentIndex < mockExtremeStatements.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleComplete = () => {
    const commentaryData = mockExtremeStatements.map((statement) => ({
      statementId: statement.id,
      statementText: statement.text,
      position: statement.position,
      comment: comments[statement.id] || '',
    }));
    onComplete({ commentary: commentaryData });
  };

  const currentComment = comments[currentStatement.id] || '';
  const wordCount = currentComment.split(/\s+/).filter(Boolean).length;

  return (
    <Card className="max-w-3xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-label mb-2">
            Post-Sort Commentary
          </h1>
          <p className="text-secondary-label">
            Please explain why you placed these statements at the extreme positions.
          </p>
        </div>

        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-secondary-label">
            Statement {currentIndex + 1} of {mockExtremeStatements.length}
          </span>
          <div className="flex space-x-2">
            {mockExtremeStatements.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex
                    ? 'bg-system-blue'
                    : comments[mockExtremeStatements[index].id]
                    ? 'bg-system-green'
                    : 'bg-quaternary-fill'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-4 bg-quaternary-fill/30 rounded-lg">
          <div className="flex items-start justify-between mb-2">
            <span className="text-sm font-medium text-secondary-label">
              You placed this at position:
            </span>
            <span
              className={`text-lg font-bold ${
                currentStatement.position > 0
                  ? 'text-system-green'
                  : currentStatement.position < 0
                  ? 'text-system-red'
                  : 'text-system-orange'
              }`}
            >
              {currentStatement.position > 0 ? '+' : ''}{currentStatement.position}
            </span>
          </div>
          <p className="text-label italic">"{currentStatement.text}"</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-label mb-2">
            Why did you place this statement at this position?
          </label>
          <p className="text-sm text-secondary-label mb-2">
            Please provide brief comments about your placement decision.
          </p>
          <textarea
            className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label placeholder:text-tertiary-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            rows={6}
            placeholder="Please explain your reasoning (minimum 50 words)..."
            value={currentComment}
            onChange={(e) => handleCommentChange(e.target.value)}
          />
          <div className="flex justify-between mt-2">
            <span
              className={`text-sm ${
                wordCount >= 50 ? 'text-system-green' : 'text-secondary-label'
              }`}
            >
              {wordCount < 50 ? `${(50 - wordCount) * 5} characters remaining` : `${wordCount} words`}
            </span>
            {wordCount >= 50 && (
              <span className="text-sm text-system-green">✓ Requirement met</span>
            )}
          </div>
        </div>

        <div className="flex justify-between">
          {!isLastStatement ? (
            <>
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={wordCount < 50}
              >
                Next Statement
              </Button>
              <div className="flex space-x-2">
                {currentIndex > 0 && (
                  <Button variant="secondary" onClick={handlePrevious}>
                    Previous
                  </Button>
                )}
                <Button variant="secondary" onClick={onBack} disabled={currentIndex === 0}>
                  Back to Q-Sort
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex space-x-2">
                <Button variant="secondary" onClick={handlePrevious}>
                  Previous
                </Button>
                <Button variant="secondary" onClick={onBack}>
                  Back to Q-Sort
                </Button>
              </div>
              <Button
                variant="primary"
                size="large"
                onClick={handleComplete}
                disabled={!allCommented}
              >
                Continue to Survey
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
