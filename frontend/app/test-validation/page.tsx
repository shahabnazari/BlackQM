'use client';

import React, { useState } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { TextField } from '@/components/apple-ui/TextField';
import { Button } from '@/components/apple-ui/Button';

export default function ValidationTestPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    // Title validation
    if (!title || title.length < 10) {
      errors['title'] = 'Title must be at least 10 characters';
    } else if (title.length > 100) {
      errors['title'] = 'Title must be less than 100 characters';
    }
    
    // Description validation (optional field)
    if (description && description.length > 0 && description.length < 50) {
      errors['description'] = 'Description must be at least 50 characters if provided';
    }
    
    setValidationErrors(errors);
    
    if (Object.keys(errors).length === 0) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }
    
    return Object.keys(errors).length === 0;
  };
  
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-6">Validation Test Page</h1>
        
        <div className="space-y-6">
          {/* Title Field */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label htmlFor="title" className="text-sm font-medium">
                Study Title <span className="text-red-500">*</span>
              </label>
            </div>
            <TextField
              id="title"
              name="title"
              placeholder="Enter your study title (10-100 characters)"
              value={title}
              onChange={(e: any) => {
                setTitle(e.target.value);
                // Clear error when requirement is met
                if (e.target.value.length >= 10 && e.target.value.length <= 100) {
                  setValidationErrors(prev => {
                    const { title, ...rest } = prev;
                    return rest;
                  });
                }
              }}
              error={validationErrors['title'] || ''}
              aria-label="Study title"
              aria-required="true"
            />
            <div className="text-xs text-gray-600 mt-1 flex justify-between">
              <span className={title.length < 10 || title.length > 100 ? "text-red-500" : ""}>
                {title.length}/100 characters
                {title.length < 10 && " (min: 10)"}
              </span>
              <span className="text-red-500">Required field</span>
            </div>
          </div>
          
          {/* Description Field */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <label htmlFor="description" className="text-sm font-medium">
                Study Description <span className="text-gray-500 text-xs">(Optional)</span>
              </label>
            </div>
            <textarea
              id="description"
              name="description"
              className={`w-full px-4 py-3 rounded-lg border ${
                validationErrors['description'] ? 'border-red-500' : 'border-gray-300'
              } focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
              rows={4}
              placeholder="Describe your study (50-500 characters if provided)"
              value={description}
              onChange={(e: any) => {
                setDescription(e.target.value);
                // Clear error when requirement is met or field is empty
                if (!e.target.value || e.target.value.length >= 50) {
                  setValidationErrors(prev => {
                    const { description, ...rest } = prev;
                    return rest;
                  });
                }
              }}
            />
            <div className="text-xs text-gray-600 mt-1 flex justify-between">
              <span className={description && description.length > 0 && description.length < 50 ? "text-red-500" : ""}>
                {description.length}/500 characters
                {description && description.length > 0 && description.length < 50 && " (min: 50 if provided)"}
              </span>
              <span>Optional field</span>
            </div>
            {validationErrors['description'] && (
              <p className="text-xs text-red-500 mt-1" role="alert">
                {validationErrors['description']}
              </p>
            )}
          </div>
          
          {/* Validation Status */}
          <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
            <h3 className="text-sm font-semibold mb-2">Validation Status</h3>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <span className={title.length >= 10 && title.length <= 100 ? "text-green-600" : "text-gray-400"}>
                  {title.length >= 10 && title.length <= 100 ? "✓" : "○"}
                </span>
                <span>Title: 10-100 characters</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={!description || description.length >= 50 ? "text-green-600" : "text-gray-400"}>
                  {!description || description.length >= 50 ? "✓" : "○"}
                </span>
                <span>Description: Optional (50+ characters if provided)</span>
              </div>
            </div>
          </div>
          
          {/* Test Button */}
          <div className="flex gap-4">
            <Button
              variant="primary"
              onClick={validateForm}
            >
              Validate Form
            </Button>
            
            <Button
              variant="secondary"
              onClick={() => {
                setTitle('');
                setDescription('');
                setValidationErrors({});
                setShowSuccess(false);
              }}
            >
              Reset
            </Button>
          </div>
          
          {/* Success Message */}
          {showSuccess && (
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-300 font-medium">
                ✓ Validation passed! All fields are valid.
              </p>
            </div>
          )}
          
          {/* Current Errors */}
          {Object.keys(validationErrors).length > 0 && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <h3 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                Validation Errors:
              </h3>
              <ul className="space-y-1 text-sm text-red-600 dark:text-red-400">
                {Object.entries(validationErrors).map(([field, error]) => (
                  <li key={field}>• {error}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Instructions */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h3 className="text-sm font-semibold mb-2">Test Instructions:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>Type less than 10 characters in the title - you should see an error</li>
              <li>Type 10 or more characters - the error should disappear immediately</li>
              <li>Type some text in description (less than 50 chars) - you should see an error</li>
              <li>Clear the description or type 50+ characters - error should disappear</li>
              <li>Click "Validate Form" to test manual validation</li>
              <li>Notice that only ONE error message appears per field (not duplicated)</li>
            </ol>
          </div>
        </div>
      </Card>
    </div>
  );
}