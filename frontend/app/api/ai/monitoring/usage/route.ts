/**
 * AI Usage Monitoring API Endpoint
 * Phase 6.86: User-specific usage and budget tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

export async function GET(req: NextRequest) {
  try {
    // Authentication check
    const session = await getServerSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // For demo purposes, return mock usage data
    // In production, this would query the actual database
    const dailyUsage = Math.random() * 8 + 2; // Random between 2-10
    const dailyLimit = 10;
    const monthlyUsage = Math.random() * 200 + 50; // Random between 50-250
    const monthlyLimit = 300;
    
    const mockUsage = {
      userId: session.user.email || 'user',
      dailyUsage,
      monthlyUsage,
      dailyLimit,
      monthlyLimit,
      percentOfDailyLimit: (dailyUsage / dailyLimit) * 100,
      percentOfMonthlyLimit: (monthlyUsage / monthlyLimit) * 100,
      isApproachingLimit: dailyUsage >= dailyLimit * 0.8,
      isOverLimit: dailyUsage >= dailyLimit,
      
      // Additional usage details
      recentRequests: [
        {
          id: '1',
          endpoint: 'questionnaire-generation',
          model: 'gpt-3.5-turbo',
          totalTokens: 1250,
          cost: 0.0025,
          status: 'success',
          responseTimeMs: 1234,
          createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          endpoint: 'statement-generation',
          model: 'gpt-4',
          totalTokens: 2500,
          cost: 0.075,
          status: 'success',
          responseTimeMs: 2456,
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          endpoint: 'bias-detection',
          model: 'gpt-3.5-turbo',
          totalTokens: 800,
          cost: 0.0016,
          status: 'success',
          responseTimeMs: 876,
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        }
      ],
      
      // Usage trend for the last 7 days
      trend: Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requests: Math.floor(Math.random() * 100) + 20,
        totalCost: Math.random() * 5 + 1,
        avgResponseTime: Math.random() * 2000 + 500
      })).reverse()
    };
    
    return NextResponse.json(mockUsage);
    
  } catch (error) {
    console.error('Usage endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch usage data' },
      { status: 500 }
    );
  }
}