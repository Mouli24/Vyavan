import mongoose from 'mongoose';

const userActivitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  role: { type: String, enum: ['admin', 'manufacturer', 'buyer'], required: true },
  action: { type: String, required: true }, // LOGIN, LOGOUT, VIEW_PRODUCT, PLACE_ORDER, UPDATE_PROFILE, etc.
  description: { type: String },
  targetId: { type: mongoose.Schema.Types.ObjectId }, // ID of the product, order, or profile affected
  targetModel: { type: String }, // 'Product', 'Order', etc.
  
  // Device & Meta
  ipAddress: { type: String },
  device: { type: String },
  location: { type: String },
  userAgent: { type: String },
  
  // Special Flags
  isFailedAttempt: { type: Boolean, default: false },
  isSuspicious: { type: Boolean, default: false },

}, { timestamps: true });

// Indexes for fast filtering
userActivitySchema.index({ user: 1, createdAt: -1 });
userActivitySchema.index({ action: 1 });
userActivitySchema.index({ isSuspicious: 1 });

export default mongoose.model('UserActivity', userActivitySchema);
