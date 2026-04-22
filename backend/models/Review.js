import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
    unique: true // One review per order
  },
  buyer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  manufacturer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ratings: {
    quality: { type: Number, required: true, min: 1, max: 5 },
    delivery: { type: Number, required: true, min: 1, max: 5 },
    communication: { type: Number, required: true, min: 1, max: 5 },
    overall: { type: Number, required: true, min: 1, max: 5 }
  },
  comment: {
    type: String,
    maxlength: 500
  },
  images: [{
    type: String // Cloudinary URLs
  }],
  manufacturerReply: {
    text: { type: String, maxlength: 500 },
    repliedAt: { type: Date }
  },
  isEdited: {
    type: Boolean,
    default: false
  },
  editWindowClosed: {
    type: Boolean,
    default: false
  },
  // Anti-fraud flags
  isFlagged: {
    type: Boolean,
    default: false
  },
  flagReason: {
    type: String
  }
}, { timestamps: true });

// Index for manufacturer storefront queries
reviewSchema.index({ manufacturer: 1, createdAt: -1 });

export default mongoose.model('Review', reviewSchema);
