/**
 * Secure Backend Proxy for OpenAI API
 * Phase 6.86 - Enterprise-grade security implementation
 * 
 * This endpoint:
 * 1. Keeps API keys on server-side only
 * 2. Requires authentication
 * 3. Implements rate limiting
 * 4. Tracks usage and costs
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import OpenAI from 'openai';
import { z } from 'zod';

// Initialize OpenAI client (server-side only)
let openai: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not configured on server');
    }
    
    openai = new OpenAI({
      apiKey,
      // NO dangerouslyAllowBrowser here - this is server-side only
      organization: process.env.OPENAI_ORG_ID
    });
  }
  
  return openai;
}

// Request validation schema
const proxyRequestSchema = z.object({
  prompt: z.string().min(1).max(10000),
  model: z.enum(['gpt-3.5-turbo', 'gpt-4']).optional().default('gpt-3.5-turbo'),
  temperature: z.number().min(0).max(2).optional().default(0.7),
  maxTokens: z.number().int().min(1).max(4000).optional().default(2000),
  context: z.any().optional()
});

// Rate limiting storage (in production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(userId);
  
  if (!userLimit || now > userLimit.resetTime) {
    // Reset rate limit window
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + 60000 // 1 minute window
    });
    return true;
  }
  
  const maxRequests = parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10');
  
  if (userLimit.count >= maxRequests) {
    return false; // Rate limit exceeded
  }
  
  userLimit.count++;
  return true;
}

// Cost tracking
function calculateCost(model: string, inputTokens: number, outputTokens: number): number {
  const costs = {
    'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
    'gpt-4': { input: 0.01, output: 0.03 }
  };
  
  const modelCost = costs[model as keyof typeof costs] || costs['gpt-3.5-turbo'];
  return (inputTokens * modelCost.input + outputTokens * modelCost.output) / 1000;
}

export async function POST(req: NextRequest) {
  try {
    // Step 1: Authentication check
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    const userId = session.user.email || 'anonymous';
    
    // Step 2: Rate limiting check
    if (!checkRateLimit(userId)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          retryAfter: 60 
        },
        { status: 429 }
      );
    }
    
    // Step 3: Validate request
    const body = await req.json();
    const validatedData = proxyRequestSchema.parse(body);
    
    // Step 4: Make OpenAI API call (server-side only)
    try {
      const client = getOpenAIClient();
      
      const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
      
      // Add context if provided
      if (validatedData.context) {
        messages.push({
          role: 'system',
          content: typeof validatedData.context === 'string' 
            ? validatedData.context 
            : JSON.stringify(validatedData.context)
        });
      }
      
      // Add user prompt
      messages.push({
        role: 'user',
        content: validatedData.prompt
      });
      
      const completion = await client.chat.completions.create({
        model: validatedData.model,
        messages,
        temperature: validatedData.temperature,
        max_tokens: validatedData.maxTokens
      });
      
      const content = completion.choices[0]?.message?.content || '';
      const usage = completion.usage;
      
      // Calculate cost
      const cost = calculateCost(
        validatedData.model,
        usage?.prompt_tokens || 0,
        usage?.completion_tokens || 0
      );
      
      // Log usage for audit trail (in production, save to database)
      console.log(`AI Usage: User=${userId}, Model=${validatedData.model}, Tokens=${usage?.total_tokens}, Cost=$${cost.toFixed(4)}`);
      
      // Return response
      return NextResponse.json({
        success: true,
        content,
        tokens: usage?.total_tokens || 0,
        inputTokens: usage?.prompt_tokens || 0,
        outputTokens: usage?.completion_tokens || 0,
        cost,
        model: validatedData.model,
        timestamp: new Date().toISOString()
      });
      
    } catch (openAIError: any) {
      console.error('OpenAI API error:', openAIError);
      
      // Handle specific OpenAI errors
      if (openAIError?.code === 'insufficient_quota') {
        return NextResponse.json(
          { error: 'AI service quota exceeded' },
          { status: 402 }
        );
      }
      
      if (openAIError?.code === 'invalid_api_key') {
        // Log critical error but don't expose to client
        console.error('CRITICAL: Invalid OpenAI API key');
        return NextResponse.json(
          { error: 'AI service configuration error' },
          { status: 500 }
        );
      }
      
      // Generic error response
      return NextResponse.json(
        { error: 'AI service temporarily unavailable' },
        { status: 503 }
      );
    }
    
  } catch (error) {
    console.error('Proxy endpoint error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: error.issues
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// OPTIONS request for CORS
export async function OPTIONS(_req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Credentials': 'true'
    }
  });
}