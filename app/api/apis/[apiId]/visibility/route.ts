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
    const { is_visible_on_dashboard } = await request.json();

    if (typeof is_visible_on_dashboard !== 'boolean') {
      return NextResponse.json(
        { error: 'is_visible_on_dashboard must be a boolean' },
        { status: 400 }
      );
    }

    const result = await db.collection('apis').findOneAndUpdate(
      { _id: new ObjectId(apiId) },
      {
        $set: {
          is_visible_on_dashboard,
          updatedAt: new Date(),
        },
      },
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
      message: `API visibility ${is_visible_on_dashboard ? 'enabled' : 'disabled'} on dashboard`,
    });
  } catch (error) {
    console.error('Error updating API visibility:', error);
    return NextResponse.json(
      { error: 'Failed to update API visibility' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
