export interface BulkImportData {
  participants: Array<{
    email: string;
    name?: string;
    metadata?: Record<string, any>;
  }>;
  sendInvitations?: boolean;
}

export interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  templateId: string;
  recipientIds: string[];
  status: 'draft' | 'scheduled' | 'sent' | 'completed';
  scheduledAt?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}