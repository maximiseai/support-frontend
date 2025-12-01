import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const teamUid = searchParams.get('team_uid') || '';
    const limit = parseInt(searchParams.get('limit') || '100');
    const page = parseInt(searchParams.get('page') || '1');

    const { db } = await connectToDatabase();
    const collection = db.collection('requests');

    // Build filter
    const filter: Record<string, any> = {
      endpoint: '/v2/api/company-followers',
    };

    if (status) {
      filter.status = status;
    }

    if (teamUid) {
      filter.team_uid = teamUid;
    }

    // Get total count
    const totalCount = await collection.countDocuments(filter);

    // Get paginated results with team name lookup
    const skip = (page - 1) * limit;
    const requests = await collection
      .aggregate([
        { $match: filter },
        { $sort: { created_at: -1 } },
        { $skip: skip },
        { $limit: limit },
        // Join with teams collection to get team name
        {
          $lookup: {
            from: 'teams',
            let: { teamUid: '$team_uid' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $or: [
                      { $eq: ['$uid', '$$teamUid'] },
                      { $eq: [{ $toString: '$_id' }, '$$teamUid'] },
                    ],
                  },
                },
              },
              { $project: { name: 1, uid: 1 } },
            ],
            as: 'teamInfo',
          },
        },
        {
          $addFields: {
            team_name: { $arrayElemAt: ['$teamInfo.name', 0] },
          },
        },
        { $project: { teamInfo: 0 } },
      ])
      .toArray();

    // Map to response format
    const mappedRequests = requests.map((req) => ({
      _id: req._id.toString(),
      uid: req.uid,
      team_uid: req.team_uid,
      team_name: req.team_name || 'Unknown Team',
      endpoint: req.endpoint,
      status: req.status,
      retry_status: req.retry_status,
      retry_count: req.retry_count || 0,
      current_attempt: req.current_attempt || 0,
      max_retries: req.max_retries || 3,
      linkedin_url: req.request?.linkedin_url,
      max_limit: req.request?.max_limit,
      total_followers: req.request?.total_followers || req.total_followers || 0,
      scraped_count: req.response?.scraped_count || 0,
      progress: req.response?.progress || 0,
      account_used: req.account_used,
      excluded_accounts: req.excluded_accounts || [],
      last_error: req.last_error || req.error_details,
      status_message: req.status_message,
      created_at: req.created_at,
      updated_at: req.updated_at,
      started_at: req.started_at,
      failed_at: req.failed_at,
      completed_at: req.completed_at,
    }));

    return NextResponse.json({
      success: true,
      requests: mappedRequests,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error('List requests error:', error);
    return NextResponse.json(
      { error: 'Failed to list requests', details: (error as Error).message },
      { status: 500 }
    );
  }
}
