import 'dotenv/config';
import mongoose from 'mongoose';
import dns from 'dns';
import ManufacturerProfile from './models/ManufacturerProfile.js';
import User from './models/User.js';

dns.setServers(['8.8.8.8', '8.8.4.4']);

async function fix() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to DB');
    
    // Find Raj Patil
    const raj = await User.findOne({ email: 'raj@puneindustries.com' });
    if (raj) {
      await ManufacturerProfile.findOneAndUpdate(
        { user: raj._id },
        { companyCode: 'MNG002' }
      );
      console.log('✅ Updated Raj Patil (Pune Industries) to MNG002');
    }

    // Find Alex Thompson
    const alex = await User.findOne({ email: 'alex@luminousforge.com' });
    if (alex) {
      await ManufacturerProfile.findOneAndUpdate(
        { user: alex._id },
        { companyCode: 'MNG001' }
      );
      console.log('✅ Updated Alex Thompson (Luminous Forge) to MNG001');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

fix();
