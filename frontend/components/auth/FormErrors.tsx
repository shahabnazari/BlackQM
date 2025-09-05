'use client';

import React from 'react';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface FormErrorsProps {
  errors: string[];
}

export function FormErrors({ errors }: FormErrorsProps) {
  if (errors.length === 0) return null;

  return (
    <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4 border border-red-200 dark:border-red-800">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-400">
            Please fix the following errors:
          </h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">
            <ul className="list-disc pl-5 space-y-1">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
