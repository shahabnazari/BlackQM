import type { Metadata } from 'next';
import { ResearcherNavigation } from '@/components/navigation/ResearcherNavigation';
import { PrimaryToolbar } from '@/components/navigation/PrimaryToolbar';
import { NavigationProvider } from '@/hooks/useNavigationState';
import KeyboardShortcutsHelp from '@/components/navigation/KeyboardShortcutsHelp';
import '../globals.css';

export const metadata: Metadata = {
  title: 'VQMethod - Researcher Dashboard',
  description: 'Researcher Interface for Q-Methodology Studies',
};

export default function ResearcherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NavigationProvider>
      <div className="min-h-screen bg-system-background">
        {/* Phase 8.5: Research Lifecycle Navigation */}
        <PrimaryToolbar />
        
        {/* Legacy navigation - will be phased out */}
        <ResearcherNavigation />
        <KeyboardShortcutsHelp />

        <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
      </div>
    </NavigationProvider>
  );
}
