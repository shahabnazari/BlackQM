import {
  IsArray,
  IsEnum,
  IsOptional,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VisualizationType, ChartFormat } from './create-visualization.dto';

export class ChartExportConfig {
  @ApiProperty({
    description: 'Chart type',
    enum: VisualizationType,
  })
  @IsEnum(VisualizationType)
  type!: VisualizationType;

  @ApiProperty({
    description: 'Include in export',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  include?: boolean;

  @ApiProperty({
    description: 'Custom options for this chart',
    required: false,
  })
  @IsOptional()
  options?: Record<string, any>;
}

export class ExportVisualizationDto {
  @ApiProperty({
    description: 'Charts to export',
    type: [ChartExportConfig],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChartExportConfig)
  charts!: ChartExportConfig[];

  @ApiProperty({
    description: 'Export format',
    enum: ChartFormat,
    default: ChartFormat.PDF,
  })
  @IsEnum(ChartFormat)
  format!: ChartFormat;

  @ApiProperty({
    description: 'Combine into single file',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  combine?: boolean;

  @ApiProperty({
    description: 'Include metadata',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeMetadata?: boolean;

  @ApiProperty({
    description: 'Include timestamps',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  includeTimestamps?: boolean;
}
