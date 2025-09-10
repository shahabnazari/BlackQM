'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { 
  formatShortcut, 
  getKeyboardHelpText,
  isMac,
  matchesShortcut 
} from '@/lib/utils/keyboard';

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: { ctrl?: boolean; alt?: boolean; shift?: boolean; meta?: boolean; key: string };
    description: string;
  }>;
}

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);
  const platform = isMac() ? 'Mac' : 'Windows/Linux';
  
  // Keyboard shortcut to open help (?)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // ? key to open help
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const activeElement = document.activeElement;
        const isTyping = activeElement instanceof HTMLInputElement || 
                        activeElement instanceof HTMLTextAreaElement ||
                        activeElement?.getAttribute('contenteditable') === 'true';
        
        if (!isTyping) {
          e.preventDefault();
          setIsOpen(true);
        }
      }
      
      // Escape to close
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);
  
  const shortcutGroups: ShortcutGroup[] = [
    {
      title: 'Navigation',
      shortcuts: [
        { keys: { meta: true, ctrl: true, key: 'k' }, description: 'Open search' },
        { keys: { meta: true, ctrl: true, shift: true, key: 'p' }, description: 'Open command palette' },
        { keys: { meta: true, ctrl: true, key: 'h' }, description: 'Go to home' },
        { keys: { alt: true, key: 'n' }, description: 'Next page/step' },
        { keys: { alt: true, key: 'b' }, description: 'Previous page/step' },
      ],
    },
    {
      title: 'Actions',
      shortcuts: [
        { keys: { meta: true, ctrl: true, key: 's' }, description: 'Save' },
        { keys: { meta: true, ctrl: true, key: 'n' }, description: 'Create new' },
        { keys: { meta: true, ctrl: true, key: 'e' }, description: 'Export data' },
        { keys: { meta: true, ctrl: true, key: 'Enter' }, description: 'Submit form' },
        { keys: { meta: true, ctrl: true, key: 'z' }, description: 'Undo' },
        isMac()
          ? { keys: { meta: true, shift: true, key: 'z' }, description: 'Redo' }
          : { keys: { ctrl: true, key: 'y' }, description: 'Redo' },
      ],
    },
    {
      title: 'Text Editing',
      shortcuts: [
        { keys: { meta: true, ctrl: true, key: 'b' }, description: 'Bold' },
        { keys: { meta: true, ctrl: true, key: 'i' }, description: 'Italic' },
        { keys: { meta: true, ctrl: true, key: 'u' }, description: 'Underline' },
        { keys: { meta: true, ctrl: true, key: 'a' }, description: 'Select all' },
        { keys: { meta: true, ctrl: true, key: 'c' }, description: 'Copy' },
        { keys: { meta: true, ctrl: true, key: 'v' }, description: 'Paste' },
        { keys: { meta: true, ctrl: true, key: 'x' }, description: 'Cut' },
      ],
    },
    {
      title: 'General',
      shortcuts: [
        { keys: { key: '?' }, description: 'Show keyboard shortcuts (this dialog)' },
        { keys: { key: 'Escape' }, description: 'Close dialog/Cancel' },
        { keys: { key: 'Tab' }, description: 'Next field' },
        { keys: { shift: true, key: 'Tab' }, description: 'Previous field' },
        { keys: { key: 'Enter' }, description: 'Confirm/Select' },
        { keys: { key: 'Space' }, description: 'Toggle checkbox/button' },
      ],
    },
  ];
  
  if (!isOpen) return null;
  
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div 
        className="fixed inset-x-0 top-10 mx-auto max-w-3xl z-50 animate-in slide-in-from-top-4 duration-200"
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
      >
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 id="shortcuts-title" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Keyboard Shortcuts ({platform})
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close keyboard shortcuts help"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shortcutGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                    {group.title}
                  </h3>
                  <div className="space-y-2">
                    {group.shortcuts.map((shortcut, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {shortcut.description}
                        </span>
                        <kbd className="ml-4 px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-100 dark:bg-gray-800 dark:text-gray-300 rounded">
                          {formatShortcut(shortcut.keys)}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Platform Note */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> Keyboard shortcuts are automatically adjusted for your operating system.
                {isMac() ? (
                  <> Use Command (⌘) instead of Control on Mac.</>
                ) : (
                  <> Use Control (Ctrl) instead of Command on Windows/Linux.</>
                )}
              </p>
            </div>
          </div>
          
          {/* Footer */}
          <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Press <kbd className="px-1.5 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-gray-700 rounded">?</kbd> anytime to show this help
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default KeyboardShortcutsHelp;