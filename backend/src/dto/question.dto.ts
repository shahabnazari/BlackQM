import { 
  IsString, 
  IsNotEmpty, 
  IsEnum, 
  IsBoolean, 
  IsInt, 
  IsOptional, 
  IsObject, 
  Min, 
  ValidateNested,
  IsArray,
  IsUUID 
} from 'class-validator';
import { Type } from 'class-transformer';
import { QuestionType } from '@prisma/client';

/**
 * Phase 8.2 Day 1: World-Class Question DTOs
 * 
 * Advanced validation with full type safety
 * Supports all 15+ question types
 * Dynamic validation rules
 * Skip logic support
 */

// Base validation rules that can be applied to any question
export class ValidationRulesDto {
  @IsOptional()
  @IsInt()
  minLength?: number;

  @IsOptional()
  @IsInt()
  maxLength?: number;

  @IsOptional()
  @IsInt()
  minValue?: number;

  @IsOptional()
  @IsInt()
  maxValue?: number;

  @IsOptional()
  @IsString()
  pattern?: string; // Regex pattern

  @IsOptional()
  @IsString()
  customError?: string; // Custom error message

  @IsOptional()
  @IsBoolean()
  allowDecimals?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedValues?: string[];
}

// Options for multiple choice questions
export class AnswerOptionDto {
  @IsString()
  @IsNotEmpty()
  value!: string;

  @IsString()
  @IsNotEmpty()
  label!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  exclusive?: boolean; // For "None of the above" type options

  @IsOptional()
  @IsInt()
  weight?: number; // For scoring

  @IsOptional()
  @IsString()
  color?: string; // For visual differentiation
}

// Skip logic conditions
export class SkipConditionDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsEnum(['equals', 'not_equals', 'contains', 'greater_than', 'less_than', 'in', 'not_in'])
  operator!: string;

  @IsNotEmpty()
  value: any;

  @IsEnum(['and', 'or'])
  @IsOptional()
  combinator?: 'and' | 'or';
}

// Skip logic rules
export class SkipLogicDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SkipConditionDto)
  conditions!: SkipConditionDto[];

  @IsEnum(['skip_to', 'show', 'hide', 'end_survey'])
  action!: string;

  @IsOptional()
  @IsString()
  targetQuestionId?: string;

  @IsOptional()
  @IsString()
  message?: string; // For end_survey action
}

// Create question DTO
export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  surveyId!: string;

  @IsEnum(QuestionType)
  type!: QuestionType;

  @IsString()
  @IsNotEmpty()
  text!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean = true;

  @IsInt()
  @Min(0)
  order!: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ValidationRulesDto)
  validation?: ValidationRulesDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerOptionDto)
  options?: AnswerOptionDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SkipLogicDto)
  logic?: SkipLogicDto;

  // Matrix-specific fields
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  rows?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  columns?: string[];

  // Rating/Scale specific
  @IsOptional()
  @IsInt()
  @Min(2)
  scalePoints?: number;

  @IsOptional()
  @IsString()
  minLabel?: string;

  @IsOptional()
  @IsString()
  maxLabel?: string;

  @IsOptional()
  @IsString()
  midLabel?: string;

  // Randomization
  @IsOptional()
  @IsBoolean()
  randomizeOptions?: boolean;

  @IsOptional()
  @IsBoolean()
  randomizeRows?: boolean;

  // Display settings
  @IsOptional()
  @IsEnum(['vertical', 'horizontal', 'grid', 'carousel'])
  displayMode?: string;

  @IsOptional()
  @IsBoolean()
  showLabels?: boolean;

  @IsOptional()
  @IsString()
  placeholder?: string;

  // Advanced features
  @IsOptional()
  @IsBoolean()
  allowOther?: boolean;

  @IsOptional()
  @IsString()
  otherLabel?: string;

  @IsOptional()
  @IsBoolean()
  enableComment?: boolean;

  @IsOptional()
  @IsString()
  commentLabel?: string;
}

// Update question DTO
export class UpdateQuestionDto {
  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ValidationRulesDto)
  validation?: ValidationRulesDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerOptionDto)
  options?: AnswerOptionDto[];

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => SkipLogicDto)
  logic?: SkipLogicDto;
}

// Bulk update order DTO
export class UpdateQuestionOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuestionOrderItem)
  questions!: QuestionOrderItem[];
}

class QuestionOrderItem {
  @IsString()
  @IsNotEmpty()
  id!: string;

  @IsInt()
  @Min(0)
  order!: number;
}

// Query filter DTO
export class QueryQuestionDto {
  @IsOptional()
  @IsString()
  surveyId?: string;

  @IsOptional()
  @IsEnum(QuestionType)
  type?: QuestionType;

  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  page?: number = 0;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @IsOptional()
  @IsEnum(['order', 'createdAt', 'updatedAt'])
  sortBy?: string = 'order';

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'asc';
}

// Answer submission DTO
export class SubmitAnswerDto {
  @IsString()
  @IsNotEmpty()
  questionId!: string;

  @IsNotEmpty()
  value: any; // Can be string, number, array, object depending on question type

  @IsOptional()
  @IsString()
  otherValue?: string; // For "other" option

  @IsOptional()
  @IsString()
  comment?: string; // For optional comments

  @IsOptional()
  @IsInt()
  timeSpent?: number; // Time spent on question in seconds

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>; // Additional metadata
}

// Batch import questions DTO
export class ImportQuestionsDto {
  @IsString()
  @IsNotEmpty()
  surveyId!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions!: CreateQuestionDto[];

  @IsOptional()
  @IsBoolean()
  clearExisting?: boolean = false;
}

// Question template DTO
export class QuestionTemplateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  category!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions!: CreateQuestionDto[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];
}

// Export configuration DTO
export class ExportQuestionsDto {
  @IsString()
  @IsNotEmpty()
  surveyId!: string;

  @IsEnum(['json', 'csv', 'xlsx', 'qsf']) // QSF for Qualtrics compatibility
  format!: string;

  @IsOptional()
  @IsBoolean()
  includeLogic?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeValidation?: boolean = true;

  @IsOptional()
  @IsBoolean()
  includeAnswers?: boolean = false;
}