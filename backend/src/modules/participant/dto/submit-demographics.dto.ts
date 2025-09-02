import { IsString, IsOptional, IsIn, IsInt, Min, Max } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitDemographicsDto {
  @ApiPropertyOptional({ 
    description: 'Age range',
    enum: ['18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'prefer-not-say'],
  })
  @IsOptional()
  @IsIn(['18-24', '25-34', '35-44', '45-54', '55-64', '65+', 'prefer-not-say'])
  age?: string;

  @ApiPropertyOptional({ 
    description: 'Gender',
    enum: ['male', 'female', 'non-binary', 'other', 'prefer-not-say'],
  })
  @IsOptional()
  @IsIn(['male', 'female', 'non-binary', 'other', 'prefer-not-say'])
  gender?: string;

  @ApiPropertyOptional({ 
    description: 'Education level',
    enum: ['high-school', 'some-college', 'bachelors', 'masters', 'doctorate', 'other', 'prefer-not-say'],
  })
  @IsOptional()
  @IsIn(['high-school', 'some-college', 'bachelors', 'masters', 'doctorate', 'other', 'prefer-not-say'])
  education?: string;

  @ApiPropertyOptional({ description: 'Occupation' })
  @IsOptional()
  @IsString()
  occupation?: string;

  @ApiPropertyOptional({ description: 'Country' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ 
    description: 'Experience rating (1-5)',
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  experience?: number;

  @ApiPropertyOptional({ description: 'Additional feedback' })
  @IsOptional()
  @IsString()
  feedback?: string;
}