'use client';

import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/apple-ui';

export default function AnalyticsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-label mb-2">
          Analytics Dashboard
        </h1>
        <p className="text-secondary-label">
          Comprehensive insights from your Q-methodology studies
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Factor Analysis Results</CardTitle>
            <CardDescription>
              Latest Q-sort analysis from your studies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-surface-secondary rounded-lg flex items-center justify-center text-secondary-label">
              Factor Analysis Chart Placeholder
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Participant Demographics</CardTitle>
            <CardDescription>
              Distribution of participants across studies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-surface-secondary rounded-lg flex items-center justify-center text-secondary-label">
              Demographics Chart Placeholder
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completion Trends</CardTitle>
            <CardDescription>Study completion rates over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-surface-secondary rounded-lg flex items-center justify-center text-secondary-label">
              Trends Chart Placeholder
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Statement Analysis</CardTitle>
            <CardDescription>
              Most distinguishing statements across factors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-surface-secondary rounded-lg flex items-center justify-center text-secondary-label">
              Statement Analysis Placeholder
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
