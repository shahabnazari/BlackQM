import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitPreSortDto {
  @ApiProperty({ 
    description: 'Statement IDs categorized as disagree',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  disagree!: string[];

  @ApiProperty({ 
    description: 'Statement IDs categorized as neutral',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  neutral!: string[];

  @ApiProperty({ 
    description: 'Statement IDs categorized as agree',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  agree!: string[];
}