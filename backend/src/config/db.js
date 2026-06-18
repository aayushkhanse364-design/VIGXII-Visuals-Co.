import mongoose from 'mongoose';

export default async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    throw new Error('MONGODB_URI is not defined. Copy backend/.env.example to backend/.env and set your MongoDB connection string.');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(uri, { autoIndex: true });
  console.log('MongoDB connected');
  return mongoose.connection;
}