'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { 
  formatShortcut, 
  matchesShortcut, 
  getAriaKeyShortcuts,
  getShortcutDisplay,
  isMac
} from '@/lib/utils/keyboard';

interface Command {
  id: string;
  title: string;
  description?: string;
  category: 'navigation' | 'action' | 'settings' | 'help';
  action: () => void;
  icon?: React.ReactNode;
  keywords?: string[];
  shortcut?: string;
}

interface CommandPaletteProps {
  className?: string;
}

export function CommandPalette({ className = '' }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>([]);
  const [shortcuts, setShortcuts] = useState({
    home: 'Ctrl+H',
    new: 'Ctrl+N',
    export: 'Ctrl+E',
    search: 'Ctrl+K',
    theme: 'Ctrl+T',
    palette: 'Ctrl+Shift+P',
  });

  const router = useRouter();
  const { user, logout } = useAuth();

  // Load recent commands and set platform-specific shortcuts
  useEffect(() => {
    const saved = localStorage.getItem('recentCommands');
    if (saved) {
      setRecentCommands(JSON.parse(saved));
    }
    // Set platform-specific shortcuts after mount
    setShortcuts({
      home: formatShortcut({ meta: true, ctrl: true, key: 'h' }),
      new: formatShortcut({ meta: true, ctrl: true, key: 'n' }),
      export: formatShortcut({ meta: true, ctrl: true, key: 'e' }),
      search: formatShortcut({ meta: true, ctrl: true, key: 'k' }),
      theme: formatShortcut({ meta: true, ctrl: true, key: 't' }),
      palette: formatShortcut({ meta: true, ctrl: true, shift: true, key: 'p' }),
    });
  }, []);

  // Define available commands
  const commands: Command[] = [
    // Navigation commands
    {
      id: 'nav-home',
      title: 'Go to Home',
      category: 'navigation',
      action: () => router.push('/'),
      icon: <HomeIcon />,
      keywords: ['dashboard', 'main'],
      shortcut: shortcuts.home,
    },
    {
      id: 'nav-studies',
      title: 'View Studies',
      category: 'navigation',
      action: () => router.push('/studies'),
      icon: <StudiesIcon />,
      keywords: ['research', 'projects'],
    },
    {
      id: 'nav-analytics',
      title: 'Open Analytics',
      category: 'navigation',
      action: () => router.push('/analytics'),
      icon: <AnalyticsIcon />,
      keywords: ['reports', 'data', 'statistics'],
    },
    {
      id: 'nav-participants',
      title: 'Manage Participants',
      category: 'navigation',
      action: () => router.push('/participants'),
      icon: <ParticipantsIcon />,
      keywords: ['users', 'respondents'],
    },

    // Action commands
    {
      id: 'action-create-study',
      title: 'Create New Study',
      description: 'Start a new Q-methodology study',
      category: 'action',
      action: () => router.push('/studies/create'),
      icon: <PlusIcon />,
      keywords: ['new', 'add', 'start'],
      shortcut: shortcuts.new,
    },
    {
      id: 'action-export',
      title: 'Export Data',
      description: 'Export current view data',
      category: 'action',
      action: () => console.log('Export triggered'),
      icon: <ExportIcon />,
      keywords: ['download', 'save'],
      shortcut: shortcuts.export,
    },
    {
      id: 'action-search',
      title: 'Search Everything',
      description: 'Open global search',
      category: 'action',
      action: () =>
        document.dispatchEvent(
          new KeyboardEvent('keydown', { key: 'k', metaKey: true })
        ),
      icon: <SearchIcon />,
      keywords: ['find', 'look'],
      shortcut: shortcuts.search,
    },

    // Settings commands
    {
      id: 'settings-profile',
      title: 'Edit Profile',
      category: 'settings',
      action: () => router.push('/settings/profile'),
      icon: <ProfileIcon />,
      keywords: ['account', 'user'],
    },
    {
      id: 'settings-theme',
      title: 'Toggle Theme',
      description: 'Switch between light and dark mode',
      category: 'settings',
      action: () => {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
      },
      icon: <ThemeIcon />,
      keywords: ['dark', 'light', 'mode'],
      shortcut: shortcuts.theme,
    },
    {
      id: 'settings-logout',
      title: 'Logout',
      description: 'Sign out of your account',
      category: 'settings',
      action: () => {
        logout();
        router.push('/');
      },
      icon: <LogoutIcon />,
      keywords: ['sign out', 'exit'],
    },

    // Help commands
    {
      id: 'help-docs',
      title: 'Open Documentation',
      category: 'help',
      action: () => router.push('/help'),
      icon: <HelpIcon />,
      keywords: ['guide', 'tutorial', 'docs'],
    },
    {
      id: 'help-shortcuts',
      title: 'View Keyboard Shortcuts',
      description: 'Show all available shortcuts',
      category: 'help',
      action: () => console.log('Show shortcuts modal'),
      icon: <KeyboardIcon />,
      keywords: ['keys', 'hotkeys'],
      shortcut: '?',
    },
    {
      id: 'help-contact',
      title: 'Contact Support',
      category: 'help',
      action: () => router.push('/contact'),
      icon: <ContactIcon />,
      keywords: ['email', 'message'],
    },
  ];

  // Filter commands based on query
  const filteredCommands = query
    ? commands.filter(cmd => {
        const searchText =
          `${cmd.title} ${cmd.description || ''} ${cmd.keywords?.join(' ') || ''}`.toLowerCase();
        return searchText.includes(query.toLowerCase());
      })
    : recentCommands.length > 0
      ? commands.filter(cmd => recentCommands.includes(cmd.id))
      : commands.slice(0, 5); // Show first 5 as default

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Open command palette (Cmd+Shift+P on Mac, Ctrl+Shift+P on Windows)
      if (matchesShortcut(e, { meta: true, ctrl: true, shift: true, key: 'p' })) {
        e.preventDefault();
        setIsOpen(true);
        setQuery('');
        setSelectedIndex(0);
      }

      // Close on Escape
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Navigate commands with keyboard
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev < filteredCommands.length - 1 ? prev + 1 : 0
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev =>
        prev > 0 ? prev - 1 : filteredCommands.length - 1
      );
    } else if (e.key === 'Enter' && filteredCommands[selectedIndex]) {
      e.preventDefault();
      executeCommand(filteredCommands[selectedIndex]);
    }
  };

  // Execute command and save to recent
  const executeCommand = (command: Command) => {
    command.action();

    // Save to recent commands
    const updated = [
      command.id,
      ...recentCommands.filter(id => id !== command.id),
    ].slice(0, 5);
    setRecentCommands(updated);
    localStorage.setItem('recentCommands', JSON.stringify(updated));

    setIsOpen(false);
    setQuery('');
  };

  // Update selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const getCategoryColor = (category: Command['category']) => {
    const colors = {
      navigation:
        'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30',
      action:
        'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30',
      settings: 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-800',
      help: 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30',
    };
    return colors[category];
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={() => setIsOpen(false)}
      />

      {/* Command Palette Modal */}
      <div className="fixed inset-x-0 top-20 mx-auto max-w-2xl z-50 animate-in slide-in-from-top-4 duration-200">
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl ring-1 ring-black/5 dark:ring-white/10 overflow-hidden">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a command or search..."
              className="w-full px-4 py-4 pl-12 text-lg bg-transparent border-b border-gray-200 dark:border-gray-800 focus:outline-none"
              autoFocus
            />
            <CommandIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          </div>

          {/* Commands List */}
          <div className="max-h-96 overflow-y-auto p-2">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                No commands found for "{query}"
              </div>
            ) : (
              <div className="space-y-1">
                {query === '' && recentCommands.length > 0 && (
                  <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                    Recent Commands
                  </div>
                )}
                {filteredCommands.map((command, index) => (
                  <button
                    key={command.id}
                    onClick={() => executeCommand(command)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-gray-100 dark:bg-gray-800'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                    }`}
                  >
                    <div
                      className={`p-1.5 rounded ${getCategoryColor(command.category)}`}
                    >
                      {command.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        {command.title}
                      </p>
                      {command.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {command.description}
                        </p>
                      )}
                    </div>
                    {command.shortcut && (
                      <kbd className="px-2 py-1 text-xs font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400 rounded">
                        {command.shortcut}
                      </kbd>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center space-x-4">
                <span>↑↓ Navigate</span>
                <span>{isMac() ? '↵' : 'Enter'} Select</span>
                <span>Esc Close</span>
              </div>
              <span>{shortcuts.palette} to open</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Icon Components
function CommandIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 20l4-16m6 4l-4 4 4 4M8 12l-4-4 4-4"
      />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
      />
    </svg>
  );
}

function StudiesIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  );
}

function AnalyticsIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
      />
    </svg>
  );
}

function ParticipantsIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );
}

function ExportIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
      />
    </svg>
  );
}

function ThemeIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function KeyboardIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <rect x="2" y="6" width="20" height="12" rx="2" strokeWidth={2} />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M10 14h.01M14 14h8"
      />
    </svg>
  );
}

function ContactIcon() {
  return (
    <svg
      className="w-4 h-4"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
      />
    </svg>
  );
}
