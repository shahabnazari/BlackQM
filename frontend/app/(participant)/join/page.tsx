'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card as AppleCard } from '@/components/apple-ui/Card/Card';
import { Button as AppleButton } from '@/components/apple-ui/Button/Button';
import { TextField as AppleTextField } from '@/components/apple-ui/TextField/TextField';
import { motion } from 'framer-motion';

export default function JoinStudyPage() {
  const router = useRouter();
  const [studyCode, setStudyCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validate study code format (e.g., ABC-123-XYZ)
      const codePattern = /^[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}$/;
      if (!codePattern.test(studyCode.toUpperCase())) {
        throw new Error(
          'Invalid study code format. Expected format: XXX-XXX-XXX'
        );
      }

      // Navigate to the study page with the code as the token
      router.push(`/study/${studyCode.toLowerCase()}`);
    } catch (err: any) {
      setError(err instanceof Error ? err.message : 'Invalid study code');
      setLoading(false);
    }
  };

  const handleDemoMode = () => {
    // Navigate to demo study
    router.push('/study/demo-study');
  };

  return (
    <div className="min-h-screen bg-system-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <AppleCard className="p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-semibold mb-2">Join a Study</h1>
            <p className="text-text-secondary">
              Enter your study invitation code to participate
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="studyCode"
                className="block text-sm font-medium mb-2"
              >
                Study Code
              </label>
              <AppleTextField
                id="studyCode"
                type="text"
                placeholder="XXX-XXX-XXX"
                value={studyCode}
                onChange={e => setStudyCode(e.target.value.toUpperCase())}
                className="w-full text-center text-lg tracking-wider font-mono"
                maxLength={11}
                pattern="[A-Z0-9]{3}-[A-Z0-9]{3}-[A-Z0-9]{3}"
                required
                disabled={loading}
              />
              <p className="text-xs text-text-secondary mt-2">
                Your study code should be provided by your researcher
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
              >
                {error}
              </motion.div>
            )}

            <AppleButton
              type="submit"
              variant="primary"
              className="w-full"
              disabled={loading || !studyCode}
            >
              {loading ? (
                <>
                  <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>
                  Joining Study...
                </>
              ) : (
                'Join Study'
              )}
            </AppleButton>
          </form>

          <div className="mt-8 pt-6 border-t border-separator">
            <div className="text-center">
              <p className="text-sm text-text-secondary mb-4">
                No study code? Try our demo
              </p>
              <AppleButton
                type="button"
                variant="secondary"
                onClick={handleDemoMode}
                className="w-full"
              >
                Try Demo Study
              </AppleButton>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-text-tertiary">
              By joining a study, you agree to our{' '}
              <a href="/terms" className="text-blue-600 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </AppleCard>
      </motion.div>
    </div>
  );
}
