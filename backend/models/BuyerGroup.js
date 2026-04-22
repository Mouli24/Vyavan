import mongoose from 'mongoose';

const buyerGroupSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  description:  { type: String },
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  
  rewardType: { 
    type: String, 
    enum: ['percentage_discount', 'flat_discount', 'free_shipping', 'priority_badge'], 
    required: true 
  },
  rewardValue: { type: Number, default: 0 }, // Pct value (e.g. 12) or flat amount
  
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Prevent duplicate group names for the same manufacturer
buyerGroupSchema.index({ manufacturer: 1, name: 1 }, { unique: true });

export default mongoose.model('BuyerGroup', buyerGroupSchema);
