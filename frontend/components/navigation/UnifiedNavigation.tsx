'use client';

import { useAuth } from '@/components/providers/AuthProvider';
import {
    BeakerIcon,
    ChartBarIcon,
    Cog6ToothIcon,
    DocumentDuplicateIcon,
    HomeIcon,
    UsersIcon,
} from '@heroicons/react/24/outline';
import { usePathname, useRouter } from 'next/navigation';
import React, { useMemo } from 'react';
import { Breadcrumbs } from './Breadcrumbs';
import { CommandPalette } from './CommandPalette';
import { GlobalSearch } from './GlobalSearch';
import { HamburgerMenu } from './HamburgerMenu';
import { UserProfileMenu } from './UserProfileMenu';

interface NavigationItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
  badge?: string;
  roles?: ('researcher' | 'participant' | 'admin')[];
  children?: NavigationItem[];
}

/**
 * Unified Navigation System
 * Phase 6.6: Single navigation component for all pages
 *
 * Features:
 * - Role-based navigation items
 * - Context-aware active states
 * - Responsive design (mobile/desktop)
 * - Keyboard navigation support
 * - Accessibility compliant
 */
export function UnifiedNavigation() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();

  // Navigation configuration based on user role
  const navigationItems = useMemo<NavigationItem[]>(() => {
    const _items: NavigationItem[] = [];

    // Public items (always visible)
    const publicItems: NavigationItem[] = [
      {
        label: 'Home',
        path: '/',
        icon: HomeIcon,
        description: 'Welcome page',
      },
    ];

    if (!isAuthenticated) {
      return [
        ...publicItems,
        {
          label: 'About',
          path: '/about',
          icon: HomeIcon,
        },
        {
          label: 'Help',
          path: '/help',
          icon: HomeIcon,
        },
      ];
    }

    // Researcher navigation
    if (user?.role === 'researcher') {
      return [
        {
          label: 'Dashboard',
          path: '/dashboard',
          icon: HomeIcon,
          description: 'Overview & insights',
          roles: ['researcher'],
        },
        {
          label: 'Studies',
          path: '/studies',
          icon: DocumentDuplicateIcon,
          description: 'Manage research studies',
          roles: ['researcher'],
          children: [
            {
              label: 'All Studies',
              path: '/studies',
              icon: DocumentDuplicateIcon,
            },
            {
              label: 'Create Study',
              path: '/studies/create',
              icon: DocumentDuplicateIcon,
            },
          ],
        },
        {
          label: 'Analytics',
          path: '/analytics',
          icon: ChartBarIcon,
          description: 'Platform metrics & performance',
          roles: ['researcher'],
        },
        {
          label: 'Analysis',
          path: '/analysis',
          icon: BeakerIcon,
          description: 'Research tools & Q-methodology',
          badge: 'NEW',
          roles: ['researcher'],
          children: [
            {
              label: 'Tools Hub',
              path: '/analysis',
              icon: BeakerIcon,
            },
            {
              label: 'Q-Methodology',
              path: '/analysis/q-methodology',
              icon: BeakerIcon,
            },
          ],
        },
        {
          label: 'Participants',
          path: '/participants',
          icon: UsersIcon,
          description: 'Manage participants',
          roles: ['researcher'],
        },
      ];
    }

    // Participant navigation
    if (user?.role === 'participant') {
      return [
        {
          label: 'My Studies',
          path: '/my-studies',
          icon: DocumentDuplicateIcon,
          description: 'Your active studies',
          roles: ['participant'],
        },
        {
          label: 'Join Study',
          path: '/join',
          icon: UsersIcon,
          description: 'Enter study code',
          roles: ['participant'],
        },
      ];
    }

    return publicItems;
  }, [user, isAuthenticated]);

  // Check if current path matches navigation item
  const isActive = (path: string) => {
    if (path === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(path);
  };

  // Get current section for context
  const currentSection = useMemo(() => {
    const activeItem = navigationItems.find(item => isActive(item.path));
    return activeItem?.label || 'VQMethod';
  }, [pathname, navigationItems]);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur-md">
        <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Main Navigation Bar */}
          <div className="flex h-16 items-center justify-between">
            {/* Left Section */}
            <div className="flex items-center gap-4">
              {/* Mobile Menu */}
              <HamburgerMenu />

              {/* Logo & Brand */}
              <button
                onClick={() => router.push('/')}
                className="flex items-center gap-2 transition-opacity hover:opacity-80"
                aria-label="Go to homepage"
              >
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-system-blue to-system-green flex items-center justify-center">
                  <span className="text-white font-bold text-sm">VQ</span>
                </div>
                <span className="hidden sm:block font-semibold text-lg">
                  {currentSection}
                </span>
              </button>

              {/* Desktop Navigation */}
              <div className="hidden lg:flex items-center gap-1 ml-8">
                {navigationItems.map((item: any) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);

                  return (
                    <div key={item.path} className="relative group">
                      <button
                        onClick={() => router.push(item.path)}
                        className={`
                          flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                          transition-all duration-200
                          ${
                            active
                              ? 'bg-primary/10 text-primary'
                              : 'text-text-secondary hover:bg-surface-secondary hover:text-text'
                          }
                        `}
                        aria-current={active ? 'page' : undefined}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                        {item.badge && (
                          <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-system-green/20 text-system-green font-semibold">
                            {item.badge}
                          </span>
                        )}
                      </button>

                      {/* Dropdown for children */}
                      {item.children && item.children.length > 0 && (
                        <div className="absolute top-full left-0 mt-1 w-48 py-2 bg-surface rounded-lg shadow-lg border border-border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                          {item.children.map((child: any) => (
                            <button
                              key={child.path}
                              onClick={() => router.push(child.path)}
                              className="w-full text-left px-4 py-2 text-sm hover:bg-surface-secondary transition-colors"
                            >
                              {child.label}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Tooltip */}
                      {item.description && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap pointer-events-none">
                          {item.description}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-4">
              {/* Global Search */}
              <div className="hidden md:block">
                <GlobalSearch />
              </div>

              {/* Settings */}
              {isAuthenticated && (
                <button
                  onClick={() => router.push('/settings')}
                  className="p-2 rounded-lg hover:bg-surface-secondary transition-colors"
                  aria-label="Settings"
                >
                  <Cog6ToothIcon className="w-5 h-5 text-text-secondary" />
                </button>
              )}

              {/* User Profile */}
              <UserProfileMenu />
            </div>
          </div>

          {/* Breadcrumbs - Below main nav */}
          <div className="py-2 -mb-px">
            <Breadcrumbs />
          </div>
        </nav>
      </header>

      {/* Command Palette (Global) */}
      <CommandPalette />
    </>
  );
}
