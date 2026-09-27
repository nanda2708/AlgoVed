import mongoose from 'mongoose';

// The Atlas cluster is shared with other projects, so AlgoVed always writes to
// its own database instead of whatever default the connection string implies.
const DEFAULT_DB_NAME = 'algoved';

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) throw new Error('MONGO_URI is not configured');

  const dbName = process.env.MONGO_DB_NAME || DEFAULT_DB_NAME;
  await mongoose.connect(mongoUri, { dbName, serverSelectionTimeoutMS: 10_000 });
  console.log(`MongoDB connected (database: ${dbName})`);
};

export default connectDB;
