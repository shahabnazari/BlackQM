import { IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExportAnalysisDto {
  @ApiPropertyOptional({
    enum: ['pqmethod', 'csv', 'excel', 'spss', 'r'],
    default: 'pqmethod',
    description: 'Export format',
  })
  @IsEnum(['pqmethod', 'csv', 'excel', 'spss', 'r'])
  @IsOptional()
  format?: 'pqmethod' | 'csv' | 'excel' | 'spss' | 'r' = 'pqmethod';

  @ApiPropertyOptional({
    type: Boolean,
    default: true,
    description: 'Include raw data in export',
  })
  @IsBoolean()
  @IsOptional()
  includeRawData?: boolean = true;

  @ApiPropertyOptional({
    type: Boolean,
    default: true,
    description: 'Include statistical outputs in export',
  })
  @IsBoolean()
  @IsOptional()
  includeStatistics?: boolean = true;

  @ApiPropertyOptional({
    type: Boolean,
    default: true,
    description: 'Include visualizations in export',
  })
  @IsBoolean()
  @IsOptional()
  includeVisualizations?: boolean = true;
}
