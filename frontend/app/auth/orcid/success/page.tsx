/**
 * ORCID OAuth Success Page
 * Day 27: ORCID Authentication Implementation
 *
 * Handles the OAuth callback from backend after successful ORCID authentication
 */

'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

function OrcidSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(
    'loading'
  );
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleOrcidCallback = async () => {
      try {
        // Get tokens and user data from URL parameters
        const token = searchParams.get('token');
        const refresh = searchParams.get('refresh');
        const userStr = searchParams.get('user');
        const returnUrl = searchParams.get('returnUrl');

        if (!token || !refresh) {
          throw new Error('Missing authentication tokens');
        }

        // Parse user data
        const user = userStr ? JSON.parse(decodeURIComponent(userStr)) : null;

        // Store tokens in localStorage
        localStorage.setItem('access_token', token);
        localStorage.setItem('refresh_token', refresh);

        // Store user data
        if (user) {
          localStorage.setItem('user', JSON.stringify(user));
        }

        // Set success status
        setStatus('success');

        // Redirect to returnUrl or default to literature page after 1 second
        setTimeout(() => {
          const destination = returnUrl || '/discover/literature';
          router.push(destination);
        }, 1000);
      } catch (error: any) {
        console.error('ORCID callback error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'Authentication failed');

        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/login?error=orcid_failed');
        }, 3000);
      }
    };

    handleOrcidCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin mx-auto text-green-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Completing ORCID Authentication
            </h1>
            <p className="text-gray-600">
              Please wait while we set up your account...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto text-green-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Successful!
            </h1>
            <p className="text-gray-600">Redirecting you back...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 mx-auto text-red-600 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Authentication Failed
            </h1>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <p className="text-sm text-gray-500">
              Redirecting you back to login...
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function OrcidSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto text-green-600 mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading...</h1>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    }>
      <OrcidSuccessContent />
    </Suspense>
  );
}
