import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI!;

// Get team APIs
export async function GET(request: NextRequest) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'enrich');

    const { searchParams } = new URL(request.url);
    const teamId = searchParams.get('teamId');

    if (!teamId) {
      return NextResponse.json(
        { error: 'teamId is required' },
        { status: 400 }
      );
    }

    // Get team APIs from team-apis collection
    const teamApis = await db.collection('team-apis')
      .find({ team: new ObjectId(teamId) })
      .toArray();

    // Get all APIs to show which ones are not enabled
    const allApis = await db.collection('apis')
      .find({})
      .sort({ name: 1 })
      .toArray();

    // Create a map of enabled APIs (filter out records with missing api field)
    const validTeamApis = teamApis.filter(ta => ta.api);
    const enabledApiIds = new Set(validTeamApis.map(ta => ta.api.toString()));

    // Combine data
    const apisWithAccess = allApis.map(api => {
      const teamApi = validTeamApis.find(ta => ta.api.toString() === api._id.toString());
      const isEnabled = enabledApiIds.has(api._id.toString()) && teamApi?.enabled !== false;

      // Global API settings (from apis collection) - these are defaults for new teams only
      const globalActive = api.active !== false; // defaults to true
      const globalDashboardEnabled = api.dashboardEnabled !== false; // defaults to true

      // Team-specific settings - these override global settings
      const teamDashboardEnabled = isEnabled ? (teamApi?.dashboardEnabled !== false) : false;

      // Will show on client dashboard - ONLY team settings matter (team overrides global)
      const willShowOnDashboard = isEnabled && teamDashboardEnabled;

      return {
        ...api,
        enabled: isEnabled,
        teamApiId: teamApi?._id,
        endpoint: teamApi?.endpoint || api.endpoint,
        rateLimit: teamApi?.rateLimit || api.rateLimit || 100,
        creditsPerCall: teamApi?.creditsPerCall ?? api.creditsPerCall ?? 1,
        // Team-level dashboard visibility
        dashboardEnabled: teamDashboardEnabled,
        // Global API settings (for reference only - used as defaults for new teams)
        globalActive,
        globalDashboardEnabled,
        // Computed: will this actually show on client dashboard?
        willShowOnDashboard,
      };
    });

    return NextResponse.json({ apis: apisWithAccess });
  } catch (error) {
    console.error('Error fetching team APIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team APIs' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// Enable/Disable API for team or update dashboard visibility
export async function POST(request: NextRequest) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'enrich');

    const { teamId, apiId, endpoint, enabled, rateLimit, creditsPerCall, dashboardEnabled } = await request.json();

    if (!teamId || !apiId || !endpoint) {
      return NextResponse.json(
        { error: 'teamId, apiId, and endpoint are required' },
        { status: 400 }
      );
    }

    if (enabled !== undefined) {
      // Enable/Disable API access
      if (enabled) {
        // Enable API for team (create team-api entry)
        const existing = await db.collection('team-apis').findOne({
          team: new ObjectId(teamId),
          endpoint,
        });

        if (existing) {
          // Update existing
          await db.collection('team-apis').updateOne(
            { _id: existing._id },
            {
              $set: {
                enabled: true,
                rateLimit: rateLimit || 100,
                creditsPerCall: creditsPerCall || 1,
                updatedAt: new Date(),
              },
            }
          );
        } else {
          // Create new
          await db.collection('team-apis').insertOne({
            team: new ObjectId(teamId),
            api: new ObjectId(apiId),
            endpoint,
            enabled: true,
            rateLimit: rateLimit || 100,
            creditsPerCall: creditsPerCall || 1,
            dashboardEnabled: dashboardEnabled || false,
            cycle: 'min',
            callsInCurrentMinute: 0,
            lastCalledAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }

        return NextResponse.json({
          success: true,
          message: 'API enabled for team',
        });
      } else {
        // Disable API for team
        await db.collection('team-apis').updateOne(
          {
            team: new ObjectId(teamId),
            endpoint,
          },
          {
            $set: {
              enabled: false,
              updatedAt: new Date(),
            },
          }
        );

        return NextResponse.json({
          success: true,
          message: 'API disabled for team',
        });
      }
    } else if (dashboardEnabled !== undefined) {
      // Update only dashboard visibility
      const updateResult = await db.collection('team-apis').updateOne(
        {
          team: new ObjectId(teamId),
          endpoint,
        },
        {
          $set: {
            dashboardEnabled,
            updatedAt: new Date(),
          },
        }
      );

      if (updateResult.matchedCount === 0) {
        return NextResponse.json(
          { error: 'API access not found for this team' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: dashboardEnabled
          ? 'API dashboard visibility enabled'
          : 'API dashboard visibility disabled',
      });
    } else {
      return NextResponse.json(
        { error: 'Either enabled or dashboardEnabled must be provided' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error updating team API access:', error);
    return NextResponse.json(
      { error: 'Failed to update team API access' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}

// Update team API settings (rate limit, credits per call)
export async function PATCH(request: NextRequest) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'enrich');

    const { teamId, endpoint, rateLimit, creditsPerCall } = await request.json();

    if (!teamId || !endpoint) {
      return NextResponse.json(
        { error: 'teamId and endpoint are required' },
        { status: 400 }
      );
    }

    if (rateLimit === undefined && creditsPerCall === undefined) {
      return NextResponse.json(
        { error: 'At least one of rateLimit or creditsPerCall must be provided' },
        { status: 400 }
      );
    }

    // Validate values
    if (rateLimit !== undefined && (typeof rateLimit !== 'number' || rateLimit < 0)) {
      return NextResponse.json(
        { error: 'rateLimit must be a non-negative number' },
        { status: 400 }
      );
    }

    if (creditsPerCall !== undefined && (typeof creditsPerCall !== 'number' || creditsPerCall < 0)) {
      return NextResponse.json(
        { error: 'creditsPerCall must be a non-negative number' },
        { status: 400 }
      );
    }

    // Build update object
    const updateFields: Record<string, any> = {
      updatedAt: new Date(),
    };

    if (rateLimit !== undefined) {
      updateFields.rateLimit = rateLimit;
    }

    if (creditsPerCall !== undefined) {
      updateFields.creditsPerCall = creditsPerCall;
    }

    const updateResult = await db.collection('team-apis').updateOne(
      {
        team: new ObjectId(teamId),
        endpoint,
      },
      {
        $set: updateFields,
      }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { error: 'API access not found for this team. Enable the API first.' },
        { status: 404 }
      );
    }

    const messages: string[] = [];
    if (rateLimit !== undefined) messages.push(`Rate limit set to ${rateLimit}/min`);
    if (creditsPerCall !== undefined) messages.push(`Credits per call set to ${creditsPerCall}`);

    return NextResponse.json({
      success: true,
      message: messages.join('. '),
    });
  } catch (error) {
    console.error('Error updating team API settings:', error);
    return NextResponse.json(
      { error: 'Failed to update team API settings' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
