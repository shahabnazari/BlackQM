'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function TestRoutingPage() {
  const router = useRouter();
  const [log, setLog] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testNavigation = (path: string) => {
    addLog(`Attempting navigation to: ${path}`);
    try {
      router.push(path);
      addLog(`✓ router.push() called successfully`);
    } catch (error: any) {
      addLog(`✗ Error: ${error.message}`);
    }
  };

  const testProgrammaticNavigation = () => {
    addLog('Testing window.location.href...');
    window.location.href = '/auth/login';
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>Router Test Page</h1>

      <div style={{ marginBottom: '20px' }}>
        <h2>Test Navigation Methods:</h2>

        <button
          onClick={() => testNavigation('/auth/login')}
          style={{
            margin: '5px',
            padding: '10px',
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
          }}
        >
          Test router.push('/auth/login')
        </button>

        <button
          onClick={() => testNavigation('/auth/register')}
          style={{
            margin: '5px',
            padding: '10px',
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
          }}
        >
          Test router.push('/auth/register')
        </button>

        <button
          onClick={() => testNavigation('/')}
          style={{
            margin: '5px',
            padding: '10px',
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
          }}
        >
          Test router.push('/')
        </button>

        <button
          onClick={testProgrammaticNavigation}
          style={{
            margin: '5px',
            padding: '10px',
            backgroundColor: '#FF9500',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
          }}
        >
          Test window.location.href
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Regular HTML Links (should work):</h2>
        <a href="/auth/login" style={{ margin: '5px', color: 'blue' }}>
          HTML Link to Login
        </a>
        <a href="/auth/register" style={{ margin: '5px', color: 'blue' }}>
          HTML Link to Register
        </a>
      </div>

      <div
        style={{
          backgroundColor: '#f0f0f0',
          padding: '10px',
          borderRadius: '5px',
        }}
      >
        <h2>Console Log:</h2>
        <pre style={{ maxHeight: '300px', overflow: 'auto' }}>
          {log.length === 0 ? 'No actions yet...' : log.join('\n')}
        </pre>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Debug Info:</h2>
        <p>
          Router available: {typeof router !== 'undefined' ? '✓ Yes' : '✗ No'}
        </p>
        <p>
          Current pathname:{' '}
          {typeof window !== 'undefined' ? window.location.pathname : 'SSR'}
        </p>
        <p>
          Next.js data available:{' '}
          {typeof window !== 'undefined' && (window as any).__NEXT_DATA__
            ? '✓ Yes'
            : '✗ No'}
        </p>
      </div>
    </div>
  );
}
