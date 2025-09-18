/**
 * Participant AI API Endpoint
 * Phase 6.86 Day 6 - API route for participant AI assistance
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/middleware';
import { AIService } from '@/lib/services/ai.service';
import { ParticipantAssistantService } from '@/lib/ai/participant-assistant';

// Request validation schemas
const PreScreeningSchema = z.object({
  action: z.literal('optimize-prescreening'),
  responses: z.record(z.string(), z.any()),
  questions: z.array(z.any())
});

const PreSortingSchema = z.object({
  action: z.literal('presorting-guidance'),
  statements: z.array(z.string()),
  profile: z.record(z.string(), z.any()).optional()
});

const AdaptiveHelpSchema = z.object({
  action: z.literal('adaptive-help'),
  stage: z.enum(['consent', 'prescreening', 'presorting', 'qsort', 'postsurvey']),
  context: z.object({
    participantId: z.string().optional(),
    timeOnStage: z.number().optional(),
    responses: z.record(z.string(), z.any()).optional(),
    stage: z.enum(['consent', 'prescreening', 'presorting', 'qsort', 'postsurvey'])
  }),
  userAction: z.string().optional()
});

const QSortingSuggestionsSchema = z.object({
  action: z.literal('qsorting-suggestions'),
  placements: z.record(z.string(), z.string()),
  timeSpent: z.number(),
  changeCount: z.number()
});

const PostSurveySchema = z.object({
  action: z.literal('analyze-postsurvey'),
  responses: z.record(z.string(), z.any()),
  qSortData: z.object({
    completionTime: z.number(),
    changeCount: z.number(),
    mostAgreed: z.string().optional(),
    mostDisagreed: z.string().optional()
  })
});

const SentimentSchema = z.object({
  action: z.literal('analyze-sentiment'),
  text: z.string().min(1)
});

const RequestSchema = z.discriminatedUnion('action', [
  PreScreeningSchema,
  PreSortingSchema,
  AdaptiveHelpSchema,
  QSortingSuggestionsSchema,
  PostSurveySchema,
  SentimentSchema
]);

async function handler(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate request
    const validatedData = RequestSchema.parse(body);
    
    // Initialize services
    const aiService = AIService.getInstance();
    const participantService = new ParticipantAssistantService(aiService);
    
    // Handle different actions
    let result: any;
    
    switch (validatedData.action) {
      case 'optimize-prescreening':
        result = await participantService.optimizePreScreening(
          validatedData.responses,
          validatedData.questions
        );
        break;
        
      case 'presorting-guidance':
        result = await participantService.generatePreSortingGuidance(
          validatedData.statements,
          validatedData.profile || {}
        );
        break;
        
      case 'adaptive-help':
        result = await participantService.getAdaptiveHelp(
          validatedData.stage,
          validatedData.context,
          validatedData.userAction
        );
        break;
        
      case 'qsorting-suggestions':
        result = await participantService.getQSortingSuggestions(
          validatedData.placements as Record<string, string>,
          validatedData.timeSpent,
          validatedData.changeCount
        );
        break;
        
      case 'analyze-postsurvey':
        result = await participantService.analyzePostSurveyResponses(
          validatedData.responses,
          validatedData.qSortData
        );
        break;
        
      case 'analyze-sentiment':
        result = await participantService.analyzeSentiment(
          validatedData.text
        );
        break;
        
      default:
        throw new Error('Invalid action');
    }
    
    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Participant AI endpoint error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues ?? []
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error'
      },
      { status: 500 }
    );
  }
}

// Export with authentication wrapper
export const POST = withAuth(handler as any);

// OPTIONS handler for CORS
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}