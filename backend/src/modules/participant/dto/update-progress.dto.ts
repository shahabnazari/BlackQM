import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProgressDto {
  @ApiProperty({ description: 'Current step in the journey' })
  @IsString()
  currentStep!: string;

  @ApiPropertyOptional({ description: 'Step that was just completed' })
  @IsOptional()
  @IsString()
  completedStep?: string;

  @ApiPropertyOptional({ description: 'Data collected at this step' })
  @IsOptional()
  @IsObject()
  stepData?: any;
}