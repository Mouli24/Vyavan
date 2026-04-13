import mongoose from 'mongoose';

const quickReplySchema = new mongoose.Schema({
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:        { type: String, required: true }, // e.g., "Dispatch Date"
  message:      { type: String, required: true }, // e.g., "Your order will be dispatched by [date]"
  isDefault:    { type: Boolean, default: false },
}, { timestamps: true });

export default mongoose.model('QuickReply', quickReplySchema);
