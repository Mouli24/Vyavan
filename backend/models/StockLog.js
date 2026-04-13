import mongoose from 'mongoose';

const stockLogSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  change: { type: Number, required: true },
  reason: { type: String, required: true },
  reference: { type: String }, // Order ID or adjustment ID
}, { timestamps: true });

export default mongoose.model('StockLog', stockLogSchema);
