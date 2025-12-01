import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      );
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('requests');

    // Verify the request exists
    let objectId: ObjectId;
    try {
      objectId = new ObjectId(requestId);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid request ID format' },
        { status: 400 }
      );
    }

    const existingRequest = await collection.findOne({ _id: objectId });

    if (!existingRequest) {
      return NextResponse.json(
        { error: 'Request not found' },
        { status: 404 }
      );
    }

    // Reset the request to pending status
    const result = await collection.updateOne(
      { _id: objectId },
      {
        $set: {
          status: 'pending',
          retry_status: 'pending',
          retry_count: 0,
          current_attempt: 0,
          error_details: null,
          last_error: null,
          failed_at: null,
          status_message: null,
          worker_heartbeat: null,
          started_at: null,
          account_used: null,
          'response.status': 'pending',
          'response.progress': 0,
          'response.scraped_count': 0,
          updated_at: new Date(),
        },
        $unset: {
          excluded_accounts: '',
          final_excluded_accounts: '',
          attempt_history: '',
        },
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update request' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Request has been reset to pending status and will be retried by the worker',
      requestId,
    });
  } catch (error) {
    console.error('Retry request error:', error);
    return NextResponse.json(
      { error: 'Failed to retry request', details: (error as Error).message },
      { status: 500 }
    );
  }
}
