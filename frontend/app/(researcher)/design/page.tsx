'use client';

import HypothesisBuilderPanel from '@/components/research-design/HypothesisBuilderPanel';
import QuestionRefinementPanel from '@/components/research-design/QuestionRefinementPanel';
import TheoryDiagramBuilder from '@/components/research-design/TheoryDiagramBuilder';
import type {
  GeneratedHypothesis,
  RefinedQuestion,
  TheoryDiagram,
} from '@/lib/api/services/research-design-api.service';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  BeakerIcon,
  CheckCircleIcon,
  CubeTransparentIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

/**
 * Phase 9.5 Day 3: Research Design Intelligence - Main Page
 *
 * Complete workflow: Literature → Research Design → Study Creation
 * Bridges DISCOVER (Phase 9) → DESIGN (Phase 9.5) → BUILD (Phase 10)
 */

type DesignStep = 'question' | 'hypotheses' | 'theory' | 'review';

export default function ResearchDesignPage() {
  const [currentStep, setCurrentStep] = useState<DesignStep>('question');
  const [refinedQuestion, setRefinedQuestion] =
    useState<RefinedQuestion | null>(null);
  const [hypotheses, setHypotheses] = useState<GeneratedHypothesis[]>([]);
  const [theoryDiagram, setTheoryDiagram] = useState<TheoryDiagram | null>(
    null
  );

  // Mock literature summary (in production, this would come from Phase 9)
  const [literatureSummary] = useState({
    papers: [],
    themes: [],
    gaps: [],
    contradictions: [],
    trends: [],
  });

  const steps = [
    {
      id: 'question' as const,
      name: 'Research Question',
      icon: LightBulbIcon,
      completed: !!refinedQuestion,
      description: 'Refine using SQUARE-IT framework',
    },
    {
      id: 'hypotheses' as const,
      name: 'Hypotheses',
      icon: BeakerIcon,
      completed: hypotheses.length > 0,
      description: 'Generate from contradictions & gaps',
    },
    {
      id: 'theory' as const,
      name: 'Theory Framework',
      icon: CubeTransparentIcon,
      completed: !!theoryDiagram,
      description: 'Build conceptual framework',
    },
    {
      id: 'review' as const,
      name: 'Review & Export',
      icon: CheckCircleIcon,
      completed: false,
      description: 'Finalize and proceed to build',
    },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const canGoNext = currentStepIndex < steps.length - 1;
  const canGoPrevious = currentStepIndex > 0;

  const handleNext = () => {
    const nextStep = steps[currentStepIndex + 1];
    if (canGoNext && nextStep) {
      setCurrentStep(nextStep.id);
    }
  };

  const handlePrevious = () => {
    const prevStep = steps[currentStepIndex - 1];
    if (canGoPrevious && prevStep) {
      setCurrentStep(prevStep.id);
    }
  };

  const handleProceedToBuild = () => {
    // TODO: Navigate to study creation with design outputs
    alert('Proceeding to BUILD phase with design outputs...');
  };

  const progressPercentage = ((currentStepIndex + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-white to-orange-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-xl flex items-center justify-center">
                <LightBulbIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Research Design Intelligence
                </h1>
                <p className="text-sm text-gray-600">
                  AI-powered question refinement, hypothesis generation & theory
                  building
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Progress</div>
              <div className="text-2xl font-bold text-yellow-600">
                {Math.round(progressPercentage)}%
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Step Navigation */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = step.completed;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <button
                    onClick={() => setCurrentStep(step.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white shadow-lg scale-105'
                        : isCompleted
                          ? 'bg-green-50 text-green-800 hover:bg-green-100'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <div className="relative">
                      <StepIcon className="w-5 h-5" />
                      {isCompleted && !isActive && (
                        <CheckCircleIcon className="w-3 h-3 absolute -top-1 -right-1 text-green-600 bg-white rounded-full" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-medium">{step.name}</div>
                      <div className="text-xs opacity-75">
                        {step.description}
                      </div>
                    </div>
                  </button>
                  {index < steps.length - 1 && (
                    <div className="flex-1 h-0.5 bg-gray-200 mx-2">
                      <div
                        className={`h-full ${index < currentStepIndex ? 'bg-green-500' : 'bg-gray-200'}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          {/* Step Content */}
          {currentStep === 'question' && (
            <QuestionRefinementPanel
              literatureSummary={literatureSummary}
              onQuestionRefined={question => {
                setRefinedQuestion(question);
                // Auto-advance to next step after refinement
                setTimeout(() => handleNext(), 1000);
              }}
            />
          )}

          {currentStep === 'hypotheses' && (
            <HypothesisBuilderPanel
              researchQuestion={refinedQuestion?.refinedQuestion || ''}
              literatureSummary={literatureSummary}
              onHypothesesGenerated={hyp => {
                setHypotheses(hyp);
                // Auto-advance to next step after generation
                setTimeout(() => handleNext(), 1000);
              }}
            />
          )}

          {currentStep === 'theory' && (
            <TheoryDiagramBuilder
              researchQuestion={refinedQuestion?.refinedQuestion || ''}
              themes={literatureSummary.themes}
              onDiagramGenerated={diagram => {
                setTheoryDiagram(diagram);
                // Auto-advance to next step after generation
                setTimeout(() => handleNext(), 1000);
              }}
            />
          )}

          {currentStep === 'review' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <CheckCircleIcon className="w-10 h-10 text-green-600" />
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Review Your Research Design
                  </h2>
                  <p className="text-sm text-gray-600">
                    Summary of your refined research design outputs
                  </p>
                </div>
              </div>

              {/* Refined Question Summary */}
              {refinedQuestion && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-2">
                    Research Question
                  </h3>
                  <p className="text-gray-800 mb-3">
                    {refinedQuestion.refinedQuestion}
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="text-gray-600">
                      Quality Score:{' '}
                      <strong className="text-green-600">
                        {refinedQuestion.squareitScore.overall.toFixed(1)}/10
                      </strong>
                    </span>
                    {refinedQuestion.subQuestions && (
                      <span className="text-gray-600">
                        {refinedQuestion.subQuestions.length} sub-questions
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Hypotheses Summary */}
              {hypotheses.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-2">
                    Hypotheses ({hypotheses.length})
                  </h3>
                  <div className="space-y-2">
                    {hypotheses.slice(0, 3).map((hyp, idx) => (
                      <div key={idx} className="bg-white rounded p-3 text-sm">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                            {hyp.type}
                          </span>
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-800 rounded text-xs">
                            {hyp.source}
                          </span>
                        </div>
                        <p className="text-gray-800">{hyp.statement}</p>
                      </div>
                    ))}
                    {hypotheses.length > 3 && (
                      <p className="text-xs text-gray-600 italic">
                        ... and {hypotheses.length - 3} more hypotheses
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Theory Diagram Summary */}
              {theoryDiagram && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <h3 className="font-bold text-gray-900 mb-2">
                    Conceptual Framework
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Constructs: </span>
                      <strong className="text-gray-900">
                        {theoryDiagram.constructs.length}
                      </strong>
                    </div>
                    <div>
                      <span className="text-gray-600">Relationships: </span>
                      <strong className="text-gray-900">
                        {theoryDiagram.relationships.length}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentStep('question')}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 flex items-center space-x-2"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Back to Edit</span>
                </button>
                <button
                  onClick={handleProceedToBuild}
                  className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center space-x-2"
                >
                  <span>Proceed to BUILD Phase</span>
                  <ArrowRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStep !== 'review' && (
          <div className="flex items-center justify-between mt-6">
            <button
              onClick={handlePrevious}
              disabled={!canGoPrevious}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              onClick={handleNext}
              disabled={!canGoNext}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
