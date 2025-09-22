import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { QuestionService } from './question.service';
import { 
  Question, 
  Response, 
  Survey, 
  ResponseStatus,
  Prisma 
} from '@prisma/client';

interface PostSurveyContext {
  qsortData: {
    sortPattern: number[];
    timeSpent: number;
    changesCount: number;
    extremeStatements: {
      mostAgree: string[];
      mostDisagree: string[];
    };
  };
  participantProfile: {
    id: string;
    demographics?: Record<string, any>;
    previousResponses?: number;
  };
  studyContext: {
    topic: string;
    researchQuestions: string[];
    targetAudience: string;
  };
}

interface DynamicQuestionRule {
  condition: (context: PostSurveyContext) => boolean;
  questionId: string;
  priority: number;
}

interface PostSurveyResponse {
  questionId: string;
  answer: any;
  timeSpent?: number;
  metadata?: Record<string, any>;
}

interface PostSurveyResult {
  responses: PostSurveyResponse[];
  completionTime: number;
  qualityScore: number;
  insights: {
    keyThemes: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    engagement: 'high' | 'medium' | 'low';
  };
}

@Injectable()
export class PostSurveyService {
  private readonly dynamicRules: DynamicQuestionRule[] = [
    {
      condition: (ctx) => ctx.qsortData.changesCount > 20,
      questionId: 'high-uncertainty-followup',
      priority: 1
    },
    {
      condition: (ctx) => ctx.qsortData.timeSpent < 300, // Less than 5 minutes
      questionId: 'quick-sort-reasoning',
      priority: 2
    },
    {
      condition: (ctx) => ctx.qsortData.extremeStatements.mostAgree.length > 0,
      questionId: 'extreme-agreement-explanation',
      priority: 1
    },
    {
      condition: (ctx) => ctx.participantProfile.previousResponses === 0,
      questionId: 'first-time-experience',
      priority: 3
    }
  ];

  constructor(
    private readonly prisma: PrismaService,
    private readonly questionService: QuestionService
  ) {}

  /**
   * Get context-aware post-survey questions
   * World-class implementation with intelligent question selection
   */
  async getPostSurveyQuestions(
    surveyId: string,
    participantId: string,
    qsortData?: any
  ): Promise<Question[]> {
    // Get base post-survey questions
    const baseQuestions = await this.questionService.getQuestionsBySurveyAndType(
      surveyId,
      'post-survey'
    );

    // Get participant context
    const context = await this.buildPostSurveyContext(
      surveyId,
      participantId,
      qsortData
    );

    // Apply dynamic rules to add context-aware questions
    const dynamicQuestions = await this.applyDynamicRules(context);
    
    // Combine and prioritize questions
    const allQuestions = this.mergeAndPrioritizeQuestions(
      baseQuestions,
      dynamicQuestions
    );

    // Apply adaptive ordering based on participant engagement
    return this.applyAdaptiveOrdering(allQuestions, context);
  }

  /**
   * Save post-survey responses with advanced validation and analysis
   */
  async savePostSurveyResponses(
    surveyId: string,
    participantId: string,
    responses: PostSurveyResponse[],
    qsortData?: any
  ): Promise<PostSurveyResult> {
    const startTime = Date.now();

    // Validate all responses
    const validationResult = await this.validateResponses(surveyId, responses);
    if (!validationResult.valid) {
      throw new BadRequestException(validationResult.errors);
    }

    // Calculate quality score
    const qualityScore = this.calculateQualityScore(responses);

    // Extract insights from responses
    const insights = await this.extractInsights(responses, qsortData);

    // Persist responses with transaction
    const savedResponses = await this.prisma.$transaction(async (tx) => {
      const responseRecords = [];

      for (const response of responses) {
        const question = await tx.question.findUnique({
          where: { id: response.questionId }
        });

        if (!question) continue;

        const responseRecord = await tx.response.create({
          data: {
            surveyId,
            participantId,
            questionId: response.questionId,
            questionType: question.type,
            answer: response.answer,
            metadata: {
              ...response.metadata,
              timeSpent: response.timeSpent,
              qualityScore,
              postSurvey: true,
              qsortContext: qsortData
            } as Prisma.JsonObject,
            status: ResponseStatus.COMPLETED
          }
        });

        responseRecords.push(responseRecord);
      }

      // Update participant completion status
      await this.updateParticipantStatus(tx, surveyId, participantId, 'post-survey-complete');

      return responseRecords;
    });

    // Trigger analysis pipeline integration
    await this.triggerAnalysisPipeline(surveyId, participantId, savedResponses);

    return {
      responses: responses,
      completionTime: Date.now() - startTime,
      qualityScore,
      insights
    };
  }

  /**
   * Get aggregated post-survey results for analysis
   */
  async getAggregatedResults(surveyId: string): Promise<any> {
    const responses = await this.prisma.response.findMany({
      where: {
        surveyId,
        metadata: {
          path: ['postSurvey'],
          equals: true
        }
      },
      include: {
        question: true
      }
    });

    // Group by question type for analysis
    const grouped = this.groupResponsesByType(responses);

    // Calculate statistics for quantitative questions
    const statistics = this.calculateStatistics(grouped);

    // Extract themes from qualitative responses
    const themes = await this.extractThemes(grouped.openEnded || []);

    // Generate demographic breakdown
    const demographics = this.analyzeDemographics(grouped.demographic || []);

    return {
      totalResponses: responses.length,
      statistics,
      themes,
      demographics,
      qualityMetrics: {
        averageCompletionTime: this.calculateAverageTime(responses),
        averageQualityScore: this.calculateAverageQuality(responses),
        responseRate: await this.calculateResponseRate(surveyId)
      }
    };
  }

  /**
   * Generate experience feedback summary
   */
  async generateExperienceFeedback(
    surveyId: string,
    participantId: string
  ): Promise<any> {
    const responses = await this.prisma.response.findMany({
      where: {
        surveyId,
        participantId,
        metadata: {
          path: ['postSurvey'],
          equals: true
        }
      },
      include: {
        question: true
      }
    });

    // Extract experience-related responses
    const experienceQuestions = responses.filter(r => 
      r.question.metadata && 
      (r.question.metadata as any).category === 'experience'
    );

    // Analyze sentiment
    const sentiment = this.analyzeSentiment(experienceQuestions);

    // Identify pain points
    const painPoints = this.identifyPainPoints(experienceQuestions);

    // Generate suggestions for improvement
    const improvements = this.generateImprovements(painPoints);

    return {
      overallSentiment: sentiment,
      satisfactionScore: this.calculateSatisfactionScore(experienceQuestions),
      painPoints,
      improvements,
      positiveAspects: this.extractPositiveAspects(experienceQuestions),
      wouldRecommend: this.extractRecommendation(experienceQuestions)
    };
  }

  /**
   * Private helper methods
   */
  
  private async buildPostSurveyContext(
    surveyId: string,
    participantId: string,
    qsortData?: any
  ): Promise<PostSurveyContext> {
    const survey = await this.prisma.survey.findUnique({
      where: { id: surveyId }
    });

    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
      include: {
        responses: {
          where: { surveyId }
        }
      }
    });

    return {
      qsortData: qsortData || {
        sortPattern: [],
        timeSpent: 0,
        changesCount: 0,
        extremeStatements: {
          mostAgree: [],
          mostDisagree: []
        }
      },
      participantProfile: {
        id: participantId,
        demographics: participant?.demographics as Record<string, any>,
        previousResponses: participant?.responses.length || 0
      },
      studyContext: {
        topic: survey?.title || '',
        researchQuestions: (survey?.metadata as any)?.researchQuestions || [],
        targetAudience: (survey?.metadata as any)?.targetAudience || ''
      }
    };
  }

  private async applyDynamicRules(
    context: PostSurveyContext
  ): Promise<Question[]> {
    const applicableRules = this.dynamicRules
      .filter(rule => rule.condition(context))
      .sort((a, b) => a.priority - b.priority);

    const dynamicQuestions: Question[] = [];
    
    for (const rule of applicableRules) {
      const question = await this.questionService.getQuestionById(rule.questionId);
      if (question) {
        dynamicQuestions.push(question);
      }
    }

    return dynamicQuestions;
  }

  private mergeAndPrioritizeQuestions(
    baseQuestions: Question[],
    dynamicQuestions: Question[]
  ): Question[] {
    const merged = [...baseQuestions];
    const baseIds = new Set(baseQuestions.map(q => q.id));

    for (const dq of dynamicQuestions) {
      if (!baseIds.has(dq.id)) {
        merged.push(dq);
      }
    }

    // Sort by priority if available in metadata
    return merged.sort((a, b) => {
      const priorityA = (a.metadata as any)?.priority || 999;
      const priorityB = (b.metadata as any)?.priority || 999;
      return priorityA - priorityB;
    });
  }

  private applyAdaptiveOrdering(
    questions: Question[],
    context: PostSurveyContext
  ): Question[] {
    // Group questions by category
    const categorized = this.categorizeQuestions(questions);

    // Determine optimal order based on engagement
    const engagementLevel = this.assessEngagementLevel(context);
    
    if (engagementLevel === 'high') {
      // Start with open-ended, then rating, then demographic
      return [
        ...categorized.openEnded,
        ...categorized.rating,
        ...categorized.demographic
      ];
    } else if (engagementLevel === 'low') {
      // Start with quick rating questions, minimize open-ended
      return [
        ...categorized.rating,
        ...categorized.demographic,
        ...categorized.openEnded.slice(0, 2) // Limit open-ended
      ];
    } else {
      // Balanced approach
      return [
        ...categorized.rating.slice(0, 3),
        ...categorized.openEnded.slice(0, 2),
        ...categorized.rating.slice(3),
        ...categorized.demographic,
        ...categorized.openEnded.slice(2)
      ];
    }
  }

  private categorizeQuestions(questions: Question[]): any {
    return {
      openEnded: questions.filter(q => q.type === 'TEXT' || q.type === 'TEXTAREA'),
      rating: questions.filter(q => q.type === 'RATING' || q.type === 'LIKERT'),
      demographic: questions.filter(q => (q.metadata as any)?.category === 'demographic')
    };
  }

  private assessEngagementLevel(context: PostSurveyContext): 'high' | 'medium' | 'low' {
    const { qsortData } = context;
    
    if (qsortData.timeSpent > 600 && qsortData.changesCount > 10) {
      return 'high';
    } else if (qsortData.timeSpent < 180 || qsortData.changesCount < 5) {
      return 'low';
    }
    
    return 'medium';
  }

  private async validateResponses(
    surveyId: string,
    responses: PostSurveyResponse[]
  ): Promise<{ valid: boolean; errors?: string[] }> {
    const errors: string[] = [];

    for (const response of responses) {
      const question = await this.questionService.getQuestionById(response.questionId);
      if (!question) {
        errors.push(`Question ${response.questionId} not found`);
        continue;
      }

      // Validate based on question type
      const validationResult = this.validateAnswer(question, response.answer);
      if (!validationResult.valid) {
        errors.push(validationResult.error!);
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  private validateAnswer(
    question: Question,
    answer: any
  ): { valid: boolean; error?: string } {
    const validation = question.validation as any;
    
    if (!validation) {
      return { valid: true };
    }

    // Check required
    if (validation.required && !answer) {
      return { 
        valid: false, 
        error: `Question "${question.text}" is required` 
      };
    }

    // Type-specific validation
    switch (question.type) {
      case 'TEXT':
      case 'TEXTAREA':
        if (validation.minLength && answer.length < validation.minLength) {
          return { 
            valid: false, 
            error: `Answer must be at least ${validation.minLength} characters` 
          };
        }
        if (validation.maxLength && answer.length > validation.maxLength) {
          return { 
            valid: false, 
            error: `Answer must not exceed ${validation.maxLength} characters` 
          };
        }
        break;
        
      case 'RATING':
      case 'LIKERT':
        const value = Number(answer);
        if (validation.min && value < validation.min) {
          return { 
            valid: false, 
            error: `Rating must be at least ${validation.min}` 
          };
        }
        if (validation.max && value > validation.max) {
          return { 
            valid: false, 
            error: `Rating must not exceed ${validation.max}` 
          };
        }
        break;
    }

    return { valid: true };
  }

  private calculateQualityScore(responses: PostSurveyResponse[]): number {
    let score = 0;
    let factors = 0;

    // Factor 1: Completeness (40%)
    const completenessScore = (responses.length / 20) * 40; // Assume 20 expected questions
    score += Math.min(completenessScore, 40);
    factors++;

    // Factor 2: Response depth (30%)
    const textResponses = responses.filter(r => 
      typeof r.answer === 'string' && r.answer.length > 20
    );
    const depthScore = (textResponses.length / responses.length) * 30;
    score += depthScore;
    factors++;

    // Factor 3: Time investment (20%)
    const avgTimePerQuestion = responses.reduce((sum, r) => 
      sum + (r.timeSpent || 0), 0
    ) / responses.length;
    const timeScore = Math.min((avgTimePerQuestion / 30) * 20, 20); // 30s ideal per question
    score += timeScore;
    factors++;

    // Factor 4: Consistency (10%)
    const consistencyScore = this.assessResponseConsistency(responses) * 10;
    score += consistencyScore;
    factors++;

    return Math.round(score);
  }

  private assessResponseConsistency(responses: PostSurveyResponse[]): number {
    // Check for patterns suggesting random or careless responding
    const ratingResponses = responses
      .filter(r => typeof r.answer === 'number')
      .map(r => Number(r.answer));

    if (ratingResponses.length < 3) return 1;

    // Check for straight-lining (all same answer)
    const uniqueRatings = new Set(ratingResponses).size;
    if (uniqueRatings === 1) return 0.2;

    // Check for alternating patterns
    const variance = this.calculateVariance(ratingResponses);
    if (variance < 0.5) return 0.5;

    return 1;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
  }

  private async extractInsights(
    responses: PostSurveyResponse[],
    qsortData?: any
  ): Promise<any> {
    const textResponses = responses
      .filter(r => typeof r.answer === 'string')
      .map(r => r.answer as string);

    // Extract key themes (simplified - in production, use NLP)
    const keyThemes = this.extractKeyThemes(textResponses);

    // Analyze sentiment
    const sentiment = this.analyzeSentimentFromText(textResponses);

    // Assess engagement
    const engagement = this.assessEngagement(responses, qsortData);

    return {
      keyThemes,
      sentiment,
      engagement
    };
  }

  private extractKeyThemes(texts: string[]): string[] {
    // Simplified theme extraction
    const wordFrequency = new Map<string, number>();
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for']);

    for (const text of texts) {
      const words = text.toLowerCase()
        .split(/\s+/)
        .filter(w => w.length > 3 && !stopWords.has(w));

      for (const word of words) {
        wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
      }
    }

    // Get top 5 themes
    return Array.from(wordFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private analyzeSentimentFromText(texts: string[]): 'positive' | 'neutral' | 'negative' {
    // Simplified sentiment analysis
    const positiveWords = ['good', 'great', 'excellent', 'helpful', 'easy', 'clear', 'enjoyed'];
    const negativeWords = ['difficult', 'confusing', 'hard', 'unclear', 'frustrating', 'boring'];

    let positiveCount = 0;
    let negativeCount = 0;

    for (const text of texts) {
      const lower = text.toLowerCase();
      positiveCount += positiveWords.filter(w => lower.includes(w)).length;
      negativeCount += negativeWords.filter(w => lower.includes(w)).length;
    }

    if (positiveCount > negativeCount * 1.5) return 'positive';
    if (negativeCount > positiveCount * 1.5) return 'negative';
    return 'neutral';
  }

  private assessEngagement(
    responses: PostSurveyResponse[],
    qsortData?: any
  ): 'high' | 'medium' | 'low' {
    const avgTimeSpent = responses.reduce((sum, r) => 
      sum + (r.timeSpent || 0), 0
    ) / responses.length;

    const textLength = responses
      .filter(r => typeof r.answer === 'string')
      .reduce((sum, r) => sum + (r.answer as string).length, 0);

    if (avgTimeSpent > 45 && textLength > 500) return 'high';
    if (avgTimeSpent < 15 || textLength < 100) return 'low';
    return 'medium';
  }

  private async triggerAnalysisPipeline(
    surveyId: string,
    participantId: string,
    responses: any[]
  ): Promise<void> {
    // In production, this would trigger analysis jobs
    console.log('Triggering analysis pipeline for:', {
      surveyId,
      participantId,
      responseCount: responses.length
    });
  }

  private async updateParticipantStatus(
    tx: any,
    surveyId: string,
    participantId: string,
    status: string
  ): Promise<void> {
    await tx.participant.update({
      where: { id: participantId },
      data: {
        metadata: {
          ...(await tx.participant.findUnique({ where: { id: participantId } }))?.metadata as any,
          [`survey_${surveyId}_status`]: status,
          [`survey_${surveyId}_post_survey_completed`]: new Date().toISOString()
        }
      }
    });
  }

  private groupResponsesByType(responses: any[]): any {
    const grouped: any = {};
    
    for (const response of responses) {
      const type = response.question.type;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(response);
    }
    
    return grouped;
  }

  private calculateStatistics(grouped: any): any {
    const stats: any = {};
    
    // Calculate stats for rating questions
    if (grouped.RATING || grouped.LIKERT) {
      const ratings = [...(grouped.RATING || []), ...(grouped.LIKERT || [])]
        .map(r => Number(r.answer))
        .filter(n => !isNaN(n));

      if (ratings.length > 0) {
        stats.rating = {
          mean: ratings.reduce((a, b) => a + b, 0) / ratings.length,
          median: this.calculateMedian(ratings),
          stdDev: Math.sqrt(this.calculateVariance(ratings)),
          distribution: this.calculateDistribution(ratings)
        };
      }
    }

    return stats;
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private calculateDistribution(values: number[]): any {
    const distribution: any = {};
    for (const value of values) {
      distribution[value] = (distribution[value] || 0) + 1;
    }
    return distribution;
  }

  private async extractThemes(openEndedResponses: any[]): Promise<string[]> {
    const texts = openEndedResponses.map(r => r.answer as string);
    return this.extractKeyThemes(texts);
  }

  private analyzeDemographics(demographicResponses: any[]): any {
    const demographics: any = {};
    
    for (const response of demographicResponses) {
      const questionText = response.question.text;
      demographics[questionText] = demographics[questionText] || {};
      
      const answer = response.answer;
      demographics[questionText][answer] = (demographics[questionText][answer] || 0) + 1;
    }
    
    return demographics;
  }

  private calculateAverageTime(responses: any[]): number {
    const times = responses
      .map(r => (r.metadata as any)?.timeSpent)
      .filter(t => typeof t === 'number');

    return times.length > 0 
      ? times.reduce((a, b) => a + b, 0) / times.length 
      : 0;
  }

  private calculateAverageQuality(responses: any[]): number {
    const scores = responses
      .map(r => (r.metadata as any)?.qualityScore)
      .filter(s => typeof s === 'number');

    return scores.length > 0
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0;
  }

  private async calculateResponseRate(surveyId: string): Promise<number> {
    const totalParticipants = await this.prisma.participant.count({
      where: { surveyId }
    });

    const completedParticipants = await this.prisma.participant.count({
      where: {
        surveyId,
        metadata: {
          path: [`survey_${surveyId}_post_survey_completed`],
          not: Prisma.JsonNull
        }
      }
    });

    return totalParticipants > 0 
      ? (completedParticipants / totalParticipants) * 100 
      : 0;
  }

  private analyzeSentiment(responses: any[]): any {
    const texts = responses
      .filter(r => r.questionType === 'TEXT' || r.questionType === 'TEXTAREA')
      .map(r => r.answer as string);

    return this.analyzeSentimentFromText(texts);
  }

  private identifyPainPoints(responses: any[]): string[] {
    const painPoints: string[] = [];
    
    // Look for negative sentiment in text responses
    for (const response of responses) {
      if (response.questionType === 'TEXT' || response.questionType === 'TEXTAREA') {
        const text = (response.answer as string).toLowerCase();
        if (text.includes('difficult') || text.includes('confusing') || 
            text.includes('unclear') || text.includes('frustrating')) {
          painPoints.push(text);
        }
      }
    }
    
    return painPoints;
  }

  private generateImprovements(painPoints: string[]): string[] {
    const improvements: string[] = [];
    
    // Map pain points to improvements
    for (const pain of painPoints) {
      if (pain.includes('difficult')) {
        improvements.push('Simplify the interface and provide clearer instructions');
      }
      if (pain.includes('confusing')) {
        improvements.push('Improve clarity of statements and questions');
      }
      if (pain.includes('time')) {
        improvements.push('Optimize the study length and provide time estimates');
      }
    }
    
    return [...new Set(improvements)]; // Remove duplicates
  }

  private calculateSatisfactionScore(responses: any[]): number {
    const ratingResponses = responses
      .filter(r => r.questionType === 'RATING' || r.questionType === 'LIKERT')
      .map(r => Number(r.answer));

    if (ratingResponses.length === 0) return 0;

    const avg = ratingResponses.reduce((a, b) => a + b, 0) / ratingResponses.length;
    return (avg / 5) * 100; // Convert to percentage assuming 5-point scale
  }

  private extractPositiveAspects(responses: any[]): string[] {
    const positives: string[] = [];
    
    for (const response of responses) {
      if (response.questionType === 'TEXT' || response.questionType === 'TEXTAREA') {
        const text = (response.answer as string).toLowerCase();
        if (text.includes('good') || text.includes('easy') || 
            text.includes('helpful') || text.includes('clear')) {
          positives.push(text);
        }
      }
    }
    
    return positives;
  }

  private extractRecommendation(responses: any[]): boolean | null {
    // Look for specific recommendation question
    const recommendQuestion = responses.find(r => 
      (r.question.text as string).toLowerCase().includes('recommend')
    );

    if (!recommendQuestion) return null;

    const answer = recommendQuestion.answer;
    if (typeof answer === 'boolean') return answer;
    if (typeof answer === 'number') return answer >= 4; // Assuming 5-point scale
    if (typeof answer === 'string') {
      return answer.toLowerCase().includes('yes') || 
             answer.toLowerCase().includes('definitely');
    }

    return null;
  }
}