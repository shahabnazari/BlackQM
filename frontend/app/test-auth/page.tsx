'use client';

import { useState } from 'react';
import { authService } from '@/lib/api/services';

export default function TestAuthPage() {
  const [email, setEmail] = useState('admin@test.com');
  const [password, setPassword] = useState('Password123!');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    console.log('Testing login with:', { email, password });

    try {
      const response = await authService.login({
        email,
        password,
        rememberMe: true,
      });

      console.log('Login successful:', response);
      setResult(response);
    } catch (err: any) {
      console.error('Login failed:', err);
      setError({
        message: err.message || 'Unknown error',
        response: err.response?.data,
        status: err.response?.status,
        full: err,
      });
    } finally {
      setLoading(false);
    }
  };

  const testDirectAPI = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('http://localhost:4000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      console.log('Direct API successful:', data);
      setResult(data);
    } catch (err: any) {
      console.error('Direct API failed:', err);
      setError({
        message: err.message,
        full: err,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test Page</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Credentials</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={testLogin}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                Test via Auth Service
              </button>

              <button
                onClick={testDirectAPI}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                Test Direct API
              </button>
            </div>
          </div>
        </div>

        {loading && (
          <div className="bg-yellow-100 border border-yellow-400 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">Loading...</p>
          </div>
        )}

        {result && (
          <div className="bg-green-100 border border-green-400 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-green-800 mb-2">✅ Success!</h3>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}

        {error && (
          <div className="bg-red-100 border border-red-400 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">❌ Error</h3>
            <p className="text-red-700 mb-2">{error.message}</p>
            <pre className="text-sm overflow-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </div>
        )}

        <div className="bg-gray-100 rounded-lg p-4">
          <h3 className="font-semibold mb-2">📝 Test Accounts</h3>
          <ul className="space-y-1 text-sm">
            <li>admin@test.com / Password123!</li>
            <li>researcher@test.com / Password123!</li>
            <li>participant@test.com / Password123!</li>
            <li>demo@vqmethod.com / Password123!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
