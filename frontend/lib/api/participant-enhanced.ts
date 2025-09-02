import apiClient from './config';
import { handleApiError, isNetworkError } from './error-handler';
import { mockSession, mockStudy, mockStatements, mockProgress } from './mock-data';

export interface StartSessionResponse {
  sessionCode: string;
  studyId: string;
  studyTitle: string;
  studyDescription?: string;
  gridColumns: number;
  gridShape: string;
  gridConfig: any;
}

export interface StudyInfo {
  study: any;
  welcomeMessage?: string;
  consentText?: string;
  settings: {
    enablePreScreening: boolean;
    enablePostSurvey: boolean;
    enableVideoConferencing: boolean;
  };
}

export interface Statement {
  id: string;
  text: string;
  order: number;
}

export interface Progress {
  currentStep: string;
  completedSteps: string[];
  progress: number;
}

// Track if we're in mock mode
let useMockData = false;

export const participantApiEnhanced = {
  // Check if backend is available
  async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await apiClient.get('/health');
      return response.status === 200;
    } catch (error) {
      console.warn('Backend health check failed, switching to mock mode');
      useMockData = true;
      return false;
    }
  },

  // Start a new participant session
  async startSession(studyId: string, invitationCode?: string): Promise<StartSessionResponse> {
    if (useMockData) {
      console.log('Using mock data for session');
      return Promise.resolve(mockSession);
    }

    try {
      const { data } = await apiClient.post('/participant/session/start', {
        studyId,
        invitationCode,
      });
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        console.warn('Backend not available, using mock data');
        useMockData = true;
        return mockSession;
      }
      throw handleApiError(error);
    }
  },

  // Get session information
  async getSession(sessionCode: string): Promise<any> {
    if (useMockData) {
      return Promise.resolve({
        ...mockSession,
        survey: mockStudy,
      });
    }

    try {
      const { data } = await apiClient.get(`/participant/session/${sessionCode}`);
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        useMockData = true;
        return { ...mockSession, survey: mockStudy };
      }
      throw handleApiError(error);
    }
  },

  // Get study information
  async getStudyInfo(sessionCode: string): Promise<StudyInfo> {
    if (useMockData) {
      return Promise.resolve({
        study: mockStudy,
        welcomeMessage: mockStudy.welcomeMessage,
        consentText: mockStudy.consentText,
        settings: {
          enablePreScreening: mockStudy.enablePreScreening,
          enablePostSurvey: mockStudy.enablePostSurvey,
          enableVideoConferencing: mockStudy.enableVideoConferencing,
        },
      });
    }

    try {
      const { data } = await apiClient.get(`/participant/session/${sessionCode}/study`);
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        useMockData = true;
        return {
          study: mockStudy,
          welcomeMessage: mockStudy.welcomeMessage,
          consentText: mockStudy.consentText,
          settings: {
            enablePreScreening: mockStudy.enablePreScreening,
            enablePostSurvey: mockStudy.enablePostSurvey,
            enableVideoConferencing: mockStudy.enableVideoConferencing,
          },
        };
      }
      throw handleApiError(error);
    }
  },

  // Get randomized statements
  async getStatements(sessionCode: string): Promise<Statement[]> {
    if (useMockData) {
      // Randomize mock statements
      const shuffled = [...mockStatements].sort(() => Math.random() - 0.5);
      return Promise.resolve(shuffled);
    }

    try {
      const { data } = await apiClient.get(`/participant/session/${sessionCode}/statements`);
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        useMockData = true;
        const shuffled = [...mockStatements].sort(() => Math.random() - 0.5);
        return shuffled;
      }
      throw handleApiError(error);
    }
  },

  // Update progress
  async updateProgress(sessionCode: string, progressData: {
    currentStep: string;
    completedStep?: string;
    stepData?: any;
  }): Promise<Progress> {
    if (useMockData) {
      const completedSteps = progressData.completedStep 
        ? [...(mockProgress.completedSteps || []), progressData.completedStep]
        : mockProgress.completedSteps;
      
      const updatedProgress = {
        ...mockProgress,
        currentStep: progressData.currentStep,
        completedSteps,
        progress: (completedSteps.length / 8) * 100,
      };
      
      // Store in localStorage for mock persistence
      localStorage.setItem(`progress-${sessionCode}`, JSON.stringify(updatedProgress));
      return Promise.resolve(updatedProgress);
    }

    try {
      const { data } = await apiClient.put(`/participant/session/${sessionCode}/progress`, progressData);
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        useMockData = true;
        return this.updateProgress(sessionCode, progressData);
      }
      throw handleApiError(error);
    }
  },

  // Get current progress
  async getProgress(sessionCode: string): Promise<Progress> {
    if (useMockData) {
      const stored = localStorage.getItem(`progress-${sessionCode}`);
      if (stored) {
        return Promise.resolve(JSON.parse(stored));
      }
      return Promise.resolve(mockProgress);
    }

    try {
      const { data } = await apiClient.get(`/participant/session/${sessionCode}/progress`);
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        useMockData = true;
        return this.getProgress(sessionCode);
      }
      throw handleApiError(error);
    }
  },

  // Submit consent
  async submitConsent(sessionCode: string, consent: boolean): Promise<any> {
    if (useMockData) {
      localStorage.setItem(`consent-${sessionCode}`, JSON.stringify({ consent, timestamp: Date.now() }));
      return Promise.resolve({ success: true });
    }

    try {
      const { data } = await apiClient.post(`/participant/session/${sessionCode}/consent`, { consent });
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        useMockData = true;
        return this.submitConsent(sessionCode, consent);
      }
      throw handleApiError(error);
    }
  },

  // Submit pre-screening answers
  async submitPreScreening(sessionCode: string, answers: any): Promise<any> {
    if (useMockData) {
      localStorage.setItem(`prescreening-${sessionCode}`, JSON.stringify(answers));
      return Promise.resolve({ success: true });
    }

    try {
      const { data } = await apiClient.post(`/participant/session/${sessionCode}/prescreening`, answers);
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        useMockData = true;
        return this.submitPreScreening(sessionCode, answers);
      }
      throw handleApiError(error);
    }
  },

  // Submit pre-sort categories
  async submitPreSort(sessionCode: string, categories: {
    agree: string[];
    neutral: string[];
    disagree: string[];
  }): Promise<any> {
    if (useMockData) {
      localStorage.setItem(`presort-${sessionCode}`, JSON.stringify(categories));
      return Promise.resolve({ success: true });
    }

    try {
      const { data } = await apiClient.post(`/participant/session/${sessionCode}/presort`, categories);
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        useMockData = true;
        return this.submitPreSort(sessionCode, categories);
      }
      throw handleApiError(error);
    }
  },

  // Submit Q-sort
  async submitQSort(sessionCode: string, grid: any[]): Promise<any> {
    if (useMockData) {
      localStorage.setItem(`qsort-${sessionCode}`, JSON.stringify(grid));
      return Promise.resolve({ success: true });
    }

    try {
      const { data } = await apiClient.post(`/participant/session/${sessionCode}/qsort`, { grid });
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        useMockData = true;
        return this.submitQSort(sessionCode, grid);
      }
      throw handleApiError(error);
    }
  },

  // Submit commentary
  async submitCommentary(sessionCode: string, comments: Record<string, string>): Promise<any> {
    if (useMockData) {
      localStorage.setItem(`commentary-${sessionCode}`, JSON.stringify(comments));
      return Promise.resolve({ success: true });
    }

    try {
      const { data } = await apiClient.post(`/participant/session/${sessionCode}/commentary`, { comments });
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        useMockData = true;
        return this.submitCommentary(sessionCode, comments);
      }
      throw handleApiError(error);
    }
  },

  // Submit post-survey
  async submitPostSurvey(sessionCode: string, answers: any): Promise<any> {
    if (useMockData) {
      localStorage.setItem(`postsurvey-${sessionCode}`, JSON.stringify(answers));
      return Promise.resolve({ success: true });
    }

    try {
      const { data } = await apiClient.post(`/participant/session/${sessionCode}/postsurvey`, answers);
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        useMockData = true;
        return this.submitPostSurvey(sessionCode, answers);
      }
      throw handleApiError(error);
    }
  },

  // Complete session
  async completeSession(sessionCode: string): Promise<any> {
    if (useMockData) {
      const completion = {
        completed: true,
        timestamp: Date.now(),
        completionCode: `COMP-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
      };
      localStorage.setItem(`completion-${sessionCode}`, JSON.stringify(completion));
      return Promise.resolve(completion);
    }

    try {
      const { data } = await apiClient.post(`/participant/session/${sessionCode}/complete`);
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        useMockData = true;
        return this.completeSession(sessionCode);
      }
      throw handleApiError(error);
    }
  },

  // Validate Q-sort
  async validateQSort(sessionCode: string): Promise<any> {
    if (useMockData) {
      const qsort = localStorage.getItem(`qsort-${sessionCode}`);
      if (qsort) {
        const grid = JSON.parse(qsort);
        const totalStatements = grid.reduce((sum: number, col: any) => sum + col.statementIds.length, 0);
        return Promise.resolve({
          valid: totalStatements === mockStatements.length,
          message: totalStatements === mockStatements.length 
            ? 'Q-sort is complete' 
            : `Missing ${mockStatements.length - totalStatements} statements`,
        });
      }
      return Promise.resolve({ valid: false, message: 'No Q-sort data found' });
    }

    try {
      const { data } = await apiClient.get(`/participant/session/${sessionCode}/qsort/validate`);
      return data;
    } catch (error) {
      if (isNetworkError(error)) {
        useMockData = true;
        return this.validateQSort(sessionCode);
      }
      throw handleApiError(error);
    }
  },

  // Check if using mock data
  isUsingMockData(): boolean {
    return useMockData;
  },

  // Reset to try real API again
  resetMockMode(): void {
    useMockData = false;
  }
};