/**
 * AI Usage Dashboard Component
 * Phase 6.86: Enterprise-grade monitoring visualization
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { 
  DollarSign, 
  Activity, 
  AlertCircle,
  CheckCircle,
  Clock,
  Zap
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface AIMetrics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  errorRate: number;
  cacheHitRate: number;
  topModels: Array<{ model: string; count: number; cost: number }>;
  hourlyDistribution: Array<{ hour: number; requests: number }>;
}

interface UserUsage {
  dailyUsage: number;
  monthlyUsage: number;
  dailyLimit: number;
  monthlyLimit: number;
  percentOfDailyLimit: number;
  percentOfMonthlyLimit: number;
  isApproachingLimit: boolean;
  isOverLimit: boolean;
}

const CHART_COLORS = [
  '#007AFF', // System Blue
  '#34C759', // System Green
  '#FF9500', // System Orange
  '#FF3B30', // System Red
  '#5856D6', // System Purple
];

export function AIUsageDashboard() {
  const [metrics, setMetrics] = useState<AIMetrics | null>(null);
  const [userUsage, setUserUsage] = useState<UserUsage | null>(null);
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  
  useEffect(() => {
    fetchDashboardData();
    // Refresh every 30 seconds
    const interval = setInterval(() => {
      setRefreshKey(k => k + 1);
    }, 30000);
    
    return () => clearInterval(interval);
  }, [timeRange, refreshKey]);
  
  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch metrics
      const metricsResponse = await fetch(`/api/ai/monitoring/metrics?range=${timeRange}`, {
        credentials: 'include'
      });
      
      if (!metricsResponse.ok) {
        throw new Error('Failed to fetch metrics');
      }
      
      const metricsData = await metricsResponse.json();
      setMetrics(metricsData);
      
      // Fetch user usage
      const usageResponse = await fetch('/api/ai/monitoring/usage', {
        credentials: 'include'
      });
      
      if (usageResponse.ok) {
        const usageData = await usageResponse.json();
        setUserUsage(usageData);
      }
      
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }
  
  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-system-blue"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <div className="flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>{error}</span>
        </div>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">AI Usage Dashboard</h2>
        <div className="flex items-center gap-4">
          {/* Time Range Selector */}
          <div className="flex gap-2">
            {(['day', 'week', 'month'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  timeRange === range 
                    ? 'bg-system-blue text-white' 
                    : 'bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          
          {/* Refresh Indicator */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Activity className={`w-4 h-4 ${loading ? 'animate-pulse' : ''}`} />
            <span>Live</span>
          </div>
        </div>
      </div>
      
      {/* Budget Alert */}
      {userUsage?.isOverLimit && (
        <Card className="p-4 bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <div className="flex-1">
              <p className="font-medium text-red-900">Daily Budget Exceeded</p>
              <p className="text-sm text-red-700">
                You've used ${userUsage.dailyUsage.toFixed(2)} of your ${userUsage.dailyLimit} daily limit
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {userUsage?.isApproachingLimit && !userUsage.isOverLimit && (
        <Card className="p-4 bg-yellow-50 border-yellow-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div className="flex-1">
              <p className="font-medium text-yellow-900">Approaching Daily Limit</p>
              <p className="text-sm text-yellow-700">
                {userUsage.percentOfDailyLimit.toFixed(0)}% of daily budget used
              </p>
            </div>
          </div>
        </Card>
      )}
      
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Cost */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Cost</p>
              <p className="text-2xl font-bold">
                ${metrics?.totalCost.toFixed(2) || '0.00'}
              </p>
              {userUsage && (
                <p className="text-xs text-gray-400 mt-1">
                  {userUsage.percentOfDailyLimit.toFixed(0)}% of daily limit
                </p>
              )}
            </div>
            <DollarSign className="w-8 h-8 text-system-green opacity-50" />
          </div>
        </Card>
        
        {/* Total Requests */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Requests</p>
              <p className="text-2xl font-bold">
                {metrics?.totalRequests.toLocaleString() || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {metrics?.totalTokens.toLocaleString() || 0} tokens
              </p>
            </div>
            <Zap className="w-8 h-8 text-system-blue opacity-50" />
          </div>
        </Card>
        
        {/* Response Time */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Response Time</p>
              <p className="text-2xl font-bold">
                {metrics?.averageResponseTime.toFixed(0) || 0}ms
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {metrics && metrics.averageResponseTime < 3000 ? (
                  <span className="text-green-600">Good</span>
                ) : (
                  <span className="text-yellow-600">Slow</span>
                )}
              </p>
            </div>
            <Clock className="w-8 h-8 text-system-orange opacity-50" />
          </div>
        </Card>
        
        {/* Success Rate */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Success Rate</p>
              <p className="text-2xl font-bold">
                {metrics ? (100 - metrics.errorRate).toFixed(1) : 100}%
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Cache hit: {metrics?.cacheHitRate.toFixed(0) || 0}%
              </p>
            </div>
            <CheckCircle className="w-8 h-8 text-system-green opacity-50" />
          </div>
        </Card>
      </div>
      
      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hourly Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Hourly Activity</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={metrics?.hourlyDistribution || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="hour" 
                tickFormatter={(hour) => `${hour}:00`}
              />
              <YAxis />
              <Tooltip 
                formatter={(value) => [`${value} requests`, 'Requests']}
                labelFormatter={(hour) => `${hour}:00`}
              />
              <Bar dataKey="requests" fill={CHART_COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        
        {/* Model Usage */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Model Usage</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={metrics?.topModels || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry: any) => `${entry.model}: ${entry.count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {metrics?.topModels.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
      
      {/* Budget Progress */}
      {userUsage && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Budget Usage</h3>
          <div className="space-y-4">
            {/* Daily Budget */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Daily Budget</span>
                <span className="text-sm font-medium">
                  ${userUsage.dailyUsage.toFixed(2)} / ${userUsage.dailyLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    userUsage.isOverLimit 
                      ? 'bg-red-500' 
                      : userUsage.isApproachingLimit 
                        ? 'bg-yellow-500' 
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(userUsage.percentOfDailyLimit, 100)}%` }}
                />
              </div>
            </div>
            
            {/* Monthly Budget */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Monthly Budget</span>
                <span className="text-sm font-medium">
                  ${userUsage.monthlyUsage.toFixed(2)} / ${userUsage.monthlyLimit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-system-blue h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(userUsage.percentOfMonthlyLimit, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </Card>
      )}
      
      {/* Model Details Table */}
      {metrics?.topModels && metrics.topModels.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Model Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Model</th>
                  <th className="text-right py-2">Requests</th>
                  <th className="text-right py-2">Cost</th>
                  <th className="text-right py-2">Avg Cost</th>
                </tr>
              </thead>
              <tbody>
                {metrics.topModels.map((model, index) => (
                  <tr key={model.model} className="border-b">
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        />
                        <span>{model.model}</span>
                      </div>
                    </td>
                    <td className="text-right py-2">{model.count.toLocaleString()}</td>
                    <td className="text-right py-2">${model.cost.toFixed(4)}</td>
                    <td className="text-right py-2">
                      ${(model.cost / model.count).toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

export default AIUsageDashboard;