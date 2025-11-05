'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import PreScreening from '@/components/participant/PreScreening';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

/**
 * Phase 8.2 Day 1: Pre-Screening Page
 *
 * Dynamic pre-screening page that:
 * - Loads questions from the database
 * - Evaluates qualification criteria
 * - Redirects based on results
 * - Provides alternative study suggestions
 */
function PreScreeningContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const studyId = searchParams.get('studyId') || (params.studyId as string);
  const participantId =
    searchParams.get('participantId') || (params.participantId as string);
  const studyToken = searchParams.get('token');

  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Validate required parameters
  useEffect(() => {
    if (!studyId && !studyToken) {
      setError('Study ID or token is required');
    }
  }, [studyId, studyToken]);

  const handleComplete = (result: any) => {
    if (result.qualified) {
      // Store screening result in session
      sessionStorage.setItem(`screening_${studyId}`, JSON.stringify(result));

      // Redirect to main study
      if (studyToken) {
        router.push(`/study/${studyToken}/consent`);
      } else {
        router.push(`/study/${studyId}/consent`);
      }
    } else {
      // They were shown disqualification message in PreScreening component
      // Could redirect to studies page after a delay
      setTimeout(() => {
        router.push('/studies');
      }, 5000);
    }
  };

  const handleBack = () => {
    router.push('/studies');
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-3xl mx-auto p-8">
            <div className="text-center space-y-4">
              <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto" />
              <h1 className="text-2xl font-bold text-label">Error</h1>
              <p className="text-secondary-label">{error}</p>
              <Button onClick={() => router.push('/studies')}>
                Return to Studies
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-16">
          <Card className="max-w-3xl mx-auto p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-500" />
              <p className="text-secondary-label">
                Loading pre-screening questions...
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Study Pre-Screening
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Please complete these screening questions to determine your
              eligibility
            </p>
          </div>

          {/* Pre-Screening Component */}
          <PreScreening
            surveyId={studyId}
            participantId={participantId}
            onComplete={handleComplete}
            onBack={handleBack}
            useDynamic={true} // Force dynamic mode
          />

          {/* Footer Information */}
          <div className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            <p>
              Your responses are confidential and will only be used to determine
              study eligibility.
            </p>
            <p className="mt-2">
              If you have any questions, please contact the research team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PreScreeningPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
          <div className="container mx-auto px-4 py-16">
            <Card className="max-w-3xl mx-auto p-8">
              <div className="flex flex-col items-center justify-center space-y-4">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-secondary-label">Loading...</p>
              </div>
            </Card>
          </div>
        </div>
      }
    >
      <PreScreeningContent />
    </Suspense>
  );
}
