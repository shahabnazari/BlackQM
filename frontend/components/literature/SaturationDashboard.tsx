/**
 * Phase 10 Day 18: Saturation Status Dashboard
 *
 * Enterprise-grade saturation visualization:
 * - Confidence meter (0-100% gauge)
 * - Recommendation chips (add more, saturated, continue, refine search)
 * - Line chart showing theme count vs iteration
 * - Statistics on new themes found and existing themes strengthened
 * - Scientific rationale with citations
 *
 * User communication: Clear guidance on when to stop adding sources
 * Research backing: Glaser & Strauss (1967) theoretical saturation
 */

'use client';

import React from 'react';
import type { SaturationAnalysis } from '@/lib/api/services/incremental-extraction-api.service';
import { CheckCircle, TrendingUp, Search, Plus } from 'lucide-react';

interface SaturationDashboardProps {
  saturation: SaturationAnalysis;
  onAddMorePapers?: () => void;
  themeHistory?: { iteration: number; themeCount: number }[];
}

export function SaturationDashboard({
  saturation,
  onAddMorePapers,
  themeHistory = [],
}: SaturationDashboardProps) {
  const getRecommendationConfig = () => {
    switch (saturation.recommendation) {
      case 'saturation_reached':
        return {
          icon: CheckCircle,
          label: 'Saturation Reached',
          color: 'text-green-600 dark:text-green-400',
          bgColor: 'bg-green-100 dark:bg-green-900/30',
          borderColor: 'border-green-200 dark:border-green-700',
          description:
            'No new themes emerged. Theoretical saturation achieved.',
        };
      case 'add_more_sources':
        return {
          icon: Plus,
          label: 'Add More Sources',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          borderColor: 'border-blue-200 dark:border-blue-700',
          description: 'New themes still emerging. Continue adding sources.',
        };
      case 'refine_search':
        return {
          icon: Search,
          label: 'Refine Search',
          color: 'text-amber-600 dark:text-amber-400',
          bgColor: 'bg-amber-100 dark:bg-amber-900/30',
          borderColor: 'border-amber-200 dark:border-amber-700',
          description:
            'Consider adjusting search criteria for better coverage.',
        };
      default:
        return {
          icon: TrendingUp,
          label: 'Continue Extraction',
          color: 'text-blue-600 dark:text-blue-400',
          bgColor: 'bg-blue-100 dark:bg-blue-900/30',
          borderColor: 'border-blue-200 dark:border-blue-700',
          description: 'Keep building your corpus.',
        };
    }
  };

  const config = getRecommendationConfig();
  const Icon = config.icon;
  const confidencePercent = Math.round(saturation.confidenceLevel * 100);

  // Calculate saturation meter color
  const getMeterColor = () => {
    if (confidencePercent >= 80) return 'bg-green-500';
    if (confidencePercent >= 60) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Theoretical Saturation Status
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Glaser & Strauss (1967): Stop when no new themes emerge
        </p>
      </div>

      {/* Saturation Meter */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Saturation Confidence
          </span>
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {confidencePercent}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-4 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${getMeterColor()} transition-all duration-500 ease-out`}
            style={{ width: `${confidencePercent}%` }}
          />
        </div>

        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-2">
          <span>Low</span>
          <span>Medium</span>
          <span>High</span>
        </div>
      </div>

      {/* Recommendation */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div
          className={`flex items-start gap-3 p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}
        >
          <Icon className={`w-6 h-6 ${config.color} flex-shrink-0 mt-0.5`} />
          <div className="flex-1">
            <h4 className={`font-semibold ${config.color} mb-1`}>
              {config.label}
            </h4>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {config.description}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 italic">
              {saturation.rationale}
            </p>
          </div>
        </div>

        {saturation.recommendation === 'add_more_sources' &&
          onAddMorePapers && (
            <button
              onClick={onAddMorePapers}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              <Plus className="w-4 h-4" />
              Add More Papers
            </button>
          )}
      </div>

      {/* Statistics */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
          Theme Evolution
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                New Themes
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {saturation.newThemesFound}
            </p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                Strengthened
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {saturation.existingThemesStrengthened}
            </p>
          </div>
        </div>
      </div>

      {/* Theme History Chart (if available) */}
      {themeHistory.length > 1 && (
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">
            Theme Count by Iteration
          </h4>
          <div className="relative h-32">
            {/* Simple ASCII-style line chart */}
            <svg
              className="w-full h-full"
              viewBox="0 0 400 100"
              preserveAspectRatio="none"
            >
              {/* Grid lines */}
              <line
                x1="0"
                y1="100"
                x2="400"
                y2="100"
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-300 dark:text-gray-600"
              />
              <line
                x1="0"
                y1="75"
                x2="400"
                y2="75"
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-300 dark:text-gray-600"
                strokeDasharray="2,2"
              />
              <line
                x1="0"
                y1="50"
                x2="400"
                y2="50"
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-300 dark:text-gray-600"
                strokeDasharray="2,2"
              />
              <line
                x1="0"
                y1="25"
                x2="400"
                y2="25"
                stroke="currentColor"
                strokeWidth="1"
                className="text-gray-300 dark:text-gray-600"
                strokeDasharray="2,2"
              />

              {/* Line chart */}
              {themeHistory.length > 1 &&
                (() => {
                  const maxThemes = Math.max(
                    ...themeHistory.map(h => h.themeCount)
                  );
                  const xStep = 400 / (themeHistory.length - 1);
                  const points = themeHistory
                    .map((h, i) => {
                      const x = i * xStep;
                      const y = 100 - (h.themeCount / maxThemes) * 90;
                      return `${x},${y}`;
                    })
                    .join(' ');

                  return (
                    <>
                      <polyline
                        points={points}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-blue-500"
                      />
                      {themeHistory.map((h, i) => {
                        const x = i * xStep;
                        const y = 100 - (h.themeCount / maxThemes) * 90;
                        return (
                          <circle
                            key={i}
                            cx={x}
                            cy={y}
                            r="3"
                            fill="currentColor"
                            className="text-blue-500"
                          />
                        );
                      })}
                    </>
                  );
                })()}
            </svg>
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-500 mt-2">
              {themeHistory.map((h, i) => (
                <span key={i}>It. {h.iteration}</span>
              ))}
            </div>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 italic">
            {(() => {
              if (themeHistory.length < 2)
                return '📈 Theme count still growing';
              const lastCount =
                themeHistory[themeHistory.length - 1]?.themeCount;
              const prevCount =
                themeHistory[themeHistory.length - 2]?.themeCount;
              return lastCount === prevCount
                ? '📊 Theme count plateau suggests saturation'
                : '📈 Theme count still growing';
            })()}
          </p>
        </div>
      )}

      {/* Research Note */}
      <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
        <p className="text-xs text-gray-500 dark:text-gray-500 italic">
          💡 Theoretical saturation (Glaser & Strauss 1967): Continue data
          collection until no new themes emerge. Braun & Clarke (2019):
          Iterative refinement is central to reflexive thematic analysis.
        </p>
      </div>
    </div>
  );
}
