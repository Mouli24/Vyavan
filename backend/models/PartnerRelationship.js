import mongoose from 'mongoose';

const partnerRelationshipSchema = new mongoose.Schema({
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isSuspicious: { type: Boolean, default: false },
  suspicionReason: String,
  flaggedAt: Date,
  flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Potential cached stats
  totalOrders: { type: Number, default: 0 },
  totalValue: { type: Number, default: 0 },
  lastOrderAt: Date,
  disputeCount: { type: Number, default: 0 }
}, { timestamps: true });

// Ensure unique pairs
partnerRelationshipSchema.index({ manufacturer: 1, buyer: 1 }, { unique: true });

export default mongoose.model('PartnerRelationship', partnerRelationshipSchema);
