import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import TeamLog from '@/lib/models/teamlog.model';
import Team from '@/lib/models/team.model';

export async function GET(request: NextRequest) {
  try {
    await connectMongoose();

    const searchParams = request.nextUrl.searchParams;
    const teamId = searchParams.get('teamId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!teamId) {
      return NextResponse.json(
        { error: 'Team ID is required' },
        { status: 400 }
      );
    }

    // Fetch the team to get current balance
    const team = await Team.findOne({
      $or: [{ _id: teamId }, { uid: teamId }],
    });

    if (!team) {
      return NextResponse.json(
        { error: 'Team not found' },
        { status: 404 }
      );
    }

    // Get total count
    const totalCount = await TeamLog.countDocuments({
      team_uid: { $in: [team.uid, String(team._id)] },
    });

    // Fetch logs sorted by creation date (newest first)
    const logs = await TeamLog.find({
      team_uid: { $in: [team.uid, String(team._id)] },
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Calculate before/after balance for each log
    // We'll work forward from oldest to newest for accurate calculation
    // But since we're showing newest first, we need to reverse calculate

    // Get current balance (base_credit - credits_used = available credits)
    let currentBalance = (team.base_credit || 0) - (team.credits_used || 0);

    // For the first page, calculate from current balance backwards
    // For subsequent pages, we need to get the cumulative credits_used from newer logs
    let cumulativeCreditsFromNewerLogs = 0;
    if (page > 1) {
      // Get sum of credits_used from all logs newer than current page
      const newerLogsSum = await TeamLog.aggregate([
        {
          $match: {
            team_uid: { $in: [team.uid, String(team._id)] },
          },
        },
        { $sort: { createdAt: -1 } },
        { $limit: (page - 1) * limit },
        {
          $group: {
            _id: null,
            total: { $sum: '$credits_used' },
          },
        },
      ]);

      cumulativeCreditsFromNewerLogs = newerLogsSum[0]?.total || 0;
    }

    // Calculate balance for each log
    // Starting balance for this page = current balance + credits from all newer logs
    let afterBalance = currentBalance + cumulativeCreditsFromNewerLogs;

    const logsWithBalance = logs.map((log) => {
      const beforeBalance = afterBalance + log.credits_used;
      const logWithBalance = {
        ...log,
        before_balance: beforeBalance,
        after_balance: afterBalance,
      };
      // Move to next log (going backwards in time)
      afterBalance = beforeBalance;
      return logWithBalance;
    });

    return NextResponse.json({
      logs: logsWithBalance,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      team: {
        _id: team._id,
        uid: team.uid,
        name: team.name,
        base_credit: team.base_credit,
        credits_used: team.credits_used,
        current_credits: (team.base_credit || 0) - (team.credits_used || 0),
      },
    });
  } catch (error) {
    console.error('Error fetching team logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team logs' },
      { status: 500 }
    );
  }
}
