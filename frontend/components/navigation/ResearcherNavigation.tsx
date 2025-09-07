'use client';

import React from 'react';
import { UserProfileMenu } from './UserProfileMenu';
import { GlobalSearch } from './GlobalSearch';
import { Breadcrumbs } from './Breadcrumbs';
import { HamburgerMenu } from './HamburgerMenu';
import { CommandPalette } from './CommandPalette';

export function ResearcherNavigation() {
  return (
    <>
      <header className="border-b border-border bg-surface">
        <nav className="max-w-7xl mx-auto px-6 py-4">
          {/* Main Navigation Bar */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              {/* Mobile Navigation with Enhanced Hamburger Menu */}
              <HamburgerMenu />

              {/* Logo */}
              <div className="w-10 h-10 bg-gradient-to-br from-system-blue to-system-green rounded-2xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">VQ</span>
              </div>
              <h1 className="text-xl font-semibold text-text hidden sm:block">
                VQMethod Researcher
              </h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-4">
              <a
                href="/dashboard"
                className="text-text-secondary hover:text-text transition-colors"
                title="Main Dashboard"
              >
                Dashboard
              </a>
              <a
                href="/studies"
                className="text-text-secondary hover:text-text transition-colors"
                title="Manage Studies"
              >
                Studies
              </a>
              <a
                href="/analytics"
                className="text-text-secondary hover:text-text transition-colors"
                title="Platform Metrics & Performance"
              >
                Analytics
              </a>
              <a
                href="/analysis"
                className="text-text-secondary hover:text-text transition-colors"
                title="Research Analysis Tools & Q-Methodology"
              >
                Analysis
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
