import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountIndex, active } = body;

    if (accountIndex === undefined || typeof active !== 'boolean') {
      return NextResponse.json(
        { error: 'Account index and active status are required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const accountsCollection = db.collection('linkedin_accounts');

    // Find the account
    const account = await accountsCollection.findOne({
      account_index: accountIndex,
    });

    if (!account) {
      return NextResponse.json(
        { error: 'Account not found' },
        { status: 404 }
      );
    }

    // Update active status
    const result = await accountsCollection.updateOne(
      { account_index: accountIndex },
      {
        $set: {
          active,
          updated_at: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update account status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Account ${accountIndex} has been ${active ? 'enabled' : 'disabled'}`,
      account: {
        account_index: accountIndex,
        email: account.email,
        active,
      },
    });
  } catch (error) {
    console.error('Toggle sales nav account error:', error);
    return NextResponse.json(
      {
        error: 'Failed to toggle account status',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
