import { describe, it, expect, beforeEach, vi } from 'vitest';
import { participantApiEnhanced } from '../participant-enhanced';
import { mockSession, mockStudy, mockStatements, mockProgress } from '../mock-data';

// Mock the config module
vi.mock('../config', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  },
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() }
    }
  }
}));

// Import the mocked apiClient
import apiClient from '../config';
const mockedApiClient = apiClient as any;

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => {
      const keys = Object.keys(store);
      return keys[index] || null;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('ParticipantApiEnhanced', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    participantApiEnhanced.resetMockMode();
    localStorageMock.clear();
  });

  describe('checkBackendHealth', () => {
    it('should return true when backend is healthy', async () => {
      mockedApiClient.get.mockResolvedValue({ status: 200 });

      const result = await participantApiEnhanced.checkBackendHealth();
      expect(result).toBe(true);
    });

    it('should return false and switch to mock mode when backend is unavailable', async () => {
      mockedApiClient.get.mockRejectedValue(new Error('Network error'));

      const result = await participantApiEnhanced.checkBackendHealth();
      expect(result).toBe(false);
      expect(participantApiEnhanced.isUsingMockData()).toBe(true);
    });
  });

  describe('startSession', () => {
    it('should start a session with real API when backend is available', async () => {
      const mockResponse = { data: mockSession };
      mockedApiClient.post.mockResolvedValue(mockResponse);

      const result = await participantApiEnhanced.startSession('study-1');
      expect(result).toEqual(mockSession);
    });

    it('should fallback to mock data when backend is unavailable', async () => {
      mockedApiClient.post.mockRejectedValue({ code: 'ECONNREFUSED' });

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

      mockedApiClient.get.mockResolvedValue({ data: mockStudyInfo });

      const result = await participantApiEnhanced.getStudyInfo('session-123');
      expect(result).toEqual(mockStudyInfo);
    });
  });

  describe('getStatements', () => {
    it('should return randomized statements', async () => {
      mockedApiClient.get.mockResolvedValue({ data: mockStatements });

      const result = await participantApiEnhanced.getStatements('session-123');
      expect(result).toHaveLength(mockStatements.length);
    });

    it('should randomize mock statements when using mock mode', async () => {
      // Force mock mode by making checkBackendHealth fail
      mockedApiClient.get.mockRejectedValue(new Error('Network error'));
      await participantApiEnhanced.checkBackendHealth();

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

      mockedApiClient.put.mockResolvedValue({ data: expectedResponse });

      const result = await participantApiEnhanced.updateProgress('session-123', progressData);
      expect(result).toEqual(expectedResponse);
    });

    it('should persist progress in localStorage when using mock mode', async () => {
      // Force mock mode
      mockedApiClient.get.mockRejectedValue(new Error('Network error'));
      await participantApiEnhanced.checkBackendHealth();

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

      mockedApiClient.post.mockResolvedValue({ data: { success: true } });

      const result = await participantApiEnhanced.submitQSort('session-123', grid);
      expect(result).toEqual({ success: true });
    });

    it('should persist Q-sort in localStorage when using mock mode', async () => {
      // Force mock mode
      mockedApiClient.get.mockRejectedValue(new Error('Network error'));
      await participantApiEnhanced.checkBackendHealth();

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
      // Force mock mode
      mockedApiClient.get.mockRejectedValue(new Error('Network error'));
      await participantApiEnhanced.checkBackendHealth();

      // Set up a complete Q-sort with proper structure
      // Each position should have an array of statement IDs
      const grid = [
        { position: -4, statementIds: [mockStatements[0].id] },
        { position: -3, statementIds: [mockStatements[1].id, mockStatements[2].id] },
        { position: -2, statementIds: [mockStatements[3].id, mockStatements[4].id, mockStatements[5].id] },
        { position: -1, statementIds: [mockStatements[6].id, mockStatements[7].id, mockStatements[8].id, mockStatements[9].id] },
        { position: 0, statementIds: mockStatements.slice(10, 15).map(s => s.id) },
        { position: 1, statementIds: mockStatements.slice(15, 19).map(s => s.id) },
        { position: 2, statementIds: mockStatements.slice(19, 22).map(s => s.id) },
        { position: 3, statementIds: mockStatements.slice(22, 24).map(s => s.id) },
        { position: 4, statementIds: mockStatements.slice(24, 25).map(s => s.id) }
      ];

      localStorage.setItem('qsort-session-123', JSON.stringify(grid));

      const result = await participantApiEnhanced.validateQSort('session-123');
      // The validation checks if all statements are present
      expect(result.valid).toBe(true); // All 25 statements are present in the grid
    });

    it('should detect incomplete Q-sort', async () => {
      // Force mock mode
      mockedApiClient.get.mockRejectedValue(new Error('Network error'));
      await participantApiEnhanced.checkBackendHealth();

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

      mockedApiClient.post.mockResolvedValue({ data: mockCompletion });

      const result = await participantApiEnhanced.completeSession('session-123');
      expect(result.completed).toBe(true);
      expect(result.completionCode).toBeTruthy();
    });

    it('should generate completion code in mock mode', async () => {
      // Force mock mode
      mockedApiClient.get.mockRejectedValue(new Error('Network error'));
      await participantApiEnhanced.checkBackendHealth();

      const result = await participantApiEnhanced.completeSession('session-123');
      expect(result.completed).toBe(true);
      expect(result.completionCode).toMatch(/^COMP-/);
      
      const stored = localStorage.getItem('completion-session-123');
      expect(stored).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      mockedApiClient.post.mockRejectedValue({
        response: {
          status: 400,
          data: { message: 'Bad request' }
        }
      });

      await expect(participantApiEnhanced.startSession('invalid')).rejects.toThrow('Bad request');
    });

    it('should handle network errors and switch to mock mode', async () => {
      mockedApiClient.get.mockRejectedValue({ code: 'ECONNREFUSED' });

      const result = await participantApiEnhanced.getProgress('session-123');
      expect(result).toEqual(mockProgress);
      expect(participantApiEnhanced.isUsingMockData()).toBe(true);
    });
  });
});