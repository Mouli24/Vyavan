import mongoose from 'mongoose';

const broadcastSchema = new mongoose.Schema({
  title:    { type: String, required: true },
  content:  { type: String, required: true }, // Rich text
  target: { 
    type: String, 
    enum: ['ALL', 'MANUFACTURERS', 'BUYERS', 'PREMIUM_ONLY'], 
    default: 'ALL' 
  },
  channels: [{ type: String, enum: ['IN_APP', 'EMAIL', 'SMS'] }],
  status:   { type: String, enum: ['DRAFT', 'SCHEDULED', 'SENT'], default: 'DRAFT' },
  scheduledAt: Date,
  sentAt:      Date,
  reachCount:  { type: Number, default: 0 },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Broadcast', broadcastSchema);
