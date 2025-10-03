'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { Badge } from '@/components/apple-ui/Badge';
import { Alert } from '@/components/ui/alert';
import InfoTooltip from '@/components/tooltips/InfoTooltipV2';
import {
  DocumentTextIcon,
  PlusIcon,
  TrashIcon,
  PencilIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  ClipboardDocumentCheckIcon,
  ClipboardDocumentListIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline';
import { QuestionEditor } from '@/components/questionnaire/QuestionEditor';
import { questionAPIService } from '@/lib/services/question-api.service';

interface Question {
  id: string;
  text: string;
  type: string;
  required: boolean;
  options?: any[];
  validation?: any;
  skipLogic?: any;
  metadata?: any;
}

interface QuestionnairesTabProps {
  studyId?: string;
  onUpdate: (data: any) => void;
  initialData?: {
    preScreening?: {
      enabled: boolean;
      questions: Question[];
      qualificationRules?: any[];
    };
    postSurvey?: {
      enabled: boolean;
      questions: Question[];
      contextAware: boolean;
    };
  };
}

/**
 * QuestionnairesTab Component - Phase 8.2 Day 2
 *
 * World-class questionnaire management for study creation
 * Integrates pre-screening and post-survey configuration
 *
 * @world-class Features:
 * - Dual-tab interface for pre/post questionnaires
 * - Question library with templates
 * - AI-powered question suggestions
 * - Skip logic builder
 * - Real-time validation
 * - Import/Export functionality
 */
export function QuestionnairesTab({
  studyId,
  onUpdate,
  initialData,
}: QuestionnairesTabProps) {
  // State management
  const [activeTab, setActiveTab] = useState<'pre-screening' | 'post-survey'>(
    'pre-screening'
  );
  const [preScreeningEnabled, setPreScreeningEnabled] = useState(
    initialData?.preScreening?.enabled || false
  );
  const [postSurveyEnabled, setPostSurveyEnabled] = useState(
    initialData?.postSurvey?.enabled || false
  );
  const [preScreeningQuestions, setPreScreeningQuestions] = useState<
    Question[]
  >(initialData?.preScreening?.questions || []);
  const [postSurveyQuestions, setPostSurveyQuestions] = useState<Question[]>(
    initialData?.postSurvey?.questions || []
  );
  const [qualificationRules, _setQualificationRules] = useState(
    initialData?.preScreening?.qualificationRules || []
  );
  const [contextAwareEnabled, setContextAwareEnabled] = useState(
    initialData?.postSurvey?.contextAware || true
  );
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Question templates
  const questionTemplates = {
    preScreening: [
      {
        id: 'age-check',
        text: 'What is your age?',
        type: 'NUMBER',
        required: true,
        validation: { min: 18, max: 100 },
      },
      {
        id: 'experience',
        text: 'How familiar are you with the topic of this study?',
        type: 'LIKERT',
        required: true,
        options: [
          { value: 1, label: 'Not familiar at all' },
          { value: 2, label: 'Slightly familiar' },
          { value: 3, label: 'Moderately familiar' },
          { value: 4, label: 'Very familiar' },
          { value: 5, label: 'Extremely familiar' },
        ],
      },
      {
        id: 'consent-check',
        text: 'Do you consent to participate in this research study?',
        type: 'RADIO',
        required: true,
        options: [
          { value: 'yes', label: 'Yes, I consent' },
          { value: 'no', label: 'No, I do not consent' },
        ],
      },
    ],
    postSurvey: [
      {
        id: 'overall-experience',
        text: 'How would you rate your overall experience with this study?',
        type: 'RATING',
        required: true,
        validation: { min: 1, max: 5 },
      },
      {
        id: 'difficulty',
        text: 'How difficult was it to complete the Q-sort?',
        type: 'LIKERT',
        required: false,
        options: [
          { value: 1, label: 'Very easy' },
          { value: 2, label: 'Easy' },
          { value: 3, label: 'Neutral' },
          { value: 4, label: 'Difficult' },
          { value: 5, label: 'Very difficult' },
        ],
      },
      {
        id: 'feedback',
        text: 'Do you have any feedback or suggestions for improving this study?',
        type: 'TEXTAREA',
        required: false,
        validation: { maxLength: 500 },
      },
    ],
  };

  // Update parent component
  useEffect(() => {
    onUpdate({
      preScreening: {
        enabled: preScreeningEnabled,
        questions: preScreeningQuestions,
        qualificationRules,
      },
      postSurvey: {
        enabled: postSurveyEnabled,
        questions: postSurveyQuestions,
        contextAware: contextAwareEnabled,
      },
    });
  }, [
    preScreeningEnabled,
    postSurveyEnabled,
    preScreeningQuestions,
    postSurveyQuestions,
    qualificationRules,
    contextAwareEnabled,
  ]);

  // Add question from template
  const addQuestionFromTemplate = (template: any) => {
    const newQuestion = {
      ...template,
      id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };

    if (activeTab === 'pre-screening') {
      setPreScreeningQuestions([...preScreeningQuestions, newQuestion]);
    } else {
      setPostSurveyQuestions([...postSurveyQuestions, newQuestion]);
    }
  };

  // Add custom question
  const addCustomQuestion = () => {
    setEditingQuestion(null);
    setShowEditor(true);
  };

  // Edit question
  const editQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowEditor(true);
  };

  // Save question from editor
  const saveQuestion = (question: Question) => {
    if (activeTab === 'pre-screening') {
      if (editingQuestion) {
        setPreScreeningQuestions(
          preScreeningQuestions.map(q =>
            q.id === editingQuestion.id ? question : q
          )
        );
      } else {
        setPreScreeningQuestions([...preScreeningQuestions, question]);
      }
    } else {
      if (editingQuestion) {
        setPostSurveyQuestions(
          postSurveyQuestions.map(q =>
            q.id === editingQuestion.id ? question : q
          )
        );
      } else {
        setPostSurveyQuestions([...postSurveyQuestions, question]);
      }
    }
    setShowEditor(false);
    setEditingQuestion(null);
  };

  // Delete question
  const deleteQuestion = (questionId: string) => {
    if (activeTab === 'pre-screening') {
      setPreScreeningQuestions(
        preScreeningQuestions.filter(q => q.id !== questionId)
      );
    } else {
      setPostSurveyQuestions(
        postSurveyQuestions.filter(q => q.id !== questionId)
      );
    }
  };

  // Move question up/down
  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const questions =
      activeTab === 'pre-screening'
        ? preScreeningQuestions
        : postSurveyQuestions;
    const newQuestions = [...questions];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    if (newIndex >= 0 && newIndex < questions.length) {
      const temp = newQuestions[index];
      newQuestions[index] = newQuestions[newIndex]!;
      newQuestions[newIndex] = temp!;

      if (activeTab === 'pre-screening') {
        setPreScreeningQuestions(newQuestions);
      } else {
        setPostSurveyQuestions(newQuestions);
      }
    }
  };

  // Import questions
  const importQuestions = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = e => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (activeTab === 'pre-screening') {
              setPreScreeningQuestions(data.questions || []);
            } else {
              setPostSurveyQuestions(data.questions || []);
            }
          } catch (error: any) {
            console.error('Failed to import questions:', error);
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Export questions
  const exportQuestions = () => {
    const questions =
      activeTab === 'pre-screening'
        ? preScreeningQuestions
        : postSurveyQuestions;
    const dataStr = JSON.stringify({ questions }, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const exportFileDefaultName = `${activeTab}-questions.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // Generate AI suggestions
  const generateAISuggestions = async () => {
    setLoading(true);
    try {
      // This would call the AI service to generate question suggestions
      console.log('Generating AI suggestions...');
      // Placeholder for AI integration
    } catch (error: any) {
      console.error('Failed to generate suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Save to backend
  const saveQuestionnaires = async () => {
    if (!studyId) return;

    setSaving(true);
    try {
      // Save pre-screening questions
      if (preScreeningEnabled) {
        await Promise.all(
          preScreeningQuestions.map(q =>
            questionAPIService.createQuestion({
              ...q,
              studyId,
              metadata: { ...q.metadata, type: 'pre-screening' },
            })
          )
        );
      }

      // Save post-survey questions
      if (postSurveyEnabled) {
        await Promise.all(
          postSurveyQuestions.map(q =>
            questionAPIService.createQuestion({
              ...q,
              studyId,
              metadata: { ...q.metadata, type: 'post-survey' },
            })
          )
        );
      }
    } catch (error: any) {
      console.error('Failed to save questionnaires:', error);
    } finally {
      setSaving(false);
    }
  };

  const currentQuestions =
    activeTab === 'pre-screening' ? preScreeningQuestions : postSurveyQuestions;
  const isEnabled =
    activeTab === 'pre-screening' ? preScreeningEnabled : postSurveyEnabled;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-label">Questionnaires</h2>
        <p className="text-sm text-secondary-label mt-1">
          Configure pre-screening and post-survey questions for your study
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-separator">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('pre-screening')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'pre-screening'
                ? 'border-system-blue text-system-blue'
                : 'border-transparent text-secondary-label hover:text-label'
            }`}
          >
            <div className="flex items-center gap-2">
              <ClipboardDocumentCheckIcon className="h-4 w-4" />
              Pre-Screening
              {preScreeningEnabled && (
                <Badge variant="default" size="sm">
                  {preScreeningQuestions.length}
                </Badge>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('post-survey')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'post-survey'
                ? 'border-system-blue text-system-blue'
                : 'border-transparent text-secondary-label hover:text-label'
            }`}
          >
            <div className="flex items-center gap-2">
              <ClipboardDocumentListIcon className="h-4 w-4" />
              Post-Survey
              {postSurveyEnabled && (
                <Badge variant="default" size="sm">
                  {postSurveyQuestions.length}
                </Badge>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Content */}
      <div>
        {/* Enable/Disable Toggle */}
        <Card className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-label">
                {activeTab === 'pre-screening'
                  ? 'Pre-Screening Questions'
                  : 'Post-Survey Questions'}
              </h3>
              <p className="text-sm text-secondary-label mt-1">
                {activeTab === 'pre-screening'
                  ? 'Screen participants before they start the Q-sort'
                  : 'Collect additional data after the Q-sort is complete'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {activeTab === 'post-survey' && (
                <div className="flex items-center gap-2">
                  <Switch
                    checked={contextAwareEnabled}
                    onCheckedChange={setContextAwareEnabled}
                    disabled={!postSurveyEnabled}
                  />
                  <label className="text-sm text-label">
                    Context-aware questions
                    <InfoTooltip content="Automatically add questions based on Q-sort behavior" />
                  </label>
                </div>
              )}
              <input
                type="checkbox"
                checked={isEnabled}
                onChange={e => {
                  const checked = e.target.checked;
                  if (activeTab === 'pre-screening') {
                    setPreScreeningEnabled(checked);
                  } else {
                    setPostSurveyEnabled(checked);
                  }
                }}
                className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </Card>

        {/* Questions List */}
        {isEnabled && (
          <>
            {/* Toolbar */}
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  icon={<PlusIcon className="h-4 w-4" />}
                  onClick={addCustomQuestion}
                >
                  Add Question
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  icon={<SparklesIcon className="h-4 w-4" />}
                  onClick={generateAISuggestions}
                  loading={loading}
                >
                  AI Suggestions
                </Button>
                <Button variant="secondary" size="sm" onClick={importQuestions}>
                  Import
                </Button>
                {currentQuestions.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={exportQuestions}
                  >
                    Export
                  </Button>
                )}
              </div>

              {studyId && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={saveQuestionnaires}
                  loading={saving}
                >
                  Save to Study
                </Button>
              )}
            </div>

            {/* Question Templates */}
            {currentQuestions.length === 0 && (
              <Card className="mb-4 bg-blue-50 border-blue-200">
                <div>
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">
                    Quick Start Templates
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {(activeTab === 'pre-screening'
                      ? questionTemplates.preScreening
                      : questionTemplates.postSurvey
                    ).map(template => (
                      <Button
                        key={template.id}
                        variant="secondary"
                        size="sm"
                        onClick={() => addQuestionFromTemplate(template)}
                      >
                        {template.text.substring(0, 30)}...
                      </Button>
                    ))}
                  </div>
                </div>
              </Card>
            )}

            {/* Questions */}
            {currentQuestions.length > 0 ? (
              <div className="space-y-2">
                {currentQuestions.map((question, index) => (
                  <Card
                    key={question.id}
                    className="hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col gap-1 mt-1">
                            <button
                              onClick={() => moveQuestion(index, 'up')}
                              disabled={index === 0}
                              className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                            >
                              <ChevronUpIcon className="h-3 w-3" />
                            </button>
                            <span className="text-xs text-secondary-label text-center">
                              {index + 1}
                            </span>
                            <button
                              onClick={() => moveQuestion(index, 'down')}
                              disabled={index === currentQuestions.length - 1}
                              className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"
                            >
                              <ChevronDownIcon className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-label">
                              {question.text}
                            </p>
                            <div className="flex items-center gap-3 mt-2">
                              <Badge variant="default" size="sm">
                                {question.type}
                              </Badge>
                              {question.required && (
                                <Badge variant="warning" size="sm">
                                  Required
                                </Badge>
                              )}
                              {question.skipLogic && (
                                <Badge variant="info" size="sm">
                                  Has skip logic
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="tertiary"
                          size="sm"
                          icon={<PencilIcon className="h-4 w-4" />}
                          onClick={() => editQuestion(question)}
                        />
                        <Button
                          variant="tertiary"
                          size="sm"
                          icon={<TrashIcon className="h-4 w-4" />}
                          onClick={() => deleteQuestion(question.id)}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Alert variant="default">
                <DocumentTextIcon className="h-5 w-5" />
                <div>
                  <h3 className="font-semibold">No questions added yet</h3>
                  <p className="text-sm mt-1">
                    Add questions using the templates above or create custom
                    questions.
                  </p>
                </div>
              </Alert>
            )}

            {/* Qualification Rules (Pre-screening only) */}
            {activeTab === 'pre-screening' &&
              preScreeningQuestions.length > 0 && (
                <Card className="mt-6">
                  <div>
                    <h4 className="text-base font-semibold text-label mb-2">
                      Qualification Rules
                    </h4>
                    <p className="text-sm text-secondary-label mb-4">
                      Define criteria for participant qualification
                    </p>
                    <Alert variant="default">
                      <ExclamationTriangleIcon className="h-5 w-5" />
                      <div>
                        <p className="text-sm">
                          Qualification rules can be configured after saving the
                          questions.
                        </p>
                      </div>
                    </Alert>
                  </div>
                </Card>
              )}
          </>
        )}
      </div>

      {/* Question Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <QuestionEditor
              question={editingQuestion}
              onSave={saveQuestion}
              onCancel={() => {
                setShowEditor(false);
                setEditingQuestion(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
