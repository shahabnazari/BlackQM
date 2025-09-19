import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { api } from '@/lib/api';

/**
 * Study Hub Store - Phase 7 Day 1 Implementation
 * 
 * World-class state management for the Unified Analysis Hub
 * Aligned with Phase 8.5 Research Lifecycle Navigation
 * 
 * @features
 * - Single data load strategy (load once, use everywhere)
 * - Intelligent caching with persistence
 * - Optimistic updates
 * - Real-time collaboration ready
 * - Performance optimized
 */

export type HubSection = 
  | 'overview' 
  | 'data' 
  | 'analyze' 
  | 'visualize' 
  | 'insights' 
  | 'report' 
  | 'export';

export interface StudyMetadata {
  id: string;
  title: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  participantCount: number;
  completionRate: number;
  status: 'draft' | 'active' | 'completed' | 'archived';
}

export interface QSortResponse {
  id: string;
  participantId: string;
  rankings: Record<string, number>;
  completedAt: Date;
  duration: number;
}

export interface Statement {
  id: string;
  text: string;
  category?: string;
}

export interface FactorAnalysisResult {
  factors: any[];
  eigenvalues: number[];
  variance: number[];
  loadings: number[][];
  rotation?: any;
}

export interface StudyData {
  study: StudyMetadata;
  responses: QSortResponse[];
  statements: Statement[];
}

export interface AnalysisResults {
  correlationMatrix?: number[][];
  factorAnalysis?: FactorAnalysisResult;
  distinguishingStatements?: Statement[];
  consensusStatements?: Statement[];
}

export interface StudyHubState {
  // Navigation
  currentSection: HubSection;
  sidebarCollapsed: boolean;

  // Data State
  studyData: StudyData | null;
  analysisResults: AnalysisResults | null;
  visualizations: any[];
  aiInsights: any | null;
  reportDraft: any | null;

  // Loading States
  isLoading: boolean;
  isAnalyzing: boolean;
  isSaving: boolean;

  // Error State
  error: Error | null;

  // Cache Management
  lastFetch: Date | null;
  cacheValid: boolean;

  // Actions
  setSection: (section: HubSection) => void;
  toggleSidebar: () => void;
  loadStudy: (studyId: string) => Promise<void>;
  runAnalysis: (type: string) => Promise<void>;
  generateVisualization: (config: any) => Promise<void>;
  requestAIInterpretation: () => Promise<void>;
  buildReport: (sections: string[]) => Promise<void>;
  exportData: (format: string) => Promise<void>;
  clearCache: () => void;
  reset: () => void;
}

const initialState = {
  currentSection: 'overview' as HubSection,
  sidebarCollapsed: false,
  studyData: null,
  analysisResults: null,
  visualizations: [],
  aiInsights: null,
  reportDraft: null,
  isLoading: false,
  isAnalyzing: false,
  isSaving: false,
  error: null,
  lastFetch: null,
  cacheValid: false,
};

export const useStudyHub = create<StudyHubState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Navigation Actions
        setSection: (section) => 
          set({ currentSection: section }, false, 'setSection'),

        toggleSidebar: () => 
          set((state) => ({ 
            sidebarCollapsed: !state.sidebarCollapsed 
          }), false, 'toggleSidebar'),

        // Data Loading with Intelligent Caching
        loadStudy: async (studyId) => {
          const state = get();
          
          // Check cache validity (5 minutes)
          if (
            state.studyData?.study.id === studyId &&
            state.cacheValid &&
            state.lastFetch &&
            new Date().getTime() - new Date(state.lastFetch).getTime() < 300000
          ) {
            return; // Use cached data
          }

          set({ isLoading: true, error: null }, false, 'loadStudy:start');

          try {
            // Parallel data fetching for performance
            const [study, responses, statements, analysis] = await Promise.all([
              api.get(`/studies/${studyId}`),
              api.get(`/studies/${studyId}/responses`),
              api.get(`/studies/${studyId}/statements`),
              api.get(`/studies/${studyId}/analysis`).catch(() => null),
            ]);

            set({
              studyData: {
                study: study.data,
                responses: responses.data,
                statements: statements.data,
              },
              analysisResults: analysis?.data || null,
              isLoading: false,
              lastFetch: new Date(),
              cacheValid: true,
              error: null,
            }, false, 'loadStudy:success');
          } catch (error) {
            set({
              isLoading: false,
              error: error as Error,
              cacheValid: false,
            }, false, 'loadStudy:error');
          }
        },

        // Analysis Actions
        runAnalysis: async (type) => {
          const { studyData } = get();
          if (!studyData) return;

          set({ isAnalyzing: true, error: null }, false, 'runAnalysis:start');

          try {
            const result = await api.post(`/analysis/${type}`, {
              studyId: studyData.study.id,
              responses: studyData.responses,
            });

            set((state) => ({
              analysisResults: {
                ...state.analysisResults,
                [type]: result.data,
              },
              isAnalyzing: false,
            }), false, 'runAnalysis:success');
          } catch (error) {
            set({
              isAnalyzing: false,
              error: error as Error,
            }, false, 'runAnalysis:error');
          }
        },

        // Visualization Actions
        generateVisualization: async (config) => {
          const { analysisResults } = get();
          if (!analysisResults) return;

          try {
            const viz = await api.post('/visualizations/generate', {
              config,
              data: analysisResults,
            });

            set((state) => ({
              visualizations: [...state.visualizations, viz.data],
            }), false, 'generateVisualization');
          } catch (error) {
            set({ error: error as Error }, false, 'generateVisualization:error');
          }
        },

        // AI Actions
        requestAIInterpretation: async () => {
          const { studyData, analysisResults } = get();
          if (!studyData || !analysisResults) return;

          try {
            const insights = await api.post('/ai/interpret', {
              study: studyData.study,
              analysis: analysisResults,
            });

            set({ 
              aiInsights: insights.data 
            }, false, 'requestAIInterpretation');
          } catch (error) {
            set({ error: error as Error }, false, 'requestAIInterpretation:error');
          }
        },

        // Report Actions
        buildReport: async (sections) => {
          const state = get();
          
          try {
            const report = await api.post('/reports/build', {
              studyId: state.studyData?.study.id,
              sections,
              analysis: state.analysisResults,
              insights: state.aiInsights,
            });

            set({ 
              reportDraft: report.data 
            }, false, 'buildReport');
          } catch (error) {
            set({ error: error as Error }, false, 'buildReport:error');
          }
        },

        // Export Actions
        exportData: async (format) => {
          const state = get();
          
          try {
            const response = await api.post('/export', {
              studyId: state.studyData?.study.id,
              format,
              data: {
                study: state.studyData,
                analysis: state.analysisResults,
                report: state.reportDraft,
              },
            });

            // Handle download
            const blob = new Blob([response.data], { type: 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `study-export.${format}`;
            a.click();
            window.URL.revokeObjectURL(url);
          } catch (error) {
            set({ error: error as Error }, false, 'exportData:error');
          }
        },

        // Cache Management
        clearCache: () => 
          set({ 
            cacheValid: false, 
            lastFetch: null 
          }, false, 'clearCache'),

        // Reset Store
        reset: () => 
          set(initialState, false, 'reset'),
      }),
      {
        name: 'study-hub-storage',
        partialize: (state) => ({
          currentSection: state.currentSection,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      }
    ),
    {
      name: 'StudyHub',
    }
  )
);