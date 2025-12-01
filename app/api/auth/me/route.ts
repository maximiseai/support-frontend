import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('support_session');
    const userEmail = cookieStore.get('support_user_email');

    if (!session?.value) {
      return NextResponse.json(
        { authenticated: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      email: userEmail?.value || null,
    });
  } catch (error) {
    console.error('Get current user error:', error);
    return NextResponse.json(
      { authenticated: false, error: 'Failed to get user info' },
      { status: 500 }
    );
  }
}
