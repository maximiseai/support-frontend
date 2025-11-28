import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import User from '@/lib/models/user.model';
import OTP from '@/lib/models/otp.model';
import { sendOTP } from '@/lib/services/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const emailFormatted = email.toLowerCase().trim();

    // Connect to database
    await connectMongoose();

    // Check if user exists and has support dashboard access
    const user = await User.findOne({ email: emailFormatted });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email' },
        { status: 404 }
      );
    }

    if (!user.has_support_dashboard_access) {
      return NextResponse.json(
        { error: 'Access denied. You do not have permission to access the support dashboard.' },
        { status: 403 }
      );
    }

    // Generate OTP
    const { otp } = await OTP.findAndGenerateOTP({ email: emailFormatted });

    // Send OTP via AWS SES
    await sendOTP(emailFormatted, otp);

    return NextResponse.json({
      success: true,
      message: `One time login code has been sent to ${emailFormatted}`,
    });
  } catch (error) {
    console.error('OTP generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate OTP', details: (error as Error).message },
      { status: 500 }
    );
  }
}
