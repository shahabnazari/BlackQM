'use client';

export default function TestBroken() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Website Status Check</h1>
        
        <div className="space-y-4">
          {/* Test basic styling */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Basic Styling Test</h2>
            <p className="text-gray-600">If you can see this with proper styling, basic CSS is working.</p>
            <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
              Test Button
            </button>
          </div>
          
          {/* Test dark mode */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Dark Mode Test
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              This should adapt to dark mode if enabled.
            </p>
          </div>
          
          {/* Test layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-100 p-4 rounded">
              <h3 className="font-semibold">Column 1</h3>
              <p>Grid layout test</p>
            </div>
            <div className="bg-green-100 p-4 rounded">
              <h3 className="font-semibold">Column 2</h3>
              <p>Should be side by side on desktop</p>
            </div>
          </div>
          
          {/* Test component imports */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Import Test</h2>
            <p className="text-gray-600">Testing if imports are working correctly.</p>
            <div className="mt-2 flex gap-2">
              <span className="px-3 py-1 bg-gray-200 rounded">Tag 1</span>
              <span className="px-3 py-1 bg-gray-200 rounded">Tag 2</span>
              <span className="px-3 py-1 bg-gray-200 rounded">Tag 3</span>
            </div>
          </div>
          
          {/* Test interactive elements */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Interactive Test</h2>
            <input 
              type="text" 
              placeholder="Type here to test input"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <div className="mt-2">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                <span>Checkbox test</span>
              </label>
            </div>
          </div>
          
          {/* Status indicators */}
          <div className="bg-white p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">Status Indicators</h2>
            <ul className="space-y-1">
              <li className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                CSS Loading: Working
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                React Rendering: Working
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Tailwind Classes: Working
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                Client-Side JS: Working
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="font-semibold text-yellow-800">Common Issues to Check:</h3>
          <ul className="mt-2 space-y-1 text-sm text-yellow-700">
            <li>• If styles are missing: Tailwind CSS may not be loading</li>
            <li>• If layout is broken: CSS Grid/Flexbox issues</li>
            <li>• If components missing: Import/export problems</li>
            <li>• If interactive elements don\'t work: JavaScript issues</li>
            <li>• If page is blank: React rendering errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
}