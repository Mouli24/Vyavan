import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderId:      { type: String, required: true, unique: true },
  buyer: {
    name:     { type: String, required: true },
    company:  { type: String },
    location: { type: String },
    initials: { type: String },
    ref:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  deliveryAddress: {
    fullName: { type: String, required: true },
    companyName: { type: String },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:        { type: String, required: true },          // e.g. "45x Ceramic Vase"
  value:        { type: String, required: true },          // e.g. "$3,450.00"
  valueRaw:     { type: Number, default: 0 },              // numeric for sorting/filtering
  status: {
    type: String,
    enum: ['New', 'Confirmed', 'In Production', 'Packed', 'Shipped', 'Delivered', 'Cancelled', 'Rejected', 'Return Requested', 'Returned'],
    default: 'New',
  },
  rejectionReason: { type: String },
  modificationRequest: {
    suggestedQuantity: { type: Number },
    suggestedDate:     { type: Date },
    note:              { type: String },
    status:            { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
  },
  expectedDate: { type: String },
  products: [{
    product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, min: 1 },
    isSample: { type: Boolean, default: false },
    price:    { type: Number }, // Snapshot of price at order time
  }],
  isReviewed: { type: Boolean, default: false },
  review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review' },
  deliveredAt: { type: Date },
  reviewReminderSent: { type: Boolean, default: false },
  appliedRewardValue: { type: Number, default: 0 },
  appliedGroupId: { type: mongoose.Schema.Types.ObjectId, ref: 'BuyerGroup' },
  
  // New Admin fields
  escrowStatus: { type: String, enum: ['Held', 'Released', 'Refunded', 'Pending'], default: 'Pending' },
  paymentStatus: { type: String, enum: ['Paid', 'Partial', 'Unpaid', 'Overdue'], default: 'Unpaid' },
  adminNotes: { type: String },
  timeline: [{
    status: String,
    actor: String, // 'system', 'manufacturer', 'buyer', 'admin'
    note: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
