import { useState, useEffect } from 'react';
import { formatShortcut, getPlatformShortcut } from '@/lib/utils/keyboard';

/**
 * Hook to get platform-specific keyboard shortcut display
 * Prevents hydration mismatch by defaulting to generic display until client-side
 */
export function useShortcut(
  shortcut: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
    key: string;
  },
  defaultDisplay?: string
): string {
  // Use generic default for SSR to prevent hydration mismatch
  const getDefault = () => {
    if (defaultDisplay) return defaultDisplay;
    
    // Build a generic string that works for all platforms
    const parts: string[] = [];
    if (shortcut.ctrl || shortcut.meta) parts.push('Ctrl');
    if (shortcut.alt) parts.push('Alt');
    if (shortcut.shift) parts.push('Shift');
    parts.push(shortcut.key.toUpperCase());
    return parts.join('+');
  };
  
  const [display, setDisplay] = useState<string>(getDefault());
  
  useEffect(() => {
    // Update to platform-specific display after mount
    setDisplay(formatShortcut(shortcut));
  }, []);
  
  return display;
}

/**
 * Hook to get multiple shortcuts at once
 */
export function useShortcuts(): {
  save: string;
  saveDraft: string;
  open: string;
  new: string;
  search: string;
  commandPalette: string;
  next: string;
  back: string;
  submit: string;
} {
  const [shortcuts, setShortcuts] = useState({
    save: 'Ctrl+S',
    saveDraft: 'Ctrl+Shift+S',
    open: 'Ctrl+O',
    new: 'Ctrl+N',
    search: 'Ctrl+K',
    commandPalette: 'Ctrl+Shift+P',
    next: 'Alt+N',
    back: 'Alt+B',
    submit: 'Ctrl+Enter',
  });
  
  useEffect(() => {
    const nextShortcut = getPlatformShortcut('next');
    const backShortcut = getPlatformShortcut('back');
    const saveDraftShortcut = getPlatformShortcut('saveDraft');
    
    setShortcuts({
      save: formatShortcut({ meta: true, ctrl: true, key: 's' }),
      saveDraft: formatShortcut(saveDraftShortcut),
      open: formatShortcut({ meta: true, ctrl: true, key: 'o' }),
      new: formatShortcut({ meta: true, ctrl: true, key: 'n' }),
      search: formatShortcut({ meta: true, ctrl: true, key: 'k' }),
      commandPalette: formatShortcut({ meta: true, ctrl: true, shift: true, key: 'p' }),
      next: formatShortcut(nextShortcut),
      back: formatShortcut(backShortcut),
      submit: formatShortcut({ meta: true, ctrl: true, key: 'Enter' }),
    });
  }, []);
  
  return shortcuts;
}