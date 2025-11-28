import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectMongoose } from '@/lib/mongodb';
import User from '@/lib/models/user.model';
import OTP from '@/lib/models/otp.model';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, otp } = body;

    if (!email || !otp) {
      return NextResponse.json(
        { error: 'Email and OTP are required' },
        { status: 400 }
      );
    }

    const emailFormatted = email.toLowerCase().trim();

    // Connect to database
    await connectMongoose();

    // Verify OTP
    const otpDoc = await OTP.get({ email: emailFormatted, otp });

    if (!otpDoc) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP' },
        { status: 401 }
      );
    }

    // Get user
    const user = await User.findOne({ email: emailFormatted });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Verify user has support dashboard access
    if (!user.has_support_dashboard_access) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to access the support dashboard.' },
        { status: 403 }
      );
    }

    // Generate JWT token
    const accessToken = user.token();

    // Delete OTP after successful login
    await otpDoc.deleteOne();

    // Set cookie with JWT token
    const cookieStore = await cookies();
    cookieStore.set('support_session', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    cookieStore.set('support_user_email', emailFormatted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return NextResponse.json({
      success: true,
      message: 'Login successful',
      user: user.transform(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}
