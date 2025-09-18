'use client';

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
// import { TextField } from '@/components/apple-ui/TextField';

interface PreScreeningProps {
  onComplete: (data?: any) => void;
  onBack: () => void;
}

export default function PreScreening({ onComplete, onBack }: PreScreeningProps) {
  const [answers, setAnswers] = useState({
    familiarity: '',
    participation: '',
    timeAvailable: '',
    age: '',
  });

  const handleChange = (field: string, value: string) => {
    setAnswers((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isComplete = Object.values(answers).every((value) => value !== '');

  const handleSubmit = () => {
    // Check if participant meets criteria
    const meetsAge = answers.age !== 'under18';
    const hasTime = answers.timeAvailable === 'yes';
    
    if (!meetsAge || !hasTime) {
      alert('Thank you for your interest. Unfortunately, you do not meet the requirements for this study.');
      return;
    }

    onComplete(answers);
  };

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
              onChange={(e: any) => handleChange('familiarity', e.target.value)}
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
                    onChange={(e: any) => handleChange('participation', e.target.value)}
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
                    onChange={(e: any) => handleChange('timeAvailable', e.target.value)}
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
              onChange={(e: any) => handleChange('age', e.target.value)}
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
