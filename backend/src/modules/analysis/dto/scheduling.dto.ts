import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsDate,
  IsEnum,
  IsOptional,
  IsNumber,
  IsArray,
  Min,
  Max,
  IsDateString,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum AppointmentStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no-show',
}

export enum AppointmentType {
  ONLINE = 'online',
  IN_PERSON = 'in-person',
  PHONE = 'phone',
}

export enum CompensationMethod {
  CASH = 'cash',
  CHECK = 'check',
  GIFT_CARD = 'gift_card',
  BANK_TRANSFER = 'bank_transfer',
  OTHER = 'other',
}

export enum CompensationStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  PAID = 'paid',
  CANCELLED = 'cancelled',
}

export class CreateAppointmentDto {
  @ApiProperty()
  @IsUUID()
  studyId!: string;

  @ApiProperty()
  @IsUUID()
  participantId!: string;

  @ApiProperty()
  @IsDateString()
  scheduledStart!: string;

  @ApiProperty()
  @IsDateString()
  scheduledEnd!: string;

  @ApiProperty({ enum: AppointmentType, default: AppointmentType.ONLINE })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;
}

export class UpdateAppointmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledStart?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  scheduledEnd?: string;

  @ApiProperty({ enum: AppointmentStatus, required: false })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @ApiProperty({ enum: AppointmentType, required: false })
  @IsOptional()
  @IsEnum(AppointmentType)
  type?: AppointmentType;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CancelAppointmentDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class AvailabilityDto {
  @ApiProperty({ minimum: 0, maximum: 6 })
  @IsNumber()
  @Min(0)
  @Max(6)
  dayOfWeek!: number;

  @ApiProperty({ example: '09:00' })
  @IsString()
  startTime!: string;

  @ApiProperty({ example: '17:00' })
  @IsString()
  endTime!: string;

  @ApiProperty({ default: 'UTC' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiProperty({ default: 60 })
  @IsOptional()
  @IsNumber()
  @Min(15)
  @Max(240)
  slotDuration?: number;

  @ApiProperty({ default: 15 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(60)
  bufferTime?: number;

  @ApiProperty({ default: 1 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  maxParticipantsPerSlot?: number;
}

export class SetAvailabilityDto {
  @ApiProperty({ type: [AvailabilityDto] })
  @IsArray()
  @Type(() => AvailabilityDto)
  availability!: AvailabilityDto[];
}

export class AddCompensationDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  amount!: number;

  @ApiProperty({ enum: CompensationMethod })
  @IsEnum(CompensationMethod)
  method!: CompensationMethod;

  @ApiProperty({ default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class UpdateCompensationStatusDto {
  @ApiProperty({ enum: CompensationStatus })
  @IsEnum(CompensationStatus)
  status!: CompensationStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  reference?: string;
}

export class ScheduleRemindersDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  email?: string;
}

export class RescheduleRemindersDto {
  @ApiProperty()
  @IsDateString()
  newTime!: string;
}

export class GetAppointmentsQueryDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  participantId?: string;
}

export class GetAvailableSlotsQueryDto {
  @ApiProperty()
  @IsDateString()
  startDate!: string;

  @ApiProperty()
  @IsDateString()
  endDate!: string;
}

export class AppointmentDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  studyId!: string;

  @ApiProperty()
  participantId!: string;

  @ApiProperty()
  participantName?: string;

  @ApiProperty()
  participantEmail?: string;

  @ApiProperty()
  scheduledStart!: Date;

  @ApiProperty()
  scheduledEnd!: Date;

  @ApiProperty({ enum: AppointmentStatus })
  status!: AppointmentStatus;

  @ApiProperty({ enum: AppointmentType })
  type!: AppointmentType;

  @ApiProperty()
  location?: string;

  @ApiProperty()
  meetingUrl?: string;

  @ApiProperty()
  notes?: string;

  @ApiProperty()
  remindersSent!: number;

  @ApiProperty()
  compensation?: any;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class TimeSlotDto {
  @ApiProperty()
  start!: Date;

  @ApiProperty()
  end!: Date;

  @ApiProperty()
  available!: boolean;

  @ApiProperty()
  capacity!: number;

  @ApiProperty()
  booked!: number;
}

export class RecruitmentMetricsDto {
  @ApiProperty()
  studyId!: string;

  @ApiProperty()
  totalInvited!: number;

  @ApiProperty()
  totalScheduled!: number;

  @ApiProperty()
  totalCompleted!: number;

  @ApiProperty()
  totalNoShows!: number;

  @ApiProperty()
  conversionRate!: number;

  @ApiProperty()
  averageTimeToSchedule!: number;

  @ApiProperty()
  completionRate!: number;

  @ApiProperty()
  noShowRate!: number;

  @ApiProperty()
  compensationTotal!: number;

  @ApiProperty()
  timeSlotUtilization!: number;
}
