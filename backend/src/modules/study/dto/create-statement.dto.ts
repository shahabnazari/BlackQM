import { IsString, IsOptional, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateStatementDto {
  @ApiProperty({ description: 'Statement text' })
  @IsString()
  text!: string;

  @ApiPropertyOptional({ 
    description: 'Display order of the statement',
    minimum: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  order?: number;
}