import { IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ManualRotationDto {
  @ApiProperty({
    description: 'First factor index (0-based)',
    minimum: 0,
    maximum: 9,
  })
  @IsNumber()
  @Min(0)
  @Max(9)
  factor1!: number;

  @ApiProperty({
    description: 'Second factor index (0-based)',
    minimum: 0,
    maximum: 9,
  })
  @IsNumber()
  @Min(0)
  @Max(9)
  factor2!: number;

  @ApiProperty({
    description: 'Rotation angle in degrees',
    minimum: -180,
    maximum: 180,
  })
  @IsNumber()
  @Min(-180)
  @Max(180)
  angleDegrees!: number;
}
