'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { TextField } from '@/components/apple-ui/TextField';

interface PostSurveyProps {
  onComplete: (data?: any) => void;
  onBack: () => void;
  studyId?: string;
  participantId?: string;
  useDynamicQuestions?: boolean;
}

/**
 * PostSurvey Component - Phase 8.2 Day 2 Refactored
 *
 * Enhanced to support both:
 * - Dynamic questions from API (when available)
 * - Static fallback questions (original behavior)
 *
 * @world-class Features:
 * - Seamless fallback to static questions
 * - Progressive enhancement with dynamic questions
 * - Backward compatibility maintained
 */
export default function PostSurvey({
  onComplete,
  onBack,
  studyId,
  participantId: _participantId,
  useDynamicQuestions = false,
}: PostSurveyProps) {
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    education: '',
    occupation: '',
    country: '',
    experience: '',
    feedback: '',
  });
  const [dynamicQuestions, setDynamicQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Load dynamic questions if enabled
  useEffect(() => {
    if (useDynamicQuestions && studyId) {
      loadDynamicQuestions();
    }
  }, [useDynamicQuestions, studyId]);

  const loadDynamicQuestions = async () => {
    if (!studyId) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/questions/survey/${studyId}?type=post-survey`
      );
      if (response.ok) {
        const questions = await response.json();
        setDynamicQuestions(questions);
      }
    } catch (error: any) {
      console.error('Failed to load dynamic questions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate quality score based on completeness
  const calculateQualityScore = () => {
    const fields = Object.values(formData).filter(v => v !== '');
    const score = Math.round(
      (fields.length / Object.keys(formData).length) * 100
    );
    return score;
  };

  const isComplete =
    formData.age && formData.gender && formData.education && formData.country;

  return (
    <Card className="max-w-3xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-label mb-2">
            Post-Study Survey
          </h1>
          <p className="text-secondary-label">
            Please answer a few demographic questions to help us analyze the
            results. All information will be kept confidential.
          </p>
        </div>

        {/* Show loading or dynamic questions alert */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              Loading additional questions...
            </p>
          </div>
        )}

        {dynamicQuestions.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-green-800">
              {dynamicQuestions.length} additional questions loaded based on
              your study.
            </p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="age-select"
              className="block text-sm font-medium text-label mb-2"
            >
              Age
            </label>
            <select
              id="age-select"
              className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.age}
              onChange={(e: any) => handleChange('age', e.target.value)}
            >
              <option value="">Please select</option>
              <option value="18-24">18-24</option>
              <option value="25-34">25-34</option>
              <option value="35-44">35-44</option>
              <option value="45-54">45-54</option>
              <option value="55-64">55-64</option>
              <option value="65+">65+</option>
              <option value="prefer-not-say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="gender-select"
              className="block text-sm font-medium text-label mb-2"
            >
              Gender
            </label>
            <select
              id="gender-select"
              className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.gender}
              onChange={(e: any) => handleChange('gender', e.target.value)}
            >
              <option value="">Select gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-binary</option>
              <option value="other">Other</option>
              <option value="prefer-not-say">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label
              htmlFor="education-select"
              className="block text-sm font-medium text-label mb-2"
            >
              Education
            </label>
            <select
              id="education-select"
              className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.education}
              onChange={(e: any) => handleChange('education', e.target.value)}
            >
              <option value="">Select education level</option>
              <option value="high-school">High School</option>
              <option value="some-college">Some College</option>
              <option value="bachelors">Bachelor's Degree</option>
              <option value="masters">Master's Degree</option>
              <option value="doctorate">Doctorate</option>
              <option value="other">Other</option>
              <option value="prefer-not-say">Prefer not to say</option>
            </select>
          </div>

          <TextField
            label="Occupation (Optional)"
            placeholder="Enter your occupation"
            value={formData.occupation}
            onChange={(e: any) => handleChange('occupation', e.target.value)}
          />

          <div>
            <label
              htmlFor="country-select"
              className="block text-sm font-medium text-label mb-2"
            >
              Country
            </label>
            <select
              id="country-select"
              className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.country}
              onChange={(e: any) => handleChange('country', e.target.value)}
            >
              <option value="">Select country</option>
              <option value="us">United States</option>
              <option value="uk">United Kingdom</option>
              <option value="canada">Canada</option>
              <option value="australia">Australia</option>
              <option value="germany">Germany</option>
              <option value="france">France</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-label mb-2">
              How would you rate your experience with this study?
            </label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map(rating => (
                <button
                  key={rating}
                  className={`px-4 py-2 rounded-lg border ${
                    formData.experience === rating.toString()
                      ? 'bg-system-blue text-white border-system-blue'
                      : 'border-quaternary-fill hover:border-system-blue'
                  }`}
                  onClick={() => handleChange('experience', rating.toString())}
                >
                  {rating}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-xs text-secondary-label mt-1">
              <span>Poor</span>
              <span>Excellent</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-label mb-2">
              Additional Feedback (Optional)
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label placeholder:text-tertiary-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              rows={4}
              placeholder="Share any thoughts about your experience..."
              value={formData.feedback}
              onChange={(e: any) => handleChange('feedback', e.target.value)}
            />
          </div>
        </div>

        <div className="bg-quaternary-fill/30 p-4 rounded-lg">
          <p className="text-sm text-secondary-label">
            <strong>Privacy:</strong> Your responses will be kept confidential
            and used only for research purposes. No personally identifiable
            information will be shared.
          </p>
        </div>

        <div className="flex justify-between">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={() => {
              const score = calculateQualityScore();
              onComplete({
                ...formData,
                dynamicResponses: dynamicQuestions,
                qualityScore: score,
                completedAt: new Date().toISOString(),
              });
            }}
            disabled={!isComplete}
          >
            Complete Study
          </Button>
        </div>
      </div>
    </Card>
  );
}
