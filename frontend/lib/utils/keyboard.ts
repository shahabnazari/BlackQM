/**
 * Cross-platform keyboard utilities for Mac and Windows support
 * Provides consistent keyboard handling and display across operating systems
 */

/**
 * Detects the user's operating system
 */
export function getOS(): 'mac' | 'windows' | 'linux' | 'other' {
  if (typeof window === 'undefined') return 'other';
  
  const platform = window.navigator.platform?.toLowerCase() || '';
  const userAgent = window.navigator.userAgent?.toLowerCase() || '';
  
  if (platform.includes('mac') || userAgent.includes('mac')) return 'mac';
  if (platform.includes('win') || userAgent.includes('win')) return 'windows';
  if (platform.includes('linux') || userAgent.includes('linux')) return 'linux';
  
  return 'other';
}

/**
 * Checks if the user is on a Mac
 */
export function isMac(): boolean {
  return getOS() === 'mac';
}

/**
 * Checks if the user is on Windows
 */
export function isWindows(): boolean {
  return getOS() === 'windows';
}

/**
 * Gets the appropriate modifier key for the platform
 */
export function getModifierKey(): 'metaKey' | 'ctrlKey' {
  return isMac() ? 'metaKey' : 'ctrlKey';
}

/**
 * Gets the display string for the modifier key
 */
export function getModifierDisplay(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

/**
 * Gets the full display string for the modifier key
 */
export function getModifierName(): string {
  return isMac() ? 'Command' : 'Control';
}

/**
 * Gets the display string for keyboard shortcuts
 */
export function getShortcutDisplay(shortcut: string): string {
  if (isMac()) return shortcut;
  
  // Replace Mac symbols with Windows equivalents
  return shortcut
    .replace(/⌘/g, 'Ctrl')
    .replace(/⌥/g, 'Alt')
    .replace(/⇧/g, 'Shift')
    .replace(/⌃/g, 'Ctrl')
    .replace(/↵/g, 'Enter')
    .replace(/⌫/g, 'Backspace')
    .replace(/⌦/g, 'Delete')
    .replace(/↑/g, '↑')
    .replace(/↓/g, '↓')
    .replace(/←/g, '←')
    .replace(/→/g, '→');
}

/**
 * Formats a keyboard shortcut for display based on the platform
 */
export function formatShortcut(keys: {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  key: string;
}): string {
  const parts: string[] = [];
  
  // Format the key name
  const formatKey = (key: string): string => {
    // Handle arrow keys
    if (key === 'ArrowRight' || key === 'right') return '→';
    if (key === 'ArrowLeft' || key === 'left') return '←';
    if (key === 'ArrowUp' || key === 'up') return '↑';
    if (key === 'ArrowDown' || key === 'down') return '↓';
    if (key === 'Enter') return isMac() ? '↵' : 'Enter';
    if (key === ' ') return 'Space';
    if (key === 'Escape') return 'Esc';
    return key.toUpperCase();
  };
  
  if (isMac()) {
    if (keys.ctrl) parts.push('⌃');
    if (keys.alt) parts.push('⌥');
    if (keys.shift) parts.push('⇧');
    if (keys.meta) parts.push('⌘');
    parts.push(formatKey(keys.key));
    return parts.join('');
  } else {
    if (keys.ctrl || keys.meta) parts.push('Ctrl');
    if (keys.alt) parts.push('Alt');
    if (keys.shift) parts.push('Shift');
    parts.push(formatKey(keys.key));
    return parts.join('+');
  }
}

/**
 * Checks if a keyboard event matches a shortcut
 */
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
    key: string;
  }
): boolean {
  const modifierKey = getModifierKey();
  const hasModifier = modifierKey === 'metaKey' ? event.metaKey : event.ctrlKey;
  
  // For cross-platform compatibility, treat Ctrl and Cmd as equivalent
  const ctrlOrCmd = shortcut.ctrl || shortcut.meta;
  
  return (
    (!ctrlOrCmd || hasModifier) &&
    (!shortcut.alt || event.altKey) &&
    (!shortcut.shift || event.shiftKey) &&
    event.key.toLowerCase() === shortcut.key.toLowerCase()
  );
}

/**
 * Creates an ARIA keyboard shortcut string based on the platform
 */
export function getAriaKeyShortcuts(shortcuts: Array<{
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  key: string;
}>): string {
  return shortcuts
    .map(shortcut => {
      const parts: string[] = [];
      
      // Use the appropriate modifier for the platform
      if (shortcut.ctrl || shortcut.meta) {
        parts.push(isMac() ? 'Meta' : 'Control');
      }
      if (shortcut.alt) parts.push('Alt');
      if (shortcut.shift) parts.push('Shift');
      
      // Add the key
      const key = shortcut.key.length === 1 
        ? shortcut.key.toUpperCase() 
        : shortcut.key;
      parts.push(key);
      
      return parts.join('+');
    })
    .join(' ');
}

/**
 * Common keyboard shortcuts with platform-specific display
 */
export const shortcuts = {
  save: () => formatShortcut({ meta: true, ctrl: true, key: 's' }),
  open: () => formatShortcut({ meta: true, ctrl: true, key: 'o' }),
  new: () => formatShortcut({ meta: true, ctrl: true, key: 'n' }),
  close: () => formatShortcut({ meta: true, ctrl: true, key: 'w' }),
  undo: () => formatShortcut({ meta: true, ctrl: true, key: 'z' }),
  redo: () => isMac() 
    ? formatShortcut({ meta: true, shift: true, key: 'z' })
    : formatShortcut({ ctrl: true, key: 'y' }),
  cut: () => formatShortcut({ meta: true, ctrl: true, key: 'x' }),
  copy: () => formatShortcut({ meta: true, ctrl: true, key: 'c' }),
  paste: () => formatShortcut({ meta: true, ctrl: true, key: 'v' }),
  selectAll: () => formatShortcut({ meta: true, ctrl: true, key: 'a' }),
  find: () => formatShortcut({ meta: true, ctrl: true, key: 'f' }),
  findReplace: () => formatShortcut({ meta: true, ctrl: true, key: 'h' }),
  bold: () => formatShortcut({ meta: true, ctrl: true, key: 'b' }),
  italic: () => formatShortcut({ meta: true, ctrl: true, key: 'i' }),
  underline: () => formatShortcut({ meta: true, ctrl: true, key: 'u' }),
  search: () => formatShortcut({ meta: true, ctrl: true, key: 'k' }),
  commandPalette: () => formatShortcut({ meta: true, ctrl: true, shift: true, key: 'p' }),
  submit: () => formatShortcut({ meta: true, ctrl: true, key: 'Enter' }),
  escape: () => 'Esc',
  delete: () => isMac() ? '⌫' : 'Backspace',
  forwardDelete: () => isMac() ? '⌦' : 'Delete',
};

/**
 * Get platform-specific shortcut configuration
 */
export function getPlatformShortcut(action: 'next' | 'back' | 'saveDraft'): {
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  key: string;
} {
  if (isMac()) {
    // Mac uses Command for these shortcuts
    switch (action) {
      case 'next':
        return { meta: true, key: 'ArrowRight' }; // Cmd+Right Arrow
      case 'back':
        return { meta: true, key: 'ArrowLeft' }; // Cmd+Left Arrow
      case 'saveDraft':
        return { meta: true, shift: true, key: 's' }; // Cmd+Shift+S
      default:
        return { key: '' };
    }
  } else {
    // Windows/Linux uses Alt for navigation
    switch (action) {
      case 'next':
        return { alt: true, key: 'n' };
      case 'back':
        return { alt: true, key: 'b' };
      case 'saveDraft':
        return { ctrl: true, shift: true, key: 's' }; // Ctrl+Shift+S
      default:
        return { key: '' };
    }
  }
}

/**
 * Platform-aware shortcut matching
 */
export function matchesPlatformShortcut(
  event: KeyboardEvent,
  action: 'next' | 'back' | 'saveDraft'
): boolean {
  const shortcut = getPlatformShortcut(action);
  return matchesShortcut(event, shortcut);
}

/**
 * Hook for keyboard shortcuts
 */
export function useKeyboardShortcut(
  shortcut: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
    key: string;
  },
  callback: (event: KeyboardEvent) => void,
  enabled: boolean = true
) {
  if (typeof window === 'undefined') return;
  
  const handler = (event: KeyboardEvent) => {
    if (!enabled) return;
    if (matchesShortcut(event, shortcut)) {
      event.preventDefault();
      callback(event);
    }
  };
  
  document.addEventListener('keydown', handler);
  return () => document.removeEventListener('keydown', handler);
}

/**
 * Get help text for keyboard navigation
 */
export function getKeyboardHelpText(): {
  modifier: string;
  shortcuts: Array<{ keys: string; description: string }>;
} {
  const mod = getModifierDisplay();
  const nextKey = isMac() ? `${mod}→` : 'Alt+N'; // Cmd+→ on Mac, Alt+N on Windows
  const backKey = isMac() ? `${mod}←` : 'Alt+B'; // Cmd+← on Mac, Alt+B on Windows
  const saveDraftKey = isMac() ? `${mod}⇧S` : 'Ctrl+Shift+S';
  
  return {
    modifier: getModifierName(),
    shortcuts: [
      { keys: `${mod}K`, description: 'Open search' },
      { keys: `${mod}⇧P`, description: 'Open command palette' },
      { keys: `${mod}S`, description: 'Save' },
      { keys: saveDraftKey, description: 'Save draft' },
      { keys: `${mod}N`, description: 'New' },
      { keys: `${mod}Enter`, description: 'Submit' },
      { keys: nextKey, description: 'Next' },
      { keys: backKey, description: 'Back' },
      { keys: 'Esc', description: 'Close/Cancel' },
      { keys: '↑↓', description: 'Navigate' },
      { keys: 'Enter', description: 'Select' },
      { keys: 'Tab', description: 'Next field' },
      { keys: 'Shift+Tab', description: 'Previous field' },
    ],
  };
}

/**
 * Platform-specific accessibility announcement
 */
export function getAccessibilityAnnouncement(action: string): string {
  const modifier = getModifierName();
  return `${action}. Press ${modifier} plus slash for keyboard shortcuts help.`;
}