import {
  IsEnum,
  IsNumber,
  IsBoolean,
  IsOptional,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PerformAnalysisDto {
  @ApiPropertyOptional({
    enum: ['centroid', 'pca', 'ml'],
    default: 'pca',
    description: 'Factor extraction method',
  })
  @IsEnum(['centroid', 'pca', 'ml'])
  @IsOptional()
  extractionMethod?: 'centroid' | 'pca' | 'ml' = 'pca';

  @ApiPropertyOptional({
    enum: ['varimax', 'quartimax', 'promax', 'oblimin', 'none'],
    default: 'varimax',
    description: 'Factor rotation method',
  })
  @IsEnum(['varimax', 'quartimax', 'promax', 'oblimin', 'none'])
  @IsOptional()
  rotationMethod?: 'varimax' | 'quartimax' | 'promax' | 'oblimin' | 'none' =
    'varimax';

  @ApiPropertyOptional({
    type: Number,
    description:
      'Number of factors to extract (null for automatic determination)',
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  numberOfFactors?: number | null = null;

  @ApiPropertyOptional({
    type: Boolean,
    default: true,
    description: 'Perform bootstrap analysis for confidence intervals',
  })
  @IsBoolean()
  @IsOptional()
  performBootstrap?: boolean = true;

  @ApiPropertyOptional({
    type: Number,
    default: 1000,
    description: 'Number of bootstrap iterations',
    minimum: 100,
    maximum: 10000,
  })
  @IsNumber()
  @Min(100)
  @Max(10000)
  @IsOptional()
  bootstrapIterations?: number = 1000;

  @ApiPropertyOptional({
    type: Number,
    default: 0.05,
    description: 'Significance level for distinguishing statements',
    minimum: 0.01,
    maximum: 0.1,
  })
  @IsNumber()
  @Min(0.01)
  @Max(0.1)
  @IsOptional()
  significanceLevel?: number = 0.05;

  @ApiPropertyOptional({
    type: Number,
    default: 0.5,
    description: 'Threshold for consensus statements',
    minimum: 0.1,
    maximum: 1.0,
  })
  @IsNumber()
  @Min(0.1)
  @Max(1.0)
  @IsOptional()
  consensusThreshold?: number = 0.5;
}
