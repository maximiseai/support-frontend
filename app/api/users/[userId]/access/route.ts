import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import User from '@/lib/models/user.model';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await connectMongoose();

    const { userId } = await params;
    const { has_support_dashboard_access } = await request.json();

    if (typeof has_support_dashboard_access !== 'boolean') {
      return NextResponse.json(
        { error: 'has_support_dashboard_access must be a boolean' },
        { status: 400 }
      );
    }

    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          has_support_dashboard_access,
          updatedAt: new Date(),
        },
      },
      { new: true }
    ).select('email name has_support_dashboard_access');

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
      message: `Support dashboard access ${has_support_dashboard_access ? 'granted' : 'revoked'} for ${user.email}`,
    });
  } catch (error) {
    console.error('Error updating user access:', error);
    return NextResponse.json(
      { error: 'Failed to update user access' },
      { status: 500 }
    );
  }
}
