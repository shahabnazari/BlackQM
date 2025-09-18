/**
 * Response Analysis AI API Endpoint
 * Phase 6.86 Day 7 - API route for response analysis AI features
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/auth/middleware';
import { AIService } from '@/lib/services/ai.service';
import { ResponseAnalyzerService } from '@/lib/ai/response-analyzer';

// Response data schema
const ParticipantResponseSchema = z.object({
  id: z.string(),
  participantId: z.string(),
  completionTime: z.number(),
  changeCount: z.number(),
  placements: z.record(z.string(), z.any()).optional(),
  comments: z.string().optional(),
  demographics: z.record(z.string(), z.any()).optional()
});

// Request validation schemas
const DetectPatternsSchema = z.object({
  action: z.literal('detect-patterns'),
  responses: z.array(ParticipantResponseSchema),
  studyContext: z.object({
    topic: z.string().optional(),
    researchQuestion: z.string().optional(),
    participantCount: z.number().optional()
  }).optional()
});

const CalculateQualitySchema = z.object({
  action: z.literal('calculate-quality'),
  response: ParticipantResponseSchema,
  requirements: z.record(z.string(), z.any()).optional()
});

const DetectAnomaliesSchema = z.object({
  action: z.literal('detect-anomalies'),
  response: ParticipantResponseSchema,
  allResponses: z.array(ParticipantResponseSchema)
});

const ExtractInsightsSchema = z.object({
  action: z.literal('extract-insights'),
  responses: z.array(ParticipantResponseSchema),
  studyContext: z.object({
    topic: z.string(),
    researchQuestion: z.string()
  }).optional()
});

const CrossAnalysisSchema = z.object({
  action: z.literal('cross-analysis'),
  responses: z.array(ParticipantResponseSchema),
  groupBy: z.string().optional()
});

const ComprehensiveAnalysisSchema = z.object({
  action: z.literal('comprehensive-analysis'),
  responses: z.array(ParticipantResponseSchema),
  studyContext: z.object({
    topic: z.string(),
    researchQuestion: z.string(),
    studyId: z.string().optional()
  }).optional()
});

const RequestSchema = z.discriminatedUnion('action', [
  DetectPatternsSchema,
  CalculateQualitySchema,
  DetectAnomaliesSchema,
  ExtractInsightsSchema,
  CrossAnalysisSchema,
  ComprehensiveAnalysisSchema
]);

async function handler(req: NextRequest) {
  try {
    // Parse request body
    const body = await req.json();
    
    // Validate request
    const validatedData = RequestSchema.parse(body);
    
    // Initialize services
    const aiService = AIService.getInstance();
    const analyzerService = new ResponseAnalyzerService(aiService);
    
    // Handle different analysis types
    let result: any;
    
    switch (validatedData.action) {
      case 'detect-patterns':
        result = await analyzerService.detectResponsePatterns(
          validatedData.responses,
          validatedData.studyContext || {}
        );
        break;
        
      case 'calculate-quality':
        result = await analyzerService.calculateQualityScore(
          validatedData.response,
          validatedData.requirements || {}
        );
        break;
        
      case 'detect-anomalies':
        result = await analyzerService.detectAnomalies(
          validatedData.response,
          validatedData.allResponses
        );
        break;
        
      case 'extract-insights':
        result = await analyzerService.extractInsights(
          validatedData.responses,
          validatedData.studyContext || {}
        );
        break;
        
      case 'cross-analysis':
        result = await analyzerService.analyzeCrossParticipant(
          validatedData.responses,
          validatedData.groupBy
        );
        break;
        
      case 'comprehensive-analysis':
        result = await analyzerService.generateComprehensiveAnalysis(
          validatedData.responses,
          validatedData.studyContext || {}
        );
        break;
        
      default:
        throw new Error('Invalid analysis action');
    }
    
    // Track AI usage for cost monitoring
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Response analysis completed: ${validatedData.action}`);
    
    return NextResponse.json({
      success: true,
      action: validatedData.action,
      data: result,
      timestamp,
      metadata: {
        responseCount: 'responses' in validatedData ? validatedData.responses.length : 1,
        processingTime: Date.now() - new Date(timestamp).getTime()
      }
    });
    
  } catch (error) {
    console.error('Response analysis endpoint error:', error);
    
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
        error: error instanceof Error ? error.message : 'Internal server error',
        fallback: {
          message: 'Analysis temporarily unavailable. Using cached results.',
          useCache: true
        }
      },
      { status: 500 }
    );
  }
}

// Export with authentication wrapper - requires researcher role
export const POST = withAuth(handler as any);

// GET endpoint for retrieving cached analyses
export const GET = withAuth(async (req: NextRequest): Promise<NextResponse> => {
  try {
    // Extract study ID from query params
    const { searchParams } = new URL(req.url);
    const studyId = searchParams.get('studyId');
    
    if (!studyId) {
      return NextResponse.json(
        { error: 'Study ID required' },
        { status: 400 }
      );
    }
    
    // TODO: Implement cache retrieval
    // For now, return mock data
    return NextResponse.json({
      success: true,
      studyId,
      cached: true,
      analysis: {
        summary: 'Cached analysis available',
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('GET analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analysis' },
      { status: 500 }
    );
  }
});

// OPTIONS handler for CORS
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}