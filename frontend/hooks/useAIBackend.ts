/**
 * React Hooks for AI Backend Integration
 * 
 * Custom hooks to interact with the backend AI services
 * with proper error handling, loading states, and caching
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { aiBackendService, GridRecommendation, GeneratedQuestion, BiasAnalysis } from '../lib/services/ai-backend.service';

// Generic AI Hook with loading and error states
function useAIRequest<T, P>(
  serviceMethod: (params: P) => Promise<T>
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const execute = useCallback(async (params: P) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await serviceMethod(params);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      console.error('AI request failed:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [serviceMethod]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return { data, loading, error, execute, reset };
}

// Hook for generating statements
export function useGenerateStatements() {
  return useAIRequest(aiBackendService.generateStatements.bind(aiBackendService));
}

// Hook for grid recommendations
export function useGridRecommendations() {
  const [recommendations, setRecommendations] = useState<GridRecommendation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getRecommendations = useCallback(async (params: {
    studyTopic: string;
    expectedStatements: number;
    participantExperience?: 'novice' | 'intermediate' | 'expert';
    researchType?: 'exploratory' | 'confirmatory' | 'comparative';
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await aiBackendService.getGridRecommendations(params);
      if (result.success) {
        setRecommendations(result.recommendations);
        return result.recommendations;
      } else {
        throw new Error('Failed to get grid recommendations');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get recommendations';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { recommendations, loading, error, getRecommendations };
}

// Hook for questionnaire generation
export function useGenerateQuestionnaire() {
  const [questions, setQuestions] = useState<GeneratedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateQuestionnaire = useCallback(async (params: {
    studyTopic: string;
    questionCount: number;
    questionTypes: Array<'likert' | 'multipleChoice' | 'openEnded' | 'ranking' | 'demographic'>;
    targetAudience?: string;
    includeSkipLogic?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await aiBackendService.generateQuestionnaire(params);
      if (result.success) {
        setQuestions(result.questions);
        return result.questions;
      } else {
        throw new Error('Failed to generate questionnaire');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate questionnaire';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { questions, loading, error, generateQuestionnaire };
}

// Hook for bias detection
export function useBiasDetection() {
  const [analysis, setAnalysis] = useState<BiasAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectBias = useCallback(async (params: {
    statements: string[];
    analysisDepth?: 'quick' | 'comprehensive';
    suggestAlternatives?: boolean;
  }) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await aiBackendService.detectBias(params);
      if (result.success) {
        setAnalysis(result.analysis);
        return result.analysis;
      } else {
        throw new Error('Failed to detect bias');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to detect bias';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { analysis, loading, error, detectBias };
}

// Hook for participant assistance
export function useParticipantAssistance() {
  return useAIRequest(aiBackendService.getParticipantAssistance.bind(aiBackendService));
}

// Hook for response analysis
export function useResponseAnalysis() {
  return useAIRequest(aiBackendService.analyzeResponses.bind(aiBackendService));
}

// Hook for smart validation
export function useSmartValidation() {
  return useAIRequest(aiBackendService.validateSmartly.bind(aiBackendService));
}

// Hook for usage tracking
export function useAIUsage() {
  const [usage, setUsage] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const summary = await aiBackendService.getUsageSummary();
      setUsage(summary);
      return summary;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch usage';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return { usage, loading, error, refetch: fetchUsage };
}

// Hook with caching for expensive operations
export function useCachedAIRequest<T, P>(
  serviceMethod: (params: P) => Promise<T>,
  cacheKey: string,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
) {
  const cache = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async (params: P) => {
    const key = `${cacheKey}:${JSON.stringify(params)}`;
    const cached = cache.current.get(key);
    
    // Check cache
    if (cached && Date.now() - cached.timestamp < ttl) {
      setData(cached.data);
      return cached.data;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await serviceMethod(params);
      
      // Update cache
      cache.current.set(key, { data: result, timestamp: Date.now() });
      
      // Clean old cache entries
      if (cache.current.size > 10) {
        const firstKey = cache.current.keys().next().value;
        if (firstKey) {
          cache.current.delete(firstKey);
        }
      }
      
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Request failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [serviceMethod, cacheKey, ttl]);

  const clearCache = useCallback(() => {
    cache.current.clear();
  }, []);

  return { data, loading, error, execute, clearCache };
}

// Consolidated AI Backend Hook - All methods in one place
export function useAIBackend() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate Statements
  const generateStatements = useCallback(async (params: Parameters<typeof aiBackendService.generateStatements>[0]) => {
    setLoading(true);
    setError(null);
    try {
      return await aiBackendService.generateStatements(params);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate statements';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get Grid Recommendations
  const getGridRecommendations = useCallback(async (params: Parameters<typeof aiBackendService.getGridRecommendations>[0]) => {
    setLoading(true);
    setError(null);
    try {
      return await aiBackendService.getGridRecommendations(params);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get recommendations';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate Questionnaire
  const generateQuestionnaire = useCallback(async (params: Parameters<typeof aiBackendService.generateQuestionnaire>[0]) => {
    setLoading(true);
    setError(null);
    try {
      return await aiBackendService.generateQuestionnaire(params);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate questionnaire';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Detect Bias
  const detectBias = useCallback(async (params: Parameters<typeof aiBackendService.detectBias>[0]) => {
    setLoading(true);
    setError(null);
    try {
      return await aiBackendService.detectBias(params);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to detect bias';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Analyze Responses
  const analyzeResponses = useCallback(async (params: Parameters<typeof aiBackendService.analyzeResponses>[0]) => {
    setLoading(true);
    setError(null);
    try {
      return await aiBackendService.analyzeResponses(params);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to analyze responses';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Get Participant Assistance
  const getParticipantAssistance = useCallback(async (params: Parameters<typeof aiBackendService.getParticipantAssistance>[0]) => {
    setLoading(true);
    setError(null);
    try {
      return await aiBackendService.getParticipantAssistance(params);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get assistance';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Smart Validation
  const validateSmartly = useCallback(async (params: Parameters<typeof aiBackendService.validateSmartly>[0]) => {
    setLoading(true);
    setError(null);
    try {
      return await aiBackendService.validateSmartly(params);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to validate';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Methods
    generateStatements,
    getGridRecommendations,
    generateQuestionnaire,
    detectBias,
    analyzeResponses,
    getParticipantAssistance,
    validateSmartly,
    // State
    loading,
    error
  };
}

// Hook for statement variations with debouncing
export function useStatementVariations() {
  const [variations, setVariations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const generateVariations = useCallback((statement: string, count: number = 3, debounce: number = 500) => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      if (!statement.trim()) {
        setVariations([]);
        return;
      }

      setLoading(true);
      setError(null);
      
      try {
        const result = await aiBackendService.generateStatementVariations(statement, count);
        setVariations(result.variations || []);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to generate variations';
        setError(errorMessage);
        setVariations([]);
      } finally {
        setLoading(false);
      }
    }, debounce);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { variations, loading, error, generateVariations };
}