'use client';

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';

interface Statement {
  id: string;
  text: string;
}

interface QSortGridProps {
  onComplete: (data?: any) => void;
  onBack: () => void;
  preSortData?: {
    disagree: Statement[];
    neutral: Statement[];
    agree: Statement[];
  };
}

// Q-Sort grid configuration (quasi-normal distribution with 9 columns)
const gridConfig = [
  { column: -4, maxItems: 1, label: 'Strongly Disagree' },
  { column: -3, maxItems: 2, label: 'Disagree' },
  { column: -2, maxItems: 3, label: 'Somewhat Disagree' },
  { column: -1, maxItems: 3, label: 'Slightly Disagree' },
  { column: 0, maxItems: 4, label: 'Neutral' },
  { column: 1, maxItems: 3, label: 'Slightly Agree' },
  { column: 2, maxItems: 3, label: 'Somewhat Agree' },
  { column: 3, maxItems: 2, label: 'Agree' },
  { column: 4, maxItems: 1, label: 'Strongly Agree' },
];

export default function QSortGrid({ onComplete, onBack, preSortData }: QSortGridProps) {
  const [sourceBoxes, setSourceBoxes] = useState<Record<string, Statement[]>>({
    disagree: preSortData?.disagree || [],
    neutral: preSortData?.neutral || [],
    agree: preSortData?.agree || [],
  });

  const [grid, setGrid] = useState<Record<number, Statement[]>>(
    gridConfig.reduce((acc, col) => ({ ...acc, [col.column]: [] }), {})
  );

  const [draggedStatement, setDraggedStatement] = useState<Statement | null>(null);
  const [draggedFrom, setDraggedFrom] = useState<{ type: 'box' | 'grid'; location: string | number } | null>(null);

  // Calculate if all statements are placed
  const totalStatements = Object.values(sourceBoxes).flat().length + Object.values(grid).flat().length;
  const placedInGrid = Object.values(grid).flat().length;
  const allPlaced = Object.values(sourceBoxes).every((box) => box.length === 0);

  const handleDragStart = (statement: Statement, from: { type: 'box' | 'grid'; location: string | number }) => {
    setDraggedStatement(statement);
    setDraggedFrom(from);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnGrid = (e: React.DragEvent, column: number) => {
    e.preventDefault();
    if (!draggedStatement || !draggedFrom) return;

    const columnConfig = gridConfig.find((c: any) => c.column === column);
    if (!columnConfig) return;

    // Check if column is full
    if (grid[column].length >= columnConfig.maxItems) {
      alert(`This column can only hold ${columnConfig.maxItems} statement(s)`);
      return;
    }

    // Update state
    if (draggedFrom.type === 'box') {
      setSourceBoxes((prev) => ({
        ...prev,
        [draggedFrom.location]: prev[draggedFrom.location as string].filter(
          (s: any) => s.id !== draggedStatement.id
        ),
      }));
    } else {
      setGrid((prev) => ({
        ...prev,
        [draggedFrom.location]: prev[draggedFrom.location as number].filter(
          (s: any) => s.id !== draggedStatement.id
        ),
      }));
    }

    setGrid((prev) => ({
      ...prev,
      [column]: [...prev[column], draggedStatement],
    }));

    setDraggedStatement(null);
    setDraggedFrom(null);
  };

  const handleDropOnBox = (e: React.DragEvent, boxName: string) => {
    e.preventDefault();
    if (!draggedStatement || !draggedFrom) return;

    // Remove from source
    if (draggedFrom.type === 'box') {
      setSourceBoxes((prev) => ({
        ...prev,
        [draggedFrom.location]: prev[draggedFrom.location as string].filter(
          (s: any) => s.id !== draggedStatement.id
        ),
      }));
    } else {
      setGrid((prev) => ({
        ...prev,
        [draggedFrom.location]: prev[draggedFrom.location as number].filter(
          (s: any) => s.id !== draggedStatement.id
        ),
      }));
    }

    // Add to box
    setSourceBoxes((prev) => ({
      ...prev,
      [boxName]: [...prev[boxName], draggedStatement],
    }));

    setDraggedStatement(null);
    setDraggedFrom(null);
  };

  return (
    <Card className="max-w-7xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-label mb-2">Q-Sort Grid</h1>
          <p className="text-secondary-label">
            Arrange the statements on the grid according to your level of agreement.
            Each column has a limited number of spaces.
          </p>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-secondary-label">
            Placed: {placedInGrid} of {totalStatements} statements
          </span>
          <div className="w-48 h-2 bg-quaternary-fill rounded-full overflow-hidden">
            <div
              className="h-full bg-system-blue transition-all duration-300"
              style={{ width: `${(placedInGrid / totalStatements) * 100}%` }}
            />
          </div>
        </div>

        {/* Source Boxes */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {Object.entries(sourceBoxes).map(([boxName, statements]) => (
            <div
              key={boxName}
              className={`p-3 rounded-lg border-2 min-h-[100px] ${
                boxName === 'disagree'
                  ? 'border-system-red bg-red-500/5'
                  : boxName === 'neutral'
                  ? 'border-system-orange bg-orange-500/5'
                  : 'border-system-green bg-green-500/5'
              }`}
              onDragOver={handleDragOver}
              onDrop={(e: any) => handleDropOnBox(e, boxName)}
            >
              <h3 className="text-sm font-medium text-label mb-2 capitalize">{boxName}</h3>
              <div className="space-y-1">
                {statements.map((statement) => (
                  <div
                    key={statement.id}
                    draggable
                    onDragStart={() => handleDragStart(statement, { type: 'box', location: boxName })}
                    className="p-2 bg-white dark:bg-gray-800 rounded text-xs cursor-move hover:shadow-md transition-shadow"
                  >
                    {statement.text}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Q-Sort Grid */}
        <div className="overflow-x-auto">
          <div className="grid grid-cols-9 gap-2 min-w-[800px]">
            {gridConfig.map((col) => (
              <div key={col.column} className="flex flex-col">
                <div className="text-center mb-2">
                  <div className="text-lg font-bold text-label">{col.column > 0 ? '+' : ''}{col.column}</div>
                  <div className="text-xs text-secondary-label">{col.label}</div>
                </div>
                <div
                  className={`flex-1 border-2 rounded-lg p-2 min-h-[200px] ${
                    col.column < 0
                      ? 'border-system-red bg-red-500/5'
                      : col.column === 0
                      ? 'border-system-orange bg-orange-500/5'
                      : 'border-system-green bg-green-500/5'
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e: any) => handleDropOnGrid(e, col.column)}
                >
                  <div className="space-y-1">
                    {grid[col.column].map((statement) => (
                      <div
                        key={statement.id}
                        draggable
                        onDragStart={() =>
                          handleDragStart(statement, { type: 'grid', location: col.column })
                        }
                        className="p-2 bg-white dark:bg-gray-800 rounded text-xs cursor-move hover:shadow-md transition-shadow"
                      >
                        {statement.text}
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-tertiary-label text-center mt-2">
                    {grid[col.column].length}/{col.maxItems}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-quaternary-fill/30 p-4 rounded-lg">
          <p className="text-sm text-secondary-label">
            <strong>Instructions:</strong> Drag statements from the boxes above into the grid.
            Place statements you most agree with on the right (+4) and those you most disagree
            with on the left (-4). Each column has a limited number of spaces.
          </p>
        </div>

        <div className="flex justify-between">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={() => onComplete({ grid })}
            disabled={!allPlaced}
          >
            Continue to Commentary
          </Button>
        </div>
      </div>
    </Card>
  );
}
