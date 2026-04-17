import mongoose from 'mongoose';
import dns from 'dns';

// Fix for ISP/local DNS configuration blocking SRV lookups
dns.setServers(['8.8.8.8', '8.8.4.4']);

export const connectDB = async () => {
  try {
    console.log("🔍 ATTEMPTING DB CONNECTION TO:", process.env.MONGO_URI.substring(0, 40) + "...");
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      connectTimeoutMS: 30000,
      family: 4,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    // Don't exit here, let the watch mode try to restart
  }
};
