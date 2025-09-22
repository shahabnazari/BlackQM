'use client';

import React, { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Alert } from '@/components/ui/alert';
import ScreeningQuestionnaire from '@/components/questionnaire/ScreeningQuestionnaire';
import { ScreeningResult } from '@/lib/services/question-api.service';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';

interface PreScreeningProps {
  surveyId?: string; // Make optional for backward compatibility
  participantId?: string;
  onComplete: (data?: any) => void;
  onBack: () => void;
  useDynamic?: boolean; // Allow switching between old and new behavior
}

/**
 * Phase 8.2 Day 1: Refactored PreScreening Component
 * 
 * Now supports:
 * - Dynamic questions from API
 * - Qualification logic
 * - Alternative study suggestions
 * - Backward compatibility with hardcoded questions
 */
export default function PreScreening({ 
  surveyId, 
  participantId,
  onComplete, 
  onBack,
  useDynamic = true // Default to dynamic if surveyId provided
}: PreScreeningProps) {
  const [screeningResult, setScreeningResult] = useState<ScreeningResult | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [answers, setAnswers] = useState({
    familiarity: '',
    participation: '',
    timeAvailable: '',
    age: '',
  });

  // Handle screening completion from dynamic questionnaire
  const handleScreeningComplete = (result: ScreeningResult) => {
    setScreeningResult(result);
    setShowResult(true);

    if (result.qualified) {
      // Auto-proceed after short delay for qualified participants
      setTimeout(() => {
        onComplete({
          ...result
        });
      }, 1500);
    }
  };

  // Handle manual continuation for qualified participants
  const handleContinue = () => {
    if (screeningResult?.qualified) {
      onComplete(screeningResult);
    }
  };

  // Handle change for hardcoded questions
  const handleChange = (field: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isComplete = Object.values(answers).every((value) => value !== '');

  // Handle submit for hardcoded questions
  const handleSubmit = () => {
    // Check if participant meets criteria
    const meetsAge = answers.age !== 'under18';
    const hasTime = answers.timeAvailable === 'yes';
    
    if (!meetsAge || !hasTime) {
      setScreeningResult({
        qualified: false,
        reason: 'You must be 18 or older and have at least 20 minutes available to participate.',
        recommendations: [
          !meetsAge ? 'You must be 18 or older to participate.' : '',
          !hasTime ? 'This study requires approximately 20-30 minutes to complete.' : ''
        ].filter(Boolean)
      });
      setShowResult(true);
      return;
    }

    onComplete(answers);
  };

  // Show screening result (for both dynamic and hardcoded)
  if (showResult && screeningResult) {
    return (
      <Card className="max-w-3xl mx-auto p-8">
        <div className="text-center space-y-6">
          {screeningResult.qualified ? (
            <>
              <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold text-label mb-2">
                  Congratulations!
                </h2>
                <p className="text-secondary-label">
                  You qualify for this study. Proceeding to the main study...
                </p>
              </div>
              <Button onClick={handleContinue} size="large">
                Continue to Study
              </Button>
            </>
          ) : (
            <>
              <XCircleIcon className="h-16 w-16 text-red-500 mx-auto" />
              <div>
                <h2 className="text-2xl font-bold text-label mb-2">
                  Thank You for Your Interest
                </h2>
                <p className="text-secondary-label mb-4">
                  {screeningResult.reason || 'Unfortunately, you do not meet the requirements for this study at this time.'}
                </p>
                
                {/* Show recommendations */}
                {screeningResult.recommendations && screeningResult.recommendations.length > 0 && (
                  <Alert className="text-left mb-4">
                    <ExclamationTriangleIcon className="h-4 w-4" />
                    <div className="ml-2">
                      <h3 className="font-semibold mb-2">Recommendations:</h3>
                      <ul className="list-disc list-inside space-y-1">
                        {screeningResult.recommendations.map((rec, index) => (
                          <li key={index} className="text-sm">{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </Alert>
                )}

                {/* Show alternative studies */}
                {screeningResult.alternativeStudies && screeningResult.alternativeStudies.length > 0 && (
                  <div className="text-left">
                    <h3 className="font-semibold mb-2">You may qualify for these studies:</h3>
                    <div className="space-y-2">
                      {screeningResult.alternativeStudies.map((studyId, index) => (
                        <Button
                          key={index}
                          variant="secondary"
                          onClick={() => window.location.href = `/study/${studyId}`}
                          className="w-full"
                        >
                          View Alternative Study {index + 1}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 justify-center">
                <Button variant="secondary" onClick={onBack}>
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Studies
                </Button>
                {screeningResult.redirectUrl && (
                  <Button 
                    onClick={() => window.location.href = screeningResult.redirectUrl!}
                  >
                    Learn More
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </Card>
    );
  }

  // If dynamic mode and surveyId provided, use new component
  if (useDynamic && surveyId) {
    return (
      <ScreeningQuestionnaire
        surveyId={surveyId}
        participantId={participantId || ''}
        onComplete={handleScreeningComplete}
        onExit={onBack}
        showProgress={true}
        autoSave={true}
      />
    );
  }

  // Fallback to original hardcoded implementation for backward compatibility
  return (
    <Card className="max-w-3xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-label mb-2">
            Pre-Screening Questions
          </h1>
          <p className="text-secondary-label">
            Please answer these questions to determine if you're eligible for this study.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-label mb-2">
              How familiar are you with Q-methodology research? *
            </label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={answers.familiarity}
              onChange={(e) => handleChange('familiarity', e.target.value)}
            >
              <option value="">Select an option</option>
              <option value="very">Very familiar</option>
              <option value="somewhat">Somewhat familiar</option>
              <option value="not">Not familiar at all</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-label mb-2">
              Have you participated in a Q-methodology study before? *
            </label>
            <div className="space-y-2">
              {['Yes', 'No', 'Not sure'].map((option) => (
                <label key={option} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="participation"
                    value={option.toLowerCase()}
                    checked={answers.participation === option.toLowerCase()}
                    onChange={(e) => handleChange('participation', e.target.value)}
                    className="w-4 h-4 text-system-blue border-quaternary-fill focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-label">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-label mb-2">
              Do you have 20-30 minutes to complete this study? *
            </label>
            <div className="space-y-2">
              {['Yes', 'No'].map((option) => (
                <label key={option} className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="timeAvailable"
                    value={option.toLowerCase()}
                    checked={answers.timeAvailable === option.toLowerCase()}
                    onChange={(e) => handleChange('timeAvailable', e.target.value)}
                    className="w-4 h-4 text-system-blue border-quaternary-fill focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-label">{option}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-label mb-2">
              Please confirm your age group *
            </label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={answers.age}
              onChange={(e) => handleChange('age', e.target.value)}
            >
              <option value="">Select age group</option>
              <option value="under18">Under 18</option>
              <option value="18-24">18-24</option>
              <option value="25-34">25-34</option>
              <option value="35-44">35-44</option>
              <option value="45-54">45-54</option>
              <option value="55-64">55-64</option>
              <option value="65+">65+</option>
            </select>
          </div>
        </div>

        <div className="bg-quaternary-fill/30 p-4 rounded-lg">
          <p className="text-sm text-secondary-label">
            <strong>Note:</strong> This study is open to participants aged 18 and above who
            have approximately 20-30 minutes to complete all steps.
          </p>
        </div>

        <div className="flex justify-between">
          <Button variant="secondary" onClick={onBack} disabled>
            Back
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={handleSubmit}
            disabled={!isComplete}
          >
            Check Eligibility
          </Button>
        </div>
      </div>
    </Card>
  );
}