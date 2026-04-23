import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema({
  complaintId:  { type: String, required: true, unique: true },  // e.g. "TAC-8842-B"
  title:        { type: String, required: true },
  company:      { type: String, required: true },
  category:     { type: String },
  status: {
    type: String,
    enum: ['ESCALATED', 'ADMIN REVIEWED', 'PENDING', 'RESOLVED', 'REJECTED'],
    default: 'PENDING',
  },
  description:  { type: String },
  evidence:     [{ type: String }],   // URLs to evidence images/files
  response:     { type: String },     // manufacturer's draft response
  filingDate:   { type: String },
  buyer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order:        { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  orderId:      { type: String }, 
  
  // Manufacturer Details
  manufacturerExplanation: { type: String },
  manufacturerDocuments:   [{ type: String }],
  
  resolution: {
    decision: { 
      type: String, 
      enum: ['FAVOUR_BUYER', 'FAVOUR_MANUFACTURER', 'PARTIAL_REFUND', 'BOTH_AT_FAULT', 'PENDING'], 
      default: 'PENDING' 
    },
    refundAmount:  { type: Number, default: 0 },
    adminNote:     { type: String },
    resolvedAt:    { type: Date },
    resolvedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
}, { timestamps: true });

export default mongoose.model('Complaint', complaintSchema);
