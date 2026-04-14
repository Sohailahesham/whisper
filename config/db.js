import mongoose from "mongoose";

let cached = globalThis._mongoose;
if (!cached) cached = globalThis._mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI is not set");
    cached.promise = mongoose.connect(uri, { bufferCommands: false });
    console.log("mongodb connected successfully");
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
