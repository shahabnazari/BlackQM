'use client';

import { useState, useCallback, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

export interface QAnalysisState {
  dataUploaded: boolean;
  factorsExtracted: boolean;
  factorsRotated: boolean;
  analysisComplete: boolean;
  progress: number;
  extractionResults?: ExtractionResults;
  rotationResults?: RotationResults;
  factors?: Factor[];
  rotatedFactors?: Factor[];
  factorLoadings?: FactorLoadings;
  statements?: Statement[];
}

export interface ExtractionResults {
  eigenvalues: number[];
  variance: number[];
  cumulativeVariance: number[];
  screeData: { factor: number; eigenvalue: number }[];
  numberOfFactors: number;
  extractionMethod: string;
}

export interface RotationResults {
  rotationMethod: string;
  rotationAngle: number;
  factorCorrelations: number[][];
  communalities: number[];
}

export interface Factor {
  id: string;
  number: number;
  eigenvalue: number;
  variance: number;
  loadings: number[];
  interpretation?: string;
}

export interface FactorLoadings {
  [participantId: string]: {
    [factorId: string]: number;
  };
}

export interface Statement {
  id: string;
  number: number;
  text: string;
  zScores: { [factorId: string]: number };
}

export function useQAnalysis() {
  const [analysisState, setAnalysisState] = useState<QAnalysisState>({
    dataUploaded: false,
    factorsExtracted: false,
    factorsRotated: false,
    analysisComplete: false,
    progress: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);

  // WebSocket for real-time updates
  const { sendMessage, lastMessage, connectionStatus } = useWebSocket(
    process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001'
  );

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      const data = JSON.parse(lastMessage);
      if (data.type === 'progress') {
        setAnalysisState(prev => ({ ...prev, progress: data.value }));
      } else if (data.type === 'extraction_complete') {
        setAnalysisState(prev => ({
          ...prev,
          factorsExtracted: true,
          extractionResults: data.results,
          factors: data.factors,
          progress: 40,
        }));
        setIsProcessing(false);
      } else if (data.type === 'rotation_complete') {
        setAnalysisState(prev => ({
          ...prev,
          factorsRotated: true,
          rotationResults: data.results,
          rotatedFactors: data.factors,
          progress: 70,
        }));
        setIsProcessing(false);
      }
    }
  }, [lastMessage]);

  const uploadData = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/analysis/upload', {
          method: 'POST',
          body: formData,
        });

        if (response.ok) {
          const data = await response.json();
          setAnalysisState(prev => ({
            ...prev,
            dataUploaded: true,
            statements: data.statements,
            progress: 20,
          }));

          // Notify via WebSocket for real-time updates
          sendMessage(
            JSON.stringify({
              type: 'data_uploaded',
              studyId: data.studyId,
            })
          );
        }
      } catch (error) {
        console.error('Upload failed:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    [sendMessage]
  );

  const runExtraction = useCallback(
    async (params: {
      method: 'pca' | 'centroid';
      numberOfFactors?: number;
      minEigenvalue?: number;
    }) => {
      setIsProcessing(true);

      try {
        const response = await fetch('/api/analysis/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        if (response.ok) {
          // Results will come via WebSocket
          sendMessage(
            JSON.stringify({
              type: 'start_extraction',
              params,
            })
          );
        }
      } catch (error) {
        console.error('Extraction failed:', error);
        setIsProcessing(false);
      }
    },
    [sendMessage]
  );

  const rotateFactors = useCallback(
    async (params: {
      method: 'varimax' | 'quartimax' | 'equamax' | 'oblimin';
      angle?: number;
    }) => {
      setIsProcessing(true);

      try {
        const response = await fetch('/api/analysis/rotate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });

        if (response.ok) {
          // Results will come via WebSocket
          sendMessage(
            JSON.stringify({
              type: 'start_rotation',
              params,
            })
          );
        }
      } catch (error) {
        console.error('Rotation failed:', error);
        setIsProcessing(false);
      }
    },
    [sendMessage]
  );

  const exportResults = useCallback(
    async (format: 'json' | 'csv' | 'pqmethod' | 'spss' | 'pdf') => {
      setIsProcessing(true);

      try {
        const response = await fetch(`/api/analysis/export?format=${format}`, {
          method: 'GET',
        });

        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `q-analysis-${Date.now()}.${format}`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);

          setAnalysisState(prev => ({
            ...prev,
            analysisComplete: true,
            progress: 100,
          }));
        }
      } catch (error) {
        console.error('Export failed:', error);
      } finally {
        setIsProcessing(false);
      }
    },
    []
  );

  return {
    analysisState,
    uploadData,
    runExtraction,
    rotateFactors,
    exportResults,
    isProcessing,
    connectionStatus,
  };
}
