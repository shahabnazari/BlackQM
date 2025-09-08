'use client';

import { useState } from 'react';

export default function SimpleTestPage() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Simple React Test</h1>
      <p>Count: {count}</p>
      <button 
        onClick={() => {
          setCount(count + 1);
          console.log('Button clicked! Count:', count + 1);
        }}
        style={{ 
          padding: '0.5rem 1rem',
          backgroundColor: '#007AFF',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Click me (Count: {count})
      </button>
      
      <div style={{ marginTop: '2rem' }}>
        <h2>Navigation Tests</h2>
        <button 
          onClick={() => {
            console.log('Attempting navigation...');
            window.location.href = '/';
          }}
          style={{ 
            padding: '0.5rem 1rem',
            marginRight: '1rem'
          }}
        >
          Navigate with window.location
        </button>
        
        <a href="/" style={{ padding: '0.5rem 1rem', textDecoration: 'underline' }}>
          Regular Link (should always work)
        </a>
      </div>
    </div>
  );
}
