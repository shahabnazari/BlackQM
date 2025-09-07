'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HomeIcon,
  ChartBarIcon,
  BeakerIcon,
  DocumentDuplicateIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  Bars3Icon,
  UserCircleIcon,
  InformationCircleIcon,
  QuestionMarkCircleIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/components/providers/AuthProvider';

interface MenuItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
}

export function HamburgerMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();

  // Close menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const getMenuItems = (): MenuItem[] => {
    const publicItems: MenuItem[] = [
      { label: 'Home', path: '/', icon: HomeIcon },
      { label: 'About', path: '/about', icon: InformationCircleIcon },
      { label: 'Help', path: '/help', icon: QuestionMarkCircleIcon },
    ];

    if (!isAuthenticated) {
      return publicItems;
    }

    if (user?.role === 'researcher') {
      return [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: HomeIcon,
          description: 'Main overview',
        },
        {
          label: 'Studies',
          path: '/studies',
          icon: DocumentDuplicateIcon,
          description: 'Manage your studies',
          badge: '3',
        },
        {
          label: 'Analytics',
          path: '/analytics',
          icon: ChartBarIcon,
          description: 'Platform metrics & insights',
        },
        {
          label: 'Analysis',
          path: '/analysis',
          icon: BeakerIcon,
          description: 'Q-methodology & research tools',
          badge: 'NEW',
        },
        {
          label: 'Participants',
          path: '/participants',
          icon: UsersIcon,
          description: 'Manage participants',
        },
        ...publicItems,
      ];
    }

    if (user?.role === 'participant') {
      return [
        {
          label: 'My Studies',
          path: '/my-studies',
          icon: DocumentDuplicateIcon,
        },
        { label: 'Join Study', path: '/join', icon: UsersIcon },
        ...publicItems,
      ];
    }

    return publicItems;
  };

  const menuItems = getMenuItems();

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="md:hidden p-2 rounded-lg hover:bg-surface-secondary transition-colors"
        aria-label="Open menu"
      >
        <Bars3Icon className="w-6 h-6" />
      </button>

      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-surface shadow-xl z-50 md:hidden overflow-y-auto"
            >
              {/* Header */}
              <div className="sticky top-0 bg-surface border-b border-border p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-system-blue to-system-green rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">VQ</span>
                    </div>
                    <span className="font-semibold">VQMethod</span>
                  </div>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
                    aria-label="Close menu"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>

                {/* User Profile Section */}
                {isAuthenticated && user && (
                  <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg">
                    <UserCircleIcon className="w-10 h-10 text-text-secondary" />
                    <div className="flex-1">
                      <div className="font-medium text-sm">
                        {user.name || user.email}
                      </div>
                      <div className="text-xs text-text-secondary capitalize">
                        {user.role}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Navigation Items */}
              <nav className="p-4">
                <div className="space-y-1">
                  {menuItems.map(item => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path;

                    return (
                      <button
                        key={item.path}
                        onClick={() => {
                          router.push(item.path);
                          setIsOpen(false);
                        }}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2.5 rounded-lg
                          transition-all duration-200
                          ${
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'hover:bg-surface-secondary text-text'
                          }
                        `}
                      >
                        <Icon className="w-5 h-5 flex-shrink-0" />
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.label}</span>
                            {item.badge && (
                              <span
                                className={`
                                px-1.5 py-0.5 text-xs rounded-full
                                ${
                                  item.badge === 'NEW'
                                    ? 'bg-system-green/20 text-system-green'
                                    : 'bg-primary/20 text-primary'
                                }
                              `}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <div className="text-xs text-text-secondary mt-0.5">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Settings & Logout */}
                {isAuthenticated && (
                  <>
                    <div className="border-t border-border mt-4 pt-4">
                      <button
                        onClick={() => {
                          router.push('/settings');
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-secondary transition-colors"
                      >
                        <Cog6ToothIcon className="w-5 h-5" />
                        <span className="font-medium">Settings</span>
                      </button>

                      <button
                        onClick={() => {
                          logout();
                          setIsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-secondary transition-colors text-system-red"
                      >
                        <ArrowRightOnRectangleIcon className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  </>
                )}
              </nav>

              {/* Footer */}
              <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-surface">
                <div className="text-xs text-text-secondary text-center">
                  © 2025 VQMethod
                  <br />
                  <span className="text-system-green">v1.0.0</span>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
