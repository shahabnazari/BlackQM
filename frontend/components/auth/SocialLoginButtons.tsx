import React from 'react';
import {
  GoogleIcon,
  MicrosoftIcon,
  OrcidIcon,
} from '@/components/icons';

interface SocialLoginButtonsProps {
  onLogin: (provider: string) => void;
}

export default function SocialLoginButtons({ onLogin }: SocialLoginButtonsProps) {
  return (
    <div className="mt-6 grid grid-cols-3 gap-3">
      <button
        type="button"
        onClick={() => onLogin('google')}
        className="flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label="Sign in with Google"
      >
        <GoogleIcon />
      </button>

      <button
        type="button"
        onClick={() => onLogin('microsoft')}
        className="flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label="Sign in with Microsoft"
      >
        <MicrosoftIcon />
      </button>

      <button
        type="button"
        onClick={() => onLogin('orcid')}
        className="flex justify-center items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        aria-label="Sign in with ORCID"
      >
        <OrcidIcon />
      </button>
    </div>
  );
}