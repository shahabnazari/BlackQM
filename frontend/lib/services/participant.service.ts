
// Type definitions




// Enterprise-Grade Participant Service
// Phase 6.91: Complete Participant Management with Error Handling
import { apiClient, ApiResponse } from '@/lib/api/client';
import {
    BulkImportData,
    EmailCampaign,
    EmailTemplate,
    ImportResult,
    Participant,
    ParticipantFilter,
    ParticipantInvitation,
    ParticipantMetrics
} from '@/lib/types/participant.types';
// Custom error class for participant operations
export class ParticipantServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ParticipantServiceError';
  }
}
// Service configuration
interface ServiceConfig {
  maxRetries: number;
  retryDelay: number;
  cacheTimeout: number;
  batchSize: number;
}
const DEFAULT_CONFIG: ServiceConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  batchSize: 100
};
class ParticipantService {
  private cache: Map<string, { data: any; expiry: number }> = new Map();
  private config: ServiceConfig;

  constructor(config: Partial<ServiceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }
  // Cache management
  private getCacheKey(method: string, params?: any): string {
    return `participant:${method}:${JSON.stringify(params || {})}`;
  }
  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }
    this.cache.delete(key);
    return null;
  }
  private setCache<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.config.cacheTimeout
    });
  }
  private clearCache(): void {
    this.cache.clear();
  }
  // Error handling with retry logic
  private async withRetry<T>(fn: () => Promise<T>, retries = this.config.maxRetries): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (retries > 0 && this.isRetryableError(error)) {
        await this.delay(this.config.retryDelay);
        return this.withRetry(fn, retries - 1);
      }
      throw this.handleError(error);
    }
  }
  private isRetryableError(error: any): boolean {
    const retryableStatuses = [408, 429, 500, 502, 503, 504];
    return error.response && retryableStatuses.includes(error.response.status);
  }
  private handleError(error: any): ParticipantServiceError {
    if (error.response) {
      const { status, data } = error.response;
      return new ParticipantServiceError(
        data.message || 'Participant operation failed',
        data.code || 'PARTICIPANT_ERROR',
        status,
        data.details
      );
    }
    return new ParticipantServiceError(
      error.message || 'Unknown error occurred',
      'UNKNOWN_ERROR',
      500
    );
  }
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  // Participant CRUD operations
  async getParticipant(id: string): Promise<Participant> {
    const cacheKey = this.getCacheKey('getParticipant', { id });
    const cached = this.getFromCache<Participant>(cacheKey);
    if (cached) return cached;
    return this.withRetry(async () => {
      const response = await apiClient.get<ApiResponse<Participant>>(`/participants/${id}`);
      this.setCache(cacheKey, response.data.data);
      return response.data.data;
    });
  }
  async listParticipants(filter: ParticipantFilter = {}): Promise<{
    participants: Participant[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const cacheKey = this.getCacheKey('listParticipants', filter);
    const cached = this.getFromCache<any>(cacheKey);
    if (cached) return cached;
    return this.withRetry(async () => {
      const response = await apiClient.get<ApiResponse<{
        participants: Participant[];
        total: number;
        page: number;
        pageSize: number;
      }>>('/participants', { params: filter });
      this.setCache(cacheKey, response.data.data);
      return response.data.data;
    });
  }
  async createParticipant(data: Partial<Participant>): Promise<Participant> {
    this.clearCache(); // Clear cache on mutation

    return this.withRetry(async () => {
      const response = await apiClient.post<ApiResponse<Participant>>('/participants', data);
      return response.data.data;
    });
  }
  async updateParticipant(id: string, data: Partial<Participant>): Promise<Participant> {
    this.clearCache(); // Clear cache on mutation

    return this.withRetry(async () => {
      const response = await apiClient.patch<ApiResponse<Participant>>(`/participants/${id}`, data);
      return response.data.data;
    });
  }
  async deleteParticipant(id: string): Promise<void> {
    this.clearCache(); // Clear cache on mutation

    return this.withRetry(async () => {
      await apiClient.delete(`/participants/${id}`);
    });
  }
  // Bulk operations
  async bulkCreateParticipants(participants: Partial<Participant>[]): Promise<Participant[]> {
    this.clearCache();

    // Process in batches to avoid overwhelming the server
    const results: Participant[] = [];
    for (let i = 0; i < participants.length; i += this.config.batchSize) {
      const batch = participants.slice(i, i + this.config.batchSize);
      const response = await this.withRetry(async () => {
        const res = await apiClient.post<Participant[]>('/participants/bulk', {
          participants: batch
        });
        return res.data;
      });
      results.push(...response);
    }
    return results;
  }
  async bulkUpdateParticipants(
    updates: Array<{ id: string; data: Partial<Participant> }>
  ): Promise<Participant[]> {
    this.clearCache();

    return this.withRetry(async () => {
      const response = await apiClient.patch<Participant[]>('/participants/bulk', { updates });
      return response.data;
    });
  }
  async bulkDeleteParticipants(ids: string[]): Promise<void> {
    this.clearCache();

    return this.withRetry(async () => {
      await apiClient.delete('/participants/bulk', { data: { ids } });
    });
  }
  // Import/Export operations
  async importParticipants(data: BulkImportData): Promise<ImportResult> {
    this.clearCache();

    const formData = new FormData();
    const uploadData = data as any;
    formData.append('file', uploadData.file);
    formData.append('format', uploadData.format);
    formData.append('mapping', JSON.stringify(uploadData.mapping));
    formData.append('options', JSON.stringify(uploadData.options));
    return this.withRetry(async () => {
      const response = await apiClient.post<ApiResponse<ImportResult>>('/participants/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          // Can emit progress events here if needed
          console.log(`Upload Progress: ${percentCompleted}%`);
        }
      });
      return response.data.data;
    });
  }
  async exportParticipants(
    filter: ParticipantFilter,
    format: 'csv' | 'xlsx' | 'json'
  ): Promise<Blob> {
    return this.withRetry(async () => {
      const response = await apiClient.get<Blob>('/participants/export', {
        params: { ...filter, format },
        responseType: 'blob'
      });
      return response.data;
    });
  }
  // Invitation management
  async sendInvitations(
    participantIds: string[],
    templateId?: string,
    customMessage?: string
  ): Promise<ParticipantInvitation[]> {
    this.clearCache();

    return this.withRetry(async () => {
      const response = await apiClient.post<ApiResponse<ParticipantInvitation[]>>('/participants/invite', {
        participantIds,
        templateId,
        customMessage
      });
      return response.data.data;
    });
  }
  async resendInvitation(invitationId: string): Promise<ParticipantInvitation> {
    return this.withRetry(async () => {
      const response = await apiClient.post<ApiResponse<ParticipantInvitation>>(
        `/participants/invitations/${invitationId}/resend`
      );
      return response.data.data;
    });
  }
  async trackInvitationOpen(invitationCode: string): Promise<void> {
    return this.withRetry(async () => {
      await apiClient.post(`/participants/invitations/track/${invitationCode}/open`);
    });
  }
  async acceptInvitation(invitationCode: string): Promise<Participant> {
    this.clearCache();

    return this.withRetry(async () => {
      const response = await apiClient.post<ApiResponse<Participant>>(
        `/participants/invitations/${invitationCode}/accept`
      );
      return response.data.data;
    });
  }
  async declineInvitation(invitationCode: string, reason?: string): Promise<void> {
    return this.withRetry(async () => {
      await apiClient.post(`/participants/invitations/${invitationCode}/decline`, { reason });
    });
  }
  // Metrics and analytics
  async getMetrics(studyId: string): Promise<ParticipantMetrics> {
    const cacheKey = this.getCacheKey('getMetrics', { studyId });
    const cached = this.getFromCache<ParticipantMetrics>(cacheKey);
    if (cached) return cached;
    return this.withRetry(async () => {
      const response = await apiClient.get<ApiResponse<ParticipantMetrics>>(`/participants/metrics/${studyId}`);
      this.setCache(cacheKey, response.data.data);
      return response.data.data;
    });
  }
  async getParticipantActivity(participantId: string): Promise<{
    sessions: Array<{
      startTime: Date;
      endTime: Date;
      duration: number;
      actions: number;
    }>;
    responses: Array<{
      questionId: string;
      timestamp: Date;
      value: any;
    }>;
  }> {
    return this.withRetry(async () => {
      const response = await apiClient.get<ApiResponse<{
        sessions: Array<{
          startTime: Date;
          endTime: Date;
          duration: number;
          actions: number;
        }>;
        responses: Array<{
          questionId: string;
          timestamp: Date;
          value: any;
        }>;
      }>>(`/participants/${participantId}/activity`);
      return response.data.data;
    });
  }
  // Email campaign management
  async createEmailCampaign(campaign: Partial<EmailCampaign>): Promise<EmailCampaign> {
    return this.withRetry(async () => {
      const response = await apiClient.post<ApiResponse<EmailCampaign>>('/participants/campaigns', campaign);
      return response.data.data;
    });
  }
  async sendEmailCampaign(campaignId: string): Promise<void> {
    return this.withRetry(async () => {
      await apiClient.post(`/participants/campaigns/${campaignId}/send`);
    });
  }
  async getEmailTemplates(): Promise<EmailTemplate[]> {
    const cacheKey = this.getCacheKey('getEmailTemplates');
    const cached = this.getFromCache<EmailTemplate[]>(cacheKey);
    if (cached) return cached;
    return this.withRetry(async () => {
      const response = await apiClient.get<EmailTemplate[]>('/participants/templates');
      this.setCache(cacheKey, response.data);
      return response.data;
    });
  }
  // Validation utilities
  validateImportData(data: any[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    data.forEach((row, index) => {
      if (!row.email || !this.isValidEmail(row.email)) {
        errors.push(`Row ${index + 1}: Invalid or missing email`);
      }
      if (row.phone && !this.isValidPhone(row.phone)) {
        errors.push(`Row ${index + 1}: Invalid phone number`);
      }
    });
    return {
      valid: errors.length === 0,
      errors
    }
  }
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  private isValidPhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s\-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
  }
}
// Singleton instance
export const participantService = new ParticipantService();
// Export types for convenience
export type { Participant, ParticipantFilter, ParticipantInvitation, ParticipantMetrics };
