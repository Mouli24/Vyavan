import 'dotenv/config';
import mongoose from 'mongoose';
import dns from 'dns';
import ManufacturerProfile from './models/ManufacturerProfile.js';
import User from './models/User.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to DB');
    
    const profiles = await ManufacturerProfile.find({}).populate('user');
    console.log('\nManufacturer Profiles:');
    profiles.forEach(p => {
      console.log(`- Company: ${p.user?.company || 'N/A'}, Code: ${p.companyCode}, Email: ${p.user?.email}`);
    });
  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

check();
