import mongoose from 'mongoose';

const bankSchema = new mongoose.Schema({
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  accountName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true },
  bankName: { type: String, required: true },
  branch: { type: String },
  isPrimary: { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('Bank', bankSchema);
