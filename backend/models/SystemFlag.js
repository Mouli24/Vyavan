import mongoose from 'mongoose';

const systemFlagSchema = new mongoose.Schema({
  flagType: { 
    type: String, 
    required: true,
    enum: [
      'DUPLICATE_IP', 
      'HIGH_CANCELLATION', 
      'FAKE_REVIEW', 
      'LARGE_FIRST_ORDER', 
      'NON_DISPATCH', 
      'GST_REUSE',
      'MESSAGE_SPAM',
      'REVIEW_BURST'
    ]
  },
  severity: { type: String, enum: ['Low', 'Medium', 'High', 'Critical'], default: 'Medium' },
  
  // Entities Involved
  subjectUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  involvedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // For duplicate IP or GST reuse
  
  // Evidence
  evidence: {
    ipAddress: String,
    gstNumber: String,
    orderCount: Number,
    value: Number,
    similarityScore: Number,
    description: String,
    data: mongoose.Schema.Types.Mixed // JSON dump of proof
  },

  status: { type: String, enum: ['active', 'dismissed', 'resolved', 'escalated'], default: 'active' },
  resolutionNote: String,
  resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

}, { timestamps: true });

// Index for fast feed
systemFlagSchema.index({ status: 1, severity: 1, createdAt: -1 });

export default mongoose.model('SystemFlag', systemFlagSchema);
