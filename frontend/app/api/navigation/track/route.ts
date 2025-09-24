import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/auth-options';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { studyId, phase, action } = body;

    if (!studyId || !phase || !action) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If we have a backend available, forward the request
    if (process.env.BACKEND_URL) {
      try {
        const response = await fetch(`${process.env.BACKEND_URL}/api/navigation/track`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': request.headers.get('Authorization') || '',
          },
          body: JSON.stringify({ studyId, phase, action }),
        });

        if (response.ok) {
          const data = await response.json();
          return NextResponse.json(data);
        }
      } catch (error) {
        console.error('Failed to track action in backend:', error);
        // Continue with local tracking
      }
    }

    // For now, just log and return success
    // In production, this would be stored in analytics/database
    console.log(`[Navigation Track] Study: ${studyId}, Phase: ${phase}, Action: ${action}`);

    return NextResponse.json({
      success: true,
      tracked: {
        studyId,
        phase,
        action,
        timestamp: new Date().toISOString(),
        userId: session.user.id || session.user.email,
      },
    });
  } catch (error) {
    console.error('Track action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}