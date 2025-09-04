import type { Metadata } from 'next';
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
      <header className="border-b border-quaternary-fill bg-tertiary-background">
        <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-system-blue to-system-green rounded-2xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">VQ</span>
            </div>
            <h1 className="text-xl font-semibold text-label">VQMethod Researcher</h1>
          </div>
          <div className="flex items-center gap-4">
            <a href="/researcher/dashboard" className="text-secondary-label hover:text-label">Dashboard</a>
            <a href="/researcher/studies" className="text-secondary-label hover:text-label">Studies</a>
            <a href="/researcher/analytics" className="text-secondary-label hover:text-label">Analytics</a>
          </div>
        </nav>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
