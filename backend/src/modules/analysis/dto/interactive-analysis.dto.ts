import {
  IsEnum,
  IsNumber,
  IsArray,
  IsOptional,
  IsString,
  IsObject,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class RotationHistoryItem {
  @ApiProperty({ description: 'First factor index (0-based)' })
  @IsNumber()
  factor1!: number;

  @ApiProperty({ description: 'Second factor index (0-based)' })
  @IsNumber()
  factor2!: number;

  @ApiProperty({ description: 'Rotation angle in radians' })
  @IsNumber()
  angle!: number;
}

export class InteractiveAnalysisDto {
  @ApiPropertyOptional({
    description: 'Session ID for continuing existing session',
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiProperty({
    enum: ['centroid', 'pca', 'ml'],
    default: 'pca',
    description: 'Factor extraction method',
  })
  @IsEnum(['centroid', 'pca', 'ml'])
  extractionMethod: 'centroid' | 'pca' | 'ml' = 'pca';

  @ApiProperty({
    type: Number,
    description: 'Number of factors to extract',
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  numberOfFactors!: number;

  @ApiPropertyOptional({
    type: [RotationHistoryItem],
    description: 'History of applied rotations',
  })
  @IsArray()
  @Type(() => RotationHistoryItem)
  @IsOptional()
  rotationHistory?: RotationHistoryItem[];

  @ApiPropertyOptional({
    description: 'Cached extraction results to avoid recalculation',
  })
  @IsObject()
  @IsOptional()
  cachedExtraction?: any;
}
