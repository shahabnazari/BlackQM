'use client';

import React from 'react';

import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';

export default function ThankYou() {
  return (
    <Card className="max-w-3xl mx-auto">
      <div className="space-y-6 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-system-green/20 flex items-center justify-center">
            <svg
              className="w-12 h-12 text-system-green"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-bold text-label mb-4">
            Thank You for Participating!
          </h1>
          <p className="text-lg text-secondary-label">
            Your responses have been successfully submitted.
          </p>
        </div>

        <div className="space-y-4 text-label">
          <p>
            We greatly appreciate your time and thoughtful responses. Your participation
            helps us better understand diverse perspectives on important issues.
          </p>

          <p>
            The data you've provided will be analyzed using Q-methodology to identify
            shared viewpoints and patterns of thinking within the participant group.
          </p>
        </div>

        <div className="bg-quaternary-fill/30 p-4 rounded-lg">
          <h2 className="font-semibold text-label mb-2">What happens next?</h2>
          <ul className="text-sm text-secondary-label space-y-1 text-left">
            <li>• Your responses will be analyzed along with other participants</li>
            <li>• Results will be compiled into a research report</li>
            <li>• If you opted in, you'll receive a summary of the findings</li>
            <li>• All data will remain anonymous and confidential</li>
          </ul>
        </div>

        <div className="pt-4">
          <h3 className="font-medium text-label mb-3">
            Would you like to participate in future studies?
          </h3>
          <div className="flex justify-center space-x-3">
            <Button variant="secondary">
              No Thanks
            </Button>
            <Button variant="primary">
              Yes, Keep Me Informed
            </Button>
          </div>
        </div>

        <div className="pt-6 border-t border-quaternary-fill">
          <p className="text-sm text-secondary-label mb-3">
            Share this study with others who might be interested:
          </p>
          <div className="flex justify-center space-x-3">
            <Button variant="tertiary" size="small">
              Copy Link
            </Button>
            <Button variant="tertiary" size="small">
              Share on Twitter
            </Button>
            <Button variant="tertiary" size="small">
              Share on LinkedIn
            </Button>
          </div>
        </div>

        <div className="pt-4">
          <Button variant="primary" size="large" onClick={() => window.location.href = '/'}>
            Return to Home
          </Button>
        </div>
      </div>
    </Card>
  );
}
