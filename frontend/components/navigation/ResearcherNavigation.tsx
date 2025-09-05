'use client';

import React from 'react';
import { UserProfileMenu } from './UserProfileMenu';
import { GlobalSearch } from './GlobalSearch';
import { Breadcrumbs } from './Breadcrumbs';
import { MobileNav } from './MobileNav';
import { CommandPalette } from './CommandPalette';

export function ResearcherNavigation() {
  return (
    <>
      <header className="border-b border-quaternary-fill bg-tertiary-background">
        <nav className="max-w-7xl mx-auto px-6 py-4">
          {/* Main Navigation Bar */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {/* Mobile Navigation */}
              <MobileNav className="lg:hidden" />

              {/* Logo */}
              <div className="w-10 h-10 bg-gradient-to-br from-system-blue to-system-green rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">VQ</span>
              </div>
              <h1 className="text-xl font-semibold text-label hidden sm:block">
                VQMethod Researcher
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-4">
              <a
                href="/dashboard"
                className="text-secondary-label hover:text-label"
              >
                Dashboard
              </a>
              <a
                href="/studies"
                className="text-secondary-label hover:text-label"
              >
                Studies
              </a>
              <a
                href="/analytics"
                className="text-secondary-label hover:text-label"
              >
                Analytics
              </a>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-4">
              {/* Global Search - Hidden on mobile */}
              <div className="hidden md:block w-96">
                <GlobalSearch />
              </div>

              {/* User Profile Menu */}
              <UserProfileMenu />
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="mt-2">
            <Breadcrumbs />
          </div>
        </nav>
      </header>

      {/* Command Palette - Global */}
      <CommandPalette />
    </>
  );
}
