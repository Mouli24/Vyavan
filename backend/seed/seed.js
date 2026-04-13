/**
 * Seed script — populates the database with all mock data from the frontend.
 * Run once: npm run seed
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
console.log('Cleared existing data');

// ── Users ─────────────────────────────────────────────────────────────────────
const [manufacturer, buyer1, buyer2, manufacturer2, buyer3, admin] = await User.create([
  {
    name: 'Alex Thompson',
    email: 'alex@luminousforge.com',
    password: 'password123',
    role: 'manufacturer',
    company: 'Luminous Forge',
    location: 'Berlin, Germany',
  },
  {
    name: 'Priya Sharma',
    email: 'priya@sharmatextiles.in',
    password: 'password123',
    role: 'buyer',
    company: 'Sharma Textiles',
    location: 'Mumbai, India',
  },
  {
    name: 'James Nordic',
    email: 'james@nordicliving.dk',
    password: 'password123',
    role: 'buyer',
    company: 'Nordic Living Ltd.',
    location: 'Copenhagen, DK',
  },
  {
    name: 'Raj Patil',
    email: 'raj@puneindustries.com',
    password: 'password123',
    role: 'manufacturer',
    company: 'Pune Industries',
    location: 'Pune, India',
  },
  {
    name: 'Sarah Chen',
    email: 'sarah@chenimports.sg',
    password: 'password123',
    role: 'buyer',
    company: 'Chen Imports',
    location: 'Singapore',
  },
  {
    name: 'Admin User',
    email: 'admin@b2bharat.com',
    password: 'admin123',
    role: 'admin',
    company: 'B2BHarat Platform',
    location: 'Bangalore, India',
  },
]);
console.log('Users seeded');

// ── Manufacturer Profiles ──────────────────────────────────────────────────
await ManufacturerProfile.create([
  {
    user: manufacturer._id,
    gstNumber: '29ABCDE1234F1Z5',
    panNumber: 'ABCDE1234F',
    msmeNumber: 'MSME-12345',
    address: { street: 'Mitte Factory Street 12', city: 'Berlin', state: 'Berlin', pincode: '10117', country: 'Germany' },
    categories: ['Textiles', 'Accessories'],
    certifications: ['ISO 9001', 'OEKO-TEX'],
    yearEstablished: 2015,
    employeeCount: '51-200',
    status: 'approved',
    approvedAt: new Date(),
  },
  {
    user: manufacturer2._id,
    gstNumber: '27XYZAB5678C2Z1',
    panNumber: 'XYZAB5678C',
    address: { street: 'Shivaji Nagar, Industrial Area', city: 'Pune', state: 'Maharashtra', pincode: '411005', country: 'India' },
    categories: ['Ceramics', 'Home Décor'],
    certifications: ['BIS Certified'],
    yearEstablished: 2010,
    employeeCount: '11-50',
    status: 'approved',
    approvedAt: new Date(),
  },
]);

// Update manufacturer user statuses
await User.updateMany(
  { _id: { $in: [manufacturer._id, manufacturer2._id] } },
  { manufacturerStatus: 'approved' }
);

console.log('Manufacturer profiles seeded');

// ── Products ──────────────────────────────────────────────────────────────────
const [tshirt, cap, vase, desk] = await Product.create([
  {
    name: 'Classic Cotton T-Shirt',
    price: 160,
    unit: 'Piece',
    moq: 200,
    material: '100% Organic Cotton',
    sizes: ['S', 'M', 'L', 'XL'],
    rating: 4.5,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDC-Fbay2hrN4Nb32NoZpCVh1Z6oXnjY3G-oOl2Dl6UziU4ESNMVZBGWt0ENAd8GvZEG3dXaSR0IPqo_L1cK0mEnen_cS1efSszZIjymTFLVDCeJRnXGgxvIBeHfuQm0jG5UexT6QUHIeqnYbL_pNgZGd9HaxvzlayhCH6EEGy91wZ4FgLzW2qHlTZJVJXpTGqk9UzvoBgRnljhg1bq7YZa1yRZSzeS-WYgOOfluSIBA9rspI6jH1E4-oKnBpSmflV7twSrzzXLH3Yy',
    category: 'Apparel',
    stock: 5000,
    manufacturer: manufacturer._id,
  },
  {
    name: 'Twill Sports Cap',
    price: 85,
    unit: 'Piece',
    moq: 500,
    material: 'Heavy Twill',
    sizes: ['Adjustable'],
    rating: 4.8,
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDnd5ThBLl7iCcMWQG9OftTfLcUFcqnNiPvvoiASkiPUA0zZ4oJOz9iAHT81WnrMRhb7irPXUR1UjjO9CCtTFeHWCyIwRqu4C2AZbtfDsVfDBddjxwtnQOErhZcH6F_HKhoKr0E1IXZ0pgKwZ2_vG1RYlqIzuPMWlHJiaM6z8c_LPXxIrOxOE1oXIxsy_REwioXFUIqYlihVQub5hw58z5VzDWD5FkQNNZXrkEnExSBsbP87X9gKReVO7fGw9mdzh6-OEt5Onpjz3TA',
    category: 'Apparel',
    stock: 2000,
    manufacturer: manufacturer._id,
  },
  {
    name: 'Ceramic Vase',
    price: 76,
    unit: 'Piece',
    moq: 20,
    material: 'Hand-thrown Ceramic',
    sizes: ['Small', 'Medium', 'Large'],
    rating: 4.7,
    image: 'https://picsum.photos/seed/vase/400/400',
    category: 'Home Decor',
    stock: 300,
    manufacturer: manufacturer._id,
  },
  {
    name: 'Walnut Desk',
    price: 1067,
    unit: 'Piece',
    moq: 5,
    material: 'Solid American Walnut',
    sizes: ['120cm', '150cm', '180cm'],
    rating: 4.9,
    image: 'https://picsum.photos/seed/desk/400/400',
    category: 'Furniture',
    stock: 40,
    manufacturer: manufacturer._id,
  },
]);
console.log('Products seeded');

// ── Orders ────────────────────────────────────────────────────────────────────
const [ord1, ord2, ord3, ord4] = await Order.create([
  {
    orderId: '#ORD-94210',
    buyer: { name: 'Nordic Living Ltd.', location: 'Copenhagen, DK', initials: 'NL', ref: buyer2._id },
    manufacturer: manufacturer._id,
    items: '45x Ceramic Vase',
    value: '$3,450.00',
    valueRaw: 3450,
    status: 'In Production',
    expectedDate: 'Oct 12, 2023',
    products: [{ product: vase._id, quantity: 45 }],
  },
  {
    orderId: '#ORD-94208',
    buyer: { name: 'Sarah Mitchell', location: 'London, UK', initials: 'SM' },
    manufacturer: manufacturer._id,
    items: '12x Walnut Desk',
    value: '$12,800.00',
    valueRaw: 12800,
    status: 'Pending Payment',
    expectedDate: 'Oct 15, 2023',
    products: [{ product: desk._id, quantity: 12 }],
  },
  {
    orderId: '#ORD-94199',
    buyer: { name: 'Global Furnishings', location: 'New York, US', initials: 'GF' },
    manufacturer: manufacturer._id,
    items: '120x Cotton Sheets',
    value: '$4,200.00',
    valueRaw: 4200,
    status: 'Shipped',
    expectedDate: 'Oct 08, 2023',
  },
  {
    orderId: '#ORD-94201',
    buyer: { name: 'Sharma Textiles', location: 'Mumbai, IN', initials: 'ST', ref: buyer1._id },
    manufacturer: manufacturer._id,
    items: '500x Classic Cotton T-Shirt',
    value: '$80,000.00',
    valueRaw: 80000,
    status: 'In Production',
    expectedDate: 'Nov 01, 2023',
    products: [{ product: tshirt._id, quantity: 500 }],
  },
]);
console.log('Orders seeded');

// ── Shipments ─────────────────────────────────────────────────────────────────
await Shipment.create([
  {
    shipmentId: 'SHP-001',
    type: 'Silk',
    status: 'In Transit',
    arrival: 'Est. Oct 14, 2023',
    progress: 65,
    carrier: 'DHL Express',
    origin: 'Berlin, Germany',
    destination: 'Mumbai, India',
    trackingNumber: 'DHL-9284710234',
    manufacturer: manufacturer._id,
    order: ord1._id,
  },
  {
    shipmentId: 'SHP-002',
    type: 'Linen',
    status: 'Customs',
    arrival: 'Est. Oct 18, 2023',
    progress: 40,
    carrier: 'FedEx International',
    origin: 'Berlin, Germany',
    destination: 'Copenhagen, Denmark',
    trackingNumber: 'FDX-8841290023',
    manufacturer: manufacturer._id,
    order: ord2._id,
  },
  {
    shipmentId: 'SHP-003',
    type: 'Cotton',
    status: 'Processing',
    arrival: 'Est. Oct 22, 2023',
    progress: 15,
    carrier: 'Maersk Line',
    origin: 'Berlin, Germany',
    destination: 'New York, USA',
    trackingNumber: 'MSK-6612038471',
    manufacturer: manufacturer._id,
    order: ord3._id,
  },
]);
console.log('Shipments seeded');

// ── Deals ─────────────────────────────────────────────────────────────────────
const [deal1, deal2, deal3] = await Deal.create([
  {
    title: 'Global Infrastructure Inc.',
    subtitle: 'Industrial Equipment Bulk Order',
    priority: 'HIGH',
    status: 'Negotiating',
    price: '$42,500',
    priceRaw: 42500,
    buyer: buyer2._id,
    manufacturer: manufacturer._id,
  },
  {
    title: 'Artisan Cooperatives Ltd.',
    subtitle: 'Raw Material Sourcing',
    priority: 'STANDARD',
    status: 'Waiting',
    price: '$12,800',
    priceRaw: 12800,
    manufacturer: manufacturer._id,
  },
  {
    title: 'Lumina Tech Solutions',
    subtitle: 'Software License Agreement',
    priority: 'NEW',
    status: 'New Offer',
    price: '$3,200',
    priceRaw: 3200,
    buyer: buyer1._id,
    manufacturer: manufacturer._id,
  },
]);
console.log('Deals seeded');

// ── Messages ──────────────────────────────────────────────────────────────────
await Message.create([
  {
    deal: deal1._id,
    sender: buyer2._id,
    senderRole: 'buyer',
    content: 'Greetings. We have reviewed your initial proposal for the heavy machinery shipment. The current price point is slightly above our allocated capital for this quarter.',
    type: 'text',
  },
  {
    deal: deal1._id,
    sender: manufacturer._id,
    senderRole: 'manufacturer',
    content: 'Understood. We can offer a volume discount if the order quantity is increased by 15 units. Alternatively, we could extend the payment terms to 60 days.',
    type: 'text',
  },
  {
    deal: deal3._id,
    sender: buyer1._id,
    senderRole: 'buyer',
    content: 'Welcome back! We are interested in the cotton t-shirt bulk order. Can you provide a sample first?',
    type: 'text',
  },
  {
    deal: deal3._id,
    sender: manufacturer._id,
    senderRole: 'manufacturer',
    content: 'Absolutely. We will dispatch a sample pack of 10 units within 3 business days.',
    type: 'text',
  },
]);
console.log('Messages seeded');

// ── Complaints ────────────────────────────────────────────────────────────────
await Complaint.create([
  {
    complaintId: 'TAC-8842-B',
    title: 'Structural Integrity Failure - Batch B-42',
    company: 'SteelDynamics Corp',
    category: 'Material Quality',
    status: 'ESCALATED',
    description: 'During routine stress testing of the Batch B-42 structural beams, we observed hairline fractures appearing at 85% of the rated load. This is a critical safety violation of the contract\'s ASTM A36 standards.',
    evidence: [
      'https://picsum.photos/seed/metal1/200/200',
      'https://picsum.photos/seed/metal2/200/200',
    ],
    filingDate: 'October 24, 2023',
    buyer: buyer2._id,
    manufacturer: manufacturer._id,
  },
  {
    complaintId: 'TAC-9104-X',
    title: 'Dimensional Variance in Casting',
    company: 'Global Alloys Ltd',
    category: 'Precision Specs',
    status: 'ADMIN REVIEWED',
    description: 'The delivered castings show a ±2.5mm variance in critical dimensions, exceeding the ±0.5mm tolerance specified in the purchase order.',
    filingDate: 'October 18, 2023',
    buyer: buyer1._id,
    manufacturer: manufacturer._id,
  },
  {
    complaintId: 'TAC-7721-P',
    title: 'Surface Finish Degradation',
    company: 'Nordic Texture Lab',
    category: 'Aesthetics',
    status: 'PENDING',
    description: 'Received units show premature oxidation and uneven anodizing on the surface finish, not meeting the Ra 0.8 µm specification.',
    filingDate: 'October 10, 2023',
    buyer: buyer2._id,
    manufacturer: manufacturer._id,
  },
]);
console.log('Complaints seeded');

// ── Settlements ───────────────────────────────────────────────────────────────
await Settlement.create([
  {
    referenceId: 'TRX-7829-KK',
    date: 'Oct 20, 2023',
    recipient: 'Chase Business',
    amount: '$4,500.00',
    amountRaw: 4500,
    status: 'COMPLETED',
    type: 'bank',
    manufacturer: manufacturer._id,
    order: ord1._id,
  },
  {
    referenceId: 'TRX-7210-AL',
    date: 'Oct 18, 2023',
    recipient: 'Manual Payout',
    amount: '$1,200.00',
    amountRaw: 1200,
    status: 'COMPLETED',
    type: 'manual',
    manufacturer: manufacturer._id,
  },
  {
    referenceId: 'TRX-6981-ZM',
    date: 'Oct 15, 2023',
    recipient: 'Chase Business',
    amount: '$9,840.50',
    amountRaw: 9840.5,
    status: 'COMPLETED',
    type: 'bank',
    manufacturer: manufacturer._id,
    order: ord2._id,
  },
  {
    referenceId: 'TRX-6442-PP',
    date: 'Oct 12, 2023',
    recipient: 'Refund Reserve',
    amount: '$450.00',
    amountRaw: 450,
    status: 'HELD',
    type: 'refund',
    manufacturer: manufacturer._id,
  },
]);
console.log('Settlements seeded');

console.log('\n✅ Seed complete!');
console.log('─────────────────────────────────');
console.log('Manufacturer  alex@luminousforge.com  /  password123');
console.log('Manufacturer  raj@puneindustries.com   /  password123');
console.log('Buyer         priya@sharmatextiles.in  /  password123');
console.log('Buyer         james@nordicliving.dk   /  password123');
console.log('Buyer         sarah@chenimports.sg    /  password123');
console.log('Admin         admin@b2bharat.com      /  password123');

await mongoose.disconnect();
