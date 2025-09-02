import { IsArray, IsInt, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class GridColumnDto {
  @ApiProperty({ description: 'Column position (e.g., -4 to 4)' })
  @IsInt()
  position!: number;

  @ApiProperty({ 
    description: 'Statement IDs in this column',
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  statementIds!: string[];
}

export class SubmitQSortDto {
  @ApiProperty({ 
    description: 'Q-sort grid data',
    type: [GridColumnDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GridColumnDto)
  grid!: GridColumnDto[];
}