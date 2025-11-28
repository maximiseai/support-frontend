import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Helper function to escape regex special characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const apiEndpoint = searchParams.get('api');
    const minLimit = searchParams.get('minLimit');
    const maxLimit = searchParams.get('maxLimit');
    const exactMatch = searchParams.get('exact') === 'true';

    if (!apiEndpoint) {
      return NextResponse.json(
        { error: 'API endpoint parameter is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const teamsCollection = db.collection('teams');

    // Find all teams
    const allTeams = await teamsCollection.find({}).toArray();

    // Filter teams based on criteria
    const escapedQuery = escapeRegex(apiEndpoint);
    const regexPattern = new RegExp(exactMatch ? `^${escapedQuery}$` : escapedQuery, 'i');

    const matchingTeams = allTeams
      .map(team => {
        if (!team.api_limits || typeof team.api_limits !== 'object') {
          return null;
        }

        // Find matching API endpoints
        const matchingApis = Object.entries(team.api_limits)
          .filter(([apiKey, limit]) => {
            // Check if API key matches
            if (!regexPattern.test(apiKey)) {
              return false;
            }

            // Apply limit filters if provided
            const limitValue = typeof limit === 'number' ? limit : 0;
            if (minLimit && limitValue < parseInt(minLimit)) {
              return false;
            }
            if (maxLimit && limitValue > parseInt(maxLimit)) {
              return false;
            }

            return true;
          })
          .map(([apiKey, limit]) => ({
            api_name: apiKey,
            current_limit: limit,
            unlimited: limit === -1 || limit === 999999,
            needs_attention: typeof limit === 'number' && limit < 100
          }));

        if (matchingApis.length === 0) {
          return null;
        }

        return {
          _id: team._id,
          name: team.name,
          members: team.members || [],
          credits: team.credits || 0,
          matching_apis: matchingApis,
          total_apis: Object.keys(team.api_limits).length,
          created_at: team.created_at,
          updated_at: team.updated_at
        };
      })
      .filter(team => team !== null);

    // Sort by API limit (ascending - show teams with lowest limits first)
    matchingTeams.sort((a, b) => {
      const aMinLimit = Math.min(...a.matching_apis.map((api: any) => 
        typeof api.current_limit === 'number' ? api.current_limit : Infinity
      ));
      const bMinLimit = Math.min(...b.matching_apis.map((api: any) => 
        typeof api.current_limit === 'number' ? api.current_limit : Infinity
      ));
      return aMinLimit - bMinLimit;
    });

    // Calculate statistics
    const stats = {
      total_teams: matchingTeams.length,
      total_api_instances: matchingTeams.reduce((sum, team) => 
        sum + team.matching_apis.length, 0
      ),
      teams_needing_attention: matchingTeams.filter(team =>
        team.matching_apis.some((api: any) => api.needs_attention)
      ).length,
      average_limit: matchingTeams.length > 0
        ? Math.round(
            matchingTeams.reduce((sum, team) => {
              const avgTeamLimit = team.matching_apis.reduce((s: number, api: any) => 
                s + (typeof api.current_limit === 'number' ? api.current_limit : 0), 0
              ) / team.matching_apis.length;
              return sum + avgTeamLimit;
            }, 0) / matchingTeams.length
          )
        : 0
    };

    return NextResponse.json({
      success: true,
      api_endpoint: apiEndpoint,
      filters: {
        exact_match: exactMatch,
        min_limit: minLimit ? parseInt(minLimit) : null,
        max_limit: maxLimit ? parseInt(maxLimit) : null
      },
      statistics: stats,
      teams: matchingTeams
    });

  } catch (error) {
    console.error('API endpoint search error:', error);
    return NextResponse.json(
      { error: 'Failed to search by API endpoint', details: (error as Error).message },
      { status: 500 }
    );
  }
}
