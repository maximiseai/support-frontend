import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { getAccountInfo } from '@/lib/accountsConfig';

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const accountsCollection = db.collection('sales_nav_accounts');

    const accounts = await accountsCollection
      .find({})
      .sort({ account_index: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      count: accounts.length,
      accounts: accounts.map((account) => {
        // Get account info from accounts.json (name and LinkedIn URL)
        const accountInfo = getAccountInfo(account.account_index);

        return {
          _id: account._id,
          account_index: account.account_index,
          // Use name from accounts.json
          name: accountInfo.name || `Account ${account.account_index}`,
          email: account.email,
          active: account.active ?? true,
          status: account.status,
          in_cooldown: account.in_cooldown,
          cooldown_until: account.cooldown_until,
          last_error: account.last_error,
          last_error_time: account.last_error_time,
          error_count: account.error_count || 0,
          updated_at: account.updated_at,
          // Prefer MongoDB linkedin_profile_url, fallback to derived URL
          linkedin_profile_url: account.linkedin_profile_url || accountInfo.linkedinProfileUrl,
        };
      }),
    });
  } catch (error) {
    console.error('List sales nav accounts error:', error);
    return NextResponse.json(
      {
        error: 'Failed to list sales nav accounts',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
