'use client';

import { useState } from 'react';

export default function TestPage() {
  const [count, setCount] = useState(0);
  const [message, setMessage] = useState('');

  const handleClick = () => {
    setCount(count + 1);
    setMessage(`Button clicked ${count + 1} times`);
    console.log('Button clicked!');
    alert('Button clicked! JavaScript is working.');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">JavaScript Test Page</h1>
      
      <div className="space-y-4">
        <div>
          <button 
            onClick={handleClick}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Test Button (Click Me)
          </button>
        </div>
        
        <div>
          <p>Count: {count}</p>
          <p>{message}</p>
        </div>
        
        <div>
          <button 
            onClick={() => window.location.href = '/'}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
          >
            Navigate with window.location
          </button>
        </div>
        
        <div>
          <a href="/" className="text-blue-500 underline">
            Regular HTML Link (should work)
          </a>
        </div>
      </div>
    </div>
  );
}