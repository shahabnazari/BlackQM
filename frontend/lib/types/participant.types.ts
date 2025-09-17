export interface Participant {
  id: string;
  studyId: string;
  email?: string;
  name?: string;
  status: 'invited' | 'active' | 'completed' | 'withdrawn';
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface ParticipantInvitation {
  id: string;
  participantId: string;
  email: string;
  status: 'pending' | 'sent' | 'accepted' | 'declined';
  sentAt?: Date;
  acceptedAt?: Date;
  expiresAt: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

export interface ParticipantFilter {
  studyId?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface ParticipantMetrics {
  total: number;
  active: number;
  completed: number;
  withdrawn: number;
  averageCompletionTime?: number;
}