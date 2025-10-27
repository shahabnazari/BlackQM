'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { PostSurveyQuestionnaire } from '@/components/questionnaire/PostSurveyQuestionnaire';
import PostSurvey from '@/components/participant/PostSurvey';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Alert } from '@/components/ui/alert';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  DocumentCheckIcon
} from '@heroicons/react/24/outline';

/**
 * Post-Survey Page - Phase 8.2 Day 2
 *
 * Dynamic post-survey page that:
 * - Loads context-aware questions based on Q-sort behavior
 * - Supports both dynamic and fallback static questions
 * - Saves responses with quality scoring
 * - Integrates with analysis pipeline
 *
 * @world-class Features:
 * - Seamless transition from Q-sort
 * - Adaptive questioning based on engagement
 * - Real-time quality assessment
 * - Experience feedback collection
 */
function PostSurveyContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Extract parameters
  const studyId = searchParams.get('studyId') || params.studyId as string;
  const participantId = searchParams.get('participantId') || params.participantId as string;
  const studyToken = searchParams.get('token');
  
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [useDynamicQuestions, setUseDynamicQuestions] = useState(true);
  const [qsortData, setQsortData] = useState<any>(null);
  const [completed, setCompleted] = useState(false);
  const [surveyResult, setSurveyResult] = useState<any>(null);

  // Load Q-sort data from session
  useEffect(() => {
    const loadQSortData = () => {
      try {
        // Try to get Q-sort data from session storage
        const storedData = sessionStorage.getItem('qsortData');
        if (storedData) {
          setQsortData(JSON.parse(storedData));
        }
        
        // Check if dynamic questions are available
        checkDynamicQuestionsAvailability();
      } catch (err) {
        console.error('Failed to load Q-sort data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadQSortData();
  }, []);

  // Check if dynamic questions are available
  const checkDynamicQuestionsAvailability = async () => {
    try {
      const response = await fetch(`/api/questions/survey/${studyId}?type=post-survey`);
      if (response.ok) {
        const questions = await response.json();
        setUseDynamicQuestions(questions.length > 0);
      } else {
        setUseDynamicQuestions(false);
      }
    } catch (err) {
      console.error('Failed to check dynamic questions:', err);
      setUseDynamicQuestions(false);
    }
  };

  // Validate required parameters
  useEffect(() => {
    if (!studyId && !studyToken) {
      setError('Study ID or token is required to continue');
    }
  }, [studyId, studyToken]);

  // Handle completion
  const handleComplete = async (responses: any) => {
    setCompleted(true);
    setSurveyResult(responses);

    // Clear Q-sort data from session
    sessionStorage.removeItem('qsortData');

    // Store completion status
    if (studyId) {
      sessionStorage.setItem(`study_${studyId}_postSurvey_complete`, 'true');
    }

    // Navigate to thank you page after delay
    setTimeout(() => {
      if (studyToken) {
        router.push(`/study/${studyToken}/complete`);
      } else {
        router.push('/participant/thank-you');
      }
    }, 3000);
  };

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Handle skip
  const handleSkip = () => {
    if (confirm('Are you sure you want to skip the post-survey? Your feedback helps improve our research.')) {
      handleComplete([]);
    }
  };

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <Card>
            <Alert variant="destructive">
              <ExclamationTriangleIcon className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">Unable to load post-survey</h3>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </Alert>
            <div className="flex justify-end mt-6">
              <Button onClick={handleBack} variant="secondary">
                Go Back
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Completion state
  if (completed) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12">
        <div className="max-w-2xl w-full px-4">
          <Card className="text-center">
            <div className="py-12">
              <CheckCircleIcon className="h-20 w-20 text-green-500 mx-auto mb-6" />
              <h1 className="text-3xl font-bold text-label mb-4">
                Thank You!
              </h1>
              <p className="text-lg text-secondary-label mb-2">
                Your post-survey responses have been recorded successfully.
              </p>
              {surveyResult?.qualityScore && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg inline-block">
                  <p className="text-sm font-medium text-blue-900">
                    Response Quality Score: {surveyResult.qualityScore}%
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Thank you for your thoughtful responses!
                  </p>
                </div>
              )}
              {surveyResult?.insights && (
                <div className="mt-6 text-left max-w-md mx-auto">
                  <h3 className="text-sm font-semibold text-label mb-2">Key Insights:</h3>
                  <ul className="space-y-1">
                    <li className="text-sm text-secondary-label">
                      • Sentiment: {surveyResult.insights.sentiment}
                    </li>
                    <li className="text-sm text-secondary-label">
                      • Engagement: {surveyResult.insights.engagement}
                    </li>
                    {surveyResult.insights.keyThemes?.length > 0 && (
                      <li className="text-sm text-secondary-label">
                        • Themes: {surveyResult.insights.keyThemes.slice(0, 3).join(', ')}
                      </li>
                    )}
                  </ul>
                </div>
              )}
              <p className="text-sm text-secondary-label mt-8">
                Redirecting you to the completion page...
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-label mb-2">
            Post-Study Survey
          </h1>
          <p className="text-lg text-secondary-label">
            Help us understand your experience and improve future studies
          </p>
        </div>

        {/* Info Banner */}
        {qsortData && (
          <Card className="mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-start gap-3">
              <DocumentCheckIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">
                  Questions tailored to your experience
                </h3>
                <p className="text-sm text-blue-700 mt-1">
                  Based on your Q-sort patterns, we've prepared specific questions to better understand your perspective.
                </p>
                <div className="flex gap-6 mt-3 text-xs text-blue-600">
                  <span>Time spent: {Math.floor(qsortData.timeSpent / 60)} minutes</span>
                  <span>Changes made: {qsortData.changesCount}</span>
                  {qsortData.extremeStatements?.mostAgree?.length > 0 && (
                    <span>Strong positions: {qsortData.extremeStatements.mostAgree.length}</span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Survey Component */}
        {loading ? (
          <Card>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-secondary-label">Preparing your post-survey...</p>
              </div>
            </div>
          </Card>
        ) : useDynamicQuestions && studyId && participantId ? (
          <PostSurveyQuestionnaire
            surveyId={studyId}
            participantId={participantId}
            qsortData={qsortData}
            onComplete={handleComplete}
            onBack={handleBack}
          />
        ) : (
          <PostSurvey
            onComplete={handleComplete}
            onBack={handleBack}
          />
        )}

        {/* Skip Option */}
        {!completed && (
          <div className="text-center mt-6">
            <button
              onClick={handleSkip}
              className="text-sm text-secondary-label hover:text-label underline"
            >
              Skip post-survey and continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PostSurveyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4">
          <Card>
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                <p className="text-secondary-label">Loading...</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    }>
      <PostSurveyContent />
    </Suspense>
  );
}