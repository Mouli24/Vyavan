import mongoose from 'mongoose';

const dealSchema = new mongoose.Schema({
  title:          { type: String, required: true },
  subtitle:       { type: String },
  priority:       { type: String, enum: ['HIGH', 'STANDARD', 'NEW'], default: 'NEW' },
  status:         { type: String, enum: ['Negotiating', 'Waiting', 'New Offer', 'Accepted', 'Rejected', 'Expired', 'Converted to Order'], default: 'New Offer' },
  price:          { type: String },          // display string e.g. "₹42,500"
  priceRaw:       { type: Number, default: 0 },

  // Negotiation fields
  product:        { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity:       { type: Number, default: 1 },
  requestedPrice: { type: Number },          // current offered price per unit
  requestedTerm:  { type: String, default: 'advance_100' }, // current offered term
  floorPrice:     { type: Number },          // manufacturer secret minimum (never sent to buyer)
  round:          { type: Number, default: 1 },
  maxRounds:      { type: Number, default: 5 },
  expiresAt:      { type: Date },
  acceptedAt:     { type: Date },            // when the status was set to 'Accepted'
  counterBy:      { type: String, enum: ['buyer', 'manufacturer'], default: 'buyer' }, // whose turn to respond
  rejectionReason:{ type: String },          // mandatory reason for rejection

  // Offer history — one entry per round
  negotiationHistory: [{
    round:       { type: Number },
    offeredBy:   { type: String, enum: ['buyer', 'manufacturer'] },
    price:       { type: Number },
    term:        { type: String },
    message:     { type: String },
    createdAt:   { type: Date, default: Date.now },
  }],

  buyer:          { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  manufacturer:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

export default mongoose.model('Deal', dealSchema);
