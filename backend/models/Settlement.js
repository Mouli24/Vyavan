import mongoose from 'mongoose';

const settlementSchema = new mongoose.Schema({
  referenceId:  { type: String, required: true, unique: true },  // e.g. "TRX-7829-KK"
  date:         { type: String, required: true },   // human-readable e.g. "Oct 20, 2023"
  recipient:    { type: String, required: true },   // e.g. "Chase Business"
  amount:       { type: String, required: true },   // display e.g. "$4,500.00"
  amountRaw:    { type: Number, default: 0 },
  status:       { type: String, enum: ['COMPLETED', 'HELD', 'PENDING', 'FAILED'], default: 'PENDING' },
  type:         { type: String, enum: ['bank', 'manual', 'refund'], default: 'bank' },
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  order:        { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
}, { timestamps: true });

export default mongoose.model('Settlement', settlementSchema);
