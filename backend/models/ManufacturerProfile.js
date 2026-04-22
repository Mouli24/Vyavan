import mongoose from 'mongoose';

const manufacturerProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  companyCode: { type: String, unique: true, sparse: true },

  // Business verification
  gstNumber:  { type: String, trim: true },
  panNumber:  { type: String, trim: true, uppercase: true },
  msmeNumber: { type: String, trim: true },
  cinNumber:  { type: String, trim: true },

  // Address
  address: {
    street:  { type: String },
    city:    { type: String },
    state:   { type: String },
    pincode: { type: String },
    country: { type: String, default: 'India' },
  },

  // Business details
  tradeName:       { type: String },
  description:     { type: String },
  mainCategory:    { type: String },
  subCategory:     { type: String },
  capacity:        { type: String },
  bizDocUrl:       { type: String },
  gstCertUrl:      { type: String },
  yearEstablished: { type: Number },
  employeeCount:   { type: String, enum: ['1-10', '11-50', '51-200', '201-500', '500+'] },
  annualTurnover:  { type: String },
  exportMarkets:   [String],

  // Categories & products
  categories:     [String],
  certifications: [String],

  // Media
  factoryImages:   [String],
  profileBanner:   String,
  logo:            String,

  // Bank details
  bankDetails: {
    accountName:   String,
    accountNumber: String,
    ifscCode:      String,
    bankName:      String,
    branch:        String,
  },

  // Admin review
  status:           { type: String, enum: ['pending', 'approved', 'rejected', 'suspended'], default: 'pending' },
  rejectionReason:  String,
  approvedAt:       Date,
  approvedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // Availability for calls
  availability: [{
    day:       { type: String, enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] },
    startTime: String, // "09:00"
    endTime:   String, // "18:00"
  }],

  // Holiday / Closure Calendar
  holidaySettings: {
    // Weekly recurring off days (0=Sun, 1=Mon, ... 6=Sat)
    weeklyOffDays:    { type: [Number], default: [] },
    // Specific holiday date blocks
    holidays: [{
      date:  { type: String }, // ISO date string "YYYY-MM-DD"
      label: { type: String, default: '' },
    }],
    // When manufacturer will be back
    backInOfficeDate: { type: String, default: '' },
    // Custom auto-response message
    autoResponse:     { type: String, default: 'We are currently closed and will return on [date]. Your request has been saved.' },
    // Is the manufacturer currently on holiday?
    isOnHoliday:      { type: Boolean, default: false },
    // Flag: show "Welcome Back" summary once
    showWelcomeBack:  { type: Boolean, default: false },
    // Stats captured during holiday period
    holidayStats: {
      ordersReceived:       { type: Number, default: 0 },
      negotiationsStarted:  { type: Number, default: 0 },
      complaintsReceived:   { type: Number, default: 0 },
      holidayStartDate:     { type: String, default: '' },
    },
  },

  // Stats (cached)
  stats: {
    totalOrders:      { type: Number, default: 0 },
    totalRevenue:     { type: Number, default: 0 },
    avgRating:        { type: Number, default: 0 },
    avgQuality:       { type: Number, default: 0 },
    avgDelivery:      { type: Number, default: 0 },
    avgCommunication: { type: Number, default: 0 },
    totalReviews:     { type: Number, default: 0 },
    responseRate:     { type: Number, default: 0 },
  },
}, { timestamps: true });

// Auto-generate company code before save
manufacturerProfileSchema.pre('save', async function (next) {
  if (!this.companyCode && this.user) {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code;
    let unique = false;
    while (!unique) {
      code = 'MFR-' + Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
      const existing = await mongoose.model('ManufacturerProfile').findOne({ companyCode: code });
      if (!existing) unique = true;
    }
    this.companyCode = code;
  }
  next();
});

export default mongoose.model('ManufacturerProfile', manufacturerProfileSchema);
