import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountIndex, linkedinProfileUrl } = body;

    // Validate input
    if (typeof accountIndex !== 'number') {
      return NextResponse.json(
        { error: 'Account index is required and must be a number' },
        { status: 400 }
      );
    }

    if (typeof linkedinProfileUrl !== 'string') {
      return NextResponse.json(
        { error: 'LinkedIn profile URL must be a string' },
        { status: 400 }
      );
    }

    // Validate URL format if not empty
    if (linkedinProfileUrl.trim() !== '') {
      try {
        const url = new URL(linkedinProfileUrl);
        if (!url.hostname.includes('linkedin.com')) {
          return NextResponse.json(
            { error: 'URL must be a valid LinkedIn URL' },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: 'Invalid URL format' },
          { status: 400 }
        );
      }
    }

    const { db } = await connectToDatabase();
    const accountsCollection = db.collection('sales_nav_accounts');

    // Update the account
    const result = await accountsCollection.updateOne(
      { account_index: accountIndex },
      {
        $set: {
          linkedin_profile_url: linkedinProfileUrl.trim() || null,
          updated_at: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: `Account with index ${accountIndex} not found` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `LinkedIn URL updated for account ${accountIndex}`,
      linkedin_profile_url: linkedinProfileUrl.trim() || null,
    });
  } catch (error) {
    console.error('Update LinkedIn URL error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update LinkedIn URL',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
