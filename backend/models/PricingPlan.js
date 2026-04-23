import mongoose from 'mongoose';

const pricingPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, enum: ['Free', 'Basic', 'Premium'], unique: true },
  price: { type: Number, required: true },
  features: [String],
  limits: {
    products: { type: Number, default: 10 },
    commissions: { type: Number, default: 10 }, // %
    broadcasts: { type: Number, default: 0 }
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('PricingPlan', pricingPlanSchema);
