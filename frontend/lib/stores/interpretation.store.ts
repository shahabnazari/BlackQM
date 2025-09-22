import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface FactorNarrative {
  factorNumber: number;
  title: string;
  mainTheme: string;
  narrative: string;
  distinguishingStatements: string[];
  consensusStatements: string[];
  confidence: number;
  participantCount: number;
}

export interface Theme {
  name: string;
  description: string;
  occurrences: number;
  quotes: string[];
  keywords: string[];
  factors: number[];
}

export interface ConsensusStatement {
  id: string;
  text: string;
  agreementLevel: number; // 0-100%
  factors: number[];
  interpretation: string;
}

export interface CrossFactorSynthesis {
  commonThemes: Theme[];
  divergentViews: {
    factor: number;
    uniquePosition: string;
    evidence: string[];
  }[];
  overarchingNarrative: string;
  recommendations: string[];
}

export interface BiasAnalysisDto {
  dimensions: {
    [key: string]: {
      level: 'low' | 'medium' | 'high';
      score: number;
      confidence?: number;
      recommendation?: string;
      findings?: string[];
      affectedAreas?: string[];
      mitigation?: string[];
    };
  };
  recommendations: string[];
  overallScore: number;
}

interface InterpretationState {
  // Data
  studyData: any | null;
  analysisResults: any | null;
  narratives: FactorNarrative[];
  themes: Theme[];
  consensusStatements: ConsensusStatement[];
  synthesis: CrossFactorSynthesis | null;
  biasAnalysis: BiasAnalysisDto | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  lastGenerated: string | null;
  
  // Actions
  loadInterpretationData: (studyId: string) => Promise<void>;
  generateNarratives: (studyId: string) => Promise<void>;
  extractThemes: (studyId: string) => Promise<void>;
  analyzeConsensus: (studyId: string) => Promise<void>;
  generateSynthesis: (studyId: string) => Promise<void>;
  updateNarrative: (factorNumber: number, narrative: Partial<FactorNarrative>) => void;
  addTheme: (theme: Theme) => void;
  removeTheme: (themeName: string) => void;
  analyzeBias: (studyId: string) => Promise<void>;
  reset: () => void;
}

/**
 * Interpretation Store - Phase 8 Day 1
 * 
 * Manages state for the interpretation workspace
 * Integrates with backend interpretation.service.ts
 */
export const useInterpretationStore = create<InterpretationState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        studyData: null,
        analysisResults: null,
        narratives: [],
        themes: [],
        consensusStatements: [],
        synthesis: null,
        biasAnalysis: null,
        isLoading: false,
        error: null,
        lastGenerated: null,

        // Load interpretation data from backend
        loadInterpretationData: async (studyId: string) => {
          set({ isLoading: true, error: null });
          
          try {
            // Fetch study data
            const studyResponse = await fetch(`/api/studies/${studyId}`);
            if (!studyResponse.ok) throw new Error('Failed to fetch study data');
            const studyData = await studyResponse.json();
            
            // Fetch analysis results
            const analysisResponse = await fetch(`/api/analysis/${studyId}/results`);
            if (!analysisResponse.ok) throw new Error('Failed to fetch analysis results');
            const analysisResults = await analysisResponse.json();
            
            // Check for existing narratives
            const narrativesResponse = await fetch(`/api/analysis/${studyId}/interpretation/narratives`);
            let narratives = [];
            if (narrativesResponse.ok) {
              const data = await narrativesResponse.json();
              narratives = data.narratives || [];
            }
            
            // Check for existing themes
            const themesResponse = await fetch(`/api/analysis/${studyId}/interpretation/themes`);
            let themes = [];
            if (themesResponse.ok) {
              const data = await themesResponse.json();
              themes = data.themes || [];
            }
            
            set({
              studyData,
              analysisResults,
              narratives,
              themes,
              isLoading: false,
              error: null,
            });
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to load interpretation data',
            });
          }
        },

        // Generate AI-powered narratives for factors
        generateNarratives: async (studyId: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch(`/api/analysis/${studyId}/interpretation/narratives`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                includeDistinguishing: true,
                includeConsensus: true,
                analysisDepth: 'comprehensive',
              }),
            });
            
            if (!response.ok) throw new Error('Failed to generate narratives');
            
            const data = await response.json();
            set({
              narratives: data.narratives,
              lastGenerated: new Date().toISOString(),
              isLoading: false,
            });
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to generate narratives',
            });
          }
        },

        // Extract themes from qualitative data
        extractThemes: async (studyId: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch(`/api/analysis/${studyId}/interpretation/themes`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                includeQuotes: true,
                minOccurrences: 2,
              }),
            });
            
            if (!response.ok) throw new Error('Failed to extract themes');
            
            const data = await response.json();
            set({
              themes: data.themes,
              isLoading: false,
            });
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to extract themes',
            });
          }
        },

        // Analyze consensus statements across factors
        analyzeConsensus: async (_studyId: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const { analysisResults } = get();
            if (!analysisResults) throw new Error('No analysis results available');
            
            // Extract consensus statements from analysis
            const consensusStatements: ConsensusStatement[] = [];
            
            // Process consensus statements from each factor
            if (analysisResults.consensus) {
              analysisResults.consensus.forEach((statement: any) => {
                consensusStatements.push({
                  id: statement.id,
                  text: statement.text,
                  agreementLevel: statement.agreementLevel || 0,
                  factors: statement.factors || [],
                  interpretation: statement.interpretation || '',
                });
              });
            }
            
            set({
              consensusStatements,
              isLoading: false,
            });
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to analyze consensus',
            });
          }
        },

        // Generate cross-factor synthesis
        generateSynthesis: async (studyId: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const { narratives, themes } = get();
            
            const response = await fetch(`/api/analysis/${studyId}/interpretation/synthesis`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                narratives,
                themes,
              }),
            });
            
            if (!response.ok) throw new Error('Failed to generate synthesis');
            
            const synthesis = await response.json();
            set({
              synthesis,
              isLoading: false,
            });
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to generate synthesis',
            });
          }
        },

        // Update a specific narrative
        updateNarrative: (factorNumber: number, updates: Partial<FactorNarrative>) => {
          set((state) => ({
            narratives: state.narratives.map((n) =>
              n.factorNumber === factorNumber ? { ...n, ...updates } : n
            ),
          }));
        },

        // Add a new theme
        addTheme: (theme: Theme) => {
          set((state) => ({
            themes: [...state.themes, theme],
          }));
        },

        // Remove a theme
        removeTheme: (themeName: string) => {
          set((state) => ({
            themes: state.themes.filter((t) => t.name !== themeName),
          }));
        },

        // Analyze bias
        analyzeBias: async (studyId: string) => {
          set({ isLoading: true, error: null });
          
          try {
            const response = await fetch(`/api/analysis/${studyId}/interpretation/bias`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                includeRecommendations: true,
                dimensions: ['cultural', 'gender', 'age', 'socioeconomic', 'geographic', 'confirmation', 'sampling', 'response']
              }),
            });
            
            if (!response.ok) throw new Error('Failed to analyze bias');
            
            const biasAnalysis = await response.json();
            set({
              biasAnalysis,
              isLoading: false,
            });
          } catch (error) {
            set({
              isLoading: false,
              error: error instanceof Error ? error.message : 'Failed to analyze bias',
            });
          }
        },

        // Reset store
        reset: () => {
          set({
            studyData: null,
            analysisResults: null,
            narratives: [],
            themes: [],
            consensusStatements: [],
            synthesis: null,
            biasAnalysis: null,
            isLoading: false,
            error: null,
            lastGenerated: null,
          });
        },
      }),
      {
        name: 'interpretation-storage',
        partialize: (state) => ({
          narratives: state.narratives,
          themes: state.themes,
          consensusStatements: state.consensusStatements,
          synthesis: state.synthesis,
          lastGenerated: state.lastGenerated,
        }),
      }
    ),
    {
      name: 'InterpretationStore',
    }
  )
);