import type { Metadata } from 'next';
import { ResearcherNavigation } from '@/components/navigation/ResearcherNavigation';
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
    <div className="min-h-screen bg-system-background">
      <ResearcherNavigation />

      <main className="max-w-7xl mx-auto px-6 py-8">{children}</main>
    </div>
  );
}
