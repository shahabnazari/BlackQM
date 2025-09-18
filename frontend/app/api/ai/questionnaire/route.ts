/**
 * API Route for AI Questionnaire Generation
 * Phase 6.86 - Day 3 Enterprise Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { questionnaireGenerator } from '@/lib/ai/questionnaire-generator';
import { initializeAI } from '@/lib/services/ai.service';
import { rateLimit } from '@/lib/auth/middleware';

// Request validation schema
const generateQuestionsSchema = z.object({
  topic: z.string().min(3).max(200),
  questionCount: z.number().int().min(1).max(50).default(10),
  questionTypes: z.array(z.enum([
    'text', 'textarea', 'select', 'multiselect', 
    'radio', 'checkbox', 'scale', 'ranking', 'matrix'
  ])).optional(),
  targetAudience: z.string().optional(),
  context: z.string().optional()
});

const suggestQuestionsSchema = z.object({
  topic: z.string().min(3).max(200),
  existingQuestions: z.array(z.string())
});

const skipLogicSchema = z.object({
  questions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    type: z.string()
  }))
});

// Initialize AI service on server startup
let isInitialized = false;
async function ensureAIInitialized() {
  if (!isInitialized) {
    try {
      await initializeAI();
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      throw new Error('AI service initialization failed');
    }
  }
}

// Apply authentication and rate limiting
const authenticatedHandler = rateLimit({ 
  requests: 10, 
  windowMs: 60000 
})(async (req: NextRequest) => {
  try {
    await ensureAIInitialized();
    
    // Get authenticated user from request
    const user = (req as any).user;
    console.log(`AI Questionnaire request from user: ${user?.email}`);
    
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    const body = await req.json();
    
    switch (action) {
      case 'generate': {
        const validatedData = generateQuestionsSchema.parse(body);
        const response = await questionnaireGenerator.generateQuestions(validatedData);
        
        return NextResponse.json({
          success: true,
          data: response,
          timestamp: new Date().toISOString()
        });
      }
      
      case 'suggest': {
        const validatedData = suggestQuestionsSchema.parse(body);
        const suggestions = await questionnaireGenerator.suggestQuestions(
          validatedData.topic,
          validatedData.existingQuestions
        );
        
        return NextResponse.json({
          success: true,
          data: { suggestions },
          timestamp: new Date().toISOString()
        });
      }
      
      case 'skip-logic': {
        const validatedData = skipLogicSchema.parse(body);
        const skipLogic = await questionnaireGenerator.generateSkipLogic(
          validatedData.questions as any
        );
        
        return NextResponse.json({
          success: true,
          data: { skipLogic },
          timestamp: new Date().toISOString()
        });
      }
      
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Use: generate, suggest, or skip-logic'
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Questionnaire AI error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues
        },
        { status: 400 }
      );
    }
    
    // Check for rate limiting
    if ((error as any)?.code === 'RATE_LIMITED') {
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          retryAfter: (error as any).retryAfter || 60
        },
        { status: 429 }
      );
    }
    
    // Check for budget exceeded
    if ((error as any)?.code === 'BUDGET_EXCEEDED') {
      return NextResponse.json(
        {
          success: false,
          error: 'AI budget limit exceeded for today'
        },
        { status: 402 }
      );
    }
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate questionnaire',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

// Export the authenticated POST handler
export const POST = authenticatedHandler;

// OPTIONS request for CORS
export async function OPTIONS(_req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}