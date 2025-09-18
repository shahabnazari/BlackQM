/**
 * Participant AI Assistant Service
 * Phase 6.86 Day 6 Implementation
 * Provides intelligent assistance throughout participant journey
 */

import { AIService } from '@/lib/services/ai.service';
import { 
  ParticipantStage, 
  ParticipantContext, 
  ParticipantGuidance,
  PreScreeningOptimization,
  PreSortingGuidance,
  AdaptiveHelp,
  PostSurveyAnalysis,
  SentimentAnalysis
} from '@/lib/types/ai-enhanced.types';

export class ParticipantAssistantService {
  private aiService: AIService;
  private contextCache: Map<string, ParticipantContext>;

  constructor(aiService: AIService) {
    this.aiService = aiService;
    this.contextCache = new Map();
  }

  /**
   * Pre-screening AI optimization
   * Adapts questions based on responses
   */
  async optimizePreScreening(
    currentResponses: Record<string, any>,
    availableQuestions: any[]
  ): Promise<PreScreeningOptimization> {
    try {
      const prompt = `
        Analyze participant pre-screening responses and suggest optimizations:
        
        Current Responses:
        ${JSON.stringify(currentResponses, null, 2)}
        
        Available Questions:
        ${JSON.stringify(availableQuestions.slice(0, 5), null, 2)}
        
        Provide:
        1. Next most relevant question
        2. Questions to skip based on current answers
        3. Estimated completion time
        4. Participant engagement level
        
        Format as JSON with structure:
        {
          "nextQuestion": { "id": "...", "reason": "..." },
          "skipQuestions": ["id1", "id2"],
          "estimatedTime": "X minutes",
          "engagementLevel": "high/medium/low",
          "suggestions": ["..."]
        }
      `;

      const response = await this.aiService.generateCompletion({
        prompt,
        model: 'gpt-3.5-turbo',
        temperature: 0.3,
        maxTokens: 800
      });

      return this.parseOptimizationResponse(response.content);
    } catch (error) {
      console.error('Pre-screening optimization failed:', error);
      return this.getDefaultOptimization();
    }
  }

  /**
   * Pre-sorting guidance system
   * Helps participants understand Q-methodology
   */
  async generatePreSortingGuidance(
    statements: string[],
    participantProfile: any
  ): Promise<PreSortingGuidance> {
    try {
      const prompt = `
        Generate helpful pre-sorting guidance for a Q-methodology study participant.
        
        Study has ${statements.length} statements to sort.
        Participant profile: ${JSON.stringify(participantProfile)}
        
        Provide:
        1. Simple explanation of Q-sorting process
        2. Tips for initial categorization (agree/neutral/disagree)
        3. Common pitfalls to avoid
        4. Encouragement message
        5. Estimated time to complete
        
        Keep language simple and encouraging. Format as JSON.
      `;

      const response = await this.aiService.generateCompletion({
        prompt,
        model: 'gpt-3.5-turbo',
        temperature: 0.5,
        maxTokens: 600
      });

      return this.parseGuidanceResponse(response.content);
    } catch (error) {
      console.error('Pre-sorting guidance generation failed:', error);
      return this.getDefaultGuidance();
    }
  }

  /**
   * Adaptive help system
   * Provides context-sensitive assistance
   */
  async getAdaptiveHelp(
    stage: ParticipantStage,
    context: ParticipantContext,
    userAction?: string
  ): Promise<AdaptiveHelp> {
    try {
      // Cache context for session continuity
      const sessionId = context.participantId || 'anonymous';
      this.contextCache.set(sessionId, context);

      const prompt = `
        Provide adaptive help for a participant in Q-methodology study.
        
        Current Stage: ${stage}
        User Action: ${userAction || 'viewing page'}
        Time on Stage: ${context.timeOnStage || 0} seconds
        Previous Responses: ${context.responses ? Object.keys(context.responses).length : 0}
        
        Generate:
        1. Contextual help message (max 2 sentences)
        2. Next step suggestion
        3. Relevant tips for current stage
        4. Indication if participant seems stuck
        
        Keep tone friendly and supportive. Format as JSON.
      `;

      const response = await this.aiService.generateCompletion({
        prompt,
        model: 'gpt-3.5-turbo',
        temperature: 0.4,
        maxTokens: 400
      });

      return this.parseHelpResponse(response.content);
    } catch (error) {
      console.error('Adaptive help generation failed:', error);
      return this.getDefaultHelp(stage);
    }
  }

  /**
   * Post-survey analysis AI
   * Analyzes open-ended responses
   */
  async analyzePostSurveyResponses(
    responses: Record<string, any>,
    qSortData: any
  ): Promise<PostSurveyAnalysis> {
    try {
      const prompt = `
        Analyze post-survey responses from Q-methodology participant.
        
        Survey Responses:
        ${JSON.stringify(responses, null, 2)}
        
        Q-Sort Summary:
        - Completion time: ${qSortData.completionTime}
        - Number of changes: ${qSortData.changeCount}
        - Most agreed statement: ${qSortData.mostAgreed}
        - Most disagreed statement: ${qSortData.mostDisagreed}
        
        Provide:
        1. Key themes in responses
        2. Consistency between Q-sort and survey answers
        3. Response quality score (1-10)
        4. Notable insights
        5. Sentiment analysis of open-ended responses
        
        Format as JSON.
      `;

      const response = await this.aiService.generateCompletion({
        prompt,
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 1000
      });

      return this.parseAnalysisResponse(response.content);
    } catch (error) {
      console.error('Post-survey analysis failed:', error);
      return this.getDefaultAnalysis();
    }
  }

  /**
   * Sentiment analysis for comments
   */
  async analyzeSentiment(text: string): Promise<SentimentAnalysis> {
    try {
      const prompt = `
        Analyze the sentiment of this participant comment:
        
        "${text}"
        
        Provide:
        1. Sentiment (positive/neutral/negative)
        2. Confidence score (0-1)
        3. Emotional tone (e.g., frustrated, enthusiastic, confused)
        4. Key phrases indicating sentiment
        5. Suggestions for researcher follow-up if needed
        
        Format as JSON.
      `;

      const response = await this.aiService.generateCompletion({
        prompt,
        model: 'gpt-3.5-turbo',
        temperature: 0.2,
        maxTokens: 300
      });

      return this.parseSentimentResponse(response.content);
    } catch (error) {
      console.error('Sentiment analysis failed:', error);
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        tone: 'neutral',
        keyPhrases: [],
        followUpNeeded: false
      };
    }
  }

  /**
   * Get real-time suggestions during Q-sorting
   */
  async getQSortingSuggestions(
    currentPlacements: Record<string, string>,
    timeSpent: number,
    changesCount: number
  ): Promise<ParticipantGuidance> {
    try {
      // Quick suggestions based on patterns
      const suggestions: string[] = [];
      
      if (timeSpent > 1800) { // 30 minutes
        suggestions.push("Take your time, but remember your first instinct is often correct.");
      }
      
      if (changesCount > 50) {
        suggestions.push("You're doing great! Focus on the statements that feel most important to you.");
      }

      const placedCount = Object.keys(currentPlacements).length;
      const progress = (placedCount / 25) * 100; // Assuming 25 statements

      if (progress < 20 && timeSpent > 300) {
        suggestions.push("Start with the statements you feel strongest about - either strongly agree or disagree.");
      }

      return {
        message: suggestions[0] || "You're making good progress!",
        suggestions,
        progress,
        estimatedTimeRemaining: Math.max(5, 20 - (timeSpent / 60))
      };
    } catch (error) {
      console.error('Q-sorting suggestions failed:', error);
      return {
        message: "Keep going, you're doing great!",
        suggestions: [],
        progress: 0,
        estimatedTimeRemaining: 20
      };
    }
  }

  // Parsing helper methods
  private parseOptimizationResponse(content: string): PreScreeningOptimization {
    try {
      const parsed = JSON.parse(content);
      return {
        nextQuestion: parsed.nextQuestion || null,
        skipQuestions: parsed.skipQuestions || [],
        estimatedTime: parsed.estimatedTime || '10 minutes',
        engagementLevel: parsed.engagementLevel || 'medium',
        suggestions: parsed.suggestions || []
      };
    } catch {
      return this.getDefaultOptimization();
    }
  }

  private parseGuidanceResponse(content: string): PreSortingGuidance {
    try {
      const parsed = JSON.parse(content);
      return {
        explanation: parsed.explanation || this.getDefaultExplanation(),
        tips: parsed.tips || this.getDefaultTips(),
        pitfalls: parsed.pitfalls || [],
        encouragement: parsed.encouragement || "You've got this!",
        estimatedTime: parsed.estimatedTime || '20-30 minutes'
      };
    } catch {
      return this.getDefaultGuidance();
    }
  }

  private parseHelpResponse(content: string): AdaptiveHelp {
    try {
      const parsed = JSON.parse(content);
      return {
        message: parsed.message || '',
        nextStep: parsed.nextStep || '',
        tips: parsed.tips || [],
        isStuck: parsed.isStuck || false
      };
    } catch {
      return this.getDefaultHelp('consent');
    }
  }

  private parseAnalysisResponse(content: string): PostSurveyAnalysis {
    try {
      const parsed = JSON.parse(content);
      return {
        themes: parsed.themes || [],
        consistency: parsed.consistency || 0.5,
        qualityScore: parsed.qualityScore || 5,
        insights: parsed.insights || [],
        sentiment: parsed.sentiment || { overall: 'neutral' }
      };
    } catch {
      return this.getDefaultAnalysis();
    }
  }

  private parseSentimentResponse(content: string): SentimentAnalysis {
    try {
      const parsed = JSON.parse(content);
      return {
        sentiment: parsed.sentiment || 'neutral',
        confidence: parsed.confidence || 0.5,
        tone: parsed.tone || 'neutral',
        keyPhrases: parsed.keyPhrases || [],
        followUpNeeded: parsed.followUpNeeded || false
      };
    } catch {
      return {
        sentiment: 'neutral',
        confidence: 0.5,
        tone: 'neutral',
        keyPhrases: [],
        followUpNeeded: false
      };
    }
  }

  // Default fallback methods
  private getDefaultOptimization(): PreScreeningOptimization {
    return {
      nextQuestion: null,
      skipQuestions: [],
      estimatedTime: '10 minutes',
      engagementLevel: 'medium',
      suggestions: ['Please answer all questions to the best of your ability.']
    };
  }

  private getDefaultGuidance(): PreSortingGuidance {
    return {
      explanation: this.getDefaultExplanation(),
      tips: this.getDefaultTips(),
      pitfalls: [
        'Avoid overthinking - go with your initial reaction',
        "Don't worry about being 'right' - we want your honest opinion"
      ],
      encouragement: "You're doing great! Take your time and trust your instincts.",
      estimatedTime: '20-30 minutes'
    };
  }

  private getDefaultExplanation(): string {
    return "You'll be sorting statements based on how much you agree or disagree with them. Start by reading all statements, then place them in three initial groups: agree, neutral, and disagree.";
  }

  private getDefaultTips(): string[] {
    return [
      'Read all statements first before sorting',
      'Start with statements you feel strongest about',
      'Use the neutral category for statements you\'re unsure about',
      'You can change your mind and move statements around',
      'Focus on your own perspective, not what others might think'
    ];
  }

  private getDefaultHelp(stage: ParticipantStage): AdaptiveHelp {
    const helpByStage: Record<ParticipantStage, AdaptiveHelp> = {
      consent: {
        message: 'Please read the consent form carefully.',
        nextStep: 'Click "I Agree" to continue',
        tips: ['You can withdraw at any time'],
        isStuck: false
      },
      prescreening: {
        message: 'Answer these questions to help us understand your background.',
        nextStep: 'Complete all questions and click "Next"',
        tips: ['Be honest - there are no right or wrong answers'],
        isStuck: false
      },
      presorting: {
        message: 'Read through all statements first to get familiar with them.',
        nextStep: 'Click "Start Sorting" when ready',
        tips: ['Take your time to understand each statement'],
        isStuck: false
      },
      qsort: {
        message: 'Drag statements to arrange them by agreement level.',
        nextStep: 'Place all statements in the grid',
        tips: ['Start with extremes - what you most agree/disagree with'],
        isStuck: false
      },
      postsurvey: {
        message: 'Almost done! Share any additional thoughts.',
        nextStep: 'Complete the survey and click "Submit"',
        tips: ['Your feedback helps improve the study'],
        isStuck: false
      }
    };

    return helpByStage[stage] || helpByStage.consent;
  }

  private getDefaultAnalysis(): PostSurveyAnalysis {
    return {
      themes: [],
      consistency: 0.5,
      qualityScore: 5,
      insights: [],
      sentiment: { overall: 'neutral' }
    };
  }
}

export default ParticipantAssistantService;