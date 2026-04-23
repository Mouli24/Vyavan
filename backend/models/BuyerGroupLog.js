import mongoose from 'mongoose';

const buyerGroupLogSchema = new mongoose.Schema({
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  buyer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  group:        { type: mongoose.Schema.Types.ObjectId, ref: 'BuyerGroup', index: true },
  
  type: { 
    type: String, 
    enum: ['member_added', 'member_removed', 'reward_applied', 'group_created', 'group_deleted'], 
    required: true 
  },
  
  description: { type: String },
  orderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  metadata:    { type: mongoose.Schema.Types.Mixed }, // For extra info like logic or previous group
}, { timestamps: true });

export default mongoose.model('BuyerGroupLog', buyerGroupLogSchema);
