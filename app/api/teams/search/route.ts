import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// Helper function to escape regex special characters
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Helper function to detect search type and build smart query
function buildSmartQuery(query: string) {
  const trimmedQuery = query.trim();
  const searchFilters: any[] = [];

  // 1. Check if it's a valid MongoDB ObjectId (24 hex characters)
  if (/^[0-9a-fA-F]{24}$/.test(trimmedQuery)) {
    try {
      return {
        filter: { _id: new ObjectId(trimmedQuery) },
        searchType: 'id',
        description: 'Exact Team ID match'
      };
    } catch (err) {
      // Invalid ObjectId, continue with other searches
    }
  }

  // 2. Email search - if contains @ symbol
  if (trimmedQuery.includes('@')) {
    const escapedEmail = escapeRegex(trimmedQuery);
    searchFilters.push(
      { 'members.email': { $regex: escapedEmail, $options: 'i' } }
    );
  }

  // 3. Team name search - always include for partial matching
  const escapedName = escapeRegex(trimmedQuery);
  
  // For multi-word queries, create flexible pattern (e.g., "Tech Solutions" -> /Tech.*Solutions/i)
  const words = trimmedQuery.split(/\s+/).filter(w => w.length > 0);
  if (words.length > 1) {
    const flexiblePattern = words.map(w => escapeRegex(w)).join('.*');
    searchFilters.push(
      { name: { $regex: flexiblePattern, $options: 'i' } }
    );
  } else {
    searchFilters.push(
      { name: { $regex: escapedName, $options: 'i' } }
    );
  }

  // 4. Member name search - if query doesn't contain special characters
  if (!/[@._-]/.test(trimmedQuery)) {
    if (words.length > 1) {
      const flexiblePattern = words.map(w => escapeRegex(w)).join('.*');
      searchFilters.push(
        { 'members.name': { $regex: flexiblePattern, $options: 'i' } }
      );
    } else {
      searchFilters.push(
        { 'members.name': { $regex: escapedName, $options: 'i' } }
      );
    }
  }

  // 5. Member UID search - if looks like UID (alphanumeric with underscores/hyphens)
  if (/^[a-zA-Z0-9_-]{8,}$/.test(trimmedQuery)) {
    searchFilters.push(
      { 'members.uid': { $regex: escapedName, $options: 'i' } }
    );
  }

  return {
    filter: searchFilters.length > 0 ? { $or: searchFilters } : {},
    searchType: 'auto',
    description: 'Smart multi-field search'
  };
}

// Helper function to sort results by relevance
function sortByRelevance(teams: any[], query: string): any[] {
  const lowerQuery = query.toLowerCase().trim();
  
  return teams.sort((a, b) => {
    // Priority 1: Team name starts with query (exact prefix match)
    const aNameStarts = a.name.toLowerCase().startsWith(lowerQuery);
    const bNameStarts = b.name.toLowerCase().startsWith(lowerQuery);
    if (aNameStarts && !bNameStarts) return -1;
    if (!aNameStarts && bNameStarts) return 1;

    // Priority 2: Exact email match
    const aHasExactEmail = a.members?.some((m: any) => 
      m.email?.toLowerCase() === lowerQuery
    );
    const bHasExactEmail = b.members?.some((m: any) => 
      m.email?.toLowerCase() === lowerQuery
    );
    if (aHasExactEmail && !bHasExactEmail) return -1;
    if (!aHasExactEmail && bHasExactEmail) return 1;

    // Priority 3: Team name contains query (anywhere)
    const aNameContains = a.name.toLowerCase().includes(lowerQuery);
    const bNameContains = b.name.toLowerCase().includes(lowerQuery);
    if (aNameContains && !bNameContains) return -1;
    if (!aNameContains && bNameContains) return 1;

    // Default: maintain original order
    return 0;
  });
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q');
    const type = searchParams.get('type') || 'auto'; // auto, email, name, or id

    if (!query) {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const teamsCollection = db.collection('teams');

    let filter: any = {};
    let searchType = type;
    let description = '';

    if (type === 'auto') {
      // Smart auto-detection search
      const smartQuery = buildSmartQuery(query);
      filter = smartQuery.filter;
      searchType = smartQuery.searchType;
      description = smartQuery.description;
    } else {
      // Legacy explicit type search (backward compatibility)
      switch (type) {
        case 'email':
          const escapedEmail = escapeRegex(query);
          filter = {
            'members.email': { $regex: escapedEmail, $options: 'i' }
          };
          description = 'Email search';
          break;

        case 'name':
          const escapedName = escapeRegex(query);
          filter = {
            name: { $regex: escapedName, $options: 'i' }
          };
          description = 'Team name search';
          break;

        case 'id':
          try {
            filter = { _id: new ObjectId(query) };
            description = 'Team ID search';
          } catch (err) {
            return NextResponse.json(
              { error: 'Invalid team ID format' },
              { status: 400 }
            );
          }
          break;

        default:
          return NextResponse.json(
            { error: 'Invalid search type. Use: auto, email, name, or id' },
            { status: 400 }
          );
      }
    }

    let teams = await teamsCollection
      .find(filter)
      .limit(50)
      .toArray();

    // Sort results by relevance for better UX
    if (type === 'auto' && teams.length > 1) {
      teams = sortByRelevance(teams, query);
    }

    return NextResponse.json({
      success: true,
      count: teams.length,
      query: query,
      search_type: searchType,
      description: description,
      teams: teams.map(team => ({
        _id: team._id,
        uid: team.uid,
        name: team.name,
        members: team.members,
        base_credit: team.base_credit || 0,
        credits_used: team.credits_used || 0,
        // Calculate available credits: base_credit - credits_used
        credits: (team.base_credit || 0) - (team.credits_used || 0),
        api_limits: team.api_limits || {},
        company_followers_per_team_rate_limit: team.company_followers_per_team_rate_limit,
        company_followers_per_request_limit: team.company_followers_per_request_limit,
        created_at: team.created_at,
        updated_at: team.updated_at,
      })),
    });
  } catch (error) {
    console.error('Team search error:', error);
    return NextResponse.json(
      { error: 'Failed to search teams', details: (error as Error).message },
      { status: 500 }
    );
  }
}
