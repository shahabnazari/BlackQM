'use client';

import { PrimaryToolbar } from '@/components/navigation/PrimaryToolbar';
import { NavigationProvider } from '@/hooks/useNavigationState';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function StudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const studyId = params.id as string;

  // Store current study ID in context/localStorage for PrimaryToolbar to use
  useEffect(() => {
    if (studyId) {
      localStorage.setItem('currentStudyId', studyId);
    }

    return () => {
      localStorage.removeItem('currentStudyId');
    };
  }, [studyId]);

  return (
    <NavigationProvider>
      <div className="min-h-screen bg-system-background">
        {/* Phase navigation toolbar - only shown in study context */}
        <PrimaryToolbar />

        <main>{children}</main>
      </div>
    </NavigationProvider>
  );
}
