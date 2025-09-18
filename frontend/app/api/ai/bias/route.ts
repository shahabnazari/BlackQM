/**
 * API Route for AI Bias Detection
 * Phase 6.86 - Day 5 Enterprise Implementation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { biasDetector } from '@/lib/ai/bias-detector';
import { initializeAI } from '@/lib/services/ai.service';
import { rateLimit } from '@/lib/auth/middleware';

// Request validation schemas
const detectBiasSchema = z.object({
  statements: z.array(z.string()).min(1).max(100),
  studyTitle: z.string().optional(),
  studyDescription: z.string().optional(),
  checkTypes: z.array(z.enum([
    'language', 'perspective', 'cultural', 
    'confirmation', 'sampling', 'demographic'
  ])).optional()
});

const culturalSensitivitySchema = z.object({
  statements: z.array(z.string()).min(1).max(100)
});

const diversityAssessmentSchema = z.object({
  statements: z.array(z.string()).min(1).max(100)
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
    console.log(`AI Bias Detection request from user: ${user?.email}`);
    
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    
    const body = await req.json();
    
    switch (action) {
      case 'detect': {
        const validatedData = detectBiasSchema.parse(body);
        
        // Perform bias detection
        const biasAnalysis = await biasDetector.detectBias(validatedData);
        
        // Add quick heuristic check for immediate feedback
        const quickScore = biasDetector.calculateQuickBiasScore(validatedData.statements);
        
        return NextResponse.json({
          success: true,
          data: {
            ...biasAnalysis,
            quickScore,
            needsAttention: biasAnalysis.overallScore < 70 || quickScore < 70
          },
          timestamp: new Date().toISOString()
        });
      }
      
      case 'cultural-sensitivity': {
        const validatedData = culturalSensitivitySchema.parse(body);
        const culturalAnalysis = await biasDetector.checkCulturalSensitivity(
          validatedData.statements
        );
        
        return NextResponse.json({
          success: true,
          data: culturalAnalysis,
          timestamp: new Date().toISOString()
        });
      }
      
      case 'diversity': {
        const validatedData = diversityAssessmentSchema.parse(body);
        const diversityAnalysis = await biasDetector.assessDiversity(
          validatedData.statements
        );
        
        return NextResponse.json({
          success: true,
          data: diversityAnalysis,
          timestamp: new Date().toISOString()
        });
      }
      
      case 'quick-check': {
        // Fast heuristic-based check without AI
        const { statements } = body;
        
        if (!Array.isArray(statements)) {
          throw new Error('Statements array is required');
        }
        
        const quickScore = biasDetector.calculateQuickBiasScore(statements);
        
        return NextResponse.json({
          success: true,
          data: {
            score: quickScore,
            status: quickScore >= 80 ? 'good' : quickScore >= 60 ? 'moderate' : 'poor',
            recommendation: quickScore < 60 
              ? 'Consider running full bias detection for detailed analysis'
              : 'Statements appear relatively unbiased'
          },
          timestamp: new Date().toISOString()
        });
      }
      
      case 'comprehensive': {
        // Run all checks together
        const validatedData = detectBiasSchema.parse(body);
        
        const [biasAnalysis, culturalAnalysis, diversityAnalysis] = await Promise.all([
          biasDetector.detectBias(validatedData),
          biasDetector.checkCulturalSensitivity(validatedData.statements),
          biasDetector.assessDiversity(validatedData.statements)
        ]);
        
        const quickScore = biasDetector.calculateQuickBiasScore(validatedData.statements);
        
        return NextResponse.json({
          success: true,
          data: {
            bias: biasAnalysis,
            cultural: culturalAnalysis,
            diversity: diversityAnalysis,
            quickScore,
            overallStatus: {
              biasScore: biasAnalysis.overallScore,
              culturalScore: culturalAnalysis.score,
              diversityScore: diversityAnalysis.score,
              combinedScore: (
                biasAnalysis.overallScore + 
                culturalAnalysis.score + 
                diversityAnalysis.score
              ) / 3,
              recommendation: getOverallRecommendation(
                biasAnalysis.overallScore,
                culturalAnalysis.score,
                diversityAnalysis.score
              )
            }
          },
          timestamp: new Date().toISOString()
        });
      }
      
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action. Use: detect, cultural-sensitivity, diversity, quick-check, or comprehensive'
          },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Bias detection error:', error);
    
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
        error: 'Failed to detect bias',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
});

// Export the authenticated POST handler
export const POST = authenticatedHandler;

// Helper function for overall recommendations
function getOverallRecommendation(
  biasScore: number,
  culturalScore: number,
  diversityScore: number
): string {
  const avgScore = (biasScore + culturalScore + diversityScore) / 3;
  
  if (avgScore >= 80) {
    return 'Excellent - Statements are well-balanced and inclusive';
  } else if (avgScore >= 60) {
    return 'Good - Minor improvements recommended for better balance';
  } else if (avgScore >= 40) {
    return 'Moderate - Significant improvements needed to reduce bias';
  } else {
    return 'Poor - Major revision required to address bias and inclusivity issues';
  }
}

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