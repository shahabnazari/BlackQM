'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { participantApiEnhanced as participantApi } from '@/lib/api/participant-enhanced';
import PreScreening from '@/components/participant/PreScreening';
import Welcome from '@/components/participant/Welcome';
import Consent from '@/components/participant/Consent';
import Familiarization from '@/components/participant/Familiarization';
import PreSorting from '@/components/participant/PreSorting';
import QSortGrid from '@/components/participant/QSortGrid';
import Commentary from '@/components/participant/Commentary';
import PostSurvey from '@/components/participant/PostSurvey';
import ThankYou from '@/components/participant/ThankYou';
import { ProgressTracker } from '@/components/participant/ProgressTracker';

export type ParticipantStep =
  | 'pre-screening'
  | 'welcome'
  | 'consent'
  | 'familiarization'
  | 'pre-sorting'
  | 'q-sort'
  | 'commentary'
  | 'post-survey'
  | 'thank-you';

export default function ParticipantStudyPage() {
  const params = useParams();

  const [currentStep, setCurrentStep] = useState<ParticipantStep>('welcome');
  const [completedSteps, setCompletedSteps] = useState<ParticipantStep[]>([]);
  const [studyData, setStudyData] = useState<any>({});
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  // const [study, setStudy] = useState<any>(null);
  // const [statements, setStatements] = useState<any[]>([]);

  // Initialize session and fetch study data
  useEffect(() => {
    const initSession = async () => {
      try {
        // Check backend health first - this will enable mock mode if backend is not available
        const backendAvailable = await participantApi.checkBackendHealth();

        if (!backendAvailable) {
          console.info('Backend not available, using demo mode');
        }

        // Use token from URL or default to study-1
        const studyId =
          typeof params['token'] === 'string'
            ? params['token']
            : params['token']?.[0] || 'study-1';

        // Start session (will use mock data if backend is not available)
        const session = await participantApi.startSession(studyId);
        setSessionId(session.sessionCode);

        // Get study details
        await participantApi.getStudyInfo(session.sessionCode);
        // Store study data in component state if needed

        // Get statements
        await participantApi.getStatements(session.sessionCode);
        // Store statements if needed

        // Get progress if exists
        const progress = await participantApi.getProgress(session.sessionCode);
        if (progress.currentStep) {
          setCurrentStep(progress.currentStep as ParticipantStep);
          setCompletedSteps(
            (progress.completedSteps || []) as ParticipantStep[]
          );
        }

        // Show notification if using mock data
        if (participantApi.isUsingMockData()) {
          console.info('Using demo mode - backend not available');
        }
      } catch (error: any) {
        console.error('Failed to initialize session:', error);
        // Continue with demo mode even if there's an error
        if (participantApi.isUsingMockData()) {
          console.info('Continuing with demo mode');
        }
      } finally {
        // Always stop loading to show the UI
        setLoading(false);
      }
    };

    initSession();
  }, [params]);

  const handleStepComplete = async (data?: any) => {
    setCompletedSteps([...completedSteps, currentStep]);

    if (data) {
      setStudyData((prev: any) => ({
        ...prev,
        [currentStep]: data,
      }));
    }

    // Submit data to backend based on step
    if (sessionId) {
      try {
        switch (currentStep) {
          case 'pre-sorting':
            await participantApi.submitPreSort(sessionId, data);
            break;
          case 'q-sort':
            await participantApi.submitQSort(sessionId, data);
            break;
          case 'commentary':
            await participantApi.submitCommentary(sessionId, data);
            break;
          case 'post-survey':
            // Submit demographics or other post-survey data
            await participantApi.updateProgress(sessionId, {
              currentStep: 'thank-you',
              completedStep: currentStep,
              stepData: data,
            });
            break;
          default:
            // Update progress for other steps
            await participantApi.updateProgress(sessionId, {
              currentStep: currentStep,
              completedStep: currentStep,
              stepData: data,
            });
        }
      } catch (error: any) {
        console.error('Failed to submit step data:', error);
      }
    }

    // Move to next step
    const steps: ParticipantStep[] = [
      'pre-screening',
      'welcome',
      'consent',
      'familiarization',
      'pre-sorting',
      'q-sort',
      'commentary',
      'post-survey',
      'thank-you',
    ];

    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep);
      }
    }
  };

  const handleStepBack = () => {
    const steps: ParticipantStep[] = [
      'pre-screening',
      'welcome',
      'consent',
      'familiarization',
      'pre-sorting',
      'q-sort',
      'commentary',
      'post-survey',
      'thank-you',
    ];

    const currentIndex = steps.indexOf(currentStep);
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1];
      if (prevStep) {
        setCurrentStep(prevStep);
      }
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'pre-screening':
        return (
          <PreScreening
            onComplete={handleStepComplete}
            onBack={handleStepBack}
          />
        );
      case 'welcome':
        return (
          <Welcome onComplete={handleStepComplete} onBack={handleStepBack} />
        );
      case 'consent':
        return (
          <Consent onComplete={handleStepComplete} onBack={handleStepBack} />
        );
      case 'familiarization':
        return (
          <Familiarization
            onComplete={handleStepComplete}
            onBack={handleStepBack}
          />
        );
      case 'pre-sorting':
        return (
          <PreSorting onComplete={handleStepComplete} onBack={handleStepBack} />
        );
      case 'q-sort':
        return (
          <QSortGrid
            onComplete={handleStepComplete}
            onBack={handleStepBack}
            preSortData={studyData['pre-sorting']}
          />
        );
      case 'commentary':
        return (
          <Commentary
            onComplete={handleStepComplete}
            onBack={handleStepBack}
            qSortData={studyData['q-sort']}
          />
        );
      case 'post-survey':
        return (
          <PostSurvey onComplete={handleStepComplete} onBack={handleStepBack} />
        );
      case 'thank-you':
        return <ThankYou />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-system-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-text-secondary">Loading study...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-system-background">
      <div className="container mx-auto px-4 py-8">
        <ProgressTracker
          currentStep={currentStep}
          completedSteps={completedSteps}
        />

        <div className="mt-8">{renderStep()}</div>
      </div>
    </div>
  );
}
