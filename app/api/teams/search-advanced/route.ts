import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Helper function to escape regex special characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper to detect search type
function detectSearchType(query: string): {
  type: 'email' | 'team_name' | 'team_id' | 'api_endpoint' | 'member_name' | 'general';
  query: string;
} {
  const trimmed = query.trim();
  
  // Team ID (24 hex characters)
  if (/^[0-9a-fA-F]{24}$/.test(trimmed)) {
    return { type: 'team_id', query: trimmed };
  }
  
  // Email (contains @)
  if (trimmed.includes('@')) {
    return { type: 'email', query: trimmed };
  }
  
  // API endpoint (contains common API patterns like _api, finder, validation, enrichment)
  if (/(api|finder|validation|enrichment|lookup|search|follower)/i.test(trimmed)) {
    return { type: 'api_endpoint', query: trimmed };
  }
  
  // Member name or team name (general text)
  return { type: 'general', query: trimmed };
}

// Build aggregation pipeline for comprehensive search
function buildSearchPipeline(searchType: string, query: string) {
  const escapedQuery = escapeRegex(query);
  const regexPattern = new RegExp(escapedQuery, 'i');

  let matchStage: any = {};

  switch (searchType) {
    case 'team_id':
      matchStage = { _id: new ObjectId(query) };
      break;

    case 'email':
      matchStage = {
        'members.email': { $regex: regexPattern }
      };
      break;

    case 'api_endpoint':
      // Search for API endpoint as key in api_limits object
      matchStage = {
        $or: [
          { [`api_limits.${query}`]: { $exists: true } }, // Exact match
          // For partial matches, we'll need to check all api_limits keys
        ]
      };
      break;

    case 'member_name':
      matchStage = {
        'members.name': { $regex: regexPattern }
      };
      break;

    case 'team_name':
      matchStage = {
        name: { $regex: regexPattern }
      };
      break;

    case 'general':
      matchStage = {
        $or: [
          { name: { $regex: regexPattern } },
          { 'members.name': { $regex: regexPattern } },
          { 'members.email': { $regex: regexPattern } }
        ]
      };
      break;
  }

  // Build aggregation pipeline
  const pipeline: any[] = [
    { $match: matchStage },
    {
      // Add computed fields for API information
      $addFields: {
        api_configs: {
          $objectToArray: '$api_limits'
        },
        total_apis: { $size: { $objectToArray: '$api_limits' } }
      }
    },
    {
      // Limit results
      $limit: 50
    },
    {
      // Project only needed fields
      $project: {
        _id: 1,
        name: 1,
        members: 1,
        credits: 1,
        base_credit: 1,
        api_limits: 1,
        api_configs: 1,
        total_apis: 1,
        company_followers_per_team_rate_limit: 1,
        company_followers_per_request_limit: 1,
        created_at: 1,
        updated_at: 1
      }
    }
  ];

  return pipeline;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const includeApiDetails = searchParams.get('includeApiDetails') === 'true';

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const teamsCollection = db.collection('teams');

    // Detect search type
    const { type: searchType, query: processedQuery } = detectSearchType(query);

    // For API endpoint searches, we need special handling
    if (searchType === 'api_endpoint') {
      // Search for teams that have this API in their api_limits
      const escapedQuery = escapeRegex(processedQuery);
      const regexPattern = new RegExp(escapedQuery, 'i');

      const teams = await teamsCollection
        .find({})
        .limit(100)
        .toArray();

      // Filter teams that have matching API endpoints
      const matchingTeams = teams.filter(team => {
        if (!team.api_limits || typeof team.api_limits !== 'object') {
          return false;
        }
        
        return Object.keys(team.api_limits).some(apiKey => 
          regexPattern.test(apiKey)
        );
      });

      // Enrich teams with API details
      const enrichedTeams = matchingTeams.map(team => {
        const matchingApis = Object.entries(team.api_limits || {})
          .filter(([apiKey]) => regexPattern.test(apiKey))
          .map(([apiKey, limit]) => ({
            api_name: apiKey,
            current_limit: limit,
            unlimited: limit === -1 || limit === 999999 || limit === Infinity
          }));

        return {
          _id: team._id,
          name: team.name,
          members: team.members,
          credits: team.credits || 0,
          base_credit: team.base_credit || 0,
          matching_apis: matchingApis,
          all_api_limits: includeApiDetails ? team.api_limits : undefined,
          total_apis: Object.keys(team.api_limits || {}).length,
          company_followers_per_team_rate_limit: team.company_followers_per_team_rate_limit,
          company_followers_per_request_limit: team.company_followers_per_request_limit,
          created_at: team.created_at,
          updated_at: team.updated_at
        };
      });

      return NextResponse.json({
        success: true,
        count: enrichedTeams.length,
        query: query,
        search_type: searchType,
        description: `Found ${enrichedTeams.length} teams using API endpoint matching "${processedQuery}"`,
        teams: enrichedTeams.slice(0, 50)
      });
    }

    // For other search types, use aggregation pipeline
    const pipeline = buildSearchPipeline(searchType, processedQuery);
    const teams = await teamsCollection.aggregate(pipeline).toArray();

    // Enrich results with computed information
    const enrichedTeams = teams.map(team => {
      // Extract API configurations
      const apiConfigs = team.api_configs || [];
      const apiSummary = apiConfigs.map((item: any) => ({
        api_name: item.k,
        current_limit: item.v,
        unlimited: item.v === -1 || item.v === 999999 || item.v === Infinity
      }));

      return {
        _id: team._id,
        name: team.name,
        members: team.members || [],
        credits: team.credits || 0,
        base_credit: team.base_credit || 0,
        api_summary: apiSummary,
        all_api_limits: includeApiDetails ? team.api_limits : undefined,
        total_apis: team.total_apis || 0,
        company_followers_per_team_rate_limit: team.company_followers_per_team_rate_limit,
        company_followers_per_request_limit: team.company_followers_per_request_limit,
        created_at: team.created_at,
        updated_at: team.updated_at
      };
    });

    // Sort by relevance
    const sortedTeams = enrichedTeams.sort((a, b) => {
      // Prioritize exact name matches
      if (a.name.toLowerCase() === processedQuery.toLowerCase()) return -1;
      if (b.name.toLowerCase() === processedQuery.toLowerCase()) return 1;
      
      // Then by name starting with query
      if (a.name.toLowerCase().startsWith(processedQuery.toLowerCase())) return -1;
      if (b.name.toLowerCase().startsWith(processedQuery.toLowerCase())) return 1;
      
      return 0;
    });

    return NextResponse.json({
      success: true,
      count: sortedTeams.length,
      query: query,
      search_type: searchType,
      description: getSearchDescription(searchType, processedQuery, sortedTeams.length),
      teams: sortedTeams
    });

  } catch (error) {
    console.error('Advanced search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search', details: (error as Error).message },
      { status: 500 }
    );
  }
}

function getSearchDescription(type: string, query: string, count: number): string {
  switch (type) {
    case 'team_id':
      return `Team ID lookup`;
    case 'email':
      return `Found ${count} teams with member email matching "${query}"`;
    case 'api_endpoint':
      return `Found ${count} teams using API endpoint "${query}"`;
    case 'member_name':
      return `Found ${count} teams with member name matching "${query}"`;
    case 'team_name':
      return `Found ${count} teams with name matching "${query}"`;
    case 'general':
      return `Found ${count} teams matching "${query}" (searched team name, member name, and email)`;
    default:
      return `Found ${count} results`;
  }
}
