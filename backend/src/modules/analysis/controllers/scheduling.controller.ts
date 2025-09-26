import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SchedulingService } from '../services/scheduling.service';

@ApiTags('Scheduling')
@Controller('scheduling')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SchedulingController {
  constructor(private readonly schedulingService: SchedulingService) {}

  // ========== Appointments ==========

  @Post('appointments')
  @ApiOperation({ summary: 'Create a new appointment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Appointment created successfully',
  })
  async createAppointment(
    @Body()
    body: {
      studyId: string;
      participantId: string;
      scheduledStart: Date;
      scheduledEnd: Date;
      type?: 'online' | 'in-person' | 'phone';
      location?: string;
    },
  ) {
    return await this.schedulingService.createAppointment(
      body.studyId,
      body.participantId,
      new Date(body.scheduledStart),
      new Date(body.scheduledEnd),
      body.type,
      body.location,
    );
  }

  @Get('study/:studyId/appointments')
  @ApiOperation({ summary: 'Get appointments for a study' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns list of appointments',
  })
  async getAppointments(
    @Param('studyId') studyId: string,
    @Query()
    query: {
      status?: string;
      startDate?: string;
      endDate?: string;
      participantId?: string;
    },
  ) {
    const filters = {
      status: query.status,
      startDate: query.startDate ? new Date(query.startDate) : undefined,
      endDate: query.endDate ? new Date(query.endDate) : undefined,
      participantId: query.participantId,
    };

    return await this.schedulingService.getAppointments(studyId, filters);
  }

  @Put('appointments/:appointmentId')
  @ApiOperation({ summary: 'Update an appointment' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Appointment updated successfully',
  })
  async updateAppointment(
    @Param('appointmentId') appointmentId: string,
    @Body() body: any,
  ) {
    // Convert date strings to Date objects if present
    if (body.scheduledStart)
      body.scheduledStart = new Date(body.scheduledStart);
    if (body.scheduledEnd) body.scheduledEnd = new Date(body.scheduledEnd);

    return await this.schedulingService.updateAppointment(appointmentId, body);
  }

  @Delete('appointments/:appointmentId')
  @ApiOperation({ summary: 'Cancel an appointment' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Appointment cancelled',
  })
  async cancelAppointment(
    @Param('appointmentId') appointmentId: string,
    @Body() body: { reason?: string },
  ) {
    await this.schedulingService.cancelAppointment(appointmentId, body.reason);
    return { success: true };
  }

  @Put('appointments/:appointmentId/complete')
  @ApiOperation({ summary: 'Mark appointment as completed' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Appointment marked as completed',
  })
  async markCompleted(@Param('appointmentId') appointmentId: string) {
    await this.schedulingService.markAppointmentCompleted(appointmentId);
    return { success: true };
  }

  @Put('appointments/:appointmentId/no-show')
  @ApiOperation({ summary: 'Mark appointment as no-show' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Appointment marked as no-show',
  })
  async markNoShow(@Param('appointmentId') appointmentId: string) {
    await this.schedulingService.markNoShow(appointmentId);
    return { success: true };
  }

  // ========== Availability ==========

  @Post('study/:studyId/availability')
  @ApiOperation({ summary: 'Set study availability schedule' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Availability set successfully',
  })
  async setAvailability(
    @Param('studyId') studyId: string,
    @Body()
    body: {
      availability: Array<{
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        timezone: string;
        slotDuration: number;
        bufferTime: number;
        maxParticipantsPerSlot: number;
      }>;
    },
  ) {
    // Add studyId to each availability item
    const availabilityWithStudyId = body.availability.map((a) => ({
      ...a,
      studyId,
    }));
    await this.schedulingService.setStudyAvailability(
      studyId,
      availabilityWithStudyId,
    );
    return { success: true };
  }

  @Get('study/:studyId/slots')
  @ApiOperation({ summary: 'Get available time slots' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns available time slots',
  })
  async getAvailableSlots(
    @Param('studyId') studyId: string,
    @Query()
    query: {
      startDate: string;
      endDate: string;
    },
  ) {
    if (!query.startDate || !query.endDate) {
      throw new HttpException(
        'Start date and end date are required',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.schedulingService.getAvailableSlots(
      studyId,
      new Date(query.startDate),
      new Date(query.endDate),
    );
  }

  // ========== Compensation ==========

  @Post('appointments/:appointmentId/compensation')
  @ApiOperation({ summary: 'Add compensation record' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Compensation record created',
  })
  async addCompensation(
    @Param('appointmentId') appointmentId: string,
    @Body()
    body: {
      amount: number;
      method: 'cash' | 'check' | 'gift_card' | 'bank_transfer' | 'other';
      currency?: string;
    },
  ) {
    return await this.schedulingService.addCompensation(
      appointmentId,
      body.amount,
      body.method,
      body.currency,
    );
  }

  @Put('compensation/:compensationId')
  @ApiOperation({ summary: 'Update compensation status' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Compensation status updated',
  })
  async updateCompensationStatus(
    @Param('compensationId') compensationId: string,
    @Body()
    body: {
      status: 'approved' | 'paid' | 'cancelled';
      reference?: string;
    },
  ) {
    return await this.schedulingService.updateCompensationStatus(
      compensationId,
      body.status,
      body.reference,
    );
  }

  @Get('study/:studyId/compensation/summary')
  @ApiOperation({ summary: 'Get compensation summary for a study' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns compensation summary',
  })
  async getCompensationSummary(@Param('studyId') studyId: string) {
    return await this.schedulingService.getCompensationSummary(studyId);
  }

  // ========== Reminders ==========

  @Post('appointments/:appointmentId/reminders')
  @ApiOperation({ summary: 'Schedule reminders for an appointment' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Reminders scheduled',
  })
  async scheduleReminders(
    @Param('appointmentId') appointmentId: string,
    @Body() body: { email?: string },
  ) {
    // This would typically get appointment time from the appointment record
    const appointment = { scheduledStart: new Date() }; // Placeholder
    await this.schedulingService.scheduleReminders(
      appointmentId,
      appointment.scheduledStart,
      body.email,
    );
    return { success: true };
  }

  @Put('appointments/:appointmentId/reminders/reschedule')
  @ApiOperation({ summary: 'Reschedule reminders for an appointment' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Reminders rescheduled' })
  async rescheduleReminders(
    @Param('appointmentId') appointmentId: string,
    @Body() body: { newTime: Date },
  ) {
    await this.schedulingService.rescheduleReminders(
      appointmentId,
      new Date(body.newTime),
    );
    return { success: true };
  }

  @Delete('appointments/:appointmentId/reminders')
  @ApiOperation({ summary: 'Cancel reminders for an appointment' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Reminders cancelled',
  })
  async cancelReminders(@Param('appointmentId') appointmentId: string) {
    await this.schedulingService.cancelReminders(appointmentId);
    return { success: true };
  }

  // ========== Analytics ==========

  @Get('study/:studyId/metrics')
  @ApiOperation({ summary: 'Get recruitment metrics for a study' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns recruitment metrics',
  })
  async getRecruitmentMetrics(@Param('studyId') studyId: string) {
    return await this.schedulingService.getRecruitmentMetrics(studyId);
  }
}
