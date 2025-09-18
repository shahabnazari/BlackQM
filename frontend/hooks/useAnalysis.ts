import { useState, useEffect, useCallback } from 'react';
import {
  analysisService,
  Analysis,
  CreateAnalysisDto,
  AnalysisResults,
} from '@/lib/api/services';
import { toast } from 'sonner';

interface UseAnalysisOptions {
  studyId?: string;
  autoFetch?: boolean;
}

export function useAnalysis(options: UseAnalysisOptions = {}) {
  const { studyId, autoFetch = true } = options;
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<Analysis | null>(null);
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all analyses
  const fetchAnalyses = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await analysisService.getAnalyses(
        studyId ? { studyId } : undefined
      );
      setAnalyses(response.data || []);
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch analyses';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [studyId]);

  // Create new analysis
  const createAnalysis = useCallback(async (data: CreateAnalysisDto) => {
    setLoading(true);
    setError(null);

    try {
      const analysis = await analysisService.createAnalysis(data);
      setAnalyses(prev => [...prev, analysis]);
      setCurrentAnalysis(analysis);
      toast.success('Analysis created successfully');
      return analysis;
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Failed to create analysis';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Run analysis
  const runAnalysis = useCallback(
    async (analysisId: string) => {
      setLoading(true);
      setError(null);

      try {
        const analysis = await analysisService.runAnalysis(analysisId);

        // Update the analysis in the list
        setAnalyses(prev =>
          prev.map((a: any) => (a.id === analysisId ? analysis : a))
        );

        if (currentAnalysis?.id === analysisId) {
          setCurrentAnalysis(analysis);
        }

        // Subscribe to real-time updates
        const unsubscribe = analysisService.subscribeToUpdates(
          analysisId,
          update => {
            if (update.status === 'completed') {
              toast.success('Analysis completed successfully');
              fetchResults(analysisId);
            } else if (update.status === 'failed') {
              toast.error('Analysis failed: ' + update.error);
            }
          }
        );

        return { analysis, unsubscribe };
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to run analysis';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentAnalysis]
  );

  // Fetch analysis results
  const fetchResults = useCallback(async (analysisId: string) => {
    setLoading(true);
    setError(null);

    try {
      const analysisResults = await analysisService.getResults(analysisId);
      setResults(analysisResults);
      return analysisResults;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Failed to fetch results';
      setError(message);
      toast.error(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Delete analysis
  const deleteAnalysis = useCallback(
    async (analysisId: string) => {
      setLoading(true);
      setError(null);

      try {
        await analysisService.deleteAnalysis(analysisId);
        setAnalyses(prev => prev.filter((a: any) => a.id !== analysisId));

        if (currentAnalysis?.id === analysisId) {
          setCurrentAnalysis(null);
          setResults(null);
        }

        toast.success('Analysis deleted successfully');
      } catch (err: any) {
        const message =
          err.response?.data?.message || 'Failed to delete analysis';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentAnalysis]
  );

  // Export results
  const exportResults = useCallback(
    async (analysisId: string, format: 'pdf' | 'csv' | 'excel' | 'spss') => {
      setLoading(true);
      setError(null);

      try {
        const blob = await analysisService.exportResults(analysisId, format);

        // Create download link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analysis-${analysisId}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast.success(`Results exported as ${format.toUpperCase()}`);
      } catch (err: any) {
        const message =
          err.response?.data?.message || 'Failed to export results';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Generate interpretation
  const generateInterpretation = useCallback(
    async (analysisId: string) => {
      setLoading(true);
      setError(null);

      try {
        const interpretation =
          await analysisService.generateInterpretation(analysisId);

        // Update the analysis with the interpretation
        if (currentAnalysis?.id === analysisId && results) {
          setResults({
            ...results,
            interpretation,
          });
        }

        toast.success('Interpretation generated successfully');
        return interpretation;
      } catch (err: any) {
        const message =
          err.response?.data?.message || 'Failed to generate interpretation';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [currentAnalysis, results]
  );

  // Auto-fetch on mount if requested
  useEffect(() => {
    if (autoFetch) {
      fetchAnalyses();
    }
  }, [autoFetch, fetchAnalyses]);

  return {
    analyses,
    currentAnalysis,
    results,
    loading,
    error,
    fetchAnalyses,
    createAnalysis,
    runAnalysis,
    fetchResults,
    deleteAnalysis,
    exportResults,
    generateInterpretation,
    setCurrentAnalysis,
  };
}

// Hook for factor analysis specific operations
export function useFactorAnalysis(analysisId: string) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extractFactors = useCallback(
    async (numberOfFactors: number) => {
      setLoading(true);
      setError(null);

      try {
        const factors = await analysisService.extractFactors(
          analysisId,
          numberOfFactors
        );
        toast.success(`Extracted ${numberOfFactors} factors`);
        return factors;
      } catch (err: any) {
        const message =
          err.response?.data?.message || 'Failed to extract factors';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [analysisId]
  );

  const rotateFactors = useCallback(
    async (method: string) => {
      setLoading(true);
      setError(null);

      try {
        const factors = await analysisService.rotateFactors(analysisId, method);
        toast.success(`Applied ${method} rotation`);
        return factors;
      } catch (err: any) {
        const message =
          err.response?.data?.message || 'Failed to rotate factors';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [analysisId]
  );

  const labelFactor = useCallback(
    async (factorId: string, label: string) => {
      setLoading(true);
      setError(null);

      try {
        await analysisService.labelFactor(analysisId, factorId, label);
        toast.success('Factor labeled successfully');
      } catch (err: any) {
        const message = err.response?.data?.message || 'Failed to label factor';
        setError(message);
        toast.error(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [analysisId]
  );

  return {
    loading,
    error,
    extractFactors,
    rotateFactors,
    labelFactor,
  };
}
