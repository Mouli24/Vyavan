import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type:    {
    type: String,
    enum: [
      'order_placed', 'order_confirmed', 'order_shipped', 'order_delivered',
      'negotiation_offer', 'negotiation_accepted', 'negotiation_rejected', 'negotiation_counter',
      'complaint_filed', 'complaint_responded', 'complaint_escalated', 'complaint_resolved',
      'manufacturer_approved', 'manufacturer_rejected',
      'call_scheduled', 'call_reminder', 'call_cancelled',
      'payment_received', 'payment_failed',
      'shipment_update',
      'system',
    ],
    default: 'system',
  },
  title:   { type: String, required: true },
  message: { type: String, required: true },
  read:    { type: Boolean, default: false },
  link:    { type: String },

  // Related document
  refModel: { type: String, enum: ['Order', 'Deal', 'Complaint', 'Shipment', 'CallSchedule', null] },
  refId:    { type: mongoose.Schema.Types.ObjectId },
}, { timestamps: true });

notificationSchema.index({ user: 1, read: 1, createdAt: -1 });

export default mongoose.model('Notification', notificationSchema);
