import mongoose from 'mongoose';

const negotiationRoundSchema = new mongoose.Schema({
  negotiationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Negotiation',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  senderRole: {
    type: String,
    enum: ['buyer', 'manufacturer'],
    required: true
  },
  offeredPrice: {
    type: Number,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  roundNumber: {
    type: Number,
    required: true
  },
  isLatest: {
    type: Boolean,
    default: true
  },
  isRead: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index for quick retrieval of negotiation history
negotiationRoundSchema.index({ negotiationId: 1, roundNumber: 1 });

export default mongoose.model('NegotiationRound', negotiationRoundSchema);
