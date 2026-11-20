
import mongoose from "mongoose";

let cached = globalThis.mongooseConnection;

if (!cached) {
  cached = globalThis.mongooseConnection = {
    connection: null,
    promise: null,
  };
}

const connectDB = async () => {
  if (cached.connection) {
    return cached.connection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is missing.");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI);
  }

  try {
    cached.connection = await cached.promise;
    console.log("MongoDB connected successfully!");
    return cached.connection;
  } catch (error) {
    cached.promise = null;
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectDB;
