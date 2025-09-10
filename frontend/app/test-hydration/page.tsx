'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/apple-ui/Card';
import { Button } from '@/components/apple-ui/Button';
import { GlobalSearch } from '@/components/navigation/GlobalSearch';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { useShortcuts } from '@/lib/hooks/useShortcut';
import { formatShortcut } from '@/lib/utils/keyboard';

export default function HydrationTestPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [directFormatted, setDirectFormatted] = useState('Ctrl+K'); // SSR default
  const shortcuts = useShortcuts();
  
  useEffect(() => {
    setIsMounted(true);
    // This will only run on the client
    setDirectFormatted(formatShortcut({ meta: true, ctrl: true, key: 'k' }));
  }, []);
  
  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-6">
      <Card className="p-6">
        <h1 className="text-2xl font-bold mb-4">Hydration Mismatch Test</h1>
        
        <div className="space-y-6">
          {/* Mount Status */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <h2 className="font-semibold mb-2">Component Status</h2>
            <p>Mounted: <strong>{isMounted ? 'Yes (Client)' : 'No (SSR)'}</strong></p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              If you see any hydration errors in the console, they will appear as red warnings about text content not matching.
            </p>
          </div>
          
          {/* Shortcut Display Comparison */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h2 className="font-semibold mb-3">Shortcut Display Methods</h2>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm">Direct formatShortcut (causes hydration error):</span>
                <kbd className="px-2 py-1 text-xs bg-white dark:bg-gray-700 rounded">
                  {directFormatted}
                </kbd>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">useShortcuts hook (no hydration error):</span>
                <kbd className="px-2 py-1 text-xs bg-white dark:bg-gray-700 rounded">
                  {shortcuts.search}
                </kbd>
              </div>
            </div>
          </div>
          
          {/* Global Search Component */}
          <div>
            <h2 className="font-semibold mb-3">Global Search Component</h2>
            <GlobalSearch />
            <p className="text-xs text-gray-500 mt-2">
              Should show {isMounted ? 'platform-specific' : 'generic'} shortcut without hydration errors
            </p>
          </div>
          
          {/* Command Palette Trigger */}
          <div>
            <h2 className="font-semibold mb-3">Command Palette</h2>
            <Button
              variant="secondary"
              onClick={() => {
                document.dispatchEvent(
                  new KeyboardEvent('keydown', { 
                    key: 'p', 
                    shiftKey: true,
                    metaKey: true,
                    ctrlKey: true 
                  })
                );
              }}
            >
              Open Command Palette ({shortcuts.commandPalette})
            </Button>
            <CommandPalette />
          </div>
          
          {/* Shortcut List */}
          <div>
            <h2 className="font-semibold mb-3">All Shortcuts (from useShortcuts hook)</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Save: <kbd className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">{shortcuts.save}</kbd></div>
              <div>Save Draft: <kbd className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">{shortcuts.saveDraft}</kbd></div>
              <div>New: <kbd className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">{shortcuts.new}</kbd></div>
              <div>Open: <kbd className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">{shortcuts.open}</kbd></div>
              <div>Search: <kbd className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">{shortcuts.search}</kbd></div>
              <div>Next: <kbd className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">{shortcuts.next}</kbd></div>
              <div>Back: <kbd className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">{shortcuts.back}</kbd></div>
              <div>Submit: <kbd className="px-2 py-0.5 text-xs bg-gray-200 dark:bg-gray-700 rounded">{shortcuts.submit}</kbd></div>
            </div>
          </div>
          
          {/* Test Results */}
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h2 className="font-semibold mb-2">Expected Results</h2>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>✅ No hydration errors in console</li>
              <li>✅ Shortcuts show "Ctrl" initially, then update to platform-specific</li>
              <li>✅ GlobalSearch shows correct shortcut without errors</li>
              <li>✅ CommandPalette opens without errors</li>
              <li>✅ All components render smoothly</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}