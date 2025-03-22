// app/lib/db.js
import mongoose from 'mongoose';

// Import all models here to ensure they're registered properly
import '../models/User';
import '../models/QuizState';
import '../models/Question';
import '../models/Answer';
import '../models/Leaderboard';

// Global variable to maintain connection across serverless function invocations
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  // If connection exists, use it
  if (cached.conn) {
    return cached.conn;
  }

  // If connection promise exists, wait for it
  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    // Cache the connection promise
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('MongoDB connected successfully');
        return mongoose;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        cached.promise = null;
        throw error;
      });
  }

  // Wait for the connection
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

// Utility function to check connection status
export async function checkConnection() {
  try {
    const connection = await connectToDatabase();
    return {
      status: 'connected',
      database: connection.connection.db.databaseName,
    };
  } catch (error) {
    return {
      status: 'error',
      message: error.message,
    };
  }
}