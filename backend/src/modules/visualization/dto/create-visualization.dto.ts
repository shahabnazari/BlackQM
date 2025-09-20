import { IsString, IsObject, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum VisualizationType {
  HEATMAP = 'heatmap',
  SCATTER = 'scatter',
  BAR = 'bar',
  LINE = 'line',
  FACTOR_LOADING = 'factor-loading',
  SCREE_PLOT = 'scree-plot',
  FACTOR_ARRAY = 'factor-array',
  DISTRIBUTION = 'distribution',
  SANKEY = 'sankey',
  NETWORK = 'network',
}

export enum ChartFormat {
  SVG = 'svg',
  PNG = 'png',
  PDF = 'pdf',
}

export class CreateVisualizationDto {
  @ApiProperty({
    description: 'Type of visualization',
    enum: VisualizationType,
  })
  @IsEnum(VisualizationType)
  type!: VisualizationType;

  @ApiProperty({
    description: 'Chart title',
    required: false,
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Chart width in pixels',
    minimum: 300,
    maximum: 2000,
    default: 800,
  })
  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(2000)
  width?: number;

  @ApiProperty({
    description: 'Chart height in pixels',
    minimum: 300,
    maximum: 2000,
    default: 600,
  })
  @IsOptional()
  @IsNumber()
  @Min(300)
  @Max(2000)
  height?: number;

  @ApiProperty({
    description: 'Output format',
    enum: ChartFormat,
    default: ChartFormat.SVG,
  })
  @IsOptional()
  @IsEnum(ChartFormat)
  format?: ChartFormat;

  @ApiProperty({
    description: 'Chart configuration options',
    required: false,
  })
  @IsOptional()
  @IsObject()
  options?: Record<string, any>;

  @ApiProperty({
    description: 'Custom data for visualization',
    required: false,
  })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;
}