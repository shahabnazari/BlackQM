# VQMethod Implementation Guide - Part 2

## Phases 4-5.5: UI Excellence & Data Visualization

**Updated:** September 2025 - World-Class Organization with Perfect Alignment  
**Previous Part**: [IMPLEMENTATION_GUIDE_PART1.md](./IMPLEMENTATION_GUIDE_PART1.md) - Phases 1-3.5  
**Next Part**: [IMPLEMENTATION_GUIDE_PART3.md](./IMPLEMENTATION_GUIDE_PART3.md) - Phases 6-6.85  
**Document Rule**: Maximum 20,000 tokens per document. Content continues in sequentially numbered parts.

### Phase Coverage
- **Phase 4:** Data Visualization & Analytics Excellence
- **Phase 5:** Professional Polish & Delight  
- **Phase 5.5:** Critical UI & User Experience Excellence

### ⚠️ Daily Error Management Protocol
```bash
# Run at 5 PM daily for each phase
npm run typecheck | tee error-log-phase$(PHASE)-$(date +%Y%m%d).txt
# No new errors allowed - fix immediately
```

---

# PHASE 4: DATA VISUALIZATION & ANALYTICS EXCELLENCE

**Duration:** 4-5 days  
**Status:** ✅ COMPLETE (100%)  
**Target:** Tableau-quality visualization with Q-methodology accuracy

## 4.1 Visualization Library Setup

### Install Dependencies

```bash
cd frontend
npm install @visx/visx d3 recharts framer-motion @nivo/core @nivo/scatterplot @nivo/heatmap
npm install react-chartjs-2 chart.js
npm install --save-dev @types/d3
```

### Chart Configuration

```typescript
// frontend/lib/charts/chart-config.ts
export const chartTheme = {
  colors: {
    primary: 'rgb(0, 122, 255)',
    secondary: 'rgb(52, 199, 89)',
    tertiary: 'rgb(255, 59, 48)',
    quaternary: 'rgb(255, 149, 0)',
    scale: [
      '#007AFF',
      '#34C759',
      '#FF3B30',
      '#FF9500',
      '#AF52DE',
      '#5AC8FA',
      '#FFCC00',
      '#FF2D55',
    ],
  },
  fonts: {
    base: '-apple-system, BlinkMacSystemFont, sans-serif',
  },
  animation: {
    duration: 750,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  },
};
```

## 4.2 Q-Methodology Visualizations

### Correlation Heatmap Component

```typescript
// frontend/components/researcher/Analytics/CorrelationHeatmap.tsx
import { ResponsiveHeatMap } from '@nivo/heatmap';
import { Card } from '@/components/apple-ui/Card';

interface CorrelationHeatmapProps {
  data: CorrelationMatrix;
  participants: Participant[];
}

export function CorrelationHeatmap({ data, participants }: CorrelationHeatmapProps) {
  // Transform correlation matrix for Nivo
  const heatmapData = participants.map((p1, i) => ({
    id: p1.id,
    data: participants.map((p2, j) => ({
      x: p2.id,
      y: data[i][j],
    })),
  }));

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Correlation Matrix</h3>
      <div className="h-96">
        <ResponsiveHeatMap
          data={heatmapData}
          margin={{ top: 60, right: 90, bottom: 60, left: 90 }}
          valueFormat=">-.2f"
          axisTop={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: -45,
            legend: '',
            legendOffset: 46,
          }}
          axisRight={null}
          axisBottom={null}
          axisLeft={{
            tickSize: 5,
            tickPadding: 5,
            tickRotation: 0,
            legend: 'Participants',
            legendPosition: 'middle',
            legendOffset: -72,
          }}
          colors={{
            type: 'diverging',
            scheme: 'red_yellow_blue',
            divergeAt: 0.5,
            minValue: -1,
            maxValue: 1,
          }}
          emptyColor="#555555"
          borderColor={{
            from: 'color',
            modifiers: [['darker', 0.6]],
          }}
          labelTextColor={{
            from: 'color',
            modifiers: [['darker', 2]],
          }}
          tooltip={({ cell }) => (
            <div className="bg-white p-2 shadow-lg rounded">
              <strong>{cell.data.x} × {cell.serieId}</strong>
              <div>Correlation: {cell.formattedValue}</div>
            </div>
          )}
        />
      </div>
    </Card>
  );
}
```

### Factor Loading Chart

```typescript
// frontend/components/researcher/Analytics/FactorLoadingChart.tsx
import { Scatter } from 'react-chartjs-2';
import { Chart as ChartJS, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

interface FactorLoadingChartProps {
  loadings: FactorLoading[];
  factorX: number;
  factorY: number;
}

export function FactorLoadingChart({ loadings, factorX, factorY }: FactorLoadingChartProps) {
  const data = {
    datasets: [{
      label: 'Participant Loadings',
      data: loadings.map(l => ({
        x: l.factors[factorX],
        y: l.factors[factorY],
        participantId: l.participantId,
      })),
      backgroundColor: 'rgba(0, 122, 255, 0.6)',
      borderColor: 'rgba(0, 122, 255, 1)',
      borderWidth: 2,
      pointRadius: 6,
      pointHoverRadius: 8,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const point = context.raw as any;
            return [
              `Participant: ${point.participantId}`,
              `Factor ${factorX + 1}: ${point.x.toFixed(3)}`,
              `Factor ${factorY + 1}: ${point.y.toFixed(3)}`,
            ];
          },
        },
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: `Factor ${factorX + 1}`,
        },
        min: -1,
        max: 1,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
      y: {
        title: {
          display: true,
          text: `Factor ${factorY + 1}`,
        },
        min: -1,
        max: 1,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Factor Loadings</h3>
      <div className="h-96">
        <Scatter data={data} options={options} />
      </div>
    </Card>
  );
}
```

### Eigenvalue Scree Plot

```typescript
// frontend/components/researcher/Analytics/ScreePlot.tsx
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

interface ScreePlotProps {
  eigenvalues: number[];
}

export function ScreePlot({ eigenvalues }: ScreePlotProps) {
  const data = {
    labels: eigenvalues.map((_, i) => `Factor ${i + 1}`),
    datasets: [
      {
        label: 'Eigenvalues',
        data: eigenvalues,
        borderColor: 'rgb(0, 122, 255)',
        backgroundColor: 'rgba(0, 122, 255, 0.1)',
        borderWidth: 2,
        tension: 0.4,
      },
      {
        label: 'Kaiser Criterion',
        data: Array(eigenvalues.length).fill(1),
        borderColor: 'rgb(255, 59, 48)',
        borderDash: [5, 5],
        borderWidth: 2,
        pointRadius: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Scree Plot - Factor Extraction',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Eigenvalue',
        },
      },
    },
  };

  return (
    <Card className="p-6">
      <div className="h-96">
        <Line data={data} options={options} />
      </div>
    </Card>
  );
}
```

### Factor Arrays Visualization

```typescript
// frontend/components/researcher/Analytics/FactorArrays.tsx
import { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';

interface FactorArraysProps {
  factorArrays: FactorArray[];
  statements: Statement[];
}

export function FactorArrays({ factorArrays, statements }: FactorArraysProps) {
  const [selectedFactor, setSelectedFactor] = useState(0);

  const currentArray = factorArrays[selectedFactor];
  const distribution = currentArray.distribution;

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Factor Arrays</h3>
        <div className="flex gap-2">
          {factorArrays.map((_, index) => (
            <Button
              key={index}
              variant={selectedFactor === index ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setSelectedFactor(index)}
            >
              Factor {index + 1}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="text-sm text-secondary-label">
          Variance Explained: {currentArray.varianceExplained.toFixed(1)}%
        </div>

        {/* Idealized Q-Sort Grid */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-center gap-2">
            {distribution.map((count, column) => {
              const value = column - Math.floor(distribution.length / 2);
              return (
                <div key={column} className="flex flex-col items-center">
                  <div className="text-xs font-medium mb-2">
                    {value > 0 ? `+${value}` : value}
                  </div>
                  <div className="flex flex-col gap-1">
                    {currentArray.placements[column].map((statementId, index) => {
                      const statement = statements.find(s => s.id === statementId);
                      return (
                        <div
                          key={index}
                          className="w-20 h-20 bg-white border border-gray-300 rounded p-1 text-xs overflow-hidden"
                          title={statement?.text}
                        >
                          {statement?.text.substring(0, 30)}...
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Z-Scores Table */}
        <div className="mt-6">
          <h4 className="font-medium mb-3">Statement Rankings</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Statement</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Z-Score</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Rank</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentArray.zScores
                  .sort((a, b) => b.score - a.score)
                  .map((item, index) => {
                    const statement = statements.find(s => s.id === item.statementId);
                    return (
                      <tr key={item.statementId}>
                        <td className="px-4 py-2 text-sm">{statement?.text}</td>
                        <td className="px-4 py-2 text-sm text-center">{item.score.toFixed(3)}</td>
                        <td className="px-4 py-2 text-sm text-center">{index + 1}</td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Card>
  );
}
```

## 4.3 Real-time Analytics Dashboard

### Dashboard Layout

```typescript
// frontend/app/(researcher)/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CorrelationHeatmap } from '@/components/researcher/Analytics/CorrelationHeatmap';
import { FactorLoadingChart } from '@/components/researcher/Analytics/FactorLoadingChart';
import { ScreePlot } from '@/components/researcher/Analytics/ScreePlot';
import { FactorArrays } from '@/components/researcher/Analytics/FactorArrays';
import { ParticipantFlow } from '@/components/researcher/Analytics/ParticipantFlow';
import { ExportPanel } from '@/components/researcher/Analytics/ExportPanel';

export default function AnalyticsPage() {
  const { id: studyId } = useParams();
  const [analysisData, setAnalysisData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysisData();
    setupWebSocket();
  }, [studyId]);

  const fetchAnalysisData = async () => {
    const response = await fetch(`/api/studies/${studyId}/analysis`);
    const data = await response.json();
    setAnalysisData(data);
    setLoading(false);
  };

  const setupWebSocket = () => {
    const ws = new WebSocket(`${process.env.NEXT_PUBLIC_WS_URL}/analysis/${studyId}`);

    ws.onmessage = (event) => {
      const update = JSON.parse(event.data);
      setAnalysisData(prev => ({ ...prev, ...update }));
    };

    return () => ws.close();
  };

  if (loading) {
    return <div>Loading analysis...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Study Analytics</h1>
        <p className="text-secondary-label mt-2">
          Real-time analysis of your Q-methodology study
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CorrelationHeatmap
          data={analysisData.correlationMatrix}
          participants={analysisData.participants}
        />

        <FactorLoadingChart
          loadings={analysisData.factorLoadings}
          factorX={0}
          factorY={1}
        />

        <ScreePlot
          eigenvalues={analysisData.eigenvalues}
        />

        <ParticipantFlow
          data={analysisData.participantFlow}
        />
      </div>

      <div className="mt-6">
        <FactorArrays
          factorArrays={analysisData.factorArrays}
          statements={analysisData.statements}
        />
      </div>

      <div className="mt-6">
        <ExportPanel studyId={studyId} />
      </div>
    </div>
  );
}
```

### Export Functionality

```typescript
// frontend/components/researcher/Analytics/ExportPanel.tsx
import { useState } from 'react';
import { Button } from '@/components/apple-ui/Button';
import { Card } from '@/components/apple-ui/Card';

export function ExportPanel({ studyId }: { studyId: string }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: string) => {
    setExporting(true);

    const response = await fetch(`/api/studies/${studyId}/export`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format }),
    });

    if (response.ok) {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `study-${studyId}-${format}.${format}`;
      a.click();
    }

    setExporting(false);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Export Data</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Button
          variant="secondary"
          onClick={() => handleExport('csv')}
          disabled={exporting}
        >
          Export CSV
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleExport('excel')}
          disabled={exporting}
        >
          Export Excel
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleExport('pqmethod')}
          disabled={exporting}
        >
          Export PQMethod
        </Button>
        <Button
          variant="secondary"
          onClick={() => handleExport('spss')}
          disabled={exporting}
        >
          Export SPSS
        </Button>
      </div>
    </Card>
  );
}
```

## 🔍 Testing Checkpoint 4.1

- [ ] All visualizations render correctly
- [ ] Real-time updates work via WebSocket
- [ ] Export formats generate properly
- [ ] Charts are responsive on mobile
- [ ] Performance with 100+ participants
- [ ] PQMethod correlation ≥0.99

---

# PHASE 5: PROFESSIONAL POLISH & DELIGHT

**Duration:** 3-4 days  
**Status:** ✅ COMPLETE (100%)  
**Target:** SurveyMonkey-level polish with Apple delight

## 5.1 Skeleton Screens

### Base Skeleton Component

```typescript
// frontend/components/ui/Skeleton/Skeleton.tsx
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  shimmer?: boolean;
}

export function Skeleton({ className, shimmer = true }: SkeletonProps) {
  return (
    <div
      className={cn(
        'bg-gray-200 dark:bg-gray-700 rounded-md',
        shimmer && 'animate-pulse relative overflow-hidden',
        className
      )}
    >
      {shimmer && (
        <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      )}
    </div>
  );
}

// Add to tailwind.config.js
// animation: {
//   shimmer: 'shimmer 2s linear infinite',
// },
// keyframes: {
//   shimmer: {
//     '100%': { transform: 'translateX(100%)' },
//   },
// },
```

### Component-Specific Skeletons

```typescript
// frontend/components/ui/Skeleton/SkeletonCard.tsx
export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex gap-2 mt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}

// frontend/components/ui/Skeleton/SkeletonTable.tsx
export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" /> {/* Header */}
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
```

## 5.2 Empty States

### Empty State Component

```typescript
// frontend/components/ui/EmptyState/EmptyState.tsx
import { motion } from 'framer-motion';
import { Button } from '@/components/apple-ui/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      {icon && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6 text-gray-400"
        >
          {icon}
        </motion.div>
      )}

      <h3 className="text-lg font-semibold text-label mb-2">{title}</h3>

      {description && (
        <p className="text-secondary-label max-w-sm mb-6">{description}</p>
      )}

      {action && (
        <Button onClick={action.onClick} variant="primary">
          {action.label}
        </Button>
      )}
    </motion.div>
  );
}
```

### Context-Specific Empty States

```typescript
// frontend/components/ui/EmptyState/EmptyStates.tsx
export const EmptyStates = {
  NoStudies: () => (
    <EmptyState
      icon={<StudyIcon className="w-16 h-16" />}
      title="No studies yet"
      description="Create your first Q-methodology study to get started"
      action={{
        label: "Create Study",
        onClick: () => window.location.href = '/studies/create',
      }}
    />
  ),

  NoParticipants: () => (
    <EmptyState
      icon={<UsersIcon className="w-16 h-16" />}
      title="No participants yet"
      description="Share your study link to invite participants"
      action={{
        label: "Copy Invite Link",
        onClick: () => copyInviteLink(),
      }}
    />
  ),

  NoResults: () => (
    <EmptyState
      icon={<ChartIcon className="w-16 h-16" />}
      title="No results to display"
      description="Data will appear here once participants complete the study"
    />
  ),
};
```

## 5.3 Micro-animations

### Success Animations

```typescript
// frontend/components/ui/Animations/SuccessAnimation.tsx
import { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { motion } from 'framer-motion';

export function SuccessAnimation({ trigger }: { trigger: boolean }) {
  useEffect(() => {
    if (trigger) {
      // Confetti burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#007AFF', '#34C759', '#FF9500'],
      });
    }
  }, [trigger]);

  if (!trigger) return null;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center pointer-events-none z-50"
    >
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 0.5,
          times: [0, 0.2, 0.5, 1],
        }}
        className="text-8xl"
      >
        🎉
      </motion.div>
    </motion.div>
  );
}
```

### Enhanced Drag & Drop

```typescript
// frontend/components/ui/DragDrop/EnhancedDraggable.tsx
import { useDraggable } from '@dnd-kit/core';
import { motion, useMotionValue, useTransform } from 'framer-motion';

export function EnhancedDraggable({ id, children }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useTransform([x, y], ([x, y]) => {
    const distance = Math.sqrt(x * x + y * y);
    return 1 + Math.min(distance / 1000, 0.1);
  });

  return (
    <motion.div
      ref={setNodeRef}
      style={{
        x: transform?.x ?? 0,
        y: transform?.y ?? 0,
        scale,
      }}
      animate={{
        scale: isDragging ? 1.05 : 1,
        rotate: isDragging ? 2 : 0,
        boxShadow: isDragging
          ? '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
          : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
      }}
      className="cursor-move"
      {...listeners}
      {...attributes}
    >
      {children}
    </motion.div>
  );
}
```

### Loading Personality

```typescript
// frontend/components/ui/Loading/LoadingMessages.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const messages = [
  "Analyzing your data...",
  "Crunching the numbers...",
  "Finding patterns...",
  "Almost there...",
  "Making it perfect...",
  "Applying some magic...",
  "Computing Q-factors...",
  "Extracting insights...",
];

export function LoadingMessages() {
  const [currentMessage, setCurrentMessage] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence mode="wait">
      <motion.p
        key={currentMessage}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="text-secondary-label text-sm"
      >
        {messages[currentMessage]}
      </motion.p>
    </AnimatePresence>
  );
}
```

## 🔍 Testing Checkpoint 5.1

- [ ] Skeleton screens show during loading
- [ ] Empty states display correctly
- [ ] Confetti animation triggers on success
- [ ] Drag animations are smooth (60fps)
- [ ] Loading messages rotate properly
- [ ] All animations respect prefers-reduced-motion

---

# PHASE 5.5: CRITICAL UI & USER EXPERIENCE EXCELLENCE

**Duration:** 3-4 days  
**Status:** ✅ COMPLETE (100%)  
**Priority:** CRITICAL - User experience refinement

## 5.5.1 Responsive Design System

### Breakpoint Management

```typescript
// lib/responsive.ts
export const breakpoints = {
  xs: 375,  // iPhone SE
  sm: 640,  // Small tablet
  md: 768,  // iPad
  lg: 1024, // iPad Pro
  xl: 1280, // Desktop
  xxl: 1536 // Large desktop
};

export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState('xl');
  
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < breakpoints.sm) setBreakpoint('xs');
      else if (width < breakpoints.md) setBreakpoint('sm');
      else if (width < breakpoints.lg) setBreakpoint('md');
      else if (width < breakpoints.xl) setBreakpoint('lg');
      else if (width < breakpoints.xxl) setBreakpoint('xl');
      else setBreakpoint('xxl');
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return breakpoint;
};
```

## 5.5.2 Accessibility Implementation

### WCAG AA Compliance

```typescript
// components/accessibility/SkipLinks.tsx
export function SkipLinks() {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>
      <a href="#footer" className="skip-link">
        Skip to footer
      </a>
    </div>
  );
}
```

### Keyboard Navigation

```typescript
// hooks/useKeyboardNavigation.ts
export function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Tab trap for modals
      if (e.key === 'Tab' && modalOpen) {
        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        if (e.shiftKey && document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
      
      // Escape to close
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);
}
```

## 5.5.3 Performance Optimization

### Image Optimization

```typescript
// components/optimized/OptimizedImage.tsx
import Image from 'next/image';

export function OptimizedImage({ src, alt, priority = false }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      priority={priority}
      placeholder="blur"
      blurDataURL={generateBlurDataURL(src)}
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
    />
  );
}
```

### Code Splitting

```typescript
// Dynamic imports for heavy components
const HeavyChart = dynamic(
  () => import('@/components/charts/HeavyChart'),
  { 
    loading: () => <ChartSkeleton />,
    ssr: false 
  }
);
```

## 5.5.4 Touch Interactions

### Mobile Gestures

```typescript
// hooks/useSwipeGesture.ts
export function useSwipeGesture(onSwipe: (direction: string) => void) {
  const [touchStart, setTouchStart] = useState(null);
  
  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart({
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    });
  };
  
  const handleTouchEnd = (e: TouchEvent) => {
    if (!touchStart) return;
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };
    
    const dx = touchEnd.x - touchStart.x;
    const dy = touchEnd.y - touchStart.y;
    
    if (Math.abs(dx) > Math.abs(dy)) {
      onSwipe(dx > 0 ? 'right' : 'left');
    } else {
      onSwipe(dy > 0 ? 'down' : 'up');
    }
  };
  
  return { handleTouchStart, handleTouchEnd };
}
```

## 5.5.5 Error Boundaries

### Global Error Boundary

```typescript
// components/ErrorBoundary.tsx
export class ErrorBoundary extends Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    // Send to error tracking service
    Sentry.captureException(error);
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          error={this.state.error}
          resetErrorBoundary={() => this.setState({ hasError: false })}
        />
      );
    }
    
    return this.props.children;
  }
}
```

## Testing Checkpoint 5.5

- [ ] All pages responsive down to 375px width
- [ ] WCAG AA compliance verified
- [ ] Keyboard navigation works throughout
- [ ] Touch gestures functional on mobile
- [ ] Images optimized with lazy loading
- [ ] Error boundaries catch and report errors
- [ ] Performance metrics meet targets (LCP < 2.5s)

---

# Summary

This Part 2 covers:

- **Phase 4**: Data Visualization & Analytics Excellence
- **Phase 5**: Professional Polish & Delight
- **Phase 5.5**: Critical UI & User Experience Excellence

Continue to **IMPLEMENTATION_GUIDE_PART3.md** for Phases 6-6.85.

**Document Size**: ~18,000 tokens
