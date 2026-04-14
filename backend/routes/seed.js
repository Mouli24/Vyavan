import express from 'express';
import User from '../models/User.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Shipment from '../models/Shipment.js';
import Deal from '../models/Deal.js';
import Message from '../models/Message.js';
import Complaint from '../models/Complaint.js';
import Settlement from '../models/Settlement.js';
import ManufacturerProfile from '../models/ManufacturerProfile.js';
import Notification from '../models/Notification.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    // ── Wipe existing data ────────────────────────────────────────────────────────
    await Promise.all([
      User.deleteMany(), Product.deleteMany(), Order.deleteMany(),
      Shipment.deleteMany(), Deal.deleteMany(), Message.deleteMany(),
      Complaint.deleteMany(), Settlement.deleteMany(),
      ManufacturerProfile.deleteMany(), Notification.deleteMany(),
    ]);

    // ── Users ─────────────────────────────────────────────────────────────────────
    const [manufacturer, buyer1, buyer2, manufacturer2, buyer3, admin] = await User.create([
      { name: 'Alex Thompson', email: 'alex@luminousforge.com', password: 'password123', role: 'manufacturer', company: 'Luminous Forge', location: 'Berlin, Germany' },
      { name: 'Priya Sharma', email: 'priya@sharmatextiles.in', password: 'password123', role: 'buyer', company: 'Sharma Textiles', location: 'Mumbai, India' },
      { name: 'James Nordic', email: 'james@nordicliving.dk', password: 'password123', role: 'buyer', company: 'Nordic Living Ltd.', location: 'Copenhagen, DK' },
      { name: 'Raj Patil', email: 'raj@puneindustries.com', password: 'password123', role: 'manufacturer', company: 'Pune Industries', location: 'Pune, India' },
      { name: 'Sarah Chen', email: 'sarah@chenimports.sg', password: 'password123', role: 'buyer', company: 'Chen Imports', location: 'Singapore' },
      { name: 'Admin User', email: 'admin@b2bharat.com', password: 'password123', role: 'admin', company: 'B2BHarat Platform', location: 'Bangalore, India' },
    ]);

    // ── Manufacturer Profiles ──────────────────────────────────────────────────
    await ManufacturerProfile.create([
      { user: manufacturer._id, gstNumber: '29ABCDE1234F1Z5', address: { city: 'Berlin', country: 'Germany' }, status: 'approved', approvedAt: new Date() },
      { user: manufacturer2._id, gstNumber: '27XYZAB5678C2Z1', address: { city: 'Pune', country: 'India' }, status: 'approved', approvedAt: new Date() },
    ]);

    await User.updateMany({ _id: { $in: [manufacturer._id, manufacturer2._id] } }, { manufacturerStatus: 'approved' });

    // ── Products ──────────────────────────────────────────────────────────────────
    const [tshirt, cap] = await Product.create([
      { name: 'Classic Cotton T-Shirt', price: 160, unit: 'Piece', moq: 200, category: 'Apparel', stock: 5000, manufacturer: manufacturer._id, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDC-Fbay2hrN4Nb32NoZpCVh1Z6oXnjY3G-oOl2Dl6UziU4ESNMVZBGWt0ENAd8GvZEG3dXaSR0IPqo_L1cK0mEnen_cS1efSszZIjymTFLVDCeJRnXGgxvIBeHfuQm0jG5UexT6QUHIeqnYbL_pNgZGd9HaxvzlayhCH6EEGy91wZ4FgLzW2qHlTZJVJXpTGqk9UzvoBgRnljhg1bq7YZa1yRZSzeS-WYgOOfluSIBA9rspI6jH1E4-oKnBpSmflV7twSrzzXLH3Yy' },
      { name: 'Twill Sports Cap', price: 85, unit: 'Piece', moq: 500, category: 'Apparel', stock: 2000, manufacturer: manufacturer._id, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnd5ThBLl7iCcMWQG9OftTfLcUFcqnNiPvvoiASkiPUA0zZ4oJOz9iAHT81WnrMRhb7irPXUR1UjjO9CCtTFeHWCyIwRqu4C2AZbtfDsVfDBddjxwtnQOErhZcH6F_HKhoKr0E1IXZ0pgKwZ2_vG1RYlqIzuPMWlHJiaM6z8c_LPXxIrOxOE1oXIxsy_REwioXFUIqYlihVQub5hw58z5VzDWD5FkQNNZXrkEnExSBsbP87X9gKReVO7fGw9mdzh6-OEt5Onpjz3TA' },
    ]);

    res.json({ message: '✅ Database seeded successfully!', accountsSeeded: 6 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
