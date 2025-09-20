/**
 * Recruitment API Service - Phase 7 Day 7 Implementation
 *
 * Connects the recruitment frontend to backend scheduling and participant services
 * Provides comprehensive recruitment management functionality
 */

export interface Appointment {
  id: string;
  studyId: string;
  participantId: string;
  participantName?: string;
  participantEmail?: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  type: 'online' | 'in-person' | 'phone';
  location?: string;
  meetingUrl?: string;
  notes?: string;
  remindersSent: number;
  compensation?: Compensation;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  start: Date;
  end: Date;
  available: boolean;
  capacity: number;
  booked: number;
}

export interface Availability {
  studyId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  slotDuration: number;
  bufferTime: number;
  maxParticipantsPerSlot: number;
}

export interface Compensation {
  id: string;
  appointmentId: string;
  amount: number;
  currency: string;
  method: 'cash' | 'check' | 'gift_card' | 'bank_transfer' | 'other';
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  paidAt?: Date;
  reference?: string;
  notes?: string;
}

export interface RecruitmentMetrics {
  studyId: string;
  totalInvited: number;
  totalScheduled: number;
  totalCompleted: number;
  totalNoShows: number;
  conversionRate: number;
  averageTimeToSchedule: number;
  completionRate: number;
  noShowRate: number;
  compensationTotal: number;
  timeSlotUtilization: number;
}

export interface AppointmentFilters {
  status?: string;
  startDate?: Date;
  endDate?: Date;
  participantId?: string;
}

export interface CreateAppointmentDto {
  participantId: string;
  scheduledStart: Date;
  scheduledEnd: Date;
  type: 'online' | 'in-person' | 'phone';
  location?: string;
}

export interface UpdateAppointmentDto {
  scheduledStart?: Date;
  scheduledEnd?: Date;
  status?: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no-show';
  type?: 'online' | 'in-person' | 'phone';
  location?: string;
  notes?: string;
}

class RecruitmentAPIService {
  private baseUrl = '/api/scheduling';
  private collaborationUrl = '/api/collaboration';

  /**
   * Get authentication headers
   */
  private getHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * Handle API errors
   */
  private handleError(error: any): never {
    console.error('Recruitment API Error:', error);
    throw error;
  }

  // ========== Appointment Management ==========

  /**
   * Create a new appointment
   */
  async createAppointment(
    studyId: string,
    data: CreateAppointmentDto
  ): Promise<Appointment> {
    try {
      const response = await fetch(`${this.baseUrl}/${studyId}/appointments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`Failed to create appointment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update an existing appointment
   */
  async updateAppointment(
    appointmentId: string,
    updates: UpdateAppointmentDto
  ): Promise<Appointment> {
    try {
      const response = await fetch(
        `${this.baseUrl}/appointments/${appointmentId}`,
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify(updates),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to update appointment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(
    appointmentId: string,
    reason?: string
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/appointments/${appointmentId}/cancel`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ reason }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to cancel appointment: ${response.statusText}`);
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Mark appointment as completed
   */
  async markAppointmentCompleted(appointmentId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/appointments/${appointmentId}/complete`,
        {
          method: 'POST',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to mark appointment as completed: ${response.statusText}`
        );
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Mark appointment as no-show
   */
  async markNoShow(appointmentId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/appointments/${appointmentId}/no-show`,
        {
          method: 'POST',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to mark appointment as no-show: ${response.statusText}`
        );
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get appointments for a study
   */
  async getAppointments(
    studyId: string,
    filters?: AppointmentFilters
  ): Promise<Appointment[]> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append('status', filters.status);
      if (filters?.startDate)
        params.append('startDate', filters.startDate.toISOString());
      if (filters?.endDate)
        params.append('endDate', filters.endDate.toISOString());
      if (filters?.participantId)
        params.append('participantId', filters.participantId);

      const url = `${this.baseUrl}/${studyId}/appointments${params.toString() ? `?${params.toString()}` : ''}`;
      const response = await fetch(url, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch appointments: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ========== Availability Management ==========

  /**
   * Set study availability
   */
  async setStudyAvailability(
    studyId: string,
    availability: Availability[]
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/${studyId}/availability`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ availability }),
      });

      if (!response.ok) {
        throw new Error(`Failed to set availability: ${response.statusText}`);
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get available time slots
   */
  async getAvailableSlots(
    studyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeSlot[]> {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      const response = await fetch(
        `${this.baseUrl}/${studyId}/slots?${params.toString()}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch available slots: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ========== Compensation Tracking ==========

  /**
   * Add compensation for an appointment
   */
  async addCompensation(
    appointmentId: string,
    amount: number,
    method: 'cash' | 'check' | 'gift_card' | 'bank_transfer' | 'other',
    currency = 'USD'
  ): Promise<Compensation> {
    try {
      const response = await fetch(
        `${this.baseUrl}/appointments/${appointmentId}/compensation`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ amount, method, currency }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to add compensation: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Update compensation status
   */
  async updateCompensationStatus(
    compensationId: string,
    status: 'approved' | 'paid' | 'cancelled',
    reference?: string
  ): Promise<Compensation> {
    try {
      const response = await fetch(
        `${this.baseUrl}/compensation/${compensationId}/status`,
        {
          method: 'PATCH',
          headers: this.getHeaders(),
          body: JSON.stringify({ status, reference }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update compensation status: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get compensation summary for a study
   */
  async getCompensationSummary(studyId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${studyId}/compensation/summary`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch compensation summary: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ========== Recruitment Analytics ==========

  /**
   * Get recruitment metrics for a study
   */
  async getRecruitmentMetrics(studyId: string): Promise<RecruitmentMetrics> {
    try {
      const response = await fetch(`${this.baseUrl}/${studyId}/metrics`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch recruitment metrics: ${response.statusText}`
        );
      }

      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ========== Reminder Management ==========

  /**
   * Schedule reminders for an appointment
   */
  async scheduleReminders(
    appointmentId: string,
    reminderTimes: number[] // hours before appointment
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/appointments/${appointmentId}/reminders`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ reminderTimes }),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to schedule reminders: ${response.statusText}`);
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Cancel reminders for an appointment
   */
  async cancelReminders(appointmentId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/appointments/${appointmentId}/reminders`,
        {
          method: 'DELETE',
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to cancel reminders: ${response.statusText}`);
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ========== Collaboration Features ==========

  /**
   * Add a comment to an appointment
   */
  async addAppointmentComment(
    appointmentId: string,
    content: string
  ): Promise<any> {
    try {
      const response = await fetch(`${this.collaborationUrl}/comments`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          entityType: 'appointment',
          entityId: appointmentId,
          content,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to add comment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Get activity log for recruitment
   */
  async getRecruitmentActivityLog(studyId: string, limit = 50): Promise<any[]> {
    try {
      const response = await fetch(
        `${this.collaborationUrl}/${studyId}/activity?context=recruitment&limit=${limit}`,
        {
          headers: this.getHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch activity log: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      return this.handleError(error);
    }
  }

  // ========== Bulk Operations ==========

  /**
   * Bulk update appointment statuses
   */
  async bulkUpdateAppointmentStatuses(
    appointmentIds: string[],
    status: 'confirmed' | 'cancelled'
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/appointments/bulk/status`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify({ appointmentIds, status }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to bulk update appointments: ${response.statusText}`
        );
      }
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * Send bulk invitations
   */
  async sendBulkInvitations(
    studyId: string,
    participantIds: string[],
    message: string
  ): Promise<void> {
    try {
      const response = await fetch(
        `${this.baseUrl}/${studyId}/invitations/bulk`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ participantIds, message }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to send bulk invitations: ${response.statusText}`
        );
      }
    } catch (error) {
      return this.handleError(error);
    }
  }
}

// Export singleton instance
export const recruitmentAPI = new RecruitmentAPIService();
