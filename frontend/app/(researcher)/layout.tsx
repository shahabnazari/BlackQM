'use client';

import { usePathname } from 'next/navigation';
import { PrimaryToolbar } from '@/components/navigation/PrimaryToolbar';
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
        {/* Only show toolbar for non-dashboard, non-study pages */}
        {!isDashboard && !isStudyContext && <PrimaryToolbar />}

        <KeyboardShortcutsHelp />

        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </div>
    </NavigationProvider>
  );
}
