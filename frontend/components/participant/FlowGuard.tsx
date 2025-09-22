'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ParticipantFlowStage } from '@/hooks/useParticipantFlow';
import { Lock, AlertCircle } from 'lucide-react';

/**
 * World-class Flow Guard Component
 * Enforces navigation rules and stage requirements
 */

interface FlowGuardProps {
  children: React.ReactNode;
  requiredStage: ParticipantFlowStage;
  allowedStages?: ParticipantFlowStage[];
  flowState: {
    currentStage: ParticipantFlowStage;
    completedStages: ParticipantFlowStage[];
    canProceed: boolean;
  } | null;
  fallbackRoute?: string;
  showWarning?: boolean;
}

export function FlowGuard({
  children,
  requiredStage,
  allowedStages = [],
  flowState,
  fallbackRoute = '/study/welcome',
  showWarning = true
}: FlowGuardProps) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!flowState) {
      setMessage('Loading flow state...');
      return;
    }

    // Check if current stage matches required
    const isCurrentStageValid = flowState.currentStage === requiredStage;
    
    // Check if current stage is in allowed stages
    const isStageAllowed = allowedStages.length > 0 
      ? allowedStages.includes(flowState.currentStage)
      : isCurrentStageValid;

    // Check prerequisites
    const hasPrerequisites = checkPrerequisites(requiredStage, flowState.completedStages);

    if (isStageAllowed && hasPrerequisites) {
      setIsAuthorized(true);
    } else {
      setIsAuthorized(false);
      
      // Determine appropriate message
      if (!hasPrerequisites) {
        setMessage('Please complete previous steps first');
      } else if (!isCurrentStageValid) {
        setMessage('You cannot access this page at this stage');
      }

      // Redirect after delay to show message
      setTimeout(() => {
        router.push(fallbackRoute);
      }, 2000);
    }
  }, [flowState, requiredStage, allowedStages, router, fallbackRoute]);

  if (!flowState) {
    return <LoadingState />;
  }

  if (!isAuthorized) {
    return (
      <UnauthorizedAccess 
        message={message}
        showWarning={showWarning}
      />
    );
  }

  return <>{children}</>;
}

/**
 * Check if prerequisites for a stage are met
 */
function checkPrerequisites(
  stage: ParticipantFlowStage, 
  completedStages: ParticipantFlowStage[]
): boolean {
  const prerequisites: Record<ParticipantFlowStage, ParticipantFlowStage[]> = {
    [ParticipantFlowStage.NOT_STARTED]: [],
    [ParticipantFlowStage.PRE_SCREENING]: [],
    [ParticipantFlowStage.PRE_SCREENING_FAILED]: [ParticipantFlowStage.PRE_SCREENING],
    [ParticipantFlowStage.CONSENT]: [ParticipantFlowStage.PRE_SCREENING],
    [ParticipantFlowStage.INSTRUCTIONS]: [
      ParticipantFlowStage.PRE_SCREENING,
      ParticipantFlowStage.CONSENT
    ],
    [ParticipantFlowStage.Q_SORT]: [
      ParticipantFlowStage.PRE_SCREENING,
      ParticipantFlowStage.CONSENT,
      ParticipantFlowStage.INSTRUCTIONS
    ],
    [ParticipantFlowStage.POST_SURVEY]: [
      ParticipantFlowStage.PRE_SCREENING,
      ParticipantFlowStage.CONSENT,
      ParticipantFlowStage.Q_SORT
    ],
    [ParticipantFlowStage.COMPLETED]: [
      ParticipantFlowStage.PRE_SCREENING,
      ParticipantFlowStage.CONSENT,
      ParticipantFlowStage.Q_SORT,
      ParticipantFlowStage.POST_SURVEY
    ],
    [ParticipantFlowStage.ABANDONED]: []
  };

  const required = prerequisites[stage] || [];
  return required.every(prereq => completedStages.includes(prereq));
}

/**
 * Loading state component
 */
function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">Verifying access...</p>
      </div>
    </div>
  );
}

/**
 * Unauthorized access component
 */
function UnauthorizedAccess({ 
  message, 
  showWarning 
}: { 
  message: string;
  showWarning: boolean;
}) {
  if (!showWarning) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-4">
          <Lock className="w-16 h-16 text-yellow-500 mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Access Restricted
        </h2>
        <p className="text-gray-600 mb-6">
          {message}
        </p>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
            <p className="text-sm text-yellow-800">
              Redirecting you to the correct page...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}