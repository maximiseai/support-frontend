import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;

export async function GET(request: NextRequest) {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(process.env.MONGODB_DB_NAME || 'enrich');

    const apisCollection = db.collection('apis');

    // Get all APIs
    const apis = await apisCollection
      .find({})
      .sort({ name: 1 })
      .toArray();

    return NextResponse.json({ apis });
  } catch (error) {
    console.error('Error fetching APIs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch APIs' },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
