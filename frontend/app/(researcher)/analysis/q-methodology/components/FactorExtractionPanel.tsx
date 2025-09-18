'use client';

import React, { useState } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { motion } from 'framer-motion';
import {
  CalculatorIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface FactorExtractionPanelProps {
  onExtract: (params: any) => void;
  extractionResults?: any;
  isExtracting: boolean;
}

export default function FactorExtractionPanel({
  onExtract,
  extractionResults,
  isExtracting,
}: FactorExtractionPanelProps) {
  const [extractionMethod, setExtractionMethod] = useState<'pca' | 'centroid'>(
    'pca'
  );
  const [numberOfFactors, setNumberOfFactors] = useState<number | 'auto'>(
    'auto'
  );
  const [minEigenvalue, setMinEigenvalue] = useState(1.0);

  const handleExtraction = () => {
    const params = {
      method: extractionMethod,
      numberOfFactors: numberOfFactors === 'auto' ? undefined : numberOfFactors,
      minEigenvalue: numberOfFactors === 'auto' ? minEigenvalue : undefined,
    };
    onExtract(params);
  };

  // Scree Plot Data
  const screeData = extractionResults
    ? {
        labels: extractionResults.screeData.map(
          (d: any) => `Factor ${d.factor}`
        ),
        datasets: [
          {
            label: 'Eigenvalues',
            data: extractionResults.screeData.map((d: any) => d.eigenvalue),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true,
          },
        ],
      }
    : null;

  // Variance Explained Data
  const varianceData = extractionResults
    ? {
        labels: extractionResults.eigenvalues.map(
          (_: any, i: number) => `F${i + 1}`
        ),
        datasets: [
          {
            label: 'Individual Variance (%)',
            data: extractionResults.variance,
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: 'rgb(59, 130, 246)',
            borderWidth: 1,
          },
          {
            label: 'Cumulative Variance (%)',
            data: extractionResults.cumulativeVariance,
            type: 'line' as const,
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'transparent',
            borderWidth: 2,
            tension: 0.4,
            yAxisID: 'y1',
          },
        ],
      }
    : null;

  const chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: 'Individual Variance (%)',
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: 'Cumulative Variance (%)',
        },
      },
    },
  };

  return (
    <div className="space-y-6">
      {/* Extraction Settings */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Factor Extraction Settings
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Extraction Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Extraction Method
            </label>
            <select
              value={extractionMethod}
              onChange={e =>
                setExtractionMethod(e.target.value as 'pca' | 'centroid')
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="pca">Principal Component Analysis (PCA)</option>
              <option value="centroid">Centroid Method</option>
            </select>
          </div>

          {/* Number of Factors */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Factors
            </label>
            <select
              value={numberOfFactors}
              onChange={e => {
                const val = e.target.value;
                setNumberOfFactors(val === 'auto' ? 'auto' : parseInt(val));
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="auto">Auto (Kaiser Criterion)</option>
              <option value="2">2 Factors</option>
              <option value="3">3 Factors</option>
              <option value="4">4 Factors</option>
              <option value="5">5 Factors</option>
              <option value="6">6 Factors</option>
              <option value="7">7 Factors</option>
              <option value="8">8 Factors</option>
            </select>
          </div>

          {/* Minimum Eigenvalue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Min Eigenvalue (Kaiser)
            </label>
            <input
              type="number"
              value={minEigenvalue}
              onChange={e => setMinEigenvalue(parseFloat(e.target.value))}
              step="0.1"
              min="0.5"
              max="2.0"
              disabled={numberOfFactors !== 'auto'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50"
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-1">Kaiser Criterion:</p>
              <p>
                Automatically extracts factors with eigenvalues greater than{' '}
                {minEigenvalue}. This is the most common method for determining
                the number of factors.
              </p>
            </div>
          </div>
        </div>

        {/* Extract Button */}
        <div className="mt-6 flex justify-end">
          <Button
            variant="primary"
            size="large"
            onClick={handleExtraction}
            loading={isExtracting}
            disabled={isExtracting}
            className="flex items-center"
          >
            <CalculatorIcon className="h-5 w-5 mr-2" />
            {isExtracting ? 'Extracting...' : 'Extract Factors'}
          </Button>
        </div>
      </Card>

      {/* Extraction Results */}
      {extractionResults && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Factors Extracted
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {extractionResults.numberOfFactors}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total Variance
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {extractionResults.cumulativeVariance[
                  extractionResults.numberOfFactors - 1
                ].toFixed(1)}
                %
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Largest Eigenvalue
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.max(...extractionResults.eigenvalues).toFixed(2)}
              </p>
            </Card>
            <Card className="p-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Extraction Method
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white uppercase">
                {extractionResults.extractionMethod}
              </p>
            </Card>
          </div>

          {/* Scree Plot */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Scree Plot
            </h3>
            <div className="h-64">
              {screeData && (
                <Line
                  data={screeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
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
                  }}
                />
              )}
            </div>
          </Card>

          {/* Variance Explained */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Variance Explained
            </h3>
            <div className="h-64">
              {varianceData && (
                <Bar data={varianceData as any} options={chartOptions as any} />
              )}
            </div>
          </Card>

          {/* Factor Loadings Table */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Factor Eigenvalues & Variance
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Factor
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Eigenvalue
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Variance (%)
                    </th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Cumulative (%)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {extractionResults.eigenvalues.map(
                    (eigenvalue: number, index: number) => (
                      <tr
                        key={index}
                        className={
                          index < extractionResults.numberOfFactors
                            ? 'bg-blue-50 dark:bg-blue-900/20'
                            : ''
                        }
                      >
                        <td className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white">
                          Factor {index + 1}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {eigenvalue.toFixed(3)}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {extractionResults.variance[index].toFixed(2)}%
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                          {extractionResults.cumulativeVariance[index].toFixed(
                            2
                          )}
                          %
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
