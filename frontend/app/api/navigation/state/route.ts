import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get studyId from query params if provided
    const searchParams = request.nextUrl.searchParams;
    const studyId = searchParams.get('studyId');

    // For now, return mock navigation state
    // In production, this would fetch from the backend
    const navigationState = {
      currentPhase: 'discover',
      currentTool: undefined,
      phaseProgress: {
        discover: 25,
        design: 0,
        build: 0,
        recruit: 0,
        collect: 0,
        analyze: 0,
        visualize: 0,
        interpret: 0,
        report: 0,
        archive: 0,
      },
      completedPhases: [],
      availablePhases: ['discover', 'design', 'build'],
      studyId: studyId || undefined,
      preferences: {
        compactMode: false,
        showShortcuts: true,
        theme: 'light',
      },
    };

    // If we have a backend available, forward the request
    if (process.env.BACKEND_URL) {
      try {
        const params = studyId ? `?studyId=${studyId}` : '';
        const response = await fetch(
          `${process.env.BACKEND_URL}/api/navigation/state${params}`,
          {
            headers: {
              Authorization: request.headers.get('Authorization') || '',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch (error) {
        console.error('Failed to fetch from backend:', error);
        // Fall back to mock data
      }
    }

    return NextResponse.json(navigationState);
  } catch (error) {
    console.error('Navigation state error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
