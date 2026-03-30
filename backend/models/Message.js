import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  // For negotiation chat: link to a Deal
  deal:    { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },
  // For buyer→manufacturer chat: both parties stored
  sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole: { type: String, enum: ['manufacturer', 'buyer', 'bot', 'system'] },
  content:  { type: String, required: true },
  type:     { type: String, enum: ['text', 'product', 'proposal'], default: 'text' },
  product:  { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);
