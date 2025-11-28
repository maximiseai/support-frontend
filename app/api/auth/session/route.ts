import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('support_session');

    if (session?.value) {
      return NextResponse.json({
        authenticated: true,
      });
    } else {
      return NextResponse.json({
        authenticated: false,
      });
    }
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { authenticated: false },
      { status: 500 }
    );
  }
}
