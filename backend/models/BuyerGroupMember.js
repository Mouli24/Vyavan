import mongoose from 'mongoose';

const buyerGroupMemberSchema = new mongoose.Schema({
  group:        { type: mongoose.Schema.Types.ObjectId, ref: 'BuyerGroup', required: true, index: true },
  buyer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  joinedAt:     { type: Date, default: Date.now }
}, { timestamps: true });

// A buyer can be in only one group per manufacturer (for conflict resolution)
buyerGroupMemberSchema.index({ manufacturer: 1, buyer: 1 }, { unique: true });

export default mongoose.model('BuyerGroupMember', buyerGroupMemberSchema);
