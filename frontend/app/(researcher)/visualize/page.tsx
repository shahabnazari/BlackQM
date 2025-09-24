'use client';

import {
  CorrelationHeatmap,
  DashboardBuilder,
  DistinguishingStatements,
  EigenvalueScreePlot,
  FactorLoadingChart,
  QSortDistribution,
} from '@/components/visualizations';
import { ChartExporter } from '@/lib/visualization/export';
import { motion } from 'framer-motion';
import { useState } from 'react';

// Generate demo data
const generateDemoData = () => {
  // Eigenvalue data
  const eigenvalueData = Array.from({ length: 8 }, (_, i) => ({
    factor: i + 1,
    eigenvalue: Math.max(0.5, 5 - i * 0.7) + Math.random() * 0.3,
    varianceExplained: (20 - i * 2) * (1 + Math.random() * 0.1),
    cumulativeVariance: Math.min(95, (i + 1) * 12),
  }));

  // Correlation data
  const participants = Array.from({ length: 15 }, (_, i) => `P${i + 1}`);
  const correlationData: any[] = [];
  participants.forEach((p1, i) => {
    participants.forEach((p2, j) => {
      if (i <= j) {
        correlationData.push({
          participant1: p1,
          participant2: p2,
          correlation: i === j ? 1 : (Math.random() * 2 - 1) * 0.8,
        });
      }
    });
  });

  // Factor loading data
  const factorLoadingData = participants.map((p: any) => {
    const factor1 = (Math.random() * 2 - 1) * 0.9;
    const factor2 = (Math.random() * 2 - 1) * 0.9;
    const factor3 = (Math.random() * 2 - 1) * 0.9;
    const allLoadings = [
      { factor: 'Factor 1', value: factor1 },
      { factor: 'Factor 2', value: factor2 },
      { factor: 'Factor 3', value: factor3 },
    ];
    const loadingStrength = Math.sqrt(
      factor1 * factor1 + factor2 * factor2 + factor3 * factor3
    );

    return {
      participant: p,
      x: factor1,
      y: factor2,
      z: factor3,
      loadingStrength,
      definingFactor:
        ['Factor 1', 'Factor 2', 'Factor 3'][Math.floor(Math.random() * 3)] ||
        'Factor 1',
      allLoadings,
    };
  });

  // Q-sort distribution data
  const distributionData = Array.from({ length: 9 }, (_, i) => ({
    value: i - 4,
    count: [1, 2, 4, 6, 8, 6, 4, 2, 1][i] || 0,
    expectedCount: [1, 2, 4, 6, 8, 6, 4, 2, 1][i] || 0,
  }));

  // Distinguishing statements data
  const statements = Array.from({ length: 20 }, (_, i) => ({
    id: `S${i + 1}`,
    text: `This is statement ${i + 1} about the research topic that participants sorted.`,
    scores: [
      {
        factor: 'Factor 1',
        zScore: Math.random() * 8 - 4,
        rank: Math.floor(Math.random() * 40) + 1,
      },
      {
        factor: 'Factor 2',
        zScore: Math.random() * 8 - 4,
        rank: Math.floor(Math.random() * 40) + 1,
      },
      {
        factor: 'Factor 3',
        zScore: Math.random() * 8 - 4,
        rank: Math.floor(Math.random() * 40) + 1,
      },
    ],
    pValue: Math.random() * 0.1,
    isConsensus: Math.random() > 0.9,
  }));

  return {
    eigenvalueData,
    correlationData,
    participants,
    factorLoadingData,
    distributionData,
    statements,
  };
};

export default function VisualizationDemoPage() {
  const [view, setView] = useState<'charts' | 'dashboard'>('charts');
  const [data] = useState(generateDemoData());

  const handleExportPNG = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (element) {
      await ChartExporter.exportToPNG(element, { filename });
    }
  };

  const handleExportAllToPDF = async () => {
    const chartElements = document.querySelectorAll('.chart-container');
    const elements = Array.from(chartElements) as HTMLElement[];
    await ChartExporter.exportToPDF(elements, {
      filename: 'q-methodology-report',
      includeTitle: true,
    });
  };

  const handleExportData = () => {
    ChartExporter.exportToExcel(
      {
        Eigenvalues: data.eigenvalueData,
        'Factor Loadings': data.factorLoadingData,
        Distribution: data.distributionData,
        Statements: data.statements,
      },
      {
        filename: 'q-methodology-data',
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Data Visualization Excellence
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Phase 4: Tableau-Quality Analytics with Q-Methodology
              </p>
            </div>

            {/* View Toggle */}
            <div className="flex items-center space-x-4">
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                <button
                  onClick={() => setView('charts')}
                  className={`px-4 py-2 text-sm font-medium ${
                    view === 'charts'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Individual Charts
                </button>
                <button
                  onClick={() => setView('dashboard')}
                  className={`px-4 py-2 text-sm font-medium ${
                    view === 'dashboard'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Dashboard Builder
                </button>
              </div>

              {/* Export Options */}
              <div className="flex space-x-2">
                <button
                  onClick={handleExportAllToPDF}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                >
                  Export PDF Report
                </button>
                <button
                  onClick={handleExportData}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                >
                  Export Excel Data
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {view === 'charts' ? (
        <div className="p-6 space-y-8">
          {/* Eigenvalue Scree Plot */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="chart-container"
            id="eigenvalue-chart"
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Eigenvalue Scree Plot</h2>
                <button
                  onClick={() =>
                    handleExportPNG('eigenvalue-chart', 'eigenvalue-scree-plot')
                  }
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Export PNG
                </button>
              </div>
              <EigenvalueScreePlot data={data.eigenvalueData} />
            </div>
          </motion.div>

          {/* Correlation Heatmap */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="chart-container"
            id="correlation-chart"
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Correlation Matrix</h2>
                <button
                  onClick={() =>
                    handleExportPNG('correlation-chart', 'correlation-matrix')
                  }
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Export PNG
                </button>
              </div>
              <CorrelationHeatmap
                data={data.correlationData}
                participants={data.participants}
              />
            </div>
          </motion.div>

          {/* Factor Loading Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="chart-container"
            id="factor-loading-chart"
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Factor Loadings</h2>
                <button
                  onClick={() =>
                    handleExportPNG('factor-loading-chart', 'factor-loadings')
                  }
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Export PNG
                </button>
              </div>
              <FactorLoadingChart
                data={data.factorLoadingData}
                factors={['Factor 1', 'Factor 2', 'Factor 3']}
              />
            </div>
          </motion.div>

          {/* Q-Sort Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="chart-container"
            id="distribution-chart"
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Q-Sort Distribution</h2>
                <button
                  onClick={() =>
                    handleExportPNG('distribution-chart', 'q-sort-distribution')
                  }
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Export PNG
                </button>
              </div>
              <QSortDistribution data={data.distributionData} />
            </div>
          </motion.div>

          {/* Distinguishing Statements */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="chart-container"
            id="distinguishing-chart"
          >
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Distinguishing Statements
                </h2>
                <button
                  onClick={() =>
                    handleExportPNG(
                      'distinguishing-chart',
                      'distinguishing-statements'
                    )
                  }
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Export PNG
                </button>
              </div>
              <DistinguishingStatements
                data={data.statements}
                factors={['Factor 1', 'Factor 2', 'Factor 3']}
              />
            </div>
          </motion.div>
        </div>
      ) : (
        <DashboardBuilder
          onSave={(widgets, layout) => {
            console.log('Dashboard saved:', { widgets, layout });
          }}
        />
      )}
    </div>
  );
}
