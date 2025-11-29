import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();
    const accountsCollection = db.collection('linkedin_accounts');

    const accounts = await accountsCollection
      .find({})
      .sort({ account_index: 1 })
      .toArray();

    return NextResponse.json({
      success: true,
      count: accounts.length,
      accounts: accounts.map((account) => {
        return {
          _id: account._id,
          account_index: account.account_index,
          name: account.name || `Account ${account.account_index}`,
          email: account.email,
          active: account.active ?? true,
          status: account.status,
          in_cooldown: account.in_cooldown,
          cooldown_until: account.cooldown_until,
          cooldown_reason: account.cooldown_reason,
          last_error: account.last_error,
          last_error_at: account.last_error_at,
          error_count: account.error_count || 0,
          permanently_disabled: account.permanently_disabled || false,
          updated_at: account.updated_at,
          linkedin_profile_url: account.linkedin_profile_url,
          // Additional fields from unified schema
          proxy_host: account.proxy?.host,
          daily_requests: account.daily_requests || 0,
          hourly_requests: account.hourly_requests || 0,
          daily_followers: account.daily_followers || 0,
          daily_followers_limit: account.daily_followers_limit || 20000,
          has_2fa: !!account.two_fa_auth_token,
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
