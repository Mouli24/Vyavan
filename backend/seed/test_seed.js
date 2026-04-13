/**
 * Fresh Test Seed Script — Clears DB and adds two clean accounts for manual testing.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';

import User                 from '../models/User.js';
import Product              from '../models/Product.js';
import Order                from '../models/Order.js';
import Shipment             from '../models/Shipment.js';
import Deal                 from '../models/Deal.js';
import Message              from '../models/Message.js';
import Complaint            from '../models/Complaint.js';
import Settlement           from '../models/Settlement.js';
import ManufacturerProfile  from '../models/ManufacturerProfile.js';
import Notification         from '../models/Notification.js';

await connectDB();

// ── Wipe existing data ────────────────────────────────────────────────────────
await Promise.all([
  User.deleteMany(), Product.deleteMany(), Order.deleteMany(),
  Shipment.deleteMany(), Deal.deleteMany(), Message.deleteMany(),
  Complaint.deleteMany(), Settlement.deleteMany(),
  ManufacturerProfile.deleteMany(), Notification.deleteMany(),
]);
console.log('✅ Database wiped clean.');

// ── Users ─────────────────────────────────────────────────────────────────────
const [mfg, buyer] = await User.create([
  {
    name: 'Test Manufacturer',
    email: 'testmfg@sephio.com',
    password: 'password123',
    role: 'manufacturer',
    company: 'Test Manufacturing Co.',
    location: 'Mumbai, India',
    manufacturerStatus: 'approved'
  },
  {
    name: 'Test Buyer',
    email: 'testbuyer@sephio.com',
    password: 'password123',
    role: 'buyer',
    company: 'Global Retailers Ltd.',
    location: 'London, UK',
    isVerified: true
  }
]);

// ── Manufacturer Profile ──────────────────────────────────────────────────
await ManufacturerProfile.create({
  user: mfg._id,
  tradeName: 'Test Manufacturing Co.',
  description: 'A global leader in high-quality testing data.',
  mainCategory: 'Textiles',
  status: 'approved',
  approvedAt: new Date(),
  address: { city: 'Mumbai', state: 'Maharashtra', country: 'India' }
});

console.log('✅ Accounts created:');
console.log('   Manufacturer: testmfg@sephio.com / password123');
console.log('   Buyer:        testbuyer@sephio.com / password123');
console.log('─────────────────────────────────');

await mongoose.disconnect();
process.exit(0);
