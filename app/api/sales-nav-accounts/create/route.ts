import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { encryptPassword } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      email,
      password, // Plain text password - will be encrypted
      profile_urn,
      two_fa_auth_token,
      cookie_path,
      proxy,
      linkedin_profile_url,
      location,
      account_year,
      connection_count,
      recovery_email,
    } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('linkedin_accounts');

    // Check if account with this email already exists
    const existing = await collection.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Get the next account_index
    const lastAccount = await collection
      .find({})
      .sort({ account_index: -1 })
      .limit(1)
      .toArray();
    const nextIndex = lastAccount.length > 0 ? lastAccount[0].account_index + 1 : 0;

    // Encrypt password if provided (password is optional)
    let encrypted_password = '';
    if (password && password.trim()) {
      try {
        encrypted_password = encryptPassword(password);
      } catch (err) {
        console.error('Password encryption error:', err);
        return NextResponse.json(
          { error: 'Failed to encrypt password. Check ACCOUNTS_ENCRYPTION_KEY environment variable.' },
          { status: 500 }
        );
      }
    }

    const now = new Date();

    // Create the account document
    const newAccount = {
      account_index: nextIndex,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      profile_urn: profile_urn?.trim() || '',
      encrypted_password,
      two_fa_auth_token: two_fa_auth_token?.trim() || '',
      cookie_path: cookie_path?.trim() || `./cookie-jar/cookies-${name.replace(/\s+/g, '')}.json`,
      proxy: {
        host: proxy?.host?.trim() || '',
        port: proxy?.port ? parseInt(proxy.port, 10) : 0,
        username: proxy?.username?.trim() || '',
        password: proxy?.password?.trim() || '',
      },
      linkedin_profile_url: linkedin_profile_url?.trim() || '',
      location: location?.trim() || '',
      account_year: account_year?.trim() || '',
      connection_count: connection_count ? parseInt(connection_count, 10) : 0,
      recovery_email: recovery_email?.trim() || '',
      is_new: true,

      // Default status fields
      status: 'available',
      active: false, // New accounts start as inactive
      hourly_requests: 0,
      daily_requests: 0,
      daily_followers: 0,
      daily_followers_limit: 20000,
      last_hourly_reset: now,
      last_daily_reset: now,
      in_cooldown: false,
      cooldown_until: null,
      cooldown_reason: '',
      has_experience: false,
      experience_checked_at: null,
      error_count: 0,
      last_error: '',
      last_error_at: null,
      permanently_disabled: false,
      created_at: now,
      updated_at: now,
    };

    const result = await collection.insertOne(newAccount);

    return NextResponse.json({
      success: true,
      message: `Account "${name}" created successfully with index ${nextIndex}`,
      account: {
        _id: result.insertedId,
        account_index: nextIndex,
        name: newAccount.name,
        email: newAccount.email,
        active: newAccount.active,
      },
    });
  } catch (error) {
    console.error('Create account error:', error);
    return NextResponse.json(
      {
        error: 'Failed to create account',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
