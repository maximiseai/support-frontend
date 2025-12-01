import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { db } = await connectToDatabase();

    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId') || '';
    const teamName = searchParams.get('teamName') || '';
    const endpoint = searchParams.get('endpoint') || '';
    const status = searchParams.get('status') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Build filter for team_logs
    const filter: Record<string, any> = {};

    // If specific team is requested
    let team = null;
    if (teamId) {
      // First find the team
      const teamsCollection = db.collection('teams');
      team = await teamsCollection.findOne({
        $or: [
          { uid: teamId },
          { name: { $regex: teamId, $options: 'i' } },
        ],
      });

      if (team) {
        filter.team_uid = { $in: [team.uid, String(team._id)] };
      } else {
        // Try direct match on team_uid
        filter.team_uid = teamId;
      }
    }

    if (endpoint) {
      filter.endpoint = { $regex: endpoint, $options: 'i' };
    }

    if (status) {
      filter.status_code = parseInt(status);
    }

    const teamLogsCollection = db.collection('team_logs');
    const teamsCollection = db.collection('teams');

    // Get total count
    const totalCount = await teamLogsCollection.countDocuments(filter);

    // Fetch logs with aggregation to join with teams
    const logs = await teamLogsCollection
      .aggregate([
        { $match: filter },
        { $sort: { createdAt: -1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
        // Join with teams collection
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

    // If team was found, calculate balances
    let logsWithBalance = logs;
    if (team) {
      let currentBalance = (team.base_credit || 0) - (team.credits_used || 0);

      let cumulativeCreditsFromNewerLogs = 0;
      if (page > 1) {
        const newerLogsSum = await teamLogsCollection
          .aggregate([
            { $match: { team_uid: { $in: [team.uid, String(team._id)] } } },
            { $sort: { createdAt: -1 } },
            { $limit: (page - 1) * limit },
            { $group: { _id: null, total: { $sum: '$credits_used' } } },
          ])
          .toArray();

        cumulativeCreditsFromNewerLogs = newerLogsSum[0]?.total || 0;
      }

      let afterBalance = currentBalance + cumulativeCreditsFromNewerLogs;

      logsWithBalance = logs.map((log) => {
        const beforeBalance = afterBalance + (log.credits_used || 0);
        const logWithBalance = {
          ...log,
          before_balance: beforeBalance,
          after_balance: afterBalance,
        };
        afterBalance = beforeBalance;
        return logWithBalance;
      });
    }

    // Map logs to response format
    const formattedLogs = logsWithBalance.map((log) => ({
      _id: log._id?.toString(),
      uid: log.uid,
      team_uid: log.team_uid,
      team_name: log.team_name || 'Unknown Team',
      endpoint: log.endpoint,
      method: log.method || 'GET',
      status_code: log.status_code || 200,
      credits_used: log.credits_used || 0,
      before_balance: log.before_balance,
      after_balance: log.after_balance,
      latency: log.latency || '0',
      ip: log.ip || '',
      request_id: log.request_id,
      createdAt: log.createdAt,
      updatedAt: log.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      logs: formattedLogs,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      team: team
        ? {
            _id: team._id,
            uid: team.uid,
            name: team.name,
            base_credit: team.base_credit,
            credits_used: team.credits_used,
            current_credits: (team.base_credit || 0) - (team.credits_used || 0),
          }
        : null,
    });
  } catch (error) {
    console.error('Error fetching team logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team logs', details: (error as Error).message },
      { status: 500 }
    );
  }
}
