import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { encryptPassword } from '@/lib/encryption';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      account_index,
      name,
      email,
      password, // Plain text password - will be encrypted if provided
      profile_urn,
      two_fa_auth_token,
      cookie_path,
      proxy,
      linkedin_profile_url,
      location,
      account_year,
      connection_count,
      recovery_email,
      active,
      // permanently_disabled - REMOVED: Never allow permanent banning of accounts
    } = body;

    // Validate account_index
    if (typeof account_index !== 'number') {
      return NextResponse.json(
        { error: 'Account index is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('linkedin_accounts');

    // Check if account exists
    const existing = await collection.findOne({ account_index });
    if (!existing) {
      return NextResponse.json(
        { error: `Account with index ${account_index} not found` },
        { status: 404 }
      );
    }

    // If changing email, check it's not taken by another account
    if (email && email.trim().toLowerCase() !== existing.email) {
      const emailTaken = await collection.findOne({
        email: email.trim().toLowerCase(),
        account_index: { $ne: account_index },
      });
      if (emailTaken) {
        return NextResponse.json(
          { error: 'This email is already used by another account' },
          { status: 400 }
        );
      }
    }

    // Build update object with only provided fields
    const updateFields: Record<string, any> = {
      updated_at: new Date(),
    };

    if (name !== undefined) updateFields.name = name.trim();
    if (email !== undefined) updateFields.email = email.trim().toLowerCase();
    if (profile_urn !== undefined) updateFields.profile_urn = profile_urn.trim();
    if (two_fa_auth_token !== undefined) updateFields.two_fa_auth_token = two_fa_auth_token.trim();
    if (cookie_path !== undefined) updateFields.cookie_path = cookie_path.trim();
    if (linkedin_profile_url !== undefined) updateFields.linkedin_profile_url = linkedin_profile_url.trim();
    if (location !== undefined) updateFields.location = location.trim();
    if (account_year !== undefined) updateFields.account_year = account_year.trim();
    if (connection_count !== undefined) updateFields.connection_count = parseInt(connection_count, 10) || 0;
    if (recovery_email !== undefined) updateFields.recovery_email = recovery_email.trim();
    if (typeof active === 'boolean') updateFields.active = active;
    // REMOVED: Never allow permanent banning - accounts can only be temporarily disabled via 'active' flag

    // Handle proxy update
    if (proxy !== undefined) {
      updateFields.proxy = {
        host: proxy?.host?.trim() || existing.proxy?.host || '',
        port: proxy?.port ? parseInt(proxy.port, 10) : existing.proxy?.port || 0,
        username: proxy?.username?.trim() || existing.proxy?.username || '',
        password: proxy?.password?.trim() || existing.proxy?.password || '',
      };
    }

    // Encrypt password if provided (not empty)
    if (password && password.trim()) {
      try {
        updateFields.encrypted_password = encryptPassword(password);
      } catch (err) {
        return NextResponse.json(
          { error: 'Failed to encrypt password. Check ACCOUNTS_ENCRYPTION_KEY.' },
          { status: 500 }
        );
      }
    }

    const result = await collection.updateOne(
      { account_index },
      { $set: updateFields }
    );

    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update account' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Account ${account_index} updated successfully`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error('Update account error:', error);
    return NextResponse.json(
      {
        error: 'Failed to update account',
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
