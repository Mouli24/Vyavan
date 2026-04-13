import mongoose from 'mongoose';

const callScheduleSchema = new mongoose.Schema({
  manufacturer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  buyer:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  deal:         { type: mongoose.Schema.Types.ObjectId, ref: 'Deal' },

  scheduledAt:  { type: Date, required: true },
  duration:     { type: Number, default: 30 }, // minutes
  timezone:     { type: String, default: 'Asia/Kolkata' },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'no_show'],
    default: 'pending',
  },

  purpose:     { type: String }, // brief description
  notes:       { type: String }, // internal notes
  meetingLink: { type: String }, // zoom/google meet link

  // Reschedule tracking
  rescheduledFrom: { type: Date },
  rescheduleCount: { type: Number, default: 0 },
  cancelReason:    { type: String },
}, { timestamps: true });

export default mongoose.model('CallSchedule', callScheduleSchema);
