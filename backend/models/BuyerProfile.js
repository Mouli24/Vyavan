import mongoose from 'mongoose';

const buyerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  
  // Business Details
  businessType: { 
    type: String, 
    enum: ['Wholesaler', 'Retailer', 'Distributor', 'Manufacturer', 'Other'],
    default: 'Retailer' 
  },
  gstNumber: { type: String },
  bizCertUrl: { type: String }, // Business proof (GST certificate or Trade License)
  
  // Aggregated Stats (Cached for performance)
  stats: {
    totalSpent: { type: Number, default: 0 },
    orderCount: { type: Number, default: 0 },
    returnRate: { type: Number, default: 0 },
    complaintRate: { type: Number, default: 0 },
    avgOrderValue: { type: Number, default: 0 },
  },

  // Payment Behaviour Analytics
  paymentStats: {
    onTimePercentage: { type: Number, default: 100 },
    delayedPercentage: { type: Number, default: 0 },
    overduePercentage: { type: Number, default: 0 },
  },

  favouriteManufacturers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Verification
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rejectionReason: String,
  verifiedAt: Date,
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });

export default mongoose.model('BuyerProfile', buyerProfileSchema);
