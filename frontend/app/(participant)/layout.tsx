import type { Metadata } from 'next';
import '../globals.css';

export const metadata: Metadata = {
  title: 'VQMethod - Participant Study',
  description: 'Participate in Q-Methodology Research Studies',
};

export default function ParticipantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-system-background">
      {children}
    </div>
  );
}
