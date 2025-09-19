import { IsString, IsNumber, IsOptional, IsEnum, IsArray, Min, Max, IsBoolean } from 'class-validator';

// Grid Recommendation DTO
export class GridRecommendationDto {
  @IsString()
  studyTopic!: string;

  @IsNumber()
  @Min(10)
  @Max(100)
  expectedStatements!: number;

  @IsOptional()
  @IsString()
  participantExperience?: 'novice' | 'intermediate' | 'expert';

  @IsOptional()
  @IsString()
  researchType?: 'exploratory' | 'confirmatory' | 'comparative';
}

// Questionnaire Generation DTO
export class GenerateQuestionnaireDto {
  @IsString()
  studyTopic!: string;

  @IsNumber()
  @Min(5)
  @Max(50)
  questionCount!: number;

  @IsArray()
  @IsString({ each: true })
  questionTypes!: Array<'likert' | 'multipleChoice' | 'openEnded' | 'ranking' | 'demographic'>;

  @IsOptional()
  @IsString()
  targetAudience?: string;

  @IsOptional()
  @IsBoolean()
  includeSkipLogic?: boolean;
}

// Participant Assistance DTO
export class ParticipantAssistanceDto {
  @IsString()
  participantId!: string;

  @IsEnum(['consent', 'prescreening', 'presorting', 'qsort', 'postsurvey'])
  stage!: string;

  @IsOptional()
  context?: Record<string, any>;

  @IsOptional()
  @IsString()
  question?: string;
}

// Response Analysis DTO
export class AnalyzeResponsesDto {
  @IsArray()
  responses!: Array<{
    participantId: string;
    qsort: number[];
    surveyAnswers?: Record<string, any>;
    completionTime?: number;
  }>;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  analysisTypes?: Array<'patterns' | 'quality' | 'anomalies' | 'insights'>;
}

// Bias Detection DTO
export class BiasDetectionDto {
  @IsArray()
  @IsString({ each: true })
  statements!: string[];

  @IsOptional()
  @IsEnum(['quick', 'comprehensive'])
  analysisDepth?: 'quick' | 'comprehensive';

  @IsOptional()
  @IsBoolean()
  suggestAlternatives?: boolean;
}

// Statement Variations DTO
export class StatementVariationsDto {
  @IsString()
  originalStatement!: string;

  @IsNumber()
  @Min(1)
  @Max(10)
  variationCount!: number;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  perspectives?: string[];
}

// Budget Update DTO
export class UpdateBudgetDto {
  @IsNumber()
  @Min(0)
  @Max(1000)
  dailyLimit!: number;

  @IsNumber()
  @Min(0)
  @Max(10000)
  monthlyLimit!: number;
}