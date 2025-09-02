'use client';

import React from 'react';

import { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { TextField } from '@/components/apple-ui/TextField';

interface PostSurveyProps {
  onComplete: (data?: any) => void;
  onBack: () => void;
}

export default function PostSurvey({ onComplete, onBack }: PostSurveyProps) {
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    education: '',
    occupation: '',
    country: '',
    experience: '',
    feedback: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const isComplete = formData.age && formData.gender && formData.education && formData.country;

  return (
    <Card className="max-w-3xl mx-auto">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-label mb-2">
            Post-Study Survey
          </h1>
          <p className="text-secondary-label">
            Please answer a few demographic questions to help us analyze the results.
            All information will be kept confidential.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-label mb-2">
              Age Range *
            </label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.age}
              onChange={(e) => handleChange('age', e.target.value)}
            >
              <option value="">Select age range</option>
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
            <label className="block text-sm font-medium text-label mb-2">
              Gender *
            </label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
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
            <label className="block text-sm font-medium text-label mb-2">
              Highest Education Level *
            </label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.education}
              onChange={(e) => handleChange('education', e.target.value)}
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
            onChange={(e) => handleChange('occupation', e.target.value)}
          />

          <div>
            <label className="block text-sm font-medium text-label mb-2">
              Country *
            </label>
            <select
              className="w-full px-4 py-3 rounded-lg border border-quaternary-fill bg-tertiary-background text-label focus:border-system-blue focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
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
              {[1, 2, 3, 4, 5].map((rating) => (
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
              onChange={(e) => handleChange('feedback', e.target.value)}
            />
          </div>
        </div>

        <div className="bg-quaternary-fill/30 p-4 rounded-lg">
          <p className="text-sm text-secondary-label">
            <strong>Privacy:</strong> Your responses will be kept confidential and used only
            for research purposes. No personally identifiable information will be shared.
          </p>
        </div>

        <div className="flex justify-between">
          <Button variant="secondary" onClick={onBack}>
            Back
          </Button>
          <Button
            variant="primary"
            size="large"
            onClick={() => onComplete(formData)}
            disabled={!isComplete}
          >
            Submit Survey
          </Button>
        </div>
      </div>
    </Card>
  );
}
