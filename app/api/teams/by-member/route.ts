import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

// Helper function to escape regex special characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const memberEmail = searchParams.get('email');

    if (!memberEmail) {
      return NextResponse.json(
        { error: 'Member email is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const teamsCollection = db.collection('teams');

    // Search for teams with this member
    const escapedEmail = escapeRegex(memberEmail.trim());
    const regexPattern = new RegExp(escapedEmail, 'i');

    const teams = await teamsCollection
      .find({
        'members.email': { $regex: regexPattern }
      })
      .toArray();

    if (teams.length === 0) {
      return NextResponse.json({
        success: true,
        member_email: memberEmail,
        teams_found: 0,
        message: 'No teams found with this member email',
        teams: []
      });
    }

    // Enrich team data with comprehensive API information
    const enrichedTeams = teams.map(team => {
      // Find the matching member(s)
      const matchingMembers = (team.members || []).filter((member: any) =>
        regexPattern.test(member.email)
      );

      // Extract all API configurations
      const apiConfigs = team.api_limits
        ? Object.entries(team.api_limits).map(([apiKey, limit]) => {
            const limitValue = typeof limit === 'number' ? limit : 0;
            return {
              api_name: apiKey,
              current_limit: limitValue,
              unlimited: limitValue === -1 || limitValue === 999999,
              status: limitValue === 0 ? 'disabled' : 
                      limitValue < 100 ? 'low' :
                      limitValue < 1000 ? 'normal' : 'high'
            };
          })
        : [];

      // Group APIs by status
      const apisByStatus = {
        disabled: apiConfigs.filter(api => api.status === 'disabled'),
        low: apiConfigs.filter(api => api.status === 'low'),
        normal: apiConfigs.filter(api => api.status === 'normal'),
        high: apiConfigs.filter(api => api.status === 'high'),
        unlimited: apiConfigs.filter(api => api.unlimited)
      };

      return {
        team: {
          _id: team._id,
          name: team.name,
          credits: team.credits || 0,
          base_credit: team.base_credit || 0,
          total_members: (team.members || []).length,
          created_at: team.created_at,
          updated_at: team.updated_at
        },
        matching_members: matchingMembers,
        api_configurations: {
          total_apis: apiConfigs.length,
          by_status: apisByStatus,
          all_apis: apiConfigs.sort((a, b) => a.api_name.localeCompare(b.api_name))
        },
        special_limits: {
          company_followers_per_team: team.company_followers_per_team_rate_limit || null,
          company_followers_per_request: team.company_followers_per_request_limit || null
        }
      };
    });

    // Calculate overall statistics
    const totalApis = enrichedTeams.reduce((sum, t) => 
      sum + t.api_configurations.total_apis, 0
    );
    const uniqueApis = new Set(
      enrichedTeams.flatMap(t => 
        t.api_configurations.all_apis.map(api => api.api_name)
      )
    );

    return NextResponse.json({
      success: true,
      member_email: memberEmail,
      teams_found: enrichedTeams.length,
      summary: {
        total_teams: enrichedTeams.length,
        total_api_configurations: totalApis,
        unique_api_endpoints: uniqueApis.size,
        average_apis_per_team: enrichedTeams.length > 0 
          ? Math.round(totalApis / enrichedTeams.length) 
          : 0
      },
      teams: enrichedTeams
    });

  } catch (error) {
    console.error('Member lookup error:', error);
    return NextResponse.json(
      { error: 'Failed to lookup member', details: (error as Error).message },
      { status: 500 }
    );
  }
}
