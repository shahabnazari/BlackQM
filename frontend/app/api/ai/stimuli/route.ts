/**
 * API Route for AI Stimuli/Statement Generation
 * Phase 6.86 - Day 4 Enterprise Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { statementGenerator } from '@/lib/ai/statement-generator';
import { initializeAI } from '@/lib/services/ai.service';
import { rateLimit } from '@/lib/auth/middleware';

// Request validation schemas
const generateStatementsSchema = z.object({
  topic: z.string().min(3).max(200),
  count: z.number().int().min(10).max(100).default(30),
  perspectives: z.array(z.string()).optional(),
  avoidBias: z.boolean().default(true),
  academicLevel: z.enum(['basic', 'intermediate', 'advanced']).default('intermediate')
});

const validateStatementsSchema = z.object({
  statements: z.array(z.object({
    id: z.string(),
    text: z.string(),
    perspective: z.string(),
    polarity: z.enum(['positive', 'negative', 'neutral']),
    confidence: z.number().optional()
  }))
});

// Initialize AI service
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
    console.log(`AI Stimuli request from user: ${user?.email}`);
    
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    const body = await req.json();
    
    switch (action) {
      case 'generate': {
        const validatedData = generateStatementsSchema.parse(body);
        
        // Generate statements
        const response = await statementGenerator.generateStatements(validatedData);
        
        // Validate the generated statements
        const validation = await statementGenerator.validateStatements(
          response.statements as any
        );
        
        return NextResponse.json({
          success: true,
          data: {
            ...response,
            validation
          },
          timestamp: new Date().toISOString()
        });
      }
      
      case 'validate': {
        const validatedData = validateStatementsSchema.parse(body);
        const validation = await statementGenerator.validateStatements(
          validatedData.statements as any
        );
        
        return NextResponse.json({
          success: true,
          data: { validation },
          timestamp: new Date().toISOString()
        });
      }
      
      case 'bulk-generate': {
        // For generating multiple sets of statements
        const { topics, count = 30 } = body;
        
        if (!Array.isArray(topics) || topics.length === 0) {
          throw new Error('Topics array is required for bulk generation');
        }
        
        const results = await Promise.all(
          topics.map(async (topic: string) => {
            try {
              const response = await statementGenerator.generateStatements({
                topic,
                count,
                avoidBias: true
              });
              return {
                topic,
                success: true,
                statements: response.statements,
                metadata: response.metadata
              };
            } catch (error) {
              return {
                topic,
                success: false,
                error: error instanceof Error ? error.message : 'Generation failed'
              };
            }
          })
        );
        
        return NextResponse.json({
          success: true,
          data: { results },
          timestamp: new Date().toISOString()
        });
      }
      
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Use: generate, validate, or bulk-generate'
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Stimuli generation error:', error);
    
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
        error: 'Failed to generate statements',
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