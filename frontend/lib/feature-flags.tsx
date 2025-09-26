import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Feature flag definitions
export const FEATURE_FLAGS = {
  // Phase 8.5 Navigation Features
  NEW_NAVIGATION_SYSTEM: 'new_navigation_system',
  SWIPE_NAVIGATION: 'swipe_navigation',
  MOBILE_BOTTOM_TABS: 'mobile_bottom_tabs',
  TABLET_SIDEBAR: 'tablet_sidebar',
  COMMAND_PALETTE: 'command_palette',

  // Performance Features
  PERFORMANCE_DASHBOARD: 'performance_dashboard',
  REAL_TIME_METRICS: 'real_time_metrics',
  WEB_VITALS_TRACKING: 'web_vitals_tracking',

  // AI Features
  AI_NAVIGATION_ASSISTANT: 'ai_navigation_assistant',
  AI_PERFORMANCE_RECOMMENDATIONS: 'ai_performance_recommendations',
  AI_STATEMENT_GENERATION: 'ai_statement_generation',

  // Research Features
  KNOWLEDGE_GRAPH: 'knowledge_graph',
  PREDICTIVE_GAPS: 'predictive_gaps',
  SELF_EVOLVING_STATEMENTS: 'self_evolving_statements',
  EXPLAINABLE_AI: 'explainable_ai',

  // Experimental Features
  REAL_TIME_COLLABORATION: 'real_time_collaboration',
  VOICE_NAVIGATION: 'voice_navigation',
  AR_VISUALIZATION: 'ar_visualization',
} as const;

export type FeatureFlag = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

interface FeatureFlagConfig {
  enabled: boolean;
  rolloutPercentage?: number;
  userGroups?: string[];
  startDate?: string;
  endDate?: string;
  metadata?: Record<string, any>;
}

interface FeatureFlagsState {
  flags: Record<FeatureFlag, FeatureFlagConfig>;
  userGroup: string;
  userId: string;
  overrides: Record<FeatureFlag, boolean>;

  // Actions
  isEnabled: (flag: FeatureFlag) => boolean;
  setFlag: (flag: FeatureFlag, config: Partial<FeatureFlagConfig>) => void;
  setUserGroup: (group: string) => void;
  setOverride: (flag: FeatureFlag, enabled: boolean) => void;
  clearOverride: (flag: FeatureFlag) => void;
  clearAllOverrides: () => void;
  resetToDefaults: () => void;
}

// Default feature flag configurations
const DEFAULT_FLAGS: Record<FeatureFlag, FeatureFlagConfig> = {
  // Navigation - Phase 8.5 features
  [FEATURE_FLAGS.NEW_NAVIGATION_SYSTEM]: {
    enabled: true,
    rolloutPercentage: 100,
    metadata: { phase: '8.5', status: 'stable' },
  },
  [FEATURE_FLAGS.SWIPE_NAVIGATION]: {
    enabled: true,
    rolloutPercentage: 100,
    metadata: { phase: '8.5', day: 7 },
  },
  [FEATURE_FLAGS.MOBILE_BOTTOM_TABS]: {
    enabled: true,
    rolloutPercentage: 100,
    metadata: { phase: '8.5', day: 7 },
  },
  [FEATURE_FLAGS.TABLET_SIDEBAR]: {
    enabled: true,
    rolloutPercentage: 100,
    metadata: { phase: '8.5', day: 7 },
  },
  [FEATURE_FLAGS.COMMAND_PALETTE]: {
    enabled: true,
    rolloutPercentage: 100,
    metadata: { phase: '8.5', day: 6 },
  },

  // Performance - Phase 8.5 Day 8
  [FEATURE_FLAGS.PERFORMANCE_DASHBOARD]: {
    enabled: true,
    rolloutPercentage: 100,
    metadata: { phase: '8.5', day: 8 },
  },
  [FEATURE_FLAGS.REAL_TIME_METRICS]: {
    enabled: true,
    rolloutPercentage: 50,
    metadata: { phase: '8.5', day: 8, status: 'beta' },
  },
  [FEATURE_FLAGS.WEB_VITALS_TRACKING]: {
    enabled: true,
    rolloutPercentage: 100,
    metadata: { phase: '8.5', day: 8 },
  },

  // AI Features - Various phases
  [FEATURE_FLAGS.AI_NAVIGATION_ASSISTANT]: {
    enabled: false,
    rolloutPercentage: 10,
    userGroups: ['beta', 'internal'],
    metadata: { phase: '8.5', day: 8, status: 'experimental' },
  },
  [FEATURE_FLAGS.AI_PERFORMANCE_RECOMMENDATIONS]: {
    enabled: true,
    rolloutPercentage: 75,
    metadata: { phase: '8.5', day: 8 },
  },
  [FEATURE_FLAGS.AI_STATEMENT_GENERATION]: {
    enabled: true,
    rolloutPercentage: 100,
    metadata: { phase: '6.8', status: 'stable' },
  },

  // Research Features - Phase 9-11
  [FEATURE_FLAGS.KNOWLEDGE_GRAPH]: {
    enabled: false,
    rolloutPercentage: 0,
    metadata: { phase: '9', status: 'planned' },
  },
  [FEATURE_FLAGS.PREDICTIVE_GAPS]: {
    enabled: false,
    rolloutPercentage: 0,
    metadata: { phase: '9', status: 'planned' },
  },
  [FEATURE_FLAGS.SELF_EVOLVING_STATEMENTS]: {
    enabled: false,
    rolloutPercentage: 0,
    metadata: { phase: '10', status: 'planned' },
  },
  [FEATURE_FLAGS.EXPLAINABLE_AI]: {
    enabled: false,
    rolloutPercentage: 0,
    metadata: { phase: '10', status: 'planned' },
  },

  // Experimental Features
  [FEATURE_FLAGS.REAL_TIME_COLLABORATION]: {
    enabled: false,
    rolloutPercentage: 0,
    userGroups: ['internal'],
    metadata: { status: 'experimental' },
  },
  [FEATURE_FLAGS.VOICE_NAVIGATION]: {
    enabled: false,
    rolloutPercentage: 0,
    metadata: { status: 'experimental' },
  },
  [FEATURE_FLAGS.AR_VISUALIZATION]: {
    enabled: false,
    rolloutPercentage: 0,
    metadata: { status: 'concept' },
  },
};

// Hash function for consistent rollout
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

// Create the feature flags store
export const useFeatureFlags = create<FeatureFlagsState>()(
  persist(
    (set, get) => ({
      flags: DEFAULT_FLAGS,
      userGroup: 'default',
      userId:
        typeof window !== 'undefined'
          ? localStorage.getItem('userId') ||
            Math.random().toString(36).substring(7)
          : 'server',
      overrides: {},

      isEnabled: (flag: FeatureFlag): boolean => {
        const state = get();

        // Check for manual override first
        if (flag in state.overrides) {
          return state.overrides[flag];
        }

        const config = state.flags[flag];
        if (!config || !config.enabled) {
          return false;
        }

        // Check date constraints
        if (config.startDate) {
          const start = new Date(config.startDate);
          if (new Date() < start) return false;
        }

        if (config.endDate) {
          const end = new Date(config.endDate);
          if (new Date() > end) return false;
        }

        // Check user group restrictions
        if (config.userGroups && config.userGroups.length > 0) {
          if (!config.userGroups.includes(state.userGroup)) {
            return false;
          }
        }

        // Check rollout percentage
        if (
          config.rolloutPercentage !== undefined &&
          config.rolloutPercentage < 100
        ) {
          const hash = hashString(`${flag}-${state.userId}`);
          const bucket = hash % 100;
          return bucket < config.rolloutPercentage;
        }

        return true;
      },

      setFlag: (flag: FeatureFlag, config: Partial<FeatureFlagConfig>) => {
        set(state => ({
          flags: {
            ...state.flags,
            [flag]: {
              ...state.flags[flag],
              ...config,
            },
          },
        }));
      },

      setUserGroup: (group: string) => {
        set({ userGroup: group });
      },

      setOverride: (flag: FeatureFlag, enabled: boolean) => {
        set(state => ({
          overrides: {
            ...state.overrides,
            [flag]: enabled,
          },
        }));
      },

      clearOverride: (flag: FeatureFlag) => {
        set(state => {
          const { [flag]: _, ...rest } = state.overrides;
          return { overrides: rest };
        });
      },

      clearAllOverrides: () => {
        set({ overrides: {} });
      },

      resetToDefaults: () => {
        set({
          flags: DEFAULT_FLAGS,
          overrides: {},
          userGroup: 'default',
        });
      },
    }),
    {
      name: 'feature-flags-storage',
      partialize: state => ({
        overrides: state.overrides,
        userGroup: state.userGroup,
        userId: state.userId,
      }),
    }
  )
);

// React hook for checking feature flags
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const isEnabled = useFeatureFlags(state => state.isEnabled);
  return isEnabled(flag);
}

// React hook for multiple flags
export function useMultipleFlags(
  flags: FeatureFlag[]
): Record<FeatureFlag, boolean> {
  const isEnabled = useFeatureFlags(state => state.isEnabled);
  return flags.reduce(
    (acc, flag) => {
      acc[flag] = isEnabled(flag);
      return acc;
    },
    {} as Record<FeatureFlag, boolean>
  );
}

// Utility function for server-side flag checking
export function isFeatureEnabled(flag: FeatureFlag, userId?: string): boolean {
  const config = DEFAULT_FLAGS[flag];
  if (!config || !config.enabled) {
    return false;
  }

  // Simple server-side check without persistence
  if (
    config.rolloutPercentage !== undefined &&
    config.rolloutPercentage < 100 &&
    userId
  ) {
    const hash = hashString(`${flag}-${userId}`);
    const bucket = hash % 100;
    return bucket < config.rolloutPercentage;
  }

  return true;
}

// Development tool component for managing feature flags
export function FeatureFlagsDebugPanel() {
  const {
    flags,
    overrides,
    isEnabled,
    setOverride,
    clearOverride,
    clearAllOverrides,
    resetToDefaults,
  } = useFeatureFlags();

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-background border rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold">Feature Flags Debug</h3>
        <div className="space-x-2">
          <button
            onClick={clearAllOverrides}
            className="text-xs px-2 py-1 bg-secondary rounded"
          >
            Clear Overrides
          </button>
          <button
            onClick={resetToDefaults}
            className="text-xs px-2 py-1 bg-secondary rounded"
          >
            Reset
          </button>
        </div>
      </div>
      <div className="space-y-2">
        {Object.entries(FEATURE_FLAGS).map(([key, flag]) => {
          const config = flags[flag];
          const enabled = isEnabled(flag);
          const hasOverride = flag in overrides;

          return (
            <div
              key={flag}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex-1">
                <span className={hasOverride ? 'font-bold' : ''}>{key}</span>
                {config.rolloutPercentage !== undefined &&
                  config.rolloutPercentage < 100 && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      ({config.rolloutPercentage}%)
                    </span>
                  )}
              </div>
              <div className="flex items-center gap-2">
                <span className={enabled ? 'text-green-500' : 'text-red-500'}>
                  {enabled ? '✓' : '✗'}
                </span>
                <button
                  onClick={() =>
                    hasOverride
                      ? clearOverride(flag)
                      : setOverride(flag, !enabled)
                  }
                  className={`text-xs px-2 py-1 rounded ${hasOverride ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}
                >
                  {hasOverride ? 'Clear' : 'Override'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
