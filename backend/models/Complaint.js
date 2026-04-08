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
  resolution:   {
    type: { type: String, enum: ['replace', 'refund', 'rejected', null], default: null },
    note: { type: String },
  },
}, { timestamps: true });

export default mongoose.model('Complaint', complaintSchema);
