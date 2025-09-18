'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  ChartBarIcon,
  CubeTransparentIcon,
  BeakerIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  TableCellsIcon,
  CircleStackIcon,
  DocumentChartBarIcon,
} from '@heroicons/react/24/outline';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';

interface AnalysisTool {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  status: 'available' | 'coming-soon' | 'beta';
  category: 'statistical' | 'qualitative' | 'visualization' | 'data-processing';
}

const analysisTools: AnalysisTool[] = [
  {
    id: 'q-methodology',
    title: 'Q-Methodology Analysis',
    description:
      'Complete Q-sort analysis with factor extraction, rotation, and interpretation',
    icon: CubeTransparentIcon as any,
    href: '/analysis/q-methodology',
    status: 'available',
    category: 'statistical',
  },
  {
    id: 'factor-analysis',
    title: 'Factor Analysis',
    description:
      'Advanced factor analysis with multiple extraction and rotation methods',
    icon: ChartBarIcon as any,
    href: '/analysis/factor-analysis',
    status: 'coming-soon',
    category: 'statistical',
  },
  {
    id: 'cluster-analysis',
    title: 'Cluster Analysis',
    description:
      'Hierarchical and k-means clustering for participant segmentation',
    icon: CircleStackIcon as any,
    href: '/analysis/cluster-analysis',
    status: 'coming-soon',
    category: 'statistical',
  },
  {
    id: 'text-analysis',
    title: 'Text Analysis',
    description:
      'Sentiment analysis and theme extraction from qualitative responses',
    icon: DocumentChartBarIcon as any,
    href: '/analysis/text-analysis',
    status: 'beta',
    category: 'qualitative',
  },
  {
    id: 'correlation-matrix',
    title: 'Correlation Matrix',
    description: 'Interactive correlation matrices with significance testing',
    icon: TableCellsIcon as any,
    href: '/analysis/correlation-matrix',
    status: 'coming-soon',
    category: 'visualization',
  },
  {
    id: 'regression-analysis',
    title: 'Regression Analysis',
    description: 'Linear, logistic, and multivariate regression models',
    icon: ArrowTrendingUpIcon as any,
    href: '/analysis/regression',
    status: 'coming-soon',
    category: 'statistical',
  },
  {
    id: 'thematic-analysis',
    title: 'Thematic Analysis',
    description: 'Qualitative data coding and theme development tools',
    icon: AcademicCapIcon as any,
    href: '/analysis/thematic',
    status: 'coming-soon',
    category: 'qualitative',
  },
  {
    id: 'data-cleaning',
    title: 'Data Cleaning',
    description: 'Data preprocessing, cleaning, and transformation utilities',
    icon: BeakerIcon as any,
    href: '/analysis/data-cleaning',
    status: 'beta',
    category: 'data-processing',
  },
];

const categoryLabels = {
  statistical: 'Statistical Analysis',
  qualitative: 'Qualitative Analysis',
  visualization: 'Data Visualization',
  'data-processing': 'Data Processing',
};

export default function AnalysisHubPage() {
  const router = useRouter();

  const handleToolClick = (tool: AnalysisTool) => {
    if (tool.status === 'available' || tool.status === 'beta') {
      router.push(tool.href);
    }
  };

  const groupedTools = analysisTools.reduce(
    (acc, tool) => {
      if (!acc[tool.category]) {
        acc[tool.category] = [];
      }
      const categoryTools = acc[tool.category];
      if (categoryTools) {
        categoryTools.push(tool);
      }
      return acc;
    },
    {} as Record<string, AnalysisTool[]>
  );

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Analysis Tools</h1>
        <p className="text-text-secondary">
          Comprehensive analysis toolkit for research data processing and
          visualization
        </p>
      </div>

      {/* Tool Categories */}
      {Object.entries(groupedTools).map(([category, tools]) => (
        <div key={category} className="mb-10">
          <h2 className="text-xl font-semibold mb-4">
            {categoryLabels[category as keyof typeof categoryLabels]}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tools.map((tool: any) => {
              const Icon = tool.icon;
              const isDisabled = tool.status === 'coming-soon';

              return (
                <div
                  key={tool.id}
                  onClick={() => !isDisabled && handleToolClick(tool)}
                  className={isDisabled ? '' : 'cursor-pointer'}
                >
                  <Card
                    className={`p-5 transition-all hover:shadow-lg ${
                      isDisabled ? 'opacity-60' : 'hover:scale-[1.02]'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <Icon className="w-8 h-8 text-primary" />
                      {tool.status === 'beta' && (
                        <Badge variant="secondary">Beta</Badge>
                      )}
                      {tool.status === 'coming-soon' && (
                        <Badge variant="secondary">Coming Soon</Badge>
                      )}
                    </div>

                    <h3 className="font-semibold text-lg mb-2">{tool.title}</h3>
                    <p className="text-sm text-text-secondary mb-4">
                      {tool.description}
                    </p>

                    <Button
                      variant={isDisabled ? 'secondary' : 'primary'}
                      size="small"
                      className="w-full"
                      disabled={isDisabled}
                      onClick={() => !isDisabled && handleToolClick(tool)}
                    >
                      {isDisabled ? 'Coming Soon' : 'Open Tool'}
                    </Button>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Quick Stats */}
      <div className="mt-10 p-6 bg-surface-secondary rounded-lg">
        <h3 className="font-semibold mb-3">Platform Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-2xl font-bold text-primary">
              {analysisTools.filter((t: any) => t.status === 'available').length}
            </div>
            <div className="text-text-secondary">Available Tools</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-system-blue">
              {analysisTools.filter((t: any) => t.status === 'beta').length}
            </div>
            <div className="text-text-secondary">Beta Features</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-text-tertiary">
              {analysisTools.filter((t: any) => t.status === 'coming-soon').length}
            </div>
            <div className="text-text-secondary">Coming Soon</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-system-green">
              {Object.keys(categoryLabels).length}
            </div>
            <div className="text-text-secondary">Categories</div>
          </div>
        </div>
      </div>
    </div>
  );
}
