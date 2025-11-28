import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, dailyLimit, maxLimit } = body;

    // Validation
    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    if (dailyLimit === null && maxLimit === null) {
      return NextResponse.json(
        { error: 'At least one limit must be provided' },
        { status: 400 }
      );
    }

    if (dailyLimit !== null && (typeof dailyLimit !== 'number' || dailyLimit < 0)) {
      return NextResponse.json(
        { error: 'Daily limit must be a non-negative number' },
        { status: 400 }
      );
    }

    if (maxLimit !== null && (typeof maxLimit !== 'number' || maxLimit < 0)) {
      return NextResponse.json(
        { error: 'Maximum limit must be a non-negative number' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const teamsCollection = db.collection('teams');

    // Validate team exists
    let teamObjectId: ObjectId;
    try {
      teamObjectId = new ObjectId(teamId);
    } catch (err) {
      return NextResponse.json(
        { error: 'Invalid team ID format' },
        { status: 400 }
      );
    }

    const team = await teamsCollection.findOne({ _id: teamObjectId });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Build update object
    const updateFields: Record<string, any> = {
      updated_at: new Date(),
    };

    if (dailyLimit !== null) {
      updateFields.company_followers_per_team_rate_limit = dailyLimit;
    }

    if (maxLimit !== null) {
      updateFields.company_followers_per_request_limit = maxLimit;
    }

    // Update followers limits
    const result = await teamsCollection.updateOne(
      { _id: teamObjectId },
      {
        $set: updateFields,
      }
    );

    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update followers limits' },
        { status: 500 }
      );
    }

    // Get updated team
    const updatedTeam = await teamsCollection.findOne({ _id: teamObjectId });

    // Build response message
    const updatedFields = [];
    if (dailyLimit !== null) {
      updatedFields.push(`daily limit to ${dailyLimit}`);
    }
    if (maxLimit !== null) {
      updatedFields.push(`per-request limit to ${maxLimit}`);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated company followers ${updatedFields.join(' and ')} for ${team.name}`,
      team: {
        _id: updatedTeam?._id,
        name: updatedTeam?.name,
        company_followers_per_team_rate_limit: updatedTeam?.company_followers_per_team_rate_limit,
        company_followers_per_request_limit: updatedTeam?.company_followers_per_request_limit,
      },
    });
  } catch (error) {
    console.error('Update followers limits error:', error);
    return NextResponse.json(
      { error: 'Failed to update followers limits', details: (error as Error).message },
      { status: 500 }
    );
  }
}
