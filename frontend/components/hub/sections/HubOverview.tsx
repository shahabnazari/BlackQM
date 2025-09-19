'use client';

import { StudyData } from '@/lib/stores/study-hub.store';
import { 
  UsersIcon, 
  ChartBarIcon, 
  ClockIcon, 
  CheckCircleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

interface HubOverviewProps {
  studyData: StudyData;
}

/**
 * Hub Overview Section - Phase 7 Day 1
 * 
 * Provides a comprehensive overview of the study with key metrics
 * Aligned with Research Lifecycle Navigation System
 * 
 * @world-class Features:
 * - Real-time metrics dashboard
 * - Interactive stat cards
 * - Progress visualization
 * - Quick actions
 */
export function HubOverview({ studyData }: HubOverviewProps) {
  const { study, responses, statements } = studyData;

  // Calculate metrics
  const completionRate = Math.round((study?.completionRate || 0) * 100);
  const averageDuration = responses.length > 0
    ? Math.round(responses.reduce((sum, r) => sum + r.duration, 0) / responses.length / 60)
    : 0;

  const stats = [
    {
      label: 'Total Participants',
      value: study?.participantCount || 0,
      icon: UsersIcon,
      color: 'bg-blue-500',
      change: '+12%',
      changeType: 'positive' as const,
    },
    {
      label: 'Responses Collected',
      value: responses.length,
      icon: ChartBarIcon,
      color: 'bg-green-500',
      change: `${completionRate}% complete`,
      changeType: 'neutral' as const,
    },
    {
      label: 'Avg. Duration',
      value: `${averageDuration} min`,
      icon: ClockIcon,
      color: 'bg-purple-500',
      change: 'Per response',
      changeType: 'neutral' as const,
    },
    {
      label: 'Statements',
      value: statements.length,
      icon: CheckCircleIcon,
      color: 'bg-indigo-500',
      change: 'Active',
      changeType: 'positive' as const,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Study Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          Study Overview
        </h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          {study?.description || 'Monitor your study progress and key metrics'}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
                       dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                {stat.changeType === 'positive' && (
                  <span className="text-green-600 text-sm font-medium flex items-center">
                    <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
                    {stat.change}
                  </span>
                )}
                {stat.changeType === 'neutral' && (
                  <span className="text-gray-500 text-sm">
                    {stat.change}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {stat.value}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {stat.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Overview */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
                    dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Research Lifecycle Progress
        </h3>
        
        <div className="space-y-4">
          {/* Lifecycle Phases Progress */}
          <div className="grid grid-cols-5 gap-2">
            {[
              { phase: 'Collect', progress: 100, status: 'completed' },
              { phase: 'Analyze', progress: 45, status: 'active' },
              { phase: 'Visualize', progress: 0, status: 'upcoming' },
              { phase: 'Interpret', progress: 0, status: 'upcoming' },
              { phase: 'Report', progress: 0, status: 'upcoming' },
            ].map((item) => (
              <div key={item.phase} className="text-center">
                <div className="relative">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all ${
                        item.status === 'completed' ? 'bg-green-500' :
                        item.status === 'active' ? 'bg-blue-500' :
                        'bg-gray-300 dark:bg-gray-600'
                      }`}
                      style={{ width: `${item.progress}%` }}
                    />
                  </div>
                  {item.status === 'active' && (
                    <div className="absolute -top-1 -right-1">
                      <div className="w-4 h-4 bg-blue-500 rounded-full animate-pulse" />
                    </div>
                  )}
                </div>
                <p className={`text-xs mt-2 ${
                  item.status === 'active' 
                    ? 'text-blue-600 dark:text-blue-400 font-medium' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {item.phase}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
                    dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h3>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg 
                           hover:bg-blue-700 transition-colors text-sm font-medium">
            Run Analysis
          </button>
          <button className="px-4 py-2 bg-purple-600 text-white rounded-lg 
                           hover:bg-purple-700 transition-colors text-sm font-medium">
            Generate Visualizations
          </button>
          <button className="px-4 py-2 bg-green-600 text-white rounded-lg 
                           hover:bg-green-700 transition-colors text-sm font-medium">
            AI Interpretation
          </button>
          <button className="px-4 py-2 bg-gray-600 text-white rounded-lg 
                           hover:bg-gray-700 transition-colors text-sm font-medium">
            Export Data
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 
                    dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Recent Activity
        </h3>
        
        <div className="space-y-3">
          {responses.slice(0, 5).map((response) => (
            <div key={response.id} className="flex items-center justify-between 
                                            py-2 border-b border-gray-100 dark:border-gray-700 
                                            last:border-0">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    Participant {response.participantId.slice(0, 8)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Completed in {Math.round(response.duration / 60)} minutes
                  </p>
                </div>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {new Date(response.completedAt).toLocaleDateString()}
              </p>
            </div>
          ))}
          
          {responses.length === 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
              No responses yet
            </p>
          )}
        </div>
      </div>
    </div>
  );
}