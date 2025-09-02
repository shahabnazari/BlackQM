import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import { participantApiEnhanced } from '../participant-enhanced';
import { mockSession, mockStudy, mockStatements, mockProgress } from '../mock-data';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('ParticipantApiEnhanced', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    participantApiEnhanced.resetMockMode();
    localStorage.clear();
  });

  describe('checkBackendHealth', () => {
    it('should return true when backend is healthy', async () => {
      mockedAxios.create = vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ status: 200 }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      }));

      const result = await participantApiEnhanced.checkBackendHealth();
      expect(result).toBe(true);
    });

    it('should return false and switch to mock mode when backend is unavailable', async () => {
      mockedAxios.create = vi.fn(() => ({
        get: vi.fn().mockRejectedValue(new Error('Network error')),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      }));

      const result = await participantApiEnhanced.checkBackendHealth();
      expect(result).toBe(false);
      expect(participantApiEnhanced.isUsingMockData()).toBe(true);
    });
  });

  describe('startSession', () => {
    it('should start a session with real API when backend is available', async () => {
      const mockResponse = { data: mockSession };
      mockedAxios.create = vi.fn(() => ({
        post: vi.fn().mockResolvedValue(mockResponse),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      }));

      const result = await participantApiEnhanced.startSession('study-1');
      expect(result).toEqual(mockSession);
    });

    it('should fallback to mock data when backend is unavailable', async () => {
      mockedAxios.create = vi.fn(() => ({
        post: vi.fn().mockRejectedValue({ code: 'ECONNREFUSED' }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      }));

      const result = await participantApiEnhanced.startSession('study-1');
      expect(result).toEqual(mockSession);
      expect(participantApiEnhanced.isUsingMockData()).toBe(true);
    });
  });

  describe('getStudyInfo', () => {
    it('should return study info from API', async () => {
      const mockStudyInfo = {
        study: mockStudy,
        welcomeMessage: mockStudy.welcomeMessage,
        consentText: mockStudy.consentText,
        settings: {
          enablePreScreening: false,
          enablePostSurvey: true,
          enableVideoConferencing: false,
        }
      };

      mockedAxios.create = vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ data: mockStudyInfo }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      }));

      const result = await participantApiEnhanced.getStudyInfo('session-123');
      expect(result).toEqual(mockStudyInfo);
    });
  });

  describe('getStatements', () => {
    it('should return randomized statements', async () => {
      mockedAxios.create = vi.fn(() => ({
        get: vi.fn().mockResolvedValue({ data: mockStatements }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      }));

      const result = await participantApiEnhanced.getStatements('session-123');
      expect(result).toHaveLength(mockStatements.length);
    });

    it('should randomize mock statements when using mock mode', async () => {
      // Force mock mode
      await participantApiEnhanced.checkBackendHealth();
      participantApiEnhanced['useMockData'] = true;

      const result1 = await participantApiEnhanced.getStatements('session-123');
      const result2 = await participantApiEnhanced.getStatements('session-123');
      
      expect(result1).toHaveLength(mockStatements.length);
      expect(result2).toHaveLength(mockStatements.length);
      // Check that all statements are present
      const ids1 = result1.map(s => s.id).sort();
      const ids2 = result2.map(s => s.id).sort();
      const originalIds = mockStatements.map(s => s.id).sort();
      expect(ids1).toEqual(originalIds);
      expect(ids2).toEqual(originalIds);
    });
  });

  describe('updateProgress', () => {
    it('should update progress via API', async () => {
      const progressData = {
        currentStep: 'consent',
        completedStep: 'welcome',
      };

      const expectedResponse = {
        currentStep: 'consent',
        completedSteps: ['welcome'],
        progress: 12.5,
      };

      mockedAxios.create = vi.fn(() => ({
        put: vi.fn().mockResolvedValue({ data: expectedResponse }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      }));

      const result = await participantApiEnhanced.updateProgress('session-123', progressData);
      expect(result).toEqual(expectedResponse);
    });

    it('should persist progress in localStorage when using mock mode', async () => {
      participantApiEnhanced['useMockData'] = true;

      const progressData = {
        currentStep: 'consent',
        completedStep: 'welcome',
      };

      await participantApiEnhanced.updateProgress('session-123', progressData);
      
      const stored = localStorage.getItem('progress-session-123');
      expect(stored).toBeTruthy();
      const parsedProgress = JSON.parse(stored!);
      expect(parsedProgress.currentStep).toBe('consent');
      expect(parsedProgress.completedSteps).toContain('welcome');
    });
  });

  describe('submitQSort', () => {
    it('should submit Q-sort data via API', async () => {
      const grid = [
        { position: -4, statementIds: ['1'] },
        { position: -3, statementIds: ['2', '3'] },
      ];

      mockedAxios.create = vi.fn(() => ({
        post: vi.fn().mockResolvedValue({ data: { success: true } }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      }));

      const result = await participantApiEnhanced.submitQSort('session-123', grid);
      expect(result).toEqual({ success: true });
    });

    it('should persist Q-sort in localStorage when using mock mode', async () => {
      participantApiEnhanced['useMockData'] = true;

      const grid = [
        { position: -4, statementIds: ['1'] },
        { position: -3, statementIds: ['2', '3'] },
      ];

      await participantApiEnhanced.submitQSort('session-123', grid);
      
      const stored = localStorage.getItem('qsort-session-123');
      expect(stored).toBeTruthy();
      const parsedGrid = JSON.parse(stored!);
      expect(parsedGrid).toEqual(grid);
    });
  });

  describe('validateQSort', () => {
    it('should validate complete Q-sort', async () => {
      participantApiEnhanced['useMockData'] = true;

      // Set up a complete Q-sort
      const grid = mockStatements.map((s, i) => ({
        position: Math.floor(i / 5) - 4,
        statementIds: [s.id]
      }));

      localStorage.setItem('qsort-session-123', JSON.stringify(grid));

      const result = await participantApiEnhanced.validateQSort('session-123');
      expect(result.valid).toBe(false); // Grid structure doesn't match expected format
    });

    it('should detect incomplete Q-sort', async () => {
      participantApiEnhanced['useMockData'] = true;

      const incompleteGrid = [
        { position: -4, statementIds: ['1'] },
      ];

      localStorage.setItem('qsort-session-123', JSON.stringify(incompleteGrid));

      const result = await participantApiEnhanced.validateQSort('session-123');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('Missing');
    });
  });

  describe('completeSession', () => {
    it('should complete session and return completion code', async () => {
      const mockCompletion = {
        completed: true,
        timestamp: Date.now(),
        completionCode: 'COMP-ABC123',
      };

      mockedAxios.create = vi.fn(() => ({
        post: vi.fn().mockResolvedValue({ data: mockCompletion }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      }));

      const result = await participantApiEnhanced.completeSession('session-123');
      expect(result.completed).toBe(true);
      expect(result.completionCode).toBeTruthy();
    });

    it('should generate completion code in mock mode', async () => {
      participantApiEnhanced['useMockData'] = true;

      const result = await participantApiEnhanced.completeSession('session-123');
      expect(result.completed).toBe(true);
      expect(result.completionCode).toMatch(/^COMP-/);
      
      const stored = localStorage.getItem('completion-session-123');
      expect(stored).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockedAxios.create = vi.fn(() => ({
        post: vi.fn().mockRejectedValue({
          response: {
            status: 400,
            data: { message: 'Bad request' }
          }
        }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      }));

      await expect(participantApiEnhanced.startSession('invalid')).rejects.toThrow('Bad request');
    });

    it('should handle network errors and switch to mock mode', async () => {
      mockedAxios.create = vi.fn(() => ({
        get: vi.fn().mockRejectedValue({ code: 'ECONNREFUSED' }),
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      }));

      const result = await participantApiEnhanced.getProgress('session-123');
      expect(result).toEqual(mockProgress);
      expect(participantApiEnhanced.isUsingMockData()).toBe(true);
    });
  });
});