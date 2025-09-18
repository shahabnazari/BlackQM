/**
 * AI Grid Recommendation Endpoint
 * Phase 6.86 - Secure grid design generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

// Request validation schema
const gridRequestSchema = z.object({
  researchObjective: z.string().min(10).max(1000),
  statementCount: z.number().min(10).max(100).optional().default(30),
  participantCount: z.number().min(1).max(200).optional().default(30),
  fieldOfStudy: z.string().optional()
});

// Grid configuration type
interface GridRecommendation {
  gridStructure: {
    columns: number;
    distribution: number[];
    labels: string[];
  };
  reasoning: string;
  recommendations: string[];
  alternativeDesigns: Array<{
    name: string;
    structure: number[];
    useCase: string;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Validate request
    const body = await req.json();
    const validatedData = gridRequestSchema.parse(body);
    
    // Generate grid recommendations using the AI proxy
    const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/ai/proxy`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('cookie') || ''
      },
      body: JSON.stringify({
        prompt: `As a Q-methodology expert, recommend an optimal grid structure for this research:
        
Research Objective: ${validatedData.researchObjective}
Number of Statements: ${validatedData.statementCount}
Expected Participants: ${validatedData.participantCount}
${validatedData.fieldOfStudy ? `Field of Study: ${validatedData.fieldOfStudy}` : ''}

Please provide:
1. Recommended grid structure with column counts and distribution
2. Scientific reasoning for this structure
3. 2-3 specific recommendations for this study
4. Alternative grid designs with use cases

Format the response as JSON with the following structure:
{
  "gridStructure": {
    "columns": <number>,
    "distribution": [<array of column heights>],
    "labels": [<array of column labels from most disagree to most agree>]
  },
  "reasoning": "<scientific justification>",
  "recommendations": ["<recommendation 1>", "<recommendation 2>"],
  "alternativeDesigns": [
    {
      "name": "<design name>",
      "structure": [<distribution array>],
      "useCase": "<when to use this design>"
    }
  ]
}`,
        model: 'gpt-4',
        temperature: 0.3,
        maxTokens: 1500
      })
    });
    
    if (!aiResponse.ok) {
      throw new Error('Failed to generate grid recommendation');
    }
    
    const aiData = await aiResponse.json();
    
    try {
      // Parse AI response
      const recommendation: GridRecommendation = JSON.parse(aiData.content);
      
      // Add usage tracking
      console.log(`Grid recommendation generated for user: ${session.user.email}`);
      
      return NextResponse.json({
        success: true,
        recommendation,
        cost: aiData.cost,
        timestamp: new Date().toISOString()
      });
      
    } catch (parseError) {
      // Fallback to predefined grid if AI response is malformed
      const fallbackRecommendation: GridRecommendation = {
        gridStructure: {
          columns: 7,
          distribution: [2, 3, 4, 5, 4, 3, 2],
          labels: ['Strongly Disagree', 'Disagree', 'Somewhat Disagree', 'Neutral', 'Somewhat Agree', 'Agree', 'Strongly Agree']
        },
        reasoning: 'A standard normal distribution grid suitable for most Q-methodology studies. This 7-column design allows participants to express nuanced opinions while maintaining statistical validity.',
        recommendations: [
          'Ensure your statements cover diverse perspectives on the topic',
          'Consider pilot testing with 3-5 participants before the main study',
          'Review statements for clarity and avoid double-barreled questions'
        ],
        alternativeDesigns: [
          {
            name: 'Forced Choice (5 columns)',
            structure: [2, 4, 6, 4, 2],
            useCase: 'When you need stronger differentiation between viewpoints'
          },
          {
            name: 'Extended Range (9 columns)',
            structure: [1, 2, 3, 4, 5, 4, 3, 2, 1],
            useCase: 'For expert participants who can make fine distinctions'
          }
        ]
      };
      
      return NextResponse.json({
        success: true,
        recommendation: fallbackRecommendation,
        cost: 0,
        isFallback: true,
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Grid recommendation error:', error);
    
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
      { error: 'Failed to generate grid recommendation' },
      { status: 500 }
    );
  }
}