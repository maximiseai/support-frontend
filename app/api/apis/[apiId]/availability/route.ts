import { NextRequest, NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGODB_URI!;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ apiId: string }> }
) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'enrich');

    const { apiId } = await params;
    const { is_available, unavailable_reason } = await request.json();

    if (typeof is_available !== 'boolean') {
      return NextResponse.json(
        { error: 'is_available must be a boolean' },
        { status: 400 }
      );
    }

    const updateData: any = {
      is_available,
      updatedAt: new Date(),
    };

    // If marking as unavailable, set reason and timestamp
    if (!is_available) {
      updateData.unavailable_reason = unavailable_reason || 'Service temporarily unavailable';
      updateData.unavailable_since = new Date();
    } else {
      // If marking as available, clear the reason and timestamp
      updateData.unavailable_reason = null;
      updateData.unavailable_since = null;
    }

    const result = await db.collection('apis').findOneAndUpdate(
      { _id: new ObjectId(apiId) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result) {
      return NextResponse.json(
        { error: 'API not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      api: result,
      message: is_available
        ? 'API is now available'
        : `API marked as unavailable: ${updateData.unavailable_reason}`,
    });
  } catch (error) {
    console.error('Error updating API availability:', error);
    return NextResponse.json(
      { error: 'Failed to update API availability' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
