import mongoose from 'mongoose';

let mongoConnected = false;

export function isMongoConnected(): boolean {
  return mongoConnected && mongoose.connection.readyState === 1;
}

export async function connectDatabase(): Promise<boolean> {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/booking-cancellation-tracker';

  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    mongoConnected = true;
    console.log(`[db] Connected to MongoDB at ${uri.replace(/\/\/[^@]+@/, '//***@')}`);
    return true;
  } catch (err) {
    mongoConnected = false;
    const message = err instanceof Error ? err.message : String(err);
    console.warn(
      `[db] MongoDB not reachable (${message}). Using local JSON persistence store until MONGODB_URI is available.`
    );
    return false;
  }
}
