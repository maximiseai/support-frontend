import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, apiName, limit } = body;

    if (!teamId || !apiName || limit === undefined) {
      return NextResponse.json(
        { error: 'Team ID, API name, and limit are required' },
        { status: 400 }
      );
    }

    if (typeof limit !== 'number' || limit < 0) {
      return NextResponse.json(
        { error: 'Limit must be a non-negative number' },
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

    // Update rate limit
    const updateKey = `api_limits.${apiName}`;
    const result = await teamsCollection.updateOne(
      { _id: teamObjectId },
      {
        $set: {
          [updateKey]: limit,
          updated_at: new Date(),
        },
      }
    );

    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update rate limit' },
        { status: 500 }
      );
    }

    // Get updated team
    const updatedTeam = await teamsCollection.findOne({ _id: teamObjectId });

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${apiName} rate limit to ${limit} for ${team.name}`,
      team: {
        _id: updatedTeam?._id,
        name: updatedTeam?.name,
        api_limits: updatedTeam?.api_limits,
      },
    });
  } catch (error) {
    console.error('Update rate limit error:', error);
    return NextResponse.json(
      { error: 'Failed to update rate limit', details: (error as Error).message },
      { status: 500 }
    );
  }
}
