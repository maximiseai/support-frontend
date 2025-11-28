import mongoose from 'mongoose';
import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  throw new Error('Please add your Mongo URI to .env');
}

const uri: string = process.env.MONGODB_URI;
const dbName: string = process.env.MONGODB_DB_NAME || 'enrich';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;
let cachedMongoose: typeof mongoose | null = null;

// Connect with Mongoose (for models)
export async function connectMongoose() {
  if (cachedMongoose && mongoose.connection.readyState === 1) {
    return cachedMongoose;
  }

  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(uri, {
      dbName,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });
  }

  cachedMongoose = mongoose;
  return mongoose;
}

// Connect with MongoDB native driver (for direct queries)
export async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = await MongoClient.connect(uri, {
    serverSelectionTimeoutMS: 5000,
    connectTimeoutMS: 10000,
  });

  const db = client.db(dbName);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}
