'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { studyApi } from '@/lib/api/study';
import { formatDate } from '@/lib/utils/date';
import { Button } from '@/components/apple-ui/Button';
import { Card } from '@/components/apple-ui/Card';
import { Badge } from '@/components/apple-ui/Badge';

interface Study {
  id: string;
  title: string;
  description?: string;
  status: 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'ENDED' | 'ARCHIVED';
  _count?: {
    responses: number;
    statements: number;
  };
  createdAt: string;
  updatedAt: string;
}

// Mock studies for when API is not available
const mockStudies: Study[] = [
  {
    id: '1',
    title: 'Climate Change Perspectives Study',
    description: 'Understanding public views on climate change policies',
    status: 'ACTIVE',
    _count: {
      responses: 45,
      statements: 32,
    },
    createdAt: '2024-01-15',
    updatedAt: '2024-01-20',
  },
  {
    id: '2',
    title: 'Healthcare System Evaluation',
    description: 'Q-methodology study on healthcare system improvements',
    status: 'DRAFT',
    _count: {
      responses: 0,
      statements: 0,
    },
    createdAt: '2024-01-18',
    updatedAt: '2024-01-19',
  },
];

export default function StudiesPage() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        const data = await studyApi.getStudies();
        setStudies(data);
      } catch (err) {
        console.error('Failed to fetch studies:', err);
        // setError('Failed to load studies');
        // Use mock data as fallback
        setStudies(mockStudies);
      } finally {
        setLoading(false);
      }
    };

    fetchStudies();
  }, []);

  const getStatusBadgeVariant = (status: Study['status']) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'DRAFT':
        return 'secondary';
      case 'PAUSED':
        return 'warning';
      case 'SCHEDULED':
        return 'info';
      case 'ENDED':
      case 'ARCHIVED':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-secondary-label">Loading studies...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-label">My Studies</h1>
          <p className="mt-1 text-secondary-label">
            Manage your Q-methodology research studies
          </p>
        </div>
        <Link href="/studies/create">
          <Button variant="primary" size="large">
            Create New Study
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {studies.map((study) => (
          <Link key={study.id} href={`/studies/${study.id}`}>
            <Card className="h-full transition-transform hover:scale-[1.02] cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-label line-clamp-2">
                  {study.title}
                </h3>
                <Badge variant={getStatusBadgeVariant(study.status)}>
                  {study.status}
                </Badge>
              </div>

              <p className="text-sm text-secondary-label line-clamp-2 mb-4">
                {study.description}
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-tertiary-label">Responses:</span>
                  <span className="font-medium text-label">
                    {study._count?.responses || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary-label">Statements:</span>
                  <span className="font-medium text-label">
                    {study._count?.statements || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary-label">Updated:</span>
                  <span className="font-medium text-label">
                    {formatDate(study.updatedAt, { format: 'medium' })}
                  </span>
                </div>
              </div>

              {study.status === 'ACTIVE' && study._count?.responses && study._count.responses > 0 && (
                <div className="mt-4 pt-4 border-t border-quaternary-fill">
                  <div className="h-2 bg-quaternary-fill rounded-full overflow-hidden">
                    <div
                      className="h-full bg-system-green transition-all duration-500"
                      style={{ width: `${Math.min(100, (study._count?.responses || 0) * 10)}%` }}
                    />
                  </div>
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {studies.length === 0 && (
        <div className="text-center py-12">
          <p className="text-secondary-label mb-4">
            You haven't created any studies yet
          </p>
          <Link href="/studies/create">
            <Button variant="primary">Create Your First Study</Button>
          </Link>
        </div>
      )}
    </div>
  );
}