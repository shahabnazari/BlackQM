import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { phase, studyId } = body;

    // Validate phase
    const validPhases = [
      'discover',
      'design',
      'build',
      'recruit',
      'collect',
      'analyze',
      'visualize',
      'interpret',
      'report',
      'archive',
    ];

    if (!phase || !validPhases.includes(phase)) {
      return NextResponse.json({ error: 'Invalid phase' }, { status: 400 });
    }

    // If we have a backend available, forward the request
    if (process.env.BACKEND_URL) {
      try {
        const response = await fetch(
          `${process.env.BACKEND_URL}/api/navigation/phase`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: request.headers.get('Authorization') || '',
            },
            body: JSON.stringify({ phase, studyId }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch (error) {
        console.error('Failed to update phase in backend:', error);
        // Continue with local update
      }
    }

    // For now, just return success
    // In production, this would update the database
    return NextResponse.json({
      success: true,
      phase,
      studyId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Phase update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
