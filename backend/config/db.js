import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI is missing from environment variables!');
    process.exit(1);
  }
  
  // Diagnostic log (doesn't leak password)
  console.log(`Database URI length: ${uri.length}`);
  console.log(`Database URI prefix: ${uri.substring(0, 15)}...`);

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}
