'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { 
  matchesShortcut,
  matchesPlatformShortcut,
  getPlatformShortcut,
  getAriaKeyShortcuts,
  formatShortcut,
  isMac,
  getOS
} from '@/lib/utils/keyboard';
import { useShortcuts } from '@/lib/hooks/useShortcut';

export default function KeyboardShortcutsTestPage() {
  const [lastAction, setLastAction] = useState<string>('None');
  const [keyLog, setKeyLog] = useState<string[]>([]);
  const [testResults, setTestResults] = useState<{ [key: string]: boolean }>({});
  const shortcuts = useShortcuts();
  const os = getOS();
  
  // Add keyboard event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Log the raw key event
      const modifiers = [];
      if (e.metaKey) modifiers.push('Meta');
      if (e.ctrlKey) modifiers.push('Ctrl');
      if (e.altKey) modifiers.push('Alt');
      if (e.shiftKey) modifiers.push('Shift');
      
      const keyPress = `${modifiers.join('+')}${modifiers.length ? '+' : ''}${e.key}`;
      setKeyLog(prev => [`${new Date().toLocaleTimeString()}: ${keyPress}`, ...prev.slice(0, 9)]);
      
      // Test platform-specific shortcuts
      if (matchesPlatformShortcut(e, 'next')) {
        e.preventDefault();
        setLastAction('Next (Platform-specific)');
        setTestResults(prev => ({ ...prev, next: true }));
      } else if (matchesPlatformShortcut(e, 'back')) {
        e.preventDefault();
        setLastAction('Back (Platform-specific)');
        setTestResults(prev => ({ ...prev, back: true }));
      } else if (matchesPlatformShortcut(e, 'saveDraft')) {
        e.preventDefault();
        setLastAction('Save Draft (Platform-specific)');
        setTestResults(prev => ({ ...prev, saveDraft: true }));
      }
      
      // Test regular shortcuts
      else if (matchesShortcut(e, { meta: true, ctrl: true, key: 's' })) {
        e.preventDefault();
        setLastAction('Save (Cmd/Ctrl+S)');
        setTestResults(prev => ({ ...prev, save: true }));
      } else if (matchesShortcut(e, { meta: true, ctrl: true, key: 'k' })) {
        e.preventDefault();
        setLastAction('Search (Cmd/Ctrl+K)');
        setTestResults(prev => ({ ...prev, search: true }));
      } else if (matchesShortcut(e, { meta: true, ctrl: true, shift: true, key: 'p' })) {
        e.preventDefault();
        setLastAction('Command Palette (Cmd/Ctrl+Shift+P)');
        setTestResults(prev => ({ ...prev, commandPalette: true }));
      } else if (matchesShortcut(e, { meta: true, ctrl: true, key: 'Enter' })) {
        e.preventDefault();
        setLastAction('Submit (Cmd/Ctrl+Enter)');
        setTestResults(prev => ({ ...prev, submit: true }));
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  const platformShortcuts = [
    { 
      action: 'next' as const, 
      description: 'Navigate forward',
      display: shortcuts.next,
      config: getPlatformShortcut('next')
    },
    { 
      action: 'back' as const, 
      description: 'Navigate back',
      display: shortcuts.back,
      config: getPlatformShortcut('back')
    },
    { 
      action: 'saveDraft' as const, 
      description: 'Save as draft',
      display: shortcuts.saveDraft,
      config: getPlatformShortcut('saveDraft')
    },
  ];
  
  const standardShortcuts = [
    { key: 'save', description: 'Save', display: shortcuts.save },
    { key: 'search', description: 'Search', display: shortcuts.search },
    { key: 'commandPalette', description: 'Command Palette', display: shortcuts.commandPalette },
    { key: 'submit', description: 'Submit', display: shortcuts.submit },
  ];
  
  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Keyboard Shortcuts Test</h1>
        
        {/* System Info */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h2 className="font-semibold mb-2">System Information</h2>
          <p>Operating System: <strong className="text-blue-600 dark:text-blue-400">{os}</strong></p>
          <p>Is Mac: <strong>{isMac() ? 'Yes' : 'No'}</strong></p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {isMac() 
              ? 'You should use Command (⌘) for shortcuts' 
              : 'You should use Control (Ctrl) and Alt for shortcuts'}
          </p>
        </div>
        
        {/* Platform-Specific Shortcuts */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Platform-Specific Shortcuts</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            These shortcuts change based on your operating system
          </p>
          <div className="space-y-2">
            {platformShortcuts.map(({ action, description, display, config }) => (
              <div key={action} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <span className="font-medium">{description}</span>
                  <div className="text-xs text-gray-500 mt-1">
                    Config: {JSON.stringify(config)}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <kbd className="px-3 py-1 text-sm font-semibold bg-white dark:bg-gray-700 rounded">
                    {display}
                  </kbd>
                  {testResults[action] && (
                    <span className="text-green-600 dark:text-green-400">✓ Tested</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Standard Shortcuts */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Standard Shortcuts</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            These use Cmd on Mac, Ctrl on Windows/Linux
          </p>
          <div className="space-y-2">
            {standardShortcuts.map(({ key, description, display }) => (
              <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="font-medium">{description}</span>
                <div className="flex items-center gap-3">
                  <kbd className="px-3 py-1 text-sm font-semibold bg-white dark:bg-gray-700 rounded">
                    {display}
                  </kbd>
                  {testResults[key] && (
                    <span className="text-green-600 dark:text-green-400">✓ Tested</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Test Buttons with ARIA */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Test Buttons with ARIA Attributes</h2>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              aria-label="Navigate to next item"
              aria-keyshortcuts={getAriaKeyShortcuts([getPlatformShortcut('next')])}
              title={`Next (${shortcuts.next})`}
              onClick={() => setLastAction('Next button clicked')}
            >
              Next
            </Button>
            
            <Button
              variant="secondary"
              aria-label="Navigate to previous item"
              aria-keyshortcuts={getAriaKeyShortcuts([getPlatformShortcut('back')])}
              title={`Back (${shortcuts.back})`}
              onClick={() => setLastAction('Back button clicked')}
            >
              Back
            </Button>
            
            <Button
              variant="secondary"
              aria-label="Save as draft"
              aria-keyshortcuts={getAriaKeyShortcuts([getPlatformShortcut('saveDraft')])}
              title={`Save Draft (${shortcuts.saveDraft})`}
              onClick={() => setLastAction('Save Draft button clicked')}
            >
              Save Draft
            </Button>
            
            <Button
              variant="primary"
              aria-label="Submit form"
              aria-keyshortcuts={getAriaKeyShortcuts([{ meta: true, ctrl: true, key: 'Enter' }])}
              title={`Submit (${shortcuts.submit})`}
              onClick={() => setLastAction('Submit button clicked')}
            >
              Submit
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Hover over buttons to see tooltips. Screen readers will announce aria-keyshortcuts.
          </p>
        </div>
        
        {/* Live Test Area */}
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
          <h2 className="font-semibold mb-3">Live Keyboard Test</h2>
          <p className="text-sm mb-3">Try pressing the shortcuts to test them:</p>
          
          <div className="p-3 bg-white dark:bg-gray-800 rounded mb-3">
            <p className="text-sm font-medium">Last Action:</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">{lastAction}</p>
          </div>
          
          <div className="p-3 bg-white dark:bg-gray-800 rounded">
            <p className="text-sm font-medium mb-2">Key Press Log:</p>
            <div className="space-y-1 font-mono text-xs">
              {keyLog.length === 0 ? (
                <p className="text-gray-500">No keys pressed yet...</p>
              ) : (
                keyLog.map((log, index) => (
                  <div key={index} className="text-gray-600 dark:text-gray-400">{log}</div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Instructions */}
        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
          <h3 className="font-semibold mb-2">Testing Instructions:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>
              <strong>Mac Users:</strong> Try pressing{' '}
              <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">⌘→</kbd> for Next,{' '}
              <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">⌘←</kbd> for Back,{' '}
              <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">⌘⇧S</kbd> for Save Draft
            </li>
            <li>
              <strong>Windows Users:</strong> Try pressing{' '}
              <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">Alt+N</kbd> for Next,{' '}
              <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">Alt+B</kbd> for Back,{' '}
              <kbd className="px-1 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">Ctrl+Shift+S</kbd> for Save Draft
            </li>
            <li>Test standard shortcuts like Search ({shortcuts.search}) and Save ({shortcuts.save})</li>
            <li>Check that the "Last Action" updates when you press shortcuts</li>
            <li>Verify that shortcuts show green checkmarks when tested</li>
            <li>Use a screen reader to verify ARIA attributes are announced on buttons</li>
          </ol>
        </div>
        
        {/* Test Summary */}
        <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <h3 className="font-semibold mb-2">Test Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
            {Object.entries(testResults).map(([key, tested]) => (
              <div key={key} className="flex items-center gap-1">
                <span className={tested ? 'text-green-600' : 'text-gray-400'}>
                  {tested ? '✓' : '○'}
                </span>
                <span className="capitalize">{key}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}