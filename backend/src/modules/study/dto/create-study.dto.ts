import { IsString, IsOptional, IsInt, IsBoolean, IsEnum, Min, Max, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStudyDto {
  @ApiProperty({ description: 'Study title' })
  @IsString()
  title!: string;

  @ApiPropertyOptional({ description: 'Study description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Welcome message for participants' })
  @IsOptional()
  @IsString()
  welcomeMessage?: string;

  @ApiPropertyOptional({ description: 'Consent form text' })
  @IsOptional()
  @IsString()
  consentText?: string;

  @ApiPropertyOptional({ 
    description: 'Number of columns in Q-sort grid',
    minimum: 5,
    maximum: 13,
    default: 9,
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(13)
  gridColumns?: number;

  @ApiPropertyOptional({ 
    description: 'Grid distribution shape',
    enum: ['forced', 'free', 'quasi-normal'],
    default: 'quasi-normal',
  })
  @IsOptional()
  @IsIn(['forced', 'free', 'quasi-normal'])
  gridShape?: string;

  @ApiPropertyOptional({ 
    description: 'Enable pre-screening questions',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  enablePreScreening?: boolean;

  @ApiPropertyOptional({ 
    description: 'Enable post-sort survey',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  enablePostSurvey?: boolean;

  @ApiPropertyOptional({ 
    description: 'Enable video conferencing support',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  enableVideoConferencing?: boolean;

  @ApiPropertyOptional({ 
    description: 'Maximum number of responses allowed',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxResponses?: number;

  @ApiPropertyOptional({ 
    description: 'Additional settings as JSON',
  })
  @IsOptional()
  settings?: any;
}