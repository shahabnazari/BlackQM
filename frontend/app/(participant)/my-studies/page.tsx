'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DocumentDuplicateIcon,
  PlayCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  CalendarIcon,
  ArrowRightIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';

interface Study {
  id: string;
  title: string;
  researcherName: string;
  description: string;
  joinedDate: string;
  deadline?: string;
  progress: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'expired';
  currentStage?: string;
  token: string;
  estimatedTime: string;
  compensation?: string;
}

const mockStudies: Study[] = [
  {
    id: '1',
    title: 'Environmental Attitudes Study',
    researcherName: 'Dr. Jane Smith',
    description: 'Exploring perspectives on climate change and sustainability',
    joinedDate: '2024-09-15',
    deadline: '2024-09-25',
    progress: 65,
    status: 'in-progress',
    currentStage: 'Q-Sort',
    token: 'ENV2024',
    estimatedTime: '45 minutes',
    compensation: '$10 gift card'
  },
  {
    id: '2',
    title: 'Digital Education Preferences',
    researcherName: 'Prof. John Doe',
    description: 'Understanding attitudes toward online learning platforms',
    joinedDate: '2024-09-10',
    deadline: '2024-09-30',
    progress: 0,
    status: 'not-started',
    token: 'EDU2024',
    estimatedTime: '30 minutes'
  },
  {
    id: '3',
    title: 'Healthcare Innovation Survey',
    researcherName: 'Dr. Sarah Johnson',
    description: 'Perspectives on AI in healthcare',
    joinedDate: '2024-08-20',
    progress: 100,
    status: 'completed',
    token: 'HEALTH2024',
    estimatedTime: '40 minutes',
    compensation: '$15 gift card'
  },
  {
    id: '4',
    title: 'Workplace Culture Study',
    researcherName: 'Dr. Michael Brown',
    description: 'Remote work and team collaboration',
    joinedDate: '2024-08-01',
    deadline: '2024-08-15',
    progress: 30,
    status: 'expired',
    currentStage: 'Pre-sort',
    token: 'WORK2024',
    estimatedTime: '25 minutes'
  }
];

export default function MyStudiesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const filteredStudies = mockStudies.filter(study => {
    if (filter === 'all') return true;
    if (filter === 'active') return study.status === 'in-progress' || study.status === 'not-started';
    if (filter === 'completed') return study.status === 'completed';
    return true;
  });

  const activeCount = mockStudies.filter(s => s.status === 'in-progress' || s.status === 'not-started').length;
  const completedCount = mockStudies.filter(s => s.status === 'completed').length;

  const handleContinueStudy = (study: Study) => {
    if (study.status === 'expired') return;
    
    // Navigate to the appropriate stage
    const stage = study.currentStage?.toLowerCase().replace(' ', '-') || 'welcome';
    router.push(`/study/${study.token}/${stage}`);
  };

  const getStatusBadge = (status: Study['status']) => {
    switch(status) {
      case 'in-progress':
        return <Badge variant="secondary">In Progress</Badge>;
      case 'not-started':
        return <Badge variant="secondary">Not Started</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      default:
        return null;
    }
  };

  const getActionButton = (study: Study) => {
    switch(study.status) {
      case 'in-progress':
        return (
          <Button 
            variant="primary" 
            size="small"
            onClick={() => handleContinueStudy(study)}
            className="flex items-center gap-1"
          >
            Continue <ArrowRightIcon className="w-4 h-4" />
          </Button>
        );
      case 'not-started':
        return (
          <Button 
            variant="primary" 
            size="small"
            onClick={() => handleContinueStudy(study)}
            className="flex items-center gap-1"
          >
            Start <PlayCircleIcon className="w-4 h-4" />
          </Button>
        );
      case 'completed':
        return (
          <Button 
            variant="secondary" 
            size="small"
            disabled
            className="flex items-center gap-1"
          >
            <CheckCircleIcon className="w-4 h-4" /> Completed
          </Button>
        );
      case 'expired':
        return (
          <Button 
            variant="secondary" 
            size="small"
            disabled
          >
            Expired
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Studies</h1>
        <p className="text-text-secondary">
          Track and continue your research participation
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Active Studies</p>
              <p className="text-2xl font-bold">{activeCount}</p>
            </div>
            <PlayCircleIcon className="w-8 h-8 text-system-orange" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Completed</p>
              <p className="text-2xl font-bold text-system-green">{completedCount}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-system-green" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-text-secondary">Total Earnings</p>
              <p className="text-2xl font-bold">$25</p>
            </div>
            <DocumentDuplicateIcon className="w-8 h-8 text-primary" />
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === 'all' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => setFilter('all')}
        >
          All Studies ({mockStudies.length})
        </Button>
        <Button
          variant={filter === 'active' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => setFilter('active')}
        >
          Active ({activeCount})
        </Button>
        <Button
          variant={filter === 'completed' ? 'primary' : 'secondary'}
          size="small"
          onClick={() => setFilter('completed')}
        >
          Completed ({completedCount})
        </Button>
      </div>

      {/* Studies List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredStudies.map(study => (
          <Card key={study.id} className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold">{study.title}</h3>
                  {getStatusBadge(study.status)}
                </div>
                
                <p className="text-sm text-text-secondary mb-1">
                  by {study.researcherName}
                </p>
                
                <p className="text-sm text-text-secondary mb-3">
                  {study.description}
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-text-secondary">
                  <div className="flex items-center gap-1">
                    <CalendarIcon className="w-4 h-4" />
                    Joined {new Date(study.joinedDate).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <ClockIcon className="w-4 h-4" />
                    {study.estimatedTime}
                  </div>
                  {study.compensation && (
                    <div className="flex items-center gap-1 text-system-green">
                      {study.compensation}
                    </div>
                  )}
                  {study.deadline && study.status !== 'completed' && (
                    <div className="flex items-center gap-1 text-system-orange">
                      <ExclamationCircleIcon className="w-4 h-4" />
                      Due {new Date(study.deadline).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {(study.status === 'in-progress' || study.status === 'expired') && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-text-secondary">
                        Current: {study.currentStage || 'Not started'}
                      </span>
                      <span className="font-medium">{study.progress}%</span>
                    </div>
                    <div className="w-full bg-surface-secondary rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all ${
                          study.status === 'expired' ? 'bg-text-tertiary' : 'bg-primary'
                        }`}
                        style={{ width: `${study.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center">
                {getActionButton(study)}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredStudies.length === 0 && (
        <Card className="p-12 text-center">
          <DocumentDuplicateIcon className="w-16 h-16 text-text-tertiary mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No studies found</h3>
          <p className="text-text-secondary mb-4">
            {filter === 'active' 
              ? "You don't have any active studies" 
              : filter === 'completed'
              ? "You haven't completed any studies yet"
              : "You haven't joined any studies yet"}
          </p>
          <Button 
            variant="primary"
            onClick={() => router.push('/join')}
          >
            Join a Study
          </Button>
        </Card>
      )}

      {/* Join New Study CTA */}
      {filteredStudies.length > 0 && (
        <Card className="mt-6 p-6 bg-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold mb-1">Ready for more research?</h3>
              <p className="text-sm text-text-secondary">
                Join new studies and contribute to important research
              </p>
            </div>
            <Button 
              variant="primary"
              onClick={() => router.push('/join')}
              className="flex items-center gap-1"
            >
              Join New Study <ArrowRightIcon className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}