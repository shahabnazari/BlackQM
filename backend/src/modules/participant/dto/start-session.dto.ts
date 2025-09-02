import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StartSessionDto {
  @ApiProperty({ description: 'Study ID' })
  @IsString()
  studyId!: string;

  @ApiPropertyOptional({ description: 'Invitation code (if required)' })
  @IsOptional()
  @IsString()
  invitationCode?: string;
}