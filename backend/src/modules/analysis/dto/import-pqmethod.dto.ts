import { IsEnum, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ImportPQMethodDto {
  @ApiPropertyOptional({
    type: 'string',
    format: 'binary',
    description: 'PQMethod DAT, STA, or LIS file',
  })
  file?: any;

  @ApiPropertyOptional({
    enum: ['centroid', 'pca', 'ml'],
    default: 'pca',
    description: 'Factor extraction method for analysis',
  })
  @IsEnum(['centroid', 'pca', 'ml'])
  @IsOptional()
  extractionMethod?: 'centroid' | 'pca' | 'ml' = 'pca';

  @ApiPropertyOptional({
    enum: ['varimax', 'quartimax', 'promax', 'oblimin', 'none'],
    default: 'varimax',
    description: 'Factor rotation method for analysis',
  })
  @IsEnum(['varimax', 'quartimax', 'promax', 'oblimin', 'none'])
  @IsOptional()
  rotationMethod?: 'varimax' | 'quartimax' | 'promax' | 'oblimin' | 'none' =
    'varimax';

  @ApiPropertyOptional({
    type: Number,
    description: 'Number of factors to extract',
    minimum: 1,
    maximum: 10,
  })
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  numberOfFactors?: number;
}
