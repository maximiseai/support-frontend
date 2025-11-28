import { NextRequest, NextResponse } from 'next/server';
import { connectMongoose } from '@/lib/mongodb';
import CreditLog from '@/lib/models/creditlog.model';

export async function GET(request: NextRequest) {
  await connectMongoose();

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const search = searchParams.get('search') || '';
    const actionType = searchParams.get('action_type') || '';
    const startDate = searchParams.get('start_date') || '';
    const endDate = searchParams.get('end_date') || '';

    // Build query
    const query: any = {};

    // Search filter (team name or support user email)
    if (search) {
      query.$or = [
        { team_name: { $regex: search, $options: 'i' } },
        { support_user_email: { $regex: search, $options: 'i' } },
      ];
    }

    // Action type filter
    if (actionType) {
      query.action_type = actionType;
    }

    // Date range filter
    if (startDate || endDate) {
      query.created_at = {};
      if (startDate) {
        query.created_at.$gte = new Date(startDate);
      }
      if (endDate) {
        const endDateTime = new Date(endDate);
        endDateTime.setHours(23, 59, 59, 999);
        query.created_at.$lte = endDateTime;
      }
    }

    // Get total count
    const total = await CreditLog.countDocuments(query);

    // Get paginated logs
    const logs = await CreditLog.find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .lean();

    return NextResponse.json({
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching credit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch credit logs' },
      { status: 500 }
    );
  }
}
