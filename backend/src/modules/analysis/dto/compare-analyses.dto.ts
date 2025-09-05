import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompareAnalysesDto {
  @ApiProperty({
    description: 'First analysis ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  analysisId1!: string;

  @ApiProperty({
    description: 'Second analysis ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @IsUUID()
  analysisId2!: string;
}
