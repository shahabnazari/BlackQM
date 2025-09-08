'use client';

import { useState, useEffect } from 'react';

export default function JSTestPage() {
  const [count, setCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    setMounted(true);
    setTime(new Date().toLocaleTimeString());
    console.log('JavaScript is working! Page mounted at:', new Date().toLocaleTimeString());
    
    // Test API call to confirm JS is executing
    fetch('/api/test-js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'JavaScript is executing!',
        time: new Date().toISOString()
      })
    }).then(res => res.json())
      .then(data => console.log('API response:', data))
      .catch(err => console.error('API error:', err));
  }, []);

  const handleClick = () => {
    setCount(count + 1);
    console.log('Button clicked! Count:', count + 1);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>JavaScript Test Page</h1>
      
      <div style={{ marginTop: '20px' }}>
        <h2>Mount Status: {mounted ? '✅ Mounted' : '❌ Not Mounted'}</h2>
        <p>If you see "✅ Mounted", JavaScript is executing on the client.</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Interactive Test</h2>
        <button 
          onClick={handleClick}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Click Me (Count: {count})
        </button>
        <p>If the count increases when you click, JavaScript events are working.</p>
      </div>

      <div style={{ marginTop: '20px' }}>
        <h2>Time Mounted: {time || 'Not yet mounted'}</h2>
        <p>If you see a time, useEffect is working.</p>
      </div>

      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f0f0f0' }}>
        <h3>Diagnostics:</h3>
        <ul>
          <li>Page rendered at: {new Date().toLocaleTimeString()} (server time)</li>
          <li>Mounted: {String(mounted)}</li>
          <li>Count: {count}</li>
          <li>Client time: {time || 'N/A'}</li>
        </ul>
      </div>
    </div>
  );
}