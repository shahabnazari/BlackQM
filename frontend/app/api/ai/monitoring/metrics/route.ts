/**
 * AI Monitoring Metrics API Endpoint
 * Phase 6.86: Enterprise-grade monitoring data endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
    
    // Get time range from query params
    const searchParams = req.nextUrl.searchParams;
    const timeRange = searchParams.get('range') || 'day';
    
    // Calculate start date based on time range
    const now = new Date();
    let startDate: Date;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      default:
        startDate = new Date(now.setHours(0, 0, 0, 0));
    }
    
    // For demo purposes, return mock data
    // In production, this would query the actual database
    const mockMetrics = {
      totalRequests: Math.floor(Math.random() * 1000) + 500,
      totalTokens: Math.floor(Math.random() * 50000) + 25000,
      totalCost: Math.random() * 10 + 5,
      averageResponseTime: Math.random() * 2000 + 1000,
      errorRate: Math.random() * 5,
      cacheHitRate: Math.random() * 30 + 20,
      topModels: [
        { model: 'gpt-3.5-turbo', count: 450, cost: 2.25 },
        { model: 'gpt-4', count: 150, cost: 7.50 },
        { model: 'gpt-4-turbo', count: 75, cost: 3.75 }
      ],
      hourlyDistribution: Array.from({ length: 24 }, (_, hour) => ({
        hour,
        requests: Math.floor(Math.random() * 50) + 10
      }))
    };
    
    return NextResponse.json(mockMetrics);
    
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}