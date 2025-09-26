import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type NavigationMode = 'desktop' | 'tablet' | 'mobile';

interface NavigationState {
  currentPhase: string | null;
  secondaryTools: string[];
  navigationMode: NavigationMode;
  isOnboardingComplete: boolean;
  tourStep: number;

  setCurrentPhase: (phase: string | null) => void;
  setSecondaryTools: (tools: string[]) => void;
  setNavigationMode: (mode: NavigationMode) => void;
  completeOnboarding: () => void;
  setTourStep: (step: number) => void;
  reset: () => void;
}

export const useNavigationState = create<NavigationState>()(
  persist(
    set => ({
      currentPhase: null,
      secondaryTools: [],
      navigationMode: 'desktop',
      isOnboardingComplete: false,
      tourStep: 0,

      setCurrentPhase: phase => set({ currentPhase: phase }),
      setSecondaryTools: tools => set({ secondaryTools: tools }),
      setNavigationMode: mode => set({ navigationMode: mode }),
      completeOnboarding: () => set({ isOnboardingComplete: true }),
      setTourStep: step => set({ tourStep: step }),
      reset: () =>
        set({
          currentPhase: null,
          secondaryTools: [],
          navigationMode: 'desktop',
          isOnboardingComplete: false,
          tourStep: 0,
        }),
    }),
    {
      name: 'navigation-state',
    }
  )
);
