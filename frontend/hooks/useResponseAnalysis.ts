/**
 * useResponseAnalysis Hook
 * Phase 6.86 Day 7 - React hook for Response Analysis AI features
 */

import { useState, useCallback, useEffect } from 'react';
import { ResponseAnalyzerService } from '@/lib/ai/response-analyzer';
import { AIService } from '@/lib/services/ai.service';
import {
  ResponseAnalysis,
  Pattern,
  QualityMetrics,
  Anomaly,
  Insight,
  ParticipantResponse,
  CrossParticipantAnalysis
} from '@/lib/types/ai-enhanced.types';

interface UseResponseAnalysisReturn {
  // Pattern detection
  detectPatterns: (
    responses: ParticipantResponse[],
    studyContext?: any
  ) => Promise<Pattern[] | null>;
  
  // Quality assessment
  calculateQuality: (
    response: ParticipantResponse,
    requirements?: any
  ) => Promise<QualityMetrics | null>;
  
  // Anomaly detection
  detectAnomalies: (
    response: ParticipantResponse,
    allResponses: ParticipantResponse[]
  ) => Promise<Anomaly[] | null>;
  
  // Insights
  extractInsights: (
    responses: ParticipantResponse[],
    studyContext?: any
  ) => Promise<Insight[] | null>;
  
  // Cross-participant analysis
  analyzeCrossParticipant: (
    responses: ParticipantResponse[],
    groupBy?: string
  ) => Promise<CrossParticipantAnalysis | null>;
  
  // Comprehensive analysis
  generateFullAnalysis: (
    responses: ParticipantResponse[],
    studyContext?: any
  ) => Promise<ResponseAnalysis | null>;
  
  // State
  loading: boolean;
  error: Error | null;
  currentAnalysis: ResponseAnalysis | null;
  patterns: Pattern[] | null;
  insights: Insight[] | null;
  anomalies: Anomaly[] | null;
}

export function useResponseAnalysis(): UseResponseAnalysisReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [currentAnalysis, setCurrentAnalysis] = useState<ResponseAnalysis | null>(null);
  const [patterns, setPatterns] = useState<Pattern[] | null>(null);
  const [insights, setInsights] = useState<Insight[] | null>(null);
  const [anomalies, setAnomalies] = useState<Anomaly[] | null>(null);
  
  // Initialize service
  const [service, setService] = useState<ResponseAnalyzerService | null>(null);

  useEffect(() => {
    const aiService = AIService.getInstance();
    const analyzerService = new ResponseAnalyzerService(aiService);
    setService(analyzerService);
  }, []);

  /**
   * Detect response patterns
   */
  const detectPatterns = useCallback(async (
    responses: ParticipantResponse[],
    studyContext?: any
  ): Promise<Pattern[] | null> => {
    if (!service || !responses.length) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const detectedPatterns = await service.detectResponsePatterns(
        responses,
        studyContext || {}
      );
      setPatterns(detectedPatterns);
      return detectedPatterns;
    } catch (err) {
      console.error('Pattern detection failed:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  /**
   * Calculate response quality
   */
  const calculateQuality = useCallback(async (
    response: ParticipantResponse,
    requirements?: any
  ): Promise<QualityMetrics | null> => {
    if (!service) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const quality = await service.calculateQualityScore(
        response,
        requirements || {}
      );
      return quality;
    } catch (err) {
      console.error('Quality calculation failed:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  /**
   * Detect anomalies in response
   */
  const detectAnomalies = useCallback(async (
    response: ParticipantResponse,
    allResponses: ParticipantResponse[]
  ): Promise<Anomaly[] | null> => {
    if (!service) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const detectedAnomalies = await service.detectAnomalies(
        response,
        allResponses
      );
      setAnomalies(detectedAnomalies);
      return detectedAnomalies;
    } catch (err) {
      console.error('Anomaly detection failed:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  /**
   * Extract insights from responses
   */
  const extractInsights = useCallback(async (
    responses: ParticipantResponse[],
    studyContext?: any
  ): Promise<Insight[] | null> => {
    if (!service || !responses.length) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const extractedInsights = await service.extractInsights(
        responses,
        studyContext || {}
      );
      setInsights(extractedInsights);
      return extractedInsights;
    } catch (err) {
      console.error('Insight extraction failed:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  /**
   * Analyze across participants
   */
  const analyzeCrossParticipant = useCallback(async (
    responses: ParticipantResponse[],
    groupBy?: string
  ): Promise<CrossParticipantAnalysis | null> => {
    if (!service || !responses.length) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const crossAnalysis = await service.analyzeCrossParticipant(
        responses,
        groupBy
      );
      return crossAnalysis;
    } catch (err) {
      console.error('Cross-participant analysis failed:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  /**
   * Generate comprehensive analysis
   */
  const generateFullAnalysis = useCallback(async (
    responses: ParticipantResponse[],
    studyContext?: any
  ): Promise<ResponseAnalysis | null> => {
    if (!service || !responses.length) return null;
    
    try {
      setLoading(true);
      setError(null);
      
      const analysis = await service.generateComprehensiveAnalysis(
        responses,
        studyContext || {}
      );
      
      setCurrentAnalysis(analysis);
      setPatterns(analysis.patterns);
      setInsights(analysis.insights);
      setAnomalies(analysis.anomalies);
      
      return analysis;
    } catch (err) {
      console.error('Comprehensive analysis failed:', err);
      setError(err as Error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [service]);

  return {
    detectPatterns,
    calculateQuality,
    detectAnomalies,
    extractInsights,
    analyzeCrossParticipant,
    generateFullAnalysis,
    loading,
    error,
    currentAnalysis,
    patterns,
    insights,
    anomalies
  };
}

export default useResponseAnalysis;