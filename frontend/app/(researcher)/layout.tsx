'use client';

import { usePathname } from 'next/navigation';
import { PrimaryToolbar } from '@/components/navigation/PrimaryToolbar';
import { UserProfileMenu } from '@/components/navigation/UserProfileMenu';
import { NavigationProvider } from '@/hooks/useNavigationState';
import KeyboardShortcutsHelp from '@/components/navigation/KeyboardShortcutsHelp';
import '../globals.css';

export default function ResearcherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Only show PrimaryToolbar when in study-specific context
  // The study-specific layout will handle its own toolbar
  const isStudyContext =
    pathname?.includes('/studies/') && pathname !== '/studies';
  const isDashboard = pathname === '/dashboard';

  return (
    <NavigationProvider>
      <div className="min-h-screen bg-system-background">
        {/* Dashboard Header with Profile Menu */}
        {isDashboard && (
          <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">VQ</span>
                </div>
                <h1 className="text-xl font-semibold text-gray-900">
                  VQMethod Dashboard
                </h1>
              </div>
              <UserProfileMenu />
            </div>
          </header>
        )}

        {/* Only show toolbar for non-dashboard, non-study pages */}
        {!isDashboard && !isStudyContext && <PrimaryToolbar />}

        <KeyboardShortcutsHelp />

        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </div>
    </NavigationProvider>
  );
}
