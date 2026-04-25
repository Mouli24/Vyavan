import mongoose from 'mongoose';
import dotenv from 'dotenv';
import ManufacturerProfile from './models/ManufacturerProfile.js';

dotenv.config();

async function check() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');
    const profiles = await ManufacturerProfile.find({});
    console.log('Profiles found:', profiles.length);
    profiles.forEach(p => {
      console.log(`Code: ${p.companyCode}, User: ${p.user}`);
    });
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

check();
