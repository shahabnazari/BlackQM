'use client';

import React from 'react';
import { Card } from '@/components/apple-ui/Card';
import ResearcherBranding from './ResearcherBranding';

interface PreviewData {
  participantView: {
    welcome: {
      title: string;
      message: string;
      videoUrl?: string;
      includeVideo: boolean;
    };
    consent: {
      form: string;
      requireSignature?: boolean;
      signatureType?: string;
    };
    researcherBranding?: {
      researcherName?: string;
      researcherTitle?: string;
      researcherSignatureUrl?: string;
      organizationName?: string;
      organizationLogoUrl?: string;
      brandingPosition?: 'top' | 'bottom';
    };
    preScreening: {
      enabled: boolean;
      questions: any[];
    };
    qSort: {
      gridConfig: any[];
      gridColumns: number;
      gridShape: string;
      statements: any[];
    };
    postSurvey: {
      enabled: boolean;
      questions: any[];
    };
  };
  metadata: {
    totalSteps: number;
    estimatedTime: number;
    features: {
      videoConferencing: boolean;
      preScreening: boolean;
      postSurvey: boolean;
      digitalSignature: boolean;
    };
  };
}

interface ParticipantPreviewProps {
  previewData: PreviewData;
  studyTitle: string;
}

export default function ParticipantPreview({
  previewData,
  studyTitle,
}: ParticipantPreviewProps) {
  const [currentStep, setCurrentStep] = React.useState(0);

  const steps = React.useMemo(() => {
    const allSteps = [];

    // Welcome step
    allSteps.push({
      title: 'Welcome',
      type: 'welcome',
      data: previewData.participantView.welcome,
    });

    // Consent step
    allSteps.push({
      title: 'Consent',
      type: 'consent',
      data: previewData.participantView.consent,
    });

    // Pre-screening step (if enabled)
    if (previewData.participantView.preScreening.enabled) {
      allSteps.push({
        title: 'Pre-Screening',
        type: 'preScreening',
        data: previewData.participantView.preScreening,
      });
    }

    // Q-Sort step
    allSteps.push({
      title: 'Q-Sort',
      type: 'qSort',
      data: previewData.participantView.qSort,
    });

    // Post-survey step (if enabled)
    if (previewData.participantView.postSurvey.enabled) {
      allSteps.push({
        title: 'Post-Survey',
        type: 'postSurvey',
        data: previewData.participantView.postSurvey,
      });
    }

    // Completion step
    allSteps.push({
      title: 'Complete',
      type: 'complete',
      data: {},
    });

    return allSteps;
  }, [previewData]);

  const renderStepContent = () => {
    const step = steps[currentStep];
    if (!step) return null;

    switch (step.type) {
      case 'welcome':
        return (
          <div>
            {/* Show researcher branding at top if configured */}
            {previewData.participantView.researcherBranding
              ?.brandingPosition === 'top' && (
              <ResearcherBranding
                {...previewData.participantView.researcherBranding}
                position="top"
                variant="compact"
              />
            )}

            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-label">
                {(step.data as any).title}
              </h2>
              <div
                className="prose prose-lg max-w-none text-secondary-label"
                dangerouslySetInnerHTML={{ __html: (step.data as any).message }}
              />
              {(step.data as any).includeVideo &&
                (step.data as any).videoUrl && (
                  <div className="aspect-video bg-black/5 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl mb-2">▶️</div>
                      <p className="text-sm text-secondary-label">
                        Video Preview
                      </p>
                      <p className="text-xs text-tertiary-label mt-1">
                        {(step.data as any).videoUrl}
                      </p>
                    </div>
                  </div>
                )}
            </div>

            {/* Show researcher branding at bottom if configured */}
            {previewData.participantView.researcherBranding
              ?.brandingPosition === 'bottom' && (
              <ResearcherBranding
                {...previewData.participantView.researcherBranding}
                position="bottom"
                variant="compact"
              />
            )}
          </div>
        );

      case 'consent':
        return (
          <div>
            {/* Show researcher branding at top if configured */}
            {previewData.participantView.researcherBranding
              ?.brandingPosition === 'top' && (
              <ResearcherBranding
                {...previewData.participantView.researcherBranding}
                position="top"
                variant="full"
              />
            )}

            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-label">
                Informed Consent
              </h2>
              <div className="max-h-96 overflow-y-auto border rounded-lg p-4 bg-quaternary-fill/10">
                <div
                  className="prose prose-sm max-w-none text-secondary-label"
                  dangerouslySetInnerHTML={{ __html: (step.data as any).form }}
                />
              </div>

              <label className="flex items-start gap-3">
                <input type="checkbox" className="mt-1" />
                <span className="text-sm text-label">
                  I have read and agree to the terms of this consent form
                </span>
              </label>
            </div>

            {/* Show researcher branding at bottom if configured */}
            {previewData.participantView.researcherBranding
              ?.brandingPosition === 'bottom' && (
              <ResearcherBranding
                {...previewData.participantView.researcherBranding}
                position="bottom"
                variant="full"
              />
            )}
          </div>
        );

      case 'preScreening':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-label">
              Pre-Screening Questions
            </h2>
            <div className="space-y-4">
              {(step.data as any).questions.length > 0 ? (
                (step.data as any).questions.map((q: any, idx: number) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <p className="font-medium text-label mb-2">
                      Question {idx + 1}
                    </p>
                    <p className="text-sm text-secondary-label">{q.text}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-quaternary-fill/10 rounded-lg">
                  <p className="text-secondary-label">
                    Pre-screening questions will appear here
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'qSort':
        return (
          <div className="space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-label">Q-Sort Activity</h2>
              <p className="text-sm text-secondary-label mt-1">
                Sort the statements according to your level of agreement
              </p>
            </div>

            {/* Grid Labels */}
            <div className="flex justify-between text-xs font-medium text-secondary-label px-4">
              <span>Most Disagree</span>
              <span>Neutral</span>
              <span>Most Agree</span>
            </div>

            {/* Q-Sort Grid */}
            <div className="overflow-x-auto pb-4">
              <div className="flex justify-center gap-2 min-w-fit mx-auto">
                {(step.data as any).gridConfig?.map((col: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center">
                    <div className="text-sm font-bold mb-2 text-label">
                      {col.position > 0 ? '+' : ''}
                      {col.position}
                    </div>
                    <div className="flex flex-col gap-2">
                      {Array.from({ length: col.maxItems }).map((_, i) => (
                        <div
                          key={i}
                          className="w-20 h-20 border-2 border-dashed border-gray-300 rounded-lg bg-white flex items-center justify-center"
                        >
                          <span className="text-xs text-gray-400">
                            Drop here
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Statement Cards */}
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-label mb-2">
                Statements to Sort ({(step.data as any).statements?.length || 0}
                )
              </p>
              <div className="flex gap-2 flex-wrap">
                {(step.data as any).statements?.length > 0 ? (
                  (step.data as any).statements
                    .slice(0, 5)
                    .map((_s: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-2 bg-white border rounded shadow-sm text-xs"
                      >
                        Statement {idx + 1}
                      </div>
                    ))
                ) : (
                  <div className="text-sm text-secondary-label">
                    Statements will appear here for sorting
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'postSurvey':
        return (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-label">Post-Sort Survey</h2>
            <div className="space-y-4">
              {(step.data as any).questions.length > 0 ? (
                (step.data as any).questions.map((q: any, idx: number) => (
                  <div key={idx} className="p-4 border rounded-lg">
                    <p className="font-medium text-label mb-2">
                      Question {idx + 1}
                    </p>
                    <p className="text-sm text-secondary-label">{q.text}</p>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center bg-quaternary-fill/10 rounded-lg">
                  <p className="text-secondary-label">
                    Post-survey questions will appear here
                  </p>
                  <p className="text-xs text-tertiary-label mt-2">
                    These help gather additional insights about your sorting
                    decisions
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-label mb-2">Thank You!</h2>
            <p className="text-lg text-secondary-label">
              You have completed the study
            </p>
            <p className="text-sm text-tertiary-label mt-4">
              Your responses have been recorded
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Browser Frame */}
      <div className="border-2 border-gray-200 rounded-xl overflow-hidden shadow-xl">
        {/* Browser Header */}
        <div className="bg-gray-100 px-4 py-3 flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
          </div>
          <div className="flex-1">
            <div className="bg-white rounded-md px-3 py-1 text-xs text-gray-600 max-w-md mx-auto text-center">
              https://study.example.com/participate/
              {studyTitle.toLowerCase().replace(/\s+/g, '-')}
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white">
          {/* Progress Bar */}
          <div className="h-1 bg-gray-200">
            <div
              className="h-full bg-system-blue transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>

          {/* Step Content */}
          <div className="p-8 min-h-[500px]">{renderStepContent()}</div>

          {/* Navigation */}
          <div className="border-t px-8 py-4 flex justify-between items-center bg-gray-50">
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            <div className="text-sm text-gray-600">
              Step {currentStep + 1} of {steps.length}
            </div>

            <button
              onClick={() =>
                setCurrentStep(Math.min(steps.length - 1, currentStep + 1))
              }
              disabled={currentStep === steps.length - 1}
              className="px-4 py-2 text-sm font-medium text-white bg-system-blue border border-transparent rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {currentStep === steps.length - 2 ? 'Submit' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Controls */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-label">Interactive Preview</h3>
            <p className="text-sm text-secondary-label mt-1">
              Navigate through the participant experience
            </p>
          </div>
          <div className="flex gap-2">
            {steps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentStep(idx)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  currentStep === idx
                    ? 'bg-system-blue text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {step.title}
              </button>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
