import { IsArray, IsInt, IsString, ValidateNested, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class CommentaryItemDto {
  @ApiProperty({ description: 'Statement ID' })
  @IsString()
  statementId!: string;

  @ApiProperty({ description: 'Position in the Q-sort grid' })
  @IsInt()
  position!: number;

  @ApiProperty({ 
    description: 'Commentary text (minimum 50 characters)',
    minLength: 50,
  })
  @IsString()
  @MinLength(50)
  comment!: string;
}

export class SubmitCommentaryDto {
  @ApiProperty({ 
    description: 'Commentary for extreme positions',
    type: [CommentaryItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommentaryItemDto)
  commentaries!: CommentaryItemDto[];
}