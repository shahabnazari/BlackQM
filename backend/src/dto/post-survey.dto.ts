import { 
  IsString, 
  IsNumber, 
  IsArray, 
  IsOptional, 
  IsObject,
  ValidateNested,
  IsBoolean,
  IsEnum,
  Min,
  Max,
  IsUUID
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QSortDataDto {
  @ApiProperty({ 
    description: 'Array of statement positions in the Q-sort grid',
    example: [3, -2, 0, 1, -3, 2]
  })
  @IsArray()
  @IsNumber({}, { each: true })
  sortPattern!: number[];

  @ApiProperty({ 
    description: 'Time spent on Q-sort in seconds',
    example: 420
  })
  @IsNumber()
  @Min(0)
  timeSpent!: number;

  @ApiProperty({ 
    description: 'Number of changes made during sorting',
    example: 25
  })
  @IsNumber()
  @Min(0)
  changesCount!: number;

  @ApiProperty({ 
    description: 'Statements placed at extreme positions'
  })
  @IsObject()
  extremeStatements!: {
    mostAgree: string[];
    mostDisagree: string[];
  };
}

export class PostSurveyResponseDto {
  @ApiProperty({ 
    description: 'ID of the question being answered',
    example: 'q123'
  })
  @IsString()
  @IsUUID()
  questionId!: string;

  @ApiProperty({ 
    description: 'Answer to the question',
    examples: ['Yes', 5, ['option1', 'option2'], { rating: 4, comment: 'Good' }]
  })
  answer!: any;

  @ApiProperty({ 
    description: 'Time spent on this question in seconds',
    example: 30,
    required: false
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  timeSpent?: number;

  @ApiProperty({ 
    description: 'Additional metadata for the response',
    required: false
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class SavePostSurveyDto {
  @ApiProperty({ 
    description: 'Array of responses to post-survey questions',
    type: [PostSurveyResponseDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostSurveyResponseDto)
  responses!: PostSurveyResponseDto[];

  @ApiProperty({ 
    description: 'Q-sort data for context',
    type: QSortDataDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QSortDataDto)
  qsortData?: QSortDataDto;
}

export class GetPostSurveyQuestionsDto {
  @ApiProperty({ 
    description: 'Survey ID',
    example: 'survey123'
  })
  @IsString()
  @IsUUID()
  surveyId!: string;

  @ApiProperty({ 
    description: 'Participant ID',
    example: 'participant456'
  })
  @IsString()
  @IsUUID()
  participantId!: string;

  @ApiProperty({ 
    description: 'Q-sort data for context-aware questions',
    type: QSortDataDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => QSortDataDto)
  qsortData?: QSortDataDto;
}

export class PostSurveyInsightsDto {
  @ApiProperty({ 
    description: 'Key themes extracted from responses',
    example: ['usability', 'clarity', 'engagement']
  })
  @IsArray()
  @IsString({ each: true })
  keyThemes!: string[];

  @ApiProperty({ 
    description: 'Overall sentiment of responses',
    enum: ['positive', 'neutral', 'negative']
  })
  @IsEnum(['positive', 'neutral', 'negative'])
  sentiment!: 'positive' | 'neutral' | 'negative';

  @ApiProperty({ 
    description: 'Engagement level based on responses',
    enum: ['high', 'medium', 'low']
  })
  @IsEnum(['high', 'medium', 'low'])
  engagement!: 'high' | 'medium' | 'low';
}

export class PostSurveyResultDto {
  @ApiProperty({ 
    description: 'Saved responses',
    type: [PostSurveyResponseDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostSurveyResponseDto)
  responses!: PostSurveyResponseDto[];

  @ApiProperty({ 
    description: 'Total completion time in milliseconds',
    example: 300000
  })
  @IsNumber()
  @Min(0)
  completionTime!: number;

  @ApiProperty({ 
    description: 'Quality score of responses (0-100)',
    example: 85
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  qualityScore!: number;

  @ApiProperty({ 
    description: 'Insights extracted from responses',
    type: PostSurveyInsightsDto
  })
  @ValidateNested()
  @Type(() => PostSurveyInsightsDto)
  insights!: PostSurveyInsightsDto;
}

export class ExperienceFeedbackDto {
  @ApiProperty({ 
    description: 'Overall sentiment',
    enum: ['positive', 'neutral', 'negative']
  })
  @IsEnum(['positive', 'neutral', 'negative'])
  overallSentiment!: 'positive' | 'neutral' | 'negative';

  @ApiProperty({ 
    description: 'Satisfaction score (0-100)',
    example: 75
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  satisfactionScore!: number;

  @ApiProperty({ 
    description: 'Identified pain points',
    example: ['Statements were too similar', 'Time consuming']
  })
  @IsArray()
  @IsString({ each: true })
  painPoints!: string[];

  @ApiProperty({ 
    description: 'Suggested improvements',
    example: ['Clearer instructions', 'Better time estimates']
  })
  @IsArray()
  @IsString({ each: true })
  improvements!: string[];

  @ApiProperty({ 
    description: 'Positive aspects mentioned',
    example: ['Intuitive interface', 'Interesting topic']
  })
  @IsArray()
  @IsString({ each: true })
  positiveAspects!: string[];

  @ApiProperty({ 
    description: 'Whether participant would recommend',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  wouldRecommend?: boolean | null;
}

export class AggregatedResultsDto {
  @ApiProperty({ 
    description: 'Total number of responses',
    example: 150
  })
  @IsNumber()
  totalResponses!: number;

  @ApiProperty({ 
    description: 'Statistical analysis of quantitative questions'
  })
  @IsObject()
  statistics!: {
    rating?: {
      mean: number;
      median: number;
      stdDev: number;
      distribution: Record<number, number>;
    };
  };

  @ApiProperty({ 
    description: 'Themes extracted from qualitative responses',
    example: ['usability', 'clarity', 'engagement', 'time', 'difficulty']
  })
  @IsArray()
  @IsString({ each: true })
  themes!: string[];

  @ApiProperty({ 
    description: 'Demographic breakdown'
  })
  @IsObject()
  demographics!: Record<string, Record<string, number>>;

  @ApiProperty({ 
    description: 'Quality metrics for the responses'
  })
  @IsObject()
  qualityMetrics!: {
    averageCompletionTime: number;
    averageQualityScore: number;
    responseRate: number;
  };
}

export class DynamicQuestionDto {
  @ApiProperty({ 
    description: 'Question ID',
    example: 'q789'
  })
  @IsString()
  @IsUUID()
  id!: string;

  @ApiProperty({ 
    description: 'Question text',
    example: 'What influenced your extreme choices?'
  })
  @IsString()
  text!: string;

  @ApiProperty({ 
    description: 'Question type',
    example: 'TEXTAREA'
  })
  @IsString()
  type!: string;

  @ApiProperty({ 
    description: 'Priority for ordering',
    example: 1
  })
  @IsNumber()
  priority!: number;

  @ApiProperty({ 
    description: 'Condition that triggered this question',
    example: 'high_changes_count'
  })
  @IsString()
  triggerCondition!: string;
}