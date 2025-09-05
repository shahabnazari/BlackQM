'use client';

import React, { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DocumentTextIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  PencilSquareIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

interface FactorInterpretationProps {
  factors: any[];
  loadings: any;
  statements: any[];
}

export default function FactorInterpretation({
  factors = [],
  loadings = {},
  statements = [],
}: FactorInterpretationProps) {
  const [selectedFactor, setSelectedFactor] = useState(0);
  const [interpretations, setInterpretations] = useState<{
    [key: number]: string;
  }>({});
  const [editingFactor, setEditingFactor] = useState<number | null>(null);
  const [expandedStatements, setExpandedStatements] = useState<{
    [key: number]: boolean;
  }>({});

  const handleSaveInterpretation = (factorIndex: number, text: string) => {
    setInterpretations(prev => ({ ...prev, [factorIndex]: text }));
    setEditingFactor(null);
  };

  // Get distinguishing statements for selected factor
  const getDistinguishingStatements = (factorIndex: number) => {
    if (!statements.length) return { positive: [], negative: [] };

    const factorStatements = statements
      .map(stmt => ({
        ...stmt,
        zScore: stmt.zScores?.[`factor${factorIndex + 1}`] || 0,
      }))
      .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));

    return {
      positive: factorStatements.filter(s => s.zScore > 1.5).slice(0, 5),
      negative: factorStatements.filter(s => s.zScore < -1.5).slice(0, 5),
    };
  };

  const { positive: positiveStatements, negative: negativeStatements } =
    getDistinguishingStatements(selectedFactor);

  // Get participants loading on selected factor
  const getFactorParticipants = (factorIndex: number) => {
    const participants: any[] = [];
    Object.entries(loadings).forEach(
      ([participantId, factorLoadings]: [string, any]) => {
        const loading = factorLoadings[`factor${factorIndex + 1}`] || 0;
        if (Math.abs(loading) > 0.4) {
          participants.push({
            id: participantId,
            loading: loading,
            significant: Math.abs(loading) > 0.5,
          });
        }
      }
    );
    return participants.sort(
      (a, b) => Math.abs(b.loading) - Math.abs(a.loading)
    );
  };

  return (
    <div className="space-y-6">
      {/* Factor Selection Tabs */}
      <Card className="p-4">
        <div className="flex space-x-2 overflow-x-auto">
          {factors.map((factor, index) => (
            <Button
              key={index}
              variant={selectedFactor === index ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setSelectedFactor(index)}
              className="flex-shrink-0"
            >
              Factor {index + 1}
              <Badge variant="default" className="ml-2">
                {(factor.variance || 0).toFixed(1)}%
              </Badge>
            </Button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Factor Characteristics */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Factor {selectedFactor + 1} Characteristics
            </h3>
            <ChartBarIcon className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Eigenvalue
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {factors[selectedFactor]?.eigenvalue?.toFixed(3) || 'N/A'}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Variance
                </p>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {factors[selectedFactor]?.variance?.toFixed(1) || 0}%
                </p>
              </div>
            </div>

            {/* Factor Interpretation */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Factor Interpretation
                </label>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() =>
                    setEditingFactor(
                      editingFactor === selectedFactor ? null : selectedFactor
                    )
                  }
                >
                  {editingFactor === selectedFactor ? (
                    <CheckIcon className="h-4 w-4" />
                  ) : (
                    <PencilSquareIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {editingFactor === selectedFactor ? (
                <textarea
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  rows={3}
                  placeholder="Enter your interpretation of this factor..."
                  defaultValue={interpretations[selectedFactor] || ''}
                  onBlur={e =>
                    handleSaveInterpretation(selectedFactor, e.target.value)
                  }
                />
              ) : (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {interpretations[selectedFactor] ||
                    'No interpretation provided yet. Click edit to add your analysis.'}
                </p>
              )}
            </div>
          </div>
        </Card>

        {/* Participants Loading */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Participant Loadings
            </h3>
            <UserGroupIcon className="h-5 w-5 text-gray-400" />
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {getFactorParticipants(selectedFactor).map(participant => (
              <div
                key={participant.id}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  participant.significant
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'bg-gray-50 dark:bg-gray-800'
                }`}
              >
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {participant.id}
                </span>
                <Badge
                  variant={participant.loading > 0 ? 'success' : 'warning'}
                  className="ml-2"
                >
                  {participant.loading.toFixed(3)}
                </Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Distinguishing Statements */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Positive Statements */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Most Agree (+)
            </h3>
            <ArrowsPointingOutIcon className="h-5 w-5 text-green-500" />
          </div>

          <div className="space-y-3">
            {positiveStatements.map((stmt, index) => (
              <motion.div
                key={stmt.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {stmt.number}.{' '}
                      {expandedStatements[stmt.id]
                        ? stmt.text
                        : stmt.text.slice(0, 100) +
                          (stmt.text.length > 100 ? '...' : '')}
                    </p>
                    {stmt.text.length > 100 && (
                      <button
                        onClick={() =>
                          setExpandedStatements(prev => ({
                            ...prev,
                            [stmt.id]: !prev[stmt.id],
                          }))
                        }
                        className="text-xs text-blue-600 dark:text-blue-400 mt-1"
                      >
                        {expandedStatements[stmt.id]
                          ? 'Show less'
                          : 'Show more'}
                      </button>
                    )}
                  </div>
                  <Badge variant="success" className="ml-3 flex-shrink-0">
                    {stmt.zScore > 0 ? '+' : ''}
                    {stmt.zScore.toFixed(2)}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        {/* Negative Statements */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Most Disagree (−)
            </h3>
            <ArrowsPointingInIcon className="h-5 w-5 text-red-500" />
          </div>

          <div className="space-y-3">
            {negativeStatements.map((stmt, index) => (
              <motion.div
                key={stmt.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-gray-900 dark:text-white">
                      {stmt.number}.{' '}
                      {expandedStatements[stmt.id]
                        ? stmt.text
                        : stmt.text.slice(0, 100) +
                          (stmt.text.length > 100 ? '...' : '')}
                    </p>
                    {stmt.text.length > 100 && (
                      <button
                        onClick={() =>
                          setExpandedStatements(prev => ({
                            ...prev,
                            [stmt.id]: !prev[stmt.id],
                          }))
                        }
                        className="text-xs text-blue-600 dark:text-blue-400 mt-1"
                      >
                        {expandedStatements[stmt.id]
                          ? 'Show less'
                          : 'Show more'}
                      </button>
                    )}
                  </div>
                  <Badge variant="destructive" className="ml-3 flex-shrink-0">
                    {stmt.zScore.toFixed(2)}
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      {/* Consensus Statements */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Consensus Statements
          </h3>
          <DocumentTextIcon className="h-5 w-5 text-gray-400" />
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Statements that do not distinguish between factors (similar z-scores
            across all factors) will appear here once analysis is complete.
          </p>
        </div>
      </Card>
    </div>
  );
}
