/**
 * useParticipantAI Hook
 * Phase 6.86 Day 6 - React hook for Participant AI features
 */

import { useState, useCallback, useEffect } from 'react';
import { ParticipantAssistantService } from '@/lib/ai/participant-assistant';
import { AIService } from '@/lib/services/ai.service';
import {
  ParticipantStage,
  ParticipantContext,
  ParticipantGuidance,
  PreScreeningOptimization,
  PreSortingGuidance,
  AdaptiveHelp,
  PostSurveyAnalysis,
  SentimentAnalysis
} from '@/lib/types/ai-enhanced.types';

interface UseParticipantAIReturn {
  // Pre-screening
  optimizePreScreening: (
    responses: Record<string, any>,
    questions: any[]
  ) => Promise<PreScreeningOptimization | null>;
  
  // Pre-sorting
  getPreSortingGuidance: (
    statements: string[],
    profile: any
  ) => Promise<PreSortingGuidance | null>;
  
  // Adaptive help
  getAdaptiveHelp: (
    stage: ParticipantStage,
    context: ParticipantContext,
    action?: string
  ) => Promise<AdaptiveHelp | null>;
  
  // Q-sorting
  getQSortingSuggestions: (
    placements: Record<string, string>,
    timeSpent: number,
    changes: number
  ) => Promise<ParticipantGuidance | null>;
  
  // Post-survey
  analyzePostSurvey: (
    responses: Record<string, any>,
    qSortData: any
  ) => Promise<PostSurveyAnalysis | null>;
  
  // Sentiment
  analyzeSentiment: (text: string) => Promise<SentimentAnalysis | null>;
  
  // State
  loading: boolean;
  error: Error | null;
  lastHelp: AdaptiveHelp | null;
  guidance: ParticipantGuidance | null;
}

export function useParticipantAI(): UseParticipantAIReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastHelp, setLastHelp] = useState<AdaptiveHelp | null>(null);
  const [guidance, setGuidance] = useState<ParticipantGuidance | null>(null);
  
  // Initialize services
  const [service, setService] = useState<ParticipantAssistantService | null>(null);

  useEffect(() => {
    const aiService = AIService.getInstance();
    const participantService = new ParticipantAssistantService(aiService);
    setService(participantService);
  }, []);

  /**
   * Optimize pre-screening questions
   */
  const optimizePreScreening = useCallback(async (
    responses: Record<string, any>,
    questions: any[]
  ): Promise<PreScreeningOptimization | null> => {
    if (!service) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const optimization = await service.optimizePreScreening(responses, questions);
      return optimization;
    } catch (err) {
      console.error('Pre-screening optimization failed:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  /**
   * Get pre-sorting guidance
   */
  const getPreSortingGuidance = useCallback(async (
    statements: string[],
    profile: any
  ): Promise<PreSortingGuidance | null> => {
    if (!service) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const guidance = await service.generatePreSortingGuidance(statements, profile);
      return guidance;
    } catch (err) {
      console.error('Pre-sorting guidance failed:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  /**
   * Get adaptive help based on context
   */
  const getAdaptiveHelp = useCallback(async (
    stage: ParticipantStage,
    context: ParticipantContext,
    action?: string
  ): Promise<AdaptiveHelp | null> => {
    if (!service) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const help = await service.getAdaptiveHelp(stage, context, action);
      setLastHelp(help);
      return help;
    } catch (err) {
      console.error('Adaptive help failed:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  /**
   * Get Q-sorting suggestions
   */
  const getQSortingSuggestions = useCallback(async (
    placements: Record<string, string>,
    timeSpent: number,
    changes: number
  ): Promise<ParticipantGuidance | null> => {
    if (!service) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const suggestions = await service.getQSortingSuggestions(
        placements,
        timeSpent,
        changes
      );
      setGuidance(suggestions);
      return suggestions;
    } catch (err) {
      console.error('Q-sorting suggestions failed:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  /**
   * Analyze post-survey responses
   */
  const analyzePostSurvey = useCallback(async (
    responses: Record<string, any>,
    qSortData: any
  ): Promise<PostSurveyAnalysis | null> => {
    if (!service) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const analysis = await service.analyzePostSurveyResponses(
        responses,
        qSortData
      );
      return analysis;
    } catch (err) {
      console.error('Post-survey analysis failed:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  /**
   * Analyze sentiment of text
   */
  const analyzeSentiment = useCallback(async (
    text: string
  ): Promise<SentimentAnalysis | null> => {
    if (!service || !text.trim()) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const sentiment = await service.analyzeSentiment(text);
      return sentiment;
    } catch (err) {
      console.error('Sentiment analysis failed:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  return {
    optimizePreScreening,
    getPreSortingGuidance,
    getAdaptiveHelp,
    getQSortingSuggestions,
    analyzePostSurvey,
    analyzeSentiment,
    loading,
    error,
    lastHelp,
    guidance
  };
}

export default useParticipantAI;