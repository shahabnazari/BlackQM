import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../common/prisma.service';
import { WebSocketService } from '../../../services/websocket.service';
import { CacheService } from '../../../common/cache.service';
import { EmailService } from '../../email/services/email.service';
import { addDays, addHours, startOfDay, endOfDay, format, isAfter, isBefore } from 'date-fns';

export interface AppointmentDto {
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
  compensation?: CompensationDto;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlotDto {
  start: Date;
  end: Date;
  available: boolean;
  capacity: number;
  booked: number;
}

export interface AvailabilityDto {
  studyId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  timezone: string;
  slotDuration: number;
  bufferTime: number;
  maxParticipantsPerSlot: number;
}

export interface CompensationDto {
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

export interface ReminderDto {
  id: string;
  appointmentId: string;
  type: 'email' | 'sms';
  scheduledFor: Date;
  sentAt?: Date;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
}

export interface RecruitmentMetricsDto {
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

@Injectable()
export class SchedulingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly wsService: WebSocketService,
    private readonly cache: CacheService,
    private readonly emailService: EmailService,
  ) {
    this.initializeReminderJob();
  }

  // ========== Appointment Management ==========

  async createAppointment(
    studyId: string,
    participantId: string,
    scheduledStart: Date,
    scheduledEnd: Date,
    type: 'online' | 'in-person' | 'phone' = 'online',
    location?: string
  ): Promise<AppointmentDto> {
    // Validate time slot availability
    const isAvailable = await this.checkSlotAvailability(studyId, scheduledStart, scheduledEnd);
    if (!isAvailable) {
      throw new BadRequestException('This time slot is not available');
    }

    // Get participant details
    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      select: { email: true, name: true },
    });

    // Create appointment
    const appointment = await this.prisma.appointment.create({
      data: {
        studyId,
        participantId,
        scheduledStart,
        scheduledEnd,
        status: 'scheduled',
        type,
        location,
        meetingUrl: type === 'online' ? await this.generateMeetingUrl(studyId, participantId) : undefined,
        remindersSent: 0,
      },
    });

    // Schedule reminders
    await this.scheduleReminders(appointment.id, scheduledStart, participant?.email);

    // Clear cache
    await this.cache.delete(`study:${studyId}:appointments`);
    await this.cache.delete(`study:${studyId}:slots`);

    // Notify via WebSocket
    this.wsService.emitToRoom(`study:${studyId}`, 'scheduling', {
      type: 'appointment_created',
      data: appointment,
    });

    return this.mapToAppointmentDto(appointment, participant);
  }

  async updateAppointment(
    appointmentId: string,
    updates: Partial<AppointmentDto>
  ): Promise<AppointmentDto> {
    const existing = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { participant: true },
    });

    if (!existing) {
      throw new NotFoundException('Appointment not found');
    }

    // If rescheduling, check new slot availability
    if (updates.scheduledStart && updates.scheduledEnd) {
      const isAvailable = await this.checkSlotAvailability(
        existing.studyId,
        updates.scheduledStart,
        updates.scheduledEnd,
        appointmentId // Exclude current appointment from check
      );

      if (!isAvailable) {
        throw new BadRequestException('New time slot is not available');
      }

      // Reschedule reminders
      await this.rescheduleReminders(appointmentId, updates.scheduledStart);
    }

    // Convert DTO fields to Prisma fields
    const updateData: any = {};
    if (updates.scheduledStart) updateData.scheduledStart = updates.scheduledStart;
    if (updates.scheduledEnd) updateData.scheduledEnd = updates.scheduledEnd;
    if (updates.status) updateData.status = updates.status;
    if (updates.type) updateData.type = updates.type;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.meetingUrl !== undefined) updateData.meetingUrl = updates.meetingUrl;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const updated = await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: { participant: true },
    });

    // Clear cache
    await this.cache.delete(`study:${existing.studyId}:appointments`);
    await this.cache.delete(`study:${existing.studyId}:slots`);

    // Notify via WebSocket
    this.wsService.emitToRoom(`study:${existing.studyId}`, 'scheduling', {
      type: 'appointment_updated',
      data: updated,
    });

    return this.mapToAppointmentDto(updated);
  }

  async cancelAppointment(appointmentId: string, reason?: string): Promise<void> {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'cancelled',
        notes: reason,
        updatedAt: new Date(),
      },
    });

    // Cancel reminders
    await this.cancelReminders(appointmentId);

    // Clear cache
    await this.cache.delete(`study:${appointment.studyId}:appointments`);
    await this.cache.delete(`study:${appointment.studyId}:slots`);

    // Notify via WebSocket
    this.wsService.emitToRoom(`study:${appointment.studyId}`, 'scheduling', {
      type: 'appointment_cancelled',
      data: { appointmentId, reason },
    });
  }

  async markAppointmentCompleted(appointmentId: string): Promise<void> {
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'completed',
        updatedAt: new Date(),
      },
    });
  }

  async markNoShow(appointmentId: string): Promise<void> {
    await this.prisma.appointment.update({
      where: { id: appointmentId },
      data: {
        status: 'no-show',
        updatedAt: new Date(),
      },
    });
  }

  async getAppointments(
    studyId: string,
    filters?: {
      status?: string;
      startDate?: Date;
      endDate?: Date;
      participantId?: string;
    }
  ): Promise<AppointmentDto[]> {
    const where: any = { studyId };

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.participantId) {
      where.participantId = filters.participantId;
    }
    if (filters?.startDate || filters?.endDate) {
      where.scheduledStart = {};
      if (filters.startDate) {
        where.scheduledStart.gte = filters.startDate;
      }
      if (filters.endDate) {
        where.scheduledStart.lte = filters.endDate;
      }
    }

    const appointments = await this.prisma.appointment.findMany({
      where,
      include: {
        participant: true,
        compensation: true,
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    return appointments.map(a => this.mapToAppointmentDto(a));
  }

  // ========== Availability Management ==========

  async setStudyAvailability(
    studyId: string,
    availability: AvailabilityDto[]
  ): Promise<void> {
    // Clear existing availability
    await this.prisma.studyAvailability.deleteMany({
      where: { studyId },
    });

    // Create new availability
    await this.prisma.studyAvailability.createMany({
      data: availability.map(a => ({
        ...a,
        studyId,
      })),
    });

    // Clear cache
    await this.cache.delete(`study:${studyId}:availability`);
    await this.cache.delete(`study:${studyId}:slots`);
  }

  async getAvailableSlots(
    studyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<TimeSlotDto[]> {
    // Check cache first
    const cacheKey = `study:${studyId}:slots:${startDate.getTime()}-${endDate.getTime()}`;
    const cached = await this.cache.get(cacheKey) as TimeSlotDto[] | null;
    if (cached) return cached;

    // Get study availability settings
    const availability = await this.prisma.studyAvailability.findMany({
      where: { studyId },
    });

    if (!availability.length) {
      return [];
    }

    // Get existing appointments
    const appointments = await this.prisma.appointment.findMany({
      where: {
        studyId,
        scheduledStart: {
          gte: startDate,
          lte: endDate,
        },
        status: {
          notIn: ['cancelled'],
        },
      },
    });

    // Generate time slots
    const slots: TimeSlotDto[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      const dayAvailability = availability.find(a => a.dayOfWeek === dayOfWeek);

      if (dayAvailability) {
        const daySlots = this.generateDaySlots(
          current,
          dayAvailability,
          appointments
        );
        slots.push(...daySlots);
      }

      current.setDate(current.getDate() + 1);
    }

    // Cache for 5 minutes
    await this.cache.set(cacheKey, slots, 300);

    return slots;
  }

  private generateDaySlots(
    date: Date,
    availability: any,
    appointments: any[]
  ): TimeSlotDto[] {
    const slots: TimeSlotDto[] = [];
    const [startHour, startMinute] = availability.startTime.split(':').map(Number);
    const [endHour, endMinute] = availability.endTime.split(':').map(Number);

    const slotStart = new Date(date);
    slotStart.setHours(startHour, startMinute, 0, 0);

    const dayEnd = new Date(date);
    dayEnd.setHours(endHour, endMinute, 0, 0);

    while (slotStart < dayEnd) {
      const slotEnd = new Date(slotStart);
      slotEnd.setMinutes(slotEnd.getMinutes() + availability.slotDuration);

      // Count appointments in this slot
      const booked = appointments.filter(a => 
        a.scheduledStart >= slotStart && 
        a.scheduledStart < slotEnd &&
        a.status !== 'cancelled'
      ).length;

      slots.push({
        start: new Date(slotStart),
        end: new Date(slotEnd),
        available: booked < availability.maxParticipantsPerSlot,
        capacity: availability.maxParticipantsPerSlot,
        booked,
      });

      // Move to next slot with buffer time
      slotStart.setMinutes(
        slotStart.getMinutes() + 
        availability.slotDuration + 
        availability.bufferTime
      );
    }

    return slots;
  }

  private async checkSlotAvailability(
    studyId: string,
    start: Date,
    end: Date,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    const where: any = {
      studyId,
      scheduledStart: {
        lte: end,
      },
      scheduledEnd: {
        gte: start,
      },
      status: {
        notIn: ['cancelled'],
      },
    };

    if (excludeAppointmentId) {
      where.id = { not: excludeAppointmentId };
    }

    const conflicting = await this.prisma.appointment.count({ where });

    // Get availability settings for this time
    const dayOfWeek = start.getDay();
    const availability = await this.prisma.studyAvailability.findFirst({
      where: {
        studyId,
        dayOfWeek,
      },
    });

    if (!availability) {
      return false; // No availability set for this day
    }

    return conflicting < availability.maxParticipantsPerSlot;
  }

  // ========== Compensation Tracking ==========

  async addCompensation(
    appointmentId: string,
    amount: number,
    method: 'cash' | 'check' | 'gift_card' | 'bank_transfer' | 'other',
    currency = 'USD'
  ): Promise<CompensationDto> {
    // Get the appointment to get participantId
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: { participantId: true },
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    const compensation = await this.prisma.compensation.create({
      data: {
        appointmentId,
        participantId: appointment.participantId,
        amount,
        currency,
        method,
        status: 'pending',
      },
    });

    return this.mapToCompensationDto(compensation);
  }

  async updateCompensationStatus(
    compensationId: string,
    status: 'approved' | 'paid' | 'cancelled',
    reference?: string
  ): Promise<CompensationDto> {
    const updated = await this.prisma.compensation.update({
      where: { id: compensationId },
      data: {
        status,
        reference,
        paidAt: status === 'paid' ? new Date() : undefined,
      },
    });

    return this.mapToCompensationDto(updated);
  }

  async getCompensationSummary(studyId: string): Promise<any> {
    const compensations = await this.prisma.compensation.findMany({
      where: {
        appointment: {
          studyId,
        },
      },
      include: {
        appointment: true,
      },
    });

    const summary = {
      total: compensations.reduce((sum, c) => sum + c.amount, 0),
      paid: compensations
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.amount, 0),
      pending: compensations
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.amount, 0),
      byMethod: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    // Group by method and status
    compensations.forEach(c => {
      summary.byMethod[c.method] = (summary.byMethod[c.method] || 0) + c.amount;
      summary.byStatus[c.status] = (summary.byStatus[c.status] || 0) + c.amount;
    });

    return summary;
  }

  // ========== Reminder System ==========

  async scheduleReminders(
    appointmentId: string,
    appointmentTime: Date,
    email?: string
  ): Promise<void> {
    const reminders = [
      { type: 'email', hoursBefore: 48 },
      { type: 'email', hoursBefore: 24 },
      { type: 'email', hoursBefore: 2 },
    ];

    for (const reminder of reminders) {
      const scheduledFor = new Date(appointmentTime);
      scheduledFor.setHours(scheduledFor.getHours() - reminder.hoursBefore);

      if (scheduledFor > new Date()) {
        await this.prisma.reminder.create({
          data: {
            appointmentId,
            type: reminder.type as any,
            scheduledFor,
            status: 'pending',
            attempts: 0,
          },
        });
      }
    }
  }

  async rescheduleReminders(appointmentId: string, newTime: Date): Promise<void> {
    // Cancel existing reminders
    await this.cancelReminders(appointmentId);

    // Schedule new reminders
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { participant: true },
    });

    if (appointment) {
      await this.scheduleReminders(
        appointmentId,
        newTime,
        appointment.participant?.email
      );
    }
  }

  async cancelReminders(appointmentId: string): Promise<void> {
    await this.prisma.reminder.updateMany({
      where: {
        appointmentId,
        status: 'pending',
      },
      data: {
        status: 'cancelled',
      },
    });
  }

  private async initializeReminderJob(): Promise<void> {
    // This would be better implemented with a job queue like Bull
    // For now, using a simple interval
    setInterval(async () => {
      await this.processReminders();
    }, 60000); // Check every minute
  }

  private async processReminders(): Promise<void> {
    const pendingReminders = await this.prisma.reminder.findMany({
      where: {
        status: 'pending',
        scheduledFor: {
          lte: new Date(),
        },
      },
      include: {
        appointment: {
          include: {
            participant: true,
          },
        },
      },
    });

    for (const reminder of pendingReminders) {
      try {
        await this.sendReminder(reminder);
        
        await this.prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
          },
        });

        // Update appointment reminder count
        await this.prisma.appointment.update({
          where: { id: reminder.appointmentId },
          data: {
            remindersSent: {
              increment: 1,
            },
          },
        });
      } catch (error: any) {
        console.error(`Failed to send reminder ${reminder.id}:`, error);
        
        await this.prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            attempts: {
              increment: 1,
            },
            status: reminder.attempts >= 2 ? 'failed' : 'pending',
          },
        });
      }
    }
  }

  private async sendReminder(reminder: any): Promise<void> {
    const appointment = reminder.appointment;
    const participant = appointment.participant;

    if (reminder.type === 'email' && participant.email) {
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4F46E5; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
              .content { background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; }
              .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin-top: 20px; }
              .details { background-color: white; padding: 15px; border-radius: 6px; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h2>Study Appointment Reminder</h2>
              </div>
              <div class="content">
                <p>Dear ${participant.name || 'Participant'},</p>
                <p>This is a reminder about your upcoming study appointment.</p>
                
                <div class="details">
                  <h3>Appointment Details:</h3>
                  <p><strong>Date:</strong> ${format(new Date(appointment.scheduledStart), 'PPPP')}</p>
                  <p><strong>Time:</strong> ${format(new Date(appointment.scheduledStart), 'p')}</p>
                  <p><strong>Type:</strong> ${appointment.type}</p>
                  ${appointment.location ? `<p><strong>Location:</strong> ${appointment.location}</p>` : ''}
                  ${appointment.meetingUrl ? `<p><strong>Meeting Link:</strong> <a href="${appointment.meetingUrl}">${appointment.meetingUrl}</a></p>` : ''}
                </div>

                ${appointment.notes ? `<p><strong>Notes:</strong> ${appointment.notes}</p>` : ''}
                
                <p>If you need to reschedule or have any questions, please contact us.</p>
                
                <p>Best regards,<br>Research Team</p>
              </div>
            </div>
          </body>
        </html>
      `;

      await this.emailService.sendEmail({
        to: participant.email,
        subject: `Reminder: Study Appointment on ${format(new Date(appointment.scheduledStart), 'PPP')}`,
        html,
      });

      console.log(`Email reminder sent to ${participant.email} for appointment ${appointment.id}`);
    } else if (reminder.type === 'sms') {
      // SMS implementation would go here if needed
      console.log(`SMS reminders not yet implemented for appointment ${appointment.id}`);
    }
  }

  // ========== Recruitment Analytics ==========

  async getRecruitmentMetrics(studyId: string): Promise<RecruitmentMetricsDto> {
    // Check cache first
    const cacheKey = `study:${studyId}:recruitment:metrics`;
    const cached = await this.cache.get(cacheKey) as RecruitmentMetricsDto | null;
    if (cached) return cached;

    // Get all participants and appointments
    const [participants, appointments, compensations] = await Promise.all([
      this.prisma.participant.count({
        where: { studyId },
      }),
      this.prisma.appointment.findMany({
        where: { studyId },
      }),
      this.prisma.compensation.findMany({
        where: {
          appointment: { studyId },
        },
      }),
    ]);

    const scheduled = appointments.filter(a => 
      ['scheduled', 'confirmed', 'completed'].includes(a.status)
    ).length;
    
    const completed = appointments.filter(a => a.status === 'completed').length;
    const noShows = appointments.filter(a => a.status === 'no-show').length;

    const metrics: RecruitmentMetricsDto = {
      studyId,
      totalInvited: participants,
      totalScheduled: scheduled,
      totalCompleted: completed,
      totalNoShows: noShows,
      conversionRate: participants > 0 ? (scheduled / participants) * 100 : 0,
      averageTimeToSchedule: 0, // Would calculate from invitation to scheduling
      completionRate: scheduled > 0 ? (completed / scheduled) * 100 : 0,
      noShowRate: scheduled > 0 ? (noShows / scheduled) * 100 : 0,
      compensationTotal: compensations.reduce((sum, c) => sum + c.amount, 0),
      timeSlotUtilization: 0, // Would calculate from availability vs booked
    };

    // Cache for 10 minutes
    await this.cache.set(cacheKey, metrics, 600);

    return metrics;
  }

  // ========== Helper Methods ==========

  private async generateMeetingUrl(studyId: string, participantId: string): Promise<string> {
    // Generate unique meeting URL
    // This could integrate with Zoom, Google Meet, etc.
    return `https://meet.vqmethod.com/${studyId}/${participantId}/${Date.now()}`;
  }

  private mapToAppointmentDto(appointment: any, participant?: any): AppointmentDto {
    return {
      id: appointment.id,
      studyId: appointment.studyId,
      participantId: appointment.participantId,
      participantName: participant?.name || appointment.participant?.name,
      participantEmail: participant?.email || appointment.participant?.email,
      scheduledStart: appointment.scheduledStart,
      scheduledEnd: appointment.scheduledEnd,
      status: appointment.status,
      type: appointment.type,
      location: appointment.location,
      meetingUrl: appointment.meetingUrl,
      notes: appointment.notes,
      remindersSent: appointment.remindersSent,
      compensation: appointment.compensation ? 
        this.mapToCompensationDto(appointment.compensation) : undefined,
      createdAt: appointment.createdAt,
      updatedAt: appointment.updatedAt,
    };
  }

  private mapToCompensationDto(compensation: any): CompensationDto {
    return {
      id: compensation.id,
      appointmentId: compensation.appointmentId,
      amount: compensation.amount,
      currency: compensation.currency,
      method: compensation.method,
      status: compensation.status,
      paidAt: compensation.paidAt,
      reference: compensation.reference,
      notes: compensation.notes,
    };
  }
}