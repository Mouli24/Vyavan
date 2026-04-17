import mongoose from 'mongoose';

const negotiationSchema = new mongoose.Schema({
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  manufacturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  currentOfferPrice: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Initiated', 'Active', 'Accepted', 'Rejected', 'Expired'],
    default: 'Initiated'
  },
  totalRounds: {
    type: Number,
    default: 1
  },
  maxRounds: {
    type: Number,
    default: 5
  },
  expiresAt: {
    type: Date,
    required: true
  },
  lastActivityAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Index for expiry queries
negotiationSchema.index({ expiresAt: 1 });

export default mongoose.model('Negotiation', negotiationSchema);
