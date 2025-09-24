'use client';

import React, { useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Save, HelpCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuestionnaireBuilderPro } from '@/components/questionnaire/QuestionnaireBuilderPro';
import { toast } from 'sonner';

export default function QuestionnaireBuilderProPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const studyId = searchParams.get('studyId');
  const type = searchParams.get('type') || 'pre-screening';

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = useCallback(
    async (data: any) => {
      setIsSaving(true);
      try {
        // Save questionnaire data
        console.log('Saving questionnaire:', data);

        toast.success('Questionnaire saved successfully');

        // Navigate back to study creation
        if (studyId) {
          router.push(`/studies/${studyId}/edit#questionnaires`);
        }
      } catch (error) {
        toast.error('Failed to save questionnaire');
      } finally {
        setIsSaving(false);
      }
    },
    [studyId, router]
  );

  const handleCancel = useCallback(() => {
    if (studyId) {
      router.push(`/studies/${studyId}/edit#questionnaires`);
    } else {
      router.push('/studies');
    }
  }, [studyId, router]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-full px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                className="gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>

              <div className="flex flex-col">
                <h1 className="text-xl font-semibold text-gray-900">
                  Professional Questionnaire Builder
                </h1>
                <p className="text-sm text-gray-500">
                  {type === 'pre-screening' ? 'Pre-Screening' : 'Post-Survey'}{' '}
                  Questionnaire
                  {studyId && ` • Study ID: ${studyId}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="gap-2">
                <HelpCircle className="w-4 h-4" />
                Help
              </Button>

              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="w-4 h-4" />
                Settings
              </Button>

              <Button
                variant="default"
                size="sm"
                onClick={() => handleSave({})}
                disabled={isSaving}
                className="gap-2"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-[calc(100vh-73px)]">
        <QuestionnaireBuilderPro
          {...(studyId ? { studyId } : {})}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </main>
    </div>
  );
}
