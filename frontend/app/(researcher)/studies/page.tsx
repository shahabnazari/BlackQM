'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { studyApi, Study } from '@/lib/api/study';
import { formatDate } from '@/lib/utils/date';
import { Button } from '@/components/apple-ui/Button';
import { Card } from '@/components/apple-ui/Card';
import { Badge } from '@/components/apple-ui/Badge';
import { DraftService, StudyDraft } from '@/lib/services/draft.service';
import { Trash2, Edit3, FileText } from 'lucide-react';
import { usePopup } from '@/components/ui/PopupModal';

// Use Study type from API service
// The Study interface is imported from '@/lib/api/study'

// Mock studies for when API is not available
const mockStudies: Study[] = [
  {
    id: '1',
    title: 'Public Perception of Air Pollution Solutions',
    description:
      'Understanding public attitudes toward various air pollution mitigation strategies and policies.',
    status: 'active',
    createdBy: 'user1',
    settings: {
      requireAuth: false,
      allowAnonymous: true,
      sortingMethod: 'grid',
      statements: [],
    },
    statistics: {
      totalParticipants: 30,
      completedSorts: 25,
      averageCompletionTime: 900,
      responseRate: 83.3,
    },
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-01-20T00:00:00Z',
  },
  {
    id: '2',
    title: 'Climate Change Perspectives Study',
    description: 'Understanding public views on climate change policies',
    status: 'active',
    createdBy: 'user1',
    settings: {
      requireAuth: false,
      allowAnonymous: true,
      sortingMethod: 'grid',
      statements: [],
    },
    statistics: {
      totalParticipants: 45,
      completedSorts: 32,
      averageCompletionTime: 1200,
      responseRate: 71.1,
    },
    createdAt: '2024-01-18T00:00:00Z',
    updatedAt: '2024-01-19T00:00:00Z',
  },
  {
    id: '3',
    title: 'Healthcare System Evaluation',
    description: 'Q-methodology study on healthcare system improvements',
    status: 'draft',
    createdBy: 'user1',
    settings: {
      requireAuth: true,
      allowAnonymous: false,
      sortingMethod: 'grid',
      statements: [],
    },
    statistics: {
      totalParticipants: 0,
      completedSorts: 0,
      averageCompletionTime: 0,
      responseRate: 0,
    },
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-01-21T00:00:00Z',
  },
];

export default function StudiesPage() {
  const [studies, setStudies] = useState<Study[]>([]);
  const [drafts, setDrafts] = useState<StudyDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { showSuccess, showError, showConfirm } = usePopup();
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        // Fetch published studies
        const data = await studyApi.getStudies();
        setStudies(data);
        
        // Fetch local drafts
        const localDrafts = DraftService.getAllDrafts();
        setDrafts(localDrafts);
        
        // Clean up old drafts (older than 7 days)
        DraftService.cleanupOldDrafts(7);
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

  const handleDeleteDraft = (draftId: string) => {
    showConfirm(
      'Are you sure you want to delete this draft? This action cannot be undone.',
      () => {
        DraftService.deleteDraft(draftId);
        setDrafts(drafts.filter(d => d.id !== draftId));
        showSuccess('Draft deleted successfully');
      },
      { title: 'Delete Draft' }
    );
  };

  const handleContinueDraft = (draftId: string) => {
    router.push(`/studies/create?draft=${draftId}`);
  };

  const getStatusBadgeVariant = (status: Study['status']) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'draft':
        return 'secondary';
      case 'paused':
        return 'warning';
      case 'completed':
        return 'info';
      case 'archived':
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

      {/* Drafts Section */}
      {drafts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-label mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Unsaved Drafts
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {drafts.map(draft => (
              <Card key={draft.id} className="relative">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button
                    onClick={() => handleContinueDraft(draft.id)}
                    className="p-2 rounded-lg bg-system-blue/10 hover:bg-system-blue/20 transition-colors"
                    aria-label="Continue editing draft"
                  >
                    <Edit3 className="w-4 h-4 text-system-blue" />
                  </button>
                  <button
                    onClick={() => handleDeleteDraft(draft.id)}
                    className="p-2 rounded-lg bg-system-red/10 hover:bg-system-red/20 transition-colors"
                    aria-label="Delete draft"
                  >
                    <Trash2 className="w-4 h-4 text-system-red" />
                  </button>
                </div>
                
                <Badge variant="secondary" className="mb-3">
                  DRAFT
                </Badge>
                
                <h3 className="text-lg font-semibold text-label line-clamp-2 pr-20">
                  {draft.title || 'Untitled Study'}
                </h3>
                
                <p className="text-sm text-secondary-label mt-2">
                  {draft.config.description || 'No description'}
                </p>
                
                <div className="mt-4 pt-4 border-t border-quaternary-fill">
                  <div className="flex justify-between text-sm">
                    <span className="text-tertiary-label">Last saved:</span>
                    <span className="font-medium text-label">
                      {formatDate(draft.updatedAt, { format: 'medium' })}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Published Studies Section */}
      <div>
        <h2 className="text-xl font-semibold text-label mb-4">Published Studies</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {studies.map(study => (
          <Link key={study.id} href={`/studies/${study.id}`}>
            <Card className="h-full transition-transform hover:scale-[1.02] cursor-pointer">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-label line-clamp-2">
                  {study.title}
                </h3>
                <Badge variant={getStatusBadgeVariant(study.status)}>
                  {study.status.toUpperCase()}
                </Badge>
              </div>

              <p className="text-sm text-secondary-label line-clamp-2 mb-4">
                {study.description}
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-tertiary-label">Participants:</span>
                  <span className="font-medium text-label">
                    {study.statistics?.totalParticipants || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary-label">Completed:</span>
                  <span className="font-medium text-label">
                    {study.statistics?.completedSorts || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-tertiary-label">Updated:</span>
                  <span className="font-medium text-label">
                    {formatDate(study.updatedAt, { format: 'medium' })}
                  </span>
                </div>
              </div>

              {study.status === 'active' &&
                study.statistics?.totalParticipants > 0 && (
                  <div className="mt-4 pt-4 border-t border-quaternary-fill">
                    <div className="h-2 bg-quaternary-fill rounded-full overflow-hidden">
                      <div
                        className="h-full bg-system-green transition-all duration-500"
                        style={{
                          width: `${Math.min(100, study.statistics?.responseRate || 0)}%`,
                        }}
                      />
                    </div>
                    <p className="text-xs text-tertiary-label mt-2">
                      {study.statistics?.responseRate?.toFixed(1)}% completion
                      rate
                    </p>
                  </div>
                )}
            </Card>
          </Link>
        ))}
        </div>
      </div>

      {studies.length === 0 && drafts.length === 0 && (
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
