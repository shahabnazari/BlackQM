'use client';

import React from 'react';

import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';

interface WelcomeProps {
  onComplete: (data?: any) => void;
  onBack: () => void;
}

export default function Welcome({ onComplete, onBack }: WelcomeProps) {
  return (
    <Card className="max-w-3xl mx-auto">
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-label mb-4">
            Welcome to Our Research Study
          </h1>
          <p className="text-lg text-secondary-label">
            Thank you for participating in this Q-methodology study
          </p>
        </div>

        <div className="prose prose-slate dark:prose-invert max-w-none">
          <p className="text-label">
            This study aims to understand different perspectives on important societal issues
            using Q-methodology, a research method that combines qualitative and quantitative
            approaches.
          </p>

          <h2 className="text-xl font-semibold text-label mt-6 mb-3">
            What to Expect
          </h2>
          <ul className="space-y-2 text-label">
            <li>
              The study will take approximately 20-30 minutes to complete
            </li>
            <li>
              You'll be asked to sort statements according to your perspective
            </li>
            <li>
              There are no right or wrong answers - we're interested in your viewpoint
            </li>
            <li>
              Your responses will be kept confidential and anonymous
            </li>
          </ul>

          <h2 className="text-xl font-semibold text-label mt-6 mb-3">
            Study Process
          </h2>
          <ol className="space-y-2 text-label">
            <li>
              <strong>Consent:</strong> Review and provide informed consent
            </li>
            <li>
              <strong>Familiarization:</strong> Review all the statements
            </li>
            <li>
              <strong>Pre-sorting:</strong> Initial categorization into three groups
            </li>
            <li>
              <strong>Q-Sort:</strong> Arrange statements on a grid
            </li>
            <li>
              <strong>Commentary:</strong> Explain your key choices
            </li>
            <li>
              <strong>Survey:</strong> Answer a few demographic questions
            </li>
          </ol>
        </div>

        <div className="bg-quaternary-fill/30 p-4 rounded-lg">
          <p className="text-sm text-secondary-label">
            <strong>Note:</strong> You can take breaks between sections, and your progress
            will be saved automatically.
          </p>
        </div>

        <div className="flex justify-between">
          <Button variant="secondary" onClick={onBack} disabled>
            Back
          </Button>
          <Button variant="primary" size="large" onClick={() => onComplete()}>
            I Consent
          </Button>
        </div>
      </div>
    </Card>
  );
}
