'use client';

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';

interface ConsentProps {
  onComplete: (data?: any) => void;
  onBack: () => void;
}

export default function Consent({ onComplete, onBack }: ConsentProps) {
  const [hasConsented, setHasConsented] = useState(false);
  const [hasReadFully, setHasReadFully] = useState(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const element = e.currentTarget;
    const isAtBottom =
      Math.abs(element.scrollHeight - element.scrollTop - element.clientHeight) < 10;
    if (isAtBottom) {
      setHasReadFully(true);
    }
  };

  const handleConsent = () => {
    if (hasConsented && hasReadFully) {
      onComplete({ consented: true, timestamp: new Date().toISOString() });
    }
  };

  return (
    <Card className="max-w-3xl mx-auto">
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-label">Informed Consent Form</h1>

        <div
          className="h-96 overflow-y-auto p-4 bg-quaternary-fill/20 rounded-lg border border-quaternary-fill"
          onScroll={handleScroll}
        >
          <div className="prose prose-slate dark:prose-invert max-w-none space-y-4">
            <h2 className="text-lg font-semibold text-label">Study Information</h2>
            <p className="text-label">
              You are being invited to participate in a research study using Q-methodology
              to understand different perspectives on important societal issues.
            </p>

            <h2 className="text-lg font-semibold text-label">Purpose of the Study</h2>
            <p className="text-label">
              This research aims to identify and understand the diversity of viewpoints
              that exist within our community regarding current social, political, and
              environmental challenges.
            </p>

            <h2 className="text-lg font-semibold text-label">Study Procedures</h2>
            <p className="text-label">
              If you agree to participate, you will be asked to:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-label">
              <li>Sort a set of statements according to your level of agreement</li>
              <li>Provide brief explanations for your choices</li>
              <li>Answer demographic questions</li>
            </ul>

            <h2 className="text-lg font-semibold text-label">Time Commitment</h2>
            <p className="text-label">
              The study will take approximately 20-30 minutes to complete.
            </p>

            <h2 className="text-lg font-semibold text-label">Risks and Benefits</h2>
            <p className="text-label">
              There are no known risks associated with this research. While there are no
              direct benefits to you, your participation will contribute to a better
              understanding of diverse perspectives in our society.
            </p>

            <h2 className="text-lg font-semibold text-label">Confidentiality</h2>
            <p className="text-label">
              All information collected will be kept strictly confidential. Your responses
              will be anonymized and no personally identifiable information will be
              included in any reports or publications.
            </p>

            <h2 className="text-lg font-semibold text-label">Voluntary Participation</h2>
            <p className="text-label">
              Your participation is entirely voluntary. You may withdraw from the study
              at any time without penalty or loss of benefits.
            </p>

            <h2 className="text-lg font-semibold text-label">Contact Information</h2>
            <p className="text-label">
              If you have questions about this research, please contact the research team
              at research@vqmethod.com
            </p>

            <h2 className="text-lg font-semibold text-label">Consent Statement</h2>
            <p className="text-label font-semibold">
              By checking the box below and clicking "I Consent", you indicate that you
              have read and understood the information provided, and that you voluntarily
              agree to participate in this research study.
            </p>
          </div>
        </div>

        {!hasReadFully && (
          <p className="text-sm text-system-orange">
            Please scroll to the bottom to read the entire consent form
          </p>
        )}

        <div className="space-y-4">
          <label className="flex items-start space-x-3">
            <input
              type="checkbox"
              className="mt-1 w-5 h-5 rounded border-quaternary-fill text-system-blue focus:ring-2 focus:ring-blue-500/20"
              checked={hasConsented}
              onChange={(e) => setHasConsented(e.target.checked)}
              disabled={!hasReadFully}
            />
            <span className="text-label">
              I have read and understood the information provided above, and I voluntarily
              consent to participate in this research study.
            </span>
          </label>
        </div>

        <div className="flex justify-between">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={handleConsent}
            disabled={!hasConsented || !hasReadFully}
          >
            I Consent
          </Button>
        </div>
      </div>
    </Card>
  );
}
