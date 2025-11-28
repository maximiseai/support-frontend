import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teamId, apis, limit } = body;

    // Validation
    if (!teamId || !apis || !Array.isArray(apis) || apis.length === 0) {
      return NextResponse.json(
        { error: 'Team ID and APIs array are required' },
        { status: 400 }
      );
    }

    if (limit === undefined || typeof limit !== 'number' || limit < 0) {
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

    // Build update object for all selected APIs
    const updateFields: Record<string, any> = {
      updated_at: new Date(),
    };

    apis.forEach((apiKey: string) => {
      updateFields[`api_limits.${apiKey}`] = limit;
    });

    // Update all rate limits at once
    const result = await teamsCollection.updateOne(
      { _id: teamObjectId },
      {
        $set: updateFields,
      }
    );

    if (result.modifiedCount === 0 && result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update rate limits' },
        { status: 500 }
      );
    }

    // Get updated team
    const updatedTeam = await teamsCollection.findOne({ _id: teamObjectId });

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${apis.length} API rate limit${apis.length > 1 ? 's' : ''} to ${limit} for ${team.name}`,
      updatedApis: apis,
      team: {
        _id: updatedTeam?._id,
        name: updatedTeam?.name,
        api_limits: updatedTeam?.api_limits,
      },
    });
  } catch (error) {
    console.error('Bulk update rate limits error:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update rate limits', details: (error as Error).message },
      { status: 500 }
    );
  }
}
