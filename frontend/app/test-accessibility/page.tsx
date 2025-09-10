'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/apple-ui/Button';
import { Card } from '@/components/apple-ui/Card';
import { 
  formatShortcut, 
  getOS,
  isMac,
  isWindows,
  getModifierDisplay,
  getKeyboardHelpText,
  matchesShortcut,
  getAriaKeyShortcuts
} from '@/lib/utils/keyboard';

export default function AccessibilityTestPage() {
  const [os, setOS] = useState<string>('detecting...');
  const [lastKeyPressed, setLastKeyPressed] = useState<string>('');
  const [testResult, setTestResult] = useState<string>('');
  
  useEffect(() => {
    // Detect OS
    setOS(getOS());
    
    // Test keyboard shortcut handler
    const handleKeyDown = (e: KeyboardEvent) => {
      // Test Cmd/Ctrl+S
      if (matchesShortcut(e, { meta: true, ctrl: true, key: 's' })) {
        e.preventDefault();
        setTestResult('Save shortcut detected!');
        setLastKeyPressed(formatShortcut({ meta: true, ctrl: true, key: 's' }));
      }
      
      // Test Alt+N
      if (matchesShortcut(e, { alt: true, key: 'n' })) {
        e.preventDefault();
        setTestResult('Next shortcut detected!');
        setLastKeyPressed(formatShortcut({ alt: true, key: 'n' }));
      }
      
      // Test Cmd/Ctrl+Shift+P
      if (matchesShortcut(e, { meta: true, ctrl: true, shift: true, key: 'p' })) {
        e.preventDefault();
        setTestResult('Command palette shortcut detected!');
        setLastKeyPressed(formatShortcut({ meta: true, ctrl: true, shift: true, key: 'p' }));
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const commonShortcuts = [
    { keys: { meta: true, ctrl: true, key: 's' }, description: 'Save' },
    { keys: { meta: true, ctrl: true, key: 'n' }, description: 'New' },
    { keys: { meta: true, ctrl: true, key: 'k' }, description: 'Search' },
    { keys: { meta: true, ctrl: true, shift: true, key: 'p' }, description: 'Command Palette' },
    { keys: { alt: true, key: 'n' }, description: 'Next' },
    { keys: { alt: true, key: 'b' }, description: 'Back' },
    { keys: { meta: true, ctrl: true, key: 'Enter' }, description: 'Submit' },
  ];
  
  const helpText = getKeyboardHelpText();
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Cross-Platform Accessibility Test</h1>
        
        {/* OS Detection */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Operating System Detection</h2>
          <div className="space-y-2">
            <p>Detected OS: <strong className="text-blue-600 dark:text-blue-400">{os}</strong></p>
            <p>Is Mac: <strong>{isMac() ? 'Yes' : 'No'}</strong></p>
            <p>Is Windows: <strong>{isWindows() ? 'Yes' : 'No'}</strong></p>
            <p>Modifier Key: <strong>{getModifierDisplay()}</strong></p>
          </div>
        </div>
        
        {/* Keyboard Shortcut Display */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Platform-Specific Shortcuts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {commonShortcuts.map((shortcut, index) => (
              <div 
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <span className="text-sm">{shortcut.description}</span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-white dark:bg-gray-700 rounded">
                  {formatShortcut(shortcut.keys)}
                </kbd>
              </div>
            ))}
          </div>
        </div>
        
        {/* Interactive Test */}
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Interactive Test</h2>
          <p className="text-sm mb-3">Try pressing these shortcuts to test detection:</p>
          <div className="space-y-2">
            <p>• {formatShortcut({ meta: true, ctrl: true, key: 's' })} - Save</p>
            <p>• {formatShortcut({ alt: true, key: 'n' })} - Next</p>
            <p>• {formatShortcut({ meta: true, ctrl: true, shift: true, key: 'p' })} - Command Palette</p>
          </div>
          
          {lastKeyPressed && (
            <div className="mt-4 p-3 bg-white dark:bg-gray-800 rounded">
              <p className="text-sm">Last key pressed: <strong>{lastKeyPressed}</strong></p>
              <p className="text-sm text-green-600 dark:text-green-400">{testResult}</p>
            </div>
          )}
        </div>
        
        {/* ARIA Attributes Test */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">ARIA Keyboard Shortcuts</h2>
          <div className="space-y-3">
            <Button
              variant="primary"
              aria-label="Save document"
              aria-keyshortcuts={getAriaKeyShortcuts([{ meta: true, ctrl: true, key: 's' }])}
              title={`Save (${formatShortcut({ meta: true, ctrl: true, key: 's' })})`}
            >
              Save Document
            </Button>
            
            <Button
              variant="secondary"
              aria-label="Go to next page"
              aria-keyshortcuts={getAriaKeyShortcuts([{ alt: true, key: 'n' }])}
              title={`Next (${formatShortcut({ alt: true, key: 'n' })})`}
            >
              Next Page
            </Button>
            
            <p className="text-xs text-gray-500">
              Hover over buttons to see tooltips with platform-specific shortcuts.
              Screen readers will announce the aria-keyshortcuts attribute.
            </p>
          </div>
        </div>
        
        {/* Help Text */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h2 className="text-lg font-semibold mb-3">Keyboard Help Text</h2>
          <p className="text-sm mb-2">Modifier key name: <strong>{helpText.modifier}</strong></p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
            {helpText.shortcuts.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span>{item.description}:</span>
                <kbd className="px-2 py-0.5 text-xs bg-white dark:bg-gray-700 rounded">
                  {item.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
        
        {/* Instructions */}
        <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Check that your OS is correctly detected above</li>
            <li>Verify shortcuts show Cmd (⌘) on Mac or Ctrl on Windows/Linux</li>
            <li>Test the interactive shortcuts to ensure they work</li>
            <li>Use a screen reader to verify ARIA attributes are announced</li>
            <li>Press <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">?</kbd> to open the keyboard shortcuts help dialog</li>
          </ol>
        </div>
      </Card>
    </div>
  );
}