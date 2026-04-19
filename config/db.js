const mongoose = require('mongoose');

let cached = global.mongoose || { conn: null, promise: null };
global.mongoose = cached;

const connectDB = async () => {
  // Return existing connection if available
  if (cached.conn) return cached.conn;

  mongoose.set('strictQuery', true);

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URL, {
      bufferCommands: false,
    });
  }

  cached.conn = await cached.promise;
  console.log(`MongoDB is connected at: ${cached.conn.connection.host}`);
  return cached.conn;
};

module.exports = connectDB;