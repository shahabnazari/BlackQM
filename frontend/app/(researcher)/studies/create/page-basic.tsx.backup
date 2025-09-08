'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/apple-ui/Button';
import { Card } from '@/components/apple-ui/Card';
import { TextField } from '@/components/apple-ui/TextField';

interface StudyConfig {
  title: string;
  description: string;
  welcomeMessage: string;
  consentText: string;
  gridColumns: number;
  gridShape: 'forced' | 'free' | 'quasi-normal';
  enablePreScreening: boolean;
  enablePostSurvey: boolean;
  enableVideoConferencing: boolean;
}

export default function CreateStudyPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [studyConfig, setStudyConfig] = useState<StudyConfig>({
    title: '',
    description: '',
    welcomeMessage: '',
    consentText: '',
    gridColumns: 9,
    gridShape: 'quasi-normal',
    enablePreScreening: false,
    enablePostSurvey: true,
    enableVideoConferencing: false,
  });

  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      // Submit study creation
      console.log('Creating study:', studyConfig);
      router.push('/studies');
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const updateConfig = (field: keyof StudyConfig, value: any) => {
    setStudyConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-label">Create New Study</h1>
        <p className="mt-2 text-secondary-label">
          Set up your Q-methodology research study
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {[1, 2, 3, 4].map((stepNumber) => (
          <div
            key={stepNumber}
            className="flex items-center flex-1"
          >
            <div
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                ${
                  step >= stepNumber
                    ? 'bg-system-blue text-white'
                    : 'bg-quaternary-fill text-tertiary-label'
                }
              `}
            >
              {stepNumber}
            </div>
            {stepNumber < 4 && (
              <div
                className={`
                  flex-1 h-1 mx-2
                  ${
                    step > stepNumber
                      ? 'bg-system-blue'
                      : 'bg-quaternary-fill'
                  }
                `}
              />
            )}
          </div>
        ))}
      </div>

      <Card>
        {/* Step 1: Basic Information */}
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-label">
              Basic Information
            </h2>
            
            <TextField
              label="Study Title"
              placeholder="Enter your study title"
              value={studyConfig.title}
              onChange={(e) => updateConfig('title', e.target.value)}
            />

            <div>
              <label className="block text-sm font-medium text-label mb-2">
                Study Description
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label placeholder:text-tertiary-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={4}
                placeholder="Describe your study's purpose and goals"
                value={studyConfig.description}
                onChange={(e) => updateConfig('description', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2: Participant Experience */}
        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-label">
              Participant Experience
            </h2>

            <div>
              <label className="block text-sm font-medium text-label mb-2">
                Welcome Message
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label placeholder:text-tertiary-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={4}
                placeholder="Welcome message for participants"
                value={studyConfig.welcomeMessage}
                onChange={(e) => updateConfig('welcomeMessage', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-label mb-2">
                Consent Form Text
              </label>
              <textarea
                className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label placeholder:text-tertiary-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                rows={6}
                placeholder="Informed consent text"
                value={studyConfig.consentText}
                onChange={(e) => updateConfig('consentText', e.target.value)}
              />
            </div>

            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-quaternary-fill text-system-blue focus:ring-2 focus:ring-blue-500/20"
                  checked={studyConfig.enablePreScreening}
                  onChange={(e) =>
                    updateConfig('enablePreScreening', e.target.checked)
                  }
                />
                <span className="text-label">Enable pre-screening questions</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-quaternary-fill text-system-blue focus:ring-2 focus:ring-blue-500/20"
                  checked={studyConfig.enablePostSurvey}
                  onChange={(e) =>
                    updateConfig('enablePostSurvey', e.target.checked)
                  }
                />
                <span className="text-label">Enable post-sort survey</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="w-5 h-5 rounded border-quaternary-fill text-system-blue focus:ring-2 focus:ring-blue-500/20"
                  checked={studyConfig.enableVideoConferencing}
                  onChange={(e) =>
                    updateConfig('enableVideoConferencing', e.target.checked)
                  }
                />
                <span className="text-label">Enable video conferencing support</span>
              </label>
            </div>
          </div>
        )}

        {/* Step 3: Q-Sort Configuration */}
        {step === 3 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-label">
              Q-Sort Configuration
            </h2>

            <div>
              <label className="block text-sm font-medium text-label mb-2">
                Grid Columns
              </label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={studyConfig.gridColumns}
                onChange={(e) =>
                  updateConfig('gridColumns', parseInt(e.target.value))
                }
              >
                {[5, 7, 9, 11, 13].map((cols) => (
                  <option key={cols} value={cols}>
                    {cols} columns (from -{Math.floor(cols / 2)} to +
                    {Math.floor(cols / 2)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-label mb-2">
                Distribution Shape
              </label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                value={studyConfig.gridShape}
                onChange={(e) =>
                  updateConfig('gridShape', e.target.value as any)
                }
              >
                <option value="forced">Forced Distribution</option>
                <option value="quasi-normal">Quasi-Normal Distribution</option>
                <option value="free">Free Distribution</option>
              </select>
            </div>

            <div className="p-4 bg-quaternary-fill/30 rounded-lg">
              <p className="text-sm text-secondary-label">
                <strong>Grid Preview:</strong> Your Q-sort grid will have{' '}
                {studyConfig.gridColumns} columns ranging from -
                {Math.floor(studyConfig.gridColumns / 2)} to +
                {Math.floor(studyConfig.gridColumns / 2)} with a{' '}
                {studyConfig.gridShape} distribution pattern.
              </p>
            </div>
          </div>
        )}

        {/* Step 4: Review & Create */}
        {step === 4 && (
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-label">
              Review & Create
            </h2>

            <div className="space-y-4">
              <div className="p-4 bg-quaternary-fill/30 rounded-lg">
                <h3 className="font-medium text-label mb-2">Study Details</h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-secondary-label">Title:</dt>
                    <dd className="font-medium text-label">
                      {studyConfig.title || 'Not set'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-label">Grid Columns:</dt>
                    <dd className="font-medium text-label">
                      {studyConfig.gridColumns}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-secondary-label">Distribution:</dt>
                    <dd className="font-medium text-label">
                      {studyConfig.gridShape}
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="p-4 bg-quaternary-fill/30 rounded-lg">
                <h3 className="font-medium text-label mb-2">
                  Enabled Features
                </h3>
                <ul className="space-y-1 text-sm text-label">
                  {studyConfig.enablePreScreening && (
                    <li>✓ Pre-screening questions</li>
                  )}
                  {studyConfig.enablePostSurvey && <li>✓ Post-sort survey</li>}
                  {studyConfig.enableVideoConferencing && (
                    <li>✓ Video conferencing</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          <Button
            variant="secondary"
            onClick={handleBack}
            disabled={step === 1}
          >
            Back
          </Button>
          <Button variant="primary" onClick={handleNext}>
            {step === 4 ? 'Create Study' : 'Next'}
          </Button>
        </div>
      </Card>
    </div>
  );
}