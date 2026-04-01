import mongoose from 'mongoose';

const shipmentSchema = new mongoose.Schema({
  shipmentId:    { type: String, required: true, unique: true },
  manufacturer:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // one shipment can cover multiple orders (combined city-area dispatch)
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
  // kept for backward-compat with old code that used singular "order"
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },

  status: {
    type: String,
    enum: ['Processing', 'Packed', 'Dispatched', 'In Transit', 'Reached Hub', 'Out for Delivery', 'Delivered', 'Delayed'],
    default: 'Processing',
  },

  // ── Transport type ────────────────────────────────────────────────────────
  transportType: {
    type: String,
    enum: ['own_vehicle', 'transport_company', 'bus_cargo', 'train_parcel', 'courier'],
    required: true,
  },

  // ── Own vehicle / Transport company fields ────────────────────────────────
  driverName:         { type: String },
  driverPhone:        { type: String },
  vehicleNumber:      { type: String },
  transportCompany:   { type: String },   // only when type = transport_company

  // ── Bus cargo fields ──────────────────────────────────────────────────────
  busServiceName:     { type: String },   // e.g. GSRTC, MSRTC
  busNumber:          { type: String },
  parcelReceiptNumber:{ type: String },
  departureBusStand:  { type: String },
  destinationBusStand:{ type: String },

  // ── Train parcel fields ───────────────────────────────────────────────────
  trainName:          { type: String },
  trainNumber:        { type: String },
  parcelBookingNumber:{ type: String },   // PNR / booking receipt
  departureStation:   { type: String },
  arrivalStation:     { type: String },

  // ── Courier fields ────────────────────────────────────────────────────────
  carrier:            { type: String },   // Delhivery, Shiprocket, DTDC …
  trackingNumber:     { type: String },
  trackingUrl:        { type: String },   // generated from carrier name

  // ── Common fields ─────────────────────────────────────────────────────────
  dispatchDate:       { type: Date },
  estimatedDelivery:  { type: Date },
  pickupLocation:     { type: String },
  destination:        { type: String },
  specialInstructions:{ type: String },

  progress:    { type: Number, min: 0, max: 100, default: 10 },
  arrival:     { type: String },   // human-readable estimated arrival string

  // Docs
  lorryReceiptUrl: { type: String },
  invoiceUrl:      { type: String },

  // Event log (manufacturer manual updates + auto courier events)
  trackingEvents: [{
    status:   { type: String },
    location: { type: String },
    time:     { type: Date },
    message:  { type: String },
  }],

  // 24h / 48h reminder flags
  reminder24Sent: { type: Boolean, default: false },
  reminder48Sent: { type: Boolean, default: false },

}, { timestamps: true });

export default mongoose.model('Shipment', shipmentSchema);
